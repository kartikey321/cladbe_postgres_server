// src/rpc/sqlRpc.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import rdkafka from "node-rdkafka"
export type KafkaConfig = {
    brokers: string[];            // ["localhost:9092"]
    groupId: string;              // "cladbe-postgres-rpc"
    requestTopic: string;         // "sql.rpc.requests"
};
type Message=rdkafka.Message;
type Producer=rdkafka.Producer;
type KafkaConsumer=rdkafka.KafkaConsumer;
type OnMessage = (msg: Message) => void;
import * as flatbuffers  from "flatbuffers";
import { randomUUID } from "node:crypto";
// import protocol types/helpers:
import { SqlRpc as sr } from "@cladbe/sql-protocol";
const SqlRpc= sr.SqlRpc;
type Pending = { resolve: (v: any) => void; reject: (e: any) => void; timer: NodeJS.Timeout };

export type SqlRpcClientOpts = {
    brokers: string;            // "host:9092,host:9093"
    requestTopic?: string;      // default "sql.rpc.requests"
    replyTopic: string;         // unique per gateway instance
    groupId?: string;           // for reply consumer
    timeoutMs?: number;         // per-call timeout
};

export class SqlRpcClient {
    private prod: Producer;
    private cons: KafkaConsumer;
    private pending = new Map<string, Pending>();
    private opts: Required<SqlRpcClientOpts>;

    constructor(opts: SqlRpcClientOpts) {
        this.opts = {
            requestTopic: "sql.rpc.requests",
            groupId: "ws-gateway-rpc",
            timeoutMs: 10_000,
            ...opts,
        } as Required<SqlRpcClientOpts>;

        this.prod = new rdkafka.Producer({
            "metadata.broker.list": this.opts.brokers,
            "client.id": "ws-gateway-sqlrpc",
            "socket.keepalive.enable": true,
            dr_cb: false,
        });

        this.cons = new rdkafka.KafkaConsumer(
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
            this.prod.on("ready", () => res()).on("event.error", rej).connect();
        });

        // Optionally poll to drain internal delivery queue
        // setInterval(() => { try { this.prod.poll(); } catch {} }, 100);

        await new Promise<void>((res) => {
            this.cons
                .on("ready", () => {
                    this.cons.subscribe([this.opts.replyTopic]);
                    this.cons.consume();
                    res();
                })
                .on("data", (m: Message) => this.onData(m))
                .on("event.error", (e: rdkafka.LibrdKafkaError) => console.error("[rpc] consumer error", e));
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
        try {
            const buf = m.value as Buffer;
            const bb = new flatbuffers.ByteBuffer(
                new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
            );
            const env = SqlRpc.ResponseEnvelope.getRootAsResponseEnvelope(bb);
            const corr = env.correlationId() || "";
            const pending = this.pending.get(corr);
            if (!pending) return;

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
                    clearTimeout(pending.timer);
                    this.pending.delete(corr);
                    pending.resolve(out);
                    return;
                }

                if (t === SqlRpc.RpcResponse.RowJson) {
                    const rowTbl = new SqlRpc.RowJson();
                    env.data(rowTbl);
                    const s = rowTbl.row();
                    const parsed = s ? JSON.parse(s) : null;
                    clearTimeout(pending.timer);
                    this.pending.delete(corr);
                    pending.resolve(parsed);
                    return;
                }

                // Fallback for BoolRes / AggRes — return null for now
                clearTimeout(pending.timer);
                this.pending.delete(corr);
                pending.resolve(null);
            } else {
                clearTimeout(pending.timer);
                this.pending.delete(corr);
                pending.reject(new Error(env.errorMessage() || "rpc error"));
            }
        } catch (e) {
            console.error("[rpc] decode error", e);
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

        // Write the envelope (set BOTH payloadType and payload)
        SqlRpc.RequestEnvelope.startRequestEnvelope(b);
        SqlRpc.RequestEnvelope.addCorrelationId(b, corrOff);
        SqlRpc.RequestEnvelope.addReplyTopic(b, replyOff);
        SqlRpc.RequestEnvelope.addMethod(b, method);
        SqlRpc.RequestEnvelope.addPayloadType(b, payloadType);
        SqlRpc.RequestEnvelope.addPayload(b, payloadOff);
        const envOff = SqlRpc.RequestEnvelope.endRequestEnvelope(b);
        b.finish(envOff);

        const buf = Buffer.from(b.asUint8Array());

        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(corr);
                reject(new Error("rpc timeout"));
            }, this.opts.timeoutMs);

            this.pending.set(corr, { resolve, reject, timer });

            try {
                this.prod.produce(this.opts.requestTopic, null, buf, corr);
            } catch (e) {
                clearTimeout(timer);
                this.pending.delete(corr);
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