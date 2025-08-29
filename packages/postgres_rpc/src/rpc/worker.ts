// src/rpc/worker.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import * as flatbuffers from "flatbuffers";
import type { Message } from "node-rdkafka";

import { PostgresManager } from "@cladbe/postgres_manager";
import {
    GetDataDbRequest,
    GetSingleRecordRequest,
    AddSingleDbRequest,
    UpdateSingleDbRequest,
    DeleteRowDbRequest,
    AggregationRequest,
    TableExistsRequest,
} from "@cladbe/postgres_manager/dist/models/requests";

import * as FBG from "./generated/sql_rpc";
import { decodeOrderKey, decodeWrapper } from "./fb_decode";
import { RpcKafka } from "./kafka";

dotenv.config();

const REQUEST_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
const RESPONSE_TOPIC_DEFAULT =
    process.env.SQL_RPC_RESPONSE_TOPIC || "sql.rpc.responses";
const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const GROUP_ID = process.env.SQL_RPC_GROUP_ID || "cladbe-postgres-rpc";

const pg = PostgresManager.getInstance();
const kafka = new RpcKafka({
    brokers: BROKERS,
    groupId: GROUP_ID,
    requestTopic: REQUEST_TOPIC,
});

// ----- FB response builders -----
function okRows(corr: string, rows: any[]): Buffer {
    const b = new flatbuffers.Builder(1024);
    const rowOffsets = rows.map((r) => b.createString(JSON.stringify(r)));
    const rowsVec = FBG.SqlRpc.RowsJson.createRowsVector(b, rowOffsets);
    const rowsObj = FBG.SqlRpc.RowsJson.createRowsJson(b, rowsVec);
    const env = FBG.SqlRpc.ResponseEnvelope.createResponseEnvelope(
        b,
        b.createString(corr),
        true,
        FBG.SqlRpc.ErrorCode.NONE,
        0,
        FBG.SqlRpc.RpcResponse.RowsJson,
        rowsObj
    );
    b.finish(env);
    return Buffer.from(b.asUint8Array());
}
function okRow(corr: string, row: any): Buffer {
    const b = new flatbuffers.Builder(512);
    const rowStr = FBG.SqlRpc.RowJson.createRowJson(
        b,
        b.createString(JSON.stringify(row))
    );
    const env = FBG.SqlRpc.ResponseEnvelope.createResponseEnvelope(
        b,
        b.createString(corr),
        true,
        FBG.SqlRpc.ErrorCode.NONE,
        0,
        FBG.SqlRpc.RpcResponse.RowJson,
        rowStr
    );
    b.finish(env);
    return Buffer.from(b.asUint8Array());
}
function okBool(corr: string, val: boolean): Buffer {
    const b = new flatbuffers.Builder(64);
    const boolRes = FBG.SqlRpc.BoolRes.createBoolRes(b, val);
    const env = FBG.SqlRpc.ResponseEnvelope.createResponseEnvelope(
        b,
        b.createString(corr),
        true,
        FBG.SqlRpc.ErrorCode.NONE,
        0,
        FBG.SqlRpc.RpcResponse.BoolRes,
        boolRes
    );
    b.finish(env);
    return Buffer.from(b.asUint8Array());
}
function err(corr: string, code: number, message: string): Buffer {
    const b = new flatbuffers.Builder(256);
    const env = FBG.SqlRpc.ResponseEnvelope.createResponseEnvelope(
        b,
        b.createString(corr),
        false,
        code,
        b.createString(message),
        0,
        0
    );
    b.finish(env);
    return Buffer.from(b.asUint8Array());
}

// ----- helpers -----
function collect(m: any, base: string): string[] | undefined {
    const len = m[`${base}Length`]?.() ?? 0;
    if (!len) return undefined;
    const out: string[] = [];
    for (let i = 0; i < len; i++) out.push(m[base](i)!);
    return out;
}
function readCursorValue(ce: any): any {
    const vt = ce.valueType();
    const V = FBG.SqlSchema.FilterValue;
    if (vt === V.NullValue) return null;
    if (vt === V.StringValue) { const v = new FBG.SqlSchema.StringValue();  ce.value(v); return v.value(); }
    if (vt === V.NumberValue) { const v = new FBG.SqlSchema.NumberValue();  ce.value(v); return v.value(); }
    if (vt === V.Int64Value)  { const v = new FBG.SqlSchema.Int64Value();   ce.value(v); return Number(v.value()); }
    if (vt === V.BoolValue)   { const v = new FBG.SqlSchema.BoolValue();     ce.value(v); return v.value(); }
    if (vt === V.TimestampValue) { const v = new FBG.SqlSchema.TimestampValue(); ce.value(v); return Number(v.epoch()); }
    return undefined;
}

// ----- request handler -----
async function handleEnv(envBytes: Uint8Array) {
    const bb = new flatbuffers.ByteBuffer(envBytes);
    const req = FBG.SqlRpc.RequestEnvelope.getRootAsRequestEnvelope(bb);

    const corr = req.correlationId() || "";
    const replyTopic = req.replyTopic() || RESPONSE_TOPIC_DEFAULT;

    try {
        switch (req.method()) {
            case FBG.SqlRpc.RpcMethod.GET_DATA: {
                const m = new FBG.SqlRpc.GetDataReq(); req.payload(m);

                const order: any[] = [];
                for (let i = 0; i < m.orderLength(); i++) {
                    const ok = new FBG.SqlSchema.OrderKeySpec(); m.order(i, ok);
                    order.push(decodeOrderKey(ok));
                }
                const wrapper = m.wrapper();
                const filters = wrapper ? [decodeWrapper(wrapper)] : undefined;

                const cursor: Record<string, any> | undefined = (() => {
                    const len = (m.cursorLength && m.cursorLength()) || 0;
                    if (!len) return undefined;
                    const obj: Record<string, any> = {};
                    for (let i = 0; i < len; i++) {
                        const ce = m.cursor(i)!;
                        obj[ce.field()!] = readCursorValue(ce);
                    }
                    return obj;
                })();

                const strictAfter = (m.strictAfter && m.strictAfter()) ?? true;

                const tsReq = new GetDataDbRequest(
                    m.tableName()!,
                    m.companyId()!,
                    undefined,
                    filters,
                    m.limit() || undefined,
                    m.offset() || undefined,
                    order,
                    cursor,
                    strictAfter
                );
                const rows = await pg.getData(tsReq);
                kafka.produceSafe(replyTopic, corr, okRows(corr, rows as any[]));
                break;
            }

            case FBG.SqlRpc.RpcMethod.GET_SINGLE: {
                const m = new FBG.SqlRpc.GetSingleReq(); req.payload(m);
                const tsReq = new GetSingleRecordRequest(
                    m.tableName()!, m.companyId()!, m.primaryKeyColumn()!, m.primaryId()!
                );
                const row = await pg.getData(tsReq);
                kafka.produceSafe(replyTopic, corr, okRow(corr, row));
                break;
            }

            case FBG.SqlRpc.RpcMethod.ADD_SINGLE: {
                const m = new FBG.SqlRpc.AddSingleReq(); req.payload(m);
                const tsReq = new AddSingleDbRequest(
                    m.tableName()!, m.companyId()!, m.primaryKeyColumn()!, JSON.parse(m.rowJson()!)
                );
                const rows = await pg.editData(tsReq);
                kafka.produceSafe(replyTopic, corr, okRows(corr, rows as any[]));
                break;
            }

            case FBG.SqlRpc.RpcMethod.UPDATE_SINGLE: {
                const m = new FBG.SqlRpc.UpdateSingleReq(); req.payload(m);
                const tsReq = new UpdateSingleDbRequest(
                    m.tableName()!, m.companyId()!, JSON.parse(m.updatesJson()!),
                    m.primaryKeyColumn()!, m.primaryId()!
                );
                const rows = await pg.editData(tsReq);
                kafka.produceSafe(replyTopic, corr, okRows(corr, rows as any[]));
                break;
            }

            case FBG.SqlRpc.RpcMethod.DELETE_ROW: {
                const m = new FBG.SqlRpc.DeleteRowReq(); req.payload(m);
                const rows = await pg.deleteRequest(new DeleteRowDbRequest({
                    tableName: m.tableName()!, companyId: m.companyId()!,
                    primaryKeyColumn: m.primaryKeyColumn()!, primaryId: m.primaryId()!,
                }));
                kafka.produceSafe(replyTopic, corr, okRows(corr, rows as any[]));
                break;
            }

            case FBG.SqlRpc.RpcMethod.TABLE_EXISTS: {
                const m = new FBG.SqlRpc.TableExistsReq(); req.payload(m);
                const exists = await pg.tableExists(new TableExistsRequest(m.tableName()!, m.companyId()!));
                kafka.produceSafe(replyTopic, corr, okBool(corr, !!exists));
                break;
            }

            case FBG.SqlRpc.RpcMethod.RUN_AGGREGATION: {
                const m = new FBG.SqlRpc.RunAggregationReq(); req.payload(m);
                const wrapper = m.wrapper();
                const filters = wrapper ? [decodeWrapper(wrapper)] : undefined;
                const agg = await pg.runAggregationQuery(new AggregationRequest({
                    tableName: m.tableName()!, companyId: m.companyId()!,
                    sumFields: collect(m, "sumFields"),
                    averageFields: collect(m, "averageFields"),
                    minimumFields: collect(m, "minimumFields"),
                    maximumFields: collect(m, "maximumFields"),
                    countEnabled: m.countEnabled(),
                    filters,
                }));
                kafka.produceSafe(replyTopic, corr, okRow(corr, agg));
                break;
            }

            case FBG.SqlRpc.RpcMethod.CREATE_TABLE: {
                throw new Error("CREATE_TABLE via RPC not implemented; use HTTP route for now.");
            }

            default:
                throw new Error(`Unknown RPC method: ${req.method()}`);
        }
    } catch (e: any) {
        kafka.produceSafe(
            replyTopic,
            corr,
            err(corr, FBG.SqlRpc.ErrorCode.INTERNAL, e?.message || "internal")
        );
    }
}

// ---- lifecycle ----
export async function startRpcWorker() {
    kafka.setHandler((msg: Message) => {
        if (!msg.value) return;
        void handleEnv(new Uint8Array(msg.value as Buffer));
    });

    await kafka.start();

    const shutdown = () => kafka.stop();
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    console.log(`[RPC] listening: ${REQUEST_TOPIC} -> replies to ${RESPONSE_TOPIC_DEFAULT} (rdkafka; refactored)`);
}