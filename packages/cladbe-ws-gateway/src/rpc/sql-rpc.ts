// src/rpc/sql-rpc.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import pkg from "node-rdkafka";
const { Producer, KafkaConsumer } = pkg;
import type { LibrdKafkaError, Message } from "node-rdkafka";

import * as flatbuffers from "flatbuffers";
import { randomUUID } from "node:crypto";
// protocol types/helpers:
import { SqlRpc as sr } from "@cladbe/sql-protocol";

const SqlRpc = sr.SqlRpc;

type Pending = {
    resolve: (v: any) => void;
    reject: (e: any) => void;
    timer: NodeJS.Timeout;
    method: number;
};

export type SqlRpcClientOpts = {
    brokers: string;            // "host:9092,host:9093"
    requestTopic?: string;      // default "sql.rpc.requests"
    replyTopic: string;         // unique per gateway instance
    groupId?: string;           // for reply consumer
    timeoutMs?: number;         // per-call timeout
};

export class SqlRpcClient {
    private prod: InstanceType<typeof Producer>;
    private cons: InstanceType<typeof KafkaConsumer>;
    private pending = new Map<string, Pending>();
    private opts: Required<SqlRpcClientOpts>;

    constructor(opts: SqlRpcClientOpts) {
        this.opts = {
            requestTopic: "sql.rpc.requests",
            groupId: "ws-gateway-rpc",
            timeoutMs: 10_000,
            ...opts,
        } as Required<SqlRpcClientOpts>;

        this.prod = new Producer({
            "metadata.broker.list": this.opts.brokers,
            "client.id": "ws-gateway-sqlrpc",
            "socket.keepalive.enable": true,
            dr_cb: false,
        });

        this.cons = new KafkaConsumer(
            {
                "metadata.broker.list": this.opts.brokers,
                "group.id": this.opts.groupId,
                "enable.auto.commit": true,
                "allow.auto.create.topics": true,
                "socket.keepalive.enable": true,
                "client.id": "ws-gateway-sqlrpc",
            },
            { "auto.offset.reset": "latest" }
        );
    }

    async start() {
        await new Promise<void>((res, rej) => {
            this.prod
                .on("ready", () => {
                    console.log("[sql-rpc] producer ready",
                        { brokers: this.opts.brokers, requestTopic: this.opts.requestTopic });
                    res();
                })
                .on("event.error", (e: any) => {
                    console.error("[sql-rpc] producer error", e);
                    rej(e);
                })
                .connect();
        });

        await new Promise<void>((res) => {
            this.cons
                .on("ready", () => {
                    console.log("[sql-rpc] consumer ready",
                        { group: this.opts.groupId, replyTopic: this.opts.replyTopic, brokers: this.opts.brokers });
                    this.cons.subscribe([this.opts.replyTopic]);
                    this.cons.consume();
                    res();
                })
                .on("data", (m: Message) => this.onData(m))
                .on("event.error", (e: LibrdKafkaError) => console.error("[sql-rpc] consumer error", e));
            this.cons.connect();
        });
    }

    stop() {
        try { this.prod.disconnect(); } catch {}
        try { this.cons.disconnect(); } catch {}
        for (const [id, p] of this.pending) {
            clearTimeout(p.timer);
            p.reject(new Error("rpc shutdown"));
            this.pending.delete(id);
        }
    }

    private onData(m: Message) {
        if (!m.value) return;
        const bytes = Buffer.isBuffer(m.value) ? m.value.byteLength : 0;
        try {
            const buf = m.value as Buffer;
            const bb = new flatbuffers.ByteBuffer(
                new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
            );
            const env = SqlRpc.ResponseEnvelope.getRootAsResponseEnvelope(bb);
            const corr = env.correlationId() || "";
            const rec = this.pending.get(corr);
            console.log("[sql-rpc] ⇐ message on replyTopic",
                { key: m.key?.toString?.() ?? String(m.key ?? ""), bytes, corr });

            if (!rec) return;

            if (env.ok()) {
                const t = env.dataType();

                if (t === SqlRpc.RpcResponse.RowsJson) {
                    const rowsTbl = new SqlRpc.RowsJson();
                    env.data(rowsTbl);
                    const out: any[] = [];
                    const n = rowsTbl.rowsLength() || 0;
                    for (let i = 0; i < n; i++) {
                        const s = rowsTbl.rows(i);
                        if (s) out.push(JSON.parse(s));
                    }
                    console.log("[sql-rpc] ⇐ ok",
                        { corr, type: "RowsJson", rows: out.length, method: methodName(rec.method) });
                    clearTimeout(rec.timer);
                    this.pending.delete(corr);
                    rec.resolve(out);
                    return;
                }

                if (t === SqlRpc.RpcResponse.RowJson) {
                    const rowTbl = new SqlRpc.RowJson();
                    env.data(rowTbl);
                    const s = rowTbl.row();
                    const parsed = s ? JSON.parse(s) : null;
                    console.log("[sql-rpc] ⇐ ok", { corr, type: "RowJson", method: methodName(rec.method) });
                    clearTimeout(rec.timer);
                    this.pending.delete(corr);
                    rec.resolve(parsed);
                    return;
                }

                console.log("[sql-rpc] ⇐ ok (other type)", { corr, type: t, method: methodName(rec.method) });
                clearTimeout(rec.timer);
                this.pending.delete(corr);
                rec.resolve(null);
            } else {
                const errMsg = env.errorMessage() || "rpc error";
                console.error("[sql-rpc] ⇐ error", { corr, code: env.errorCode(), errMsg, method: methodName(rec.method) });
                clearTimeout(rec.timer);
                this.pending.delete(corr);
                rec.reject(new Error(errMsg));
            }
        } catch (e) {
            console.error("[sql-rpc] decode error", e);
        }
    }

    /**
     * Build + send a request envelope.
     * `build` must return the union type and the payload table offset.
     */
    private call(
        build: (b: flatbuffers.Builder) => { type: sr.SqlRpc.RpcPayload; off: number },
        method: sr.SqlRpc.RpcMethod
    ): Promise<any> {
        const b = new flatbuffers.Builder(1024);
        const corr = cryptoRandomId();
        const corrOff = b.createString(corr);
        const replyOff = b.createString(this.opts.replyTopic);

        const { type: payloadType, off: payloadOff } = build(b);

        SqlRpc.RequestEnvelope.startRequestEnvelope(b);
        SqlRpc.RequestEnvelope.addCorrelationId(b, corrOff);
        SqlRpc.RequestEnvelope.addReplyTopic(b, replyOff);
        SqlRpc.RequestEnvelope.addMethod(b, method);
        SqlRpc.RequestEnvelope.addPayloadType(b, payloadType);
        SqlRpc.RequestEnvelope.addPayload(b, payloadOff);
        const envOff = SqlRpc.RequestEnvelope.endRequestEnvelope(b);
        b.finish(envOff);

        const buf = Buffer.from(b.asUint8Array());
        console.log("[sql-rpc] ⇒ build",
            { corr, method: methodName(method), payloadType, bytes: buf.byteLength });

        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(corr);
                console.error("[sql-rpc] ✖ timeout", { corr, method: methodName(method), timeoutMs: this.opts.timeoutMs });
                reject(new Error("rpc timeout"));
            }, this.opts.timeoutMs);

            this.pending.set(corr, { resolve, reject, timer, method });

            try {
                this.prod.produce(this.opts.requestTopic, null, buf, corr);
                console.log("[sql-rpc] ⇒ send",
                    { corr, method: methodName(method), topic: this.opts.requestTopic, replyTopic: this.opts.replyTopic });
            } catch (e) {
                clearTimeout(timer);
                this.pending.delete(corr);
                console.error("[sql-rpc] produce error", { corr, method: methodName(method), error: String(e) });
                reject(e);
            }
        });
    }

    /** Minimal GET_DATA: snapshot without filters (Stage A) */
    getDataSnapshot(companyId: string, tableName: string, limit = 500, offset = 0): Promise<any[]> {
        return this.call((b) => {
            const companyOff = b.createString(companyId);
            const tableOff = b.createString(tableName);

            SqlRpc.GetDataReq.startGetDataReq(b);
            SqlRpc.GetDataReq.addCompanyId(b, companyOff);
            SqlRpc.GetDataReq.addTableName(b, tableOff);
            SqlRpc.GetDataReq.addLimit(b, limit);
            if (offset) SqlRpc.GetDataReq.addOffset(b, offset);
            SqlRpc.GetDataReq.addStrictAfter(b, true);
            const reqOff = SqlRpc.GetDataReq.endGetDataReq(b);

            return { type: SqlRpc.RpcPayload.GetDataReq, off: reqOff };
        }, SqlRpc.RpcMethod.GET_DATA);
    }
}

function cryptoRandomId(): string {
    try { return randomUUID(); } catch { /* fallback */ }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function methodName(m: number): string {
    switch (m) {
        case SqlRpc.RpcMethod.GET_DATA: return "GET_DATA";
        case SqlRpc.RpcMethod.GET_SINGLE: return "GET_SINGLE";
        case SqlRpc.RpcMethod.ADD_SINGLE: return "ADD_SINGLE";
        case SqlRpc.RpcMethod.UPDATE_SINGLE: return "UPDATE_SINGLE";
        case SqlRpc.RpcMethod.DELETE_ROW: return "DELETE_ROW";
        case SqlRpc.RpcMethod.CREATE_TABLE: return "CREATE_TABLE";
        case SqlRpc.RpcMethod.TABLE_EXISTS: return "TABLE_EXISTS";
        case SqlRpc.RpcMethod.RUN_AGGREGATION: return "RUN_AGGREGATION";
        default: return `UNKNOWN(${m})`;
    }
}