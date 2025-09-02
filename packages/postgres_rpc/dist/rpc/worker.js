/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dotenv from "dotenv";
import { Buffer } from "node:buffer";
import * as flatbuffers from "flatbuffers";
// protocol barrels
import { SqlRpc as sr } from "@cladbe/sql-protocol";
// your postgres manager lib
import * as pgm from "@cladbe/postgres_manager";
// our Kafka wrapper (make sure this file is at src/rpc/kafka.ts)
import { RpcKafka } from "./kafka.js";
const SqlRpc = sr.SqlRpc;
dotenv.config();
const postgresManager = pgm.PostgresManager.getInstance();
// ------- env -------
const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const REQ_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
const GROUP_ID = process.env.SQL_RPC_GROUP_ID || "cladbe-postgres-rpc";
// simple method name helper for nicer logs
const MethodName = {
    [SqlRpc.RpcMethod.GET_DATA]: "GET_DATA",
    [SqlRpc.RpcMethod.GET_SINGLE]: "GET_SINGLE",
    [SqlRpc.RpcMethod.ADD_SINGLE]: "ADD_SINGLE",
    [SqlRpc.RpcMethod.UPDATE_SINGLE]: "UPDATE_SINGLE",
    [SqlRpc.RpcMethod.DELETE_ROW]: "DELETE_ROW",
    [SqlRpc.RpcMethod.CREATE_TABLE]: "CREATE_TABLE",
    [SqlRpc.RpcMethod.TABLE_EXISTS]: "TABLE_EXISTS",
    [SqlRpc.RpcMethod.RUN_AGGREGATION]: "RUN_AGGREGATION",
};
function bbFrom(buf) {
    return new flatbuffers.ByteBuffer(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
}
function okResponse(builder, correlationId, dataOffset, dataType) {
    const corrStr = builder.createString(correlationId);
    SqlRpc.ResponseEnvelope.startResponseEnvelope(builder);
    SqlRpc.ResponseEnvelope.addCorrelationId(builder, corrStr);
    SqlRpc.ResponseEnvelope.addOk(builder, true);
    SqlRpc.ResponseEnvelope.addErrorCode(builder, SqlRpc.ErrorCode.NONE);
    SqlRpc.ResponseEnvelope.addDataType(builder, dataType);
    SqlRpc.ResponseEnvelope.addData(builder, dataOffset);
    const env = SqlRpc.ResponseEnvelope.endResponseEnvelope(builder);
    builder.finish(env);
    return Buffer.from(builder.asUint8Array());
}
function errResponse(builder, correlationId, code, message) {
    const corrStr = builder.createString(correlationId);
    const msgStr = builder.createString(message);
    SqlRpc.ResponseEnvelope.startResponseEnvelope(builder);
    SqlRpc.ResponseEnvelope.addCorrelationId(builder, corrStr);
    SqlRpc.ResponseEnvelope.addOk(builder, false);
    SqlRpc.ResponseEnvelope.addErrorCode(builder, code);
    SqlRpc.ResponseEnvelope.addErrorMessage(builder, msgStr);
    const env = SqlRpc.ResponseEnvelope.endResponseEnvelope(builder);
    builder.finish(env);
    return Buffer.from(builder.asUint8Array());
}
// ----- encoders for response union -----
function encodeRowsJson(b, rows) {
    const offs = rows.map((r) => b.createString(r));
    const vec = SqlRpc.RowsJson.createRowsVector(b, offs);
    SqlRpc.RowsJson.startRowsJson(b);
    SqlRpc.RowsJson.addRows(b, vec);
    const off = SqlRpc.RowsJson.endRowsJson(b);
    return { off, type: SqlRpc.RpcResponse.RowsJson };
}
function encodeRowJson(b, row) {
    const s = b.createString(row);
    SqlRpc.RowJson.startRowJson(b);
    SqlRpc.RowJson.addRow(b, s);
    const off = SqlRpc.RowJson.endRowJson(b);
    return { off, type: SqlRpc.RpcResponse.RowJson };
}
function encodeBool(b, v) {
    SqlRpc.BoolRes.startBoolRes(b);
    SqlRpc.BoolRes.addValue(b, v);
    const off = SqlRpc.BoolRes.endBoolRes(b);
    return { off, type: SqlRpc.RpcResponse.BoolRes };
}
function encodeAgg(b) {
    SqlRpc.AggRes.startAggRes(b);
    // TODO: map to SqlSchema.DataHelperAggregation
    const off = SqlRpc.AggRes.endAggRes(b);
    return { off, type: SqlRpc.RpcResponse.AggRes };
}
// ----- handlers (call your pg manager) -----
async function handleGetData(req) {
    const companyId = req.companyId() || "";
    const tableName = req.tableName() || "";
    const limit = req.limit();
    const offset = req.offset();
    console.log(`[rpc-worker] → pg.getData`, { companyId, tableName, limit, offset });
    const rows = postgresManager.getData(new pgm.GetDataDbRequest(tableName, companyId));
    const out = (rows || []).map((r) => JSON.stringify(r));
    console.log(`[rpc-worker] ← pg.getData OK`, { count: out.length });
    return { rows: out };
}
async function handleGetSingle(req) {
    const row = await pgm.getSingleRecord({
        companyId: req.companyId(),
        tableName: req.tableName(),
        primaryKeyColumn: req.primaryKeyColumn(),
        primaryId: req.primaryId(),
    });
    return { row: row ? JSON.stringify(row) : null };
}
async function handleAddSingle(req) {
    const added = await pgm.addSingleRecord({
        companyId: req.companyId(),
        tableName: req.tableName(),
        primaryKeyColumn: req.primaryKeyColumn(),
        data: JSON.parse(req.rowJson() || "{}"),
    });
    return { rows: (added || []).map((r) => JSON.stringify(r)) };
}
async function handleUpdateSingle(req) {
    const updated = await pgm.updateSingleRecord({
        companyId: req.companyId(),
        tableName: req.tableName(),
        primaryKeyColumn: req.primaryKeyColumn(),
        primaryId: req.primaryId(),
        updates: JSON.parse(req.updatesJson() || "{}"),
    });
    return { rows: (updated || []).map((r) => JSON.stringify(r)) };
}
async function handleDeleteRow(req) {
    const ok = await pgm.deleteRow({
        companyId: req.companyId(),
        tableName: req.tableName(),
        primaryKeyColumn: req.primaryKeyColumn(),
        primaryId: req.primaryId(),
    });
    return { ok: !!ok };
}
async function handleCreateTable(_req) {
    // TODO: map schema → pg
    return { ok: false };
}
async function handleTableExists(req) {
    const ok = await pgm.tableExists({
        companyId: req.companyId(),
        tableName: req.tableName(),
    });
    return { ok: !!ok };
}
async function handleRunAggregation(_req) {
    return { agg: {} };
}
// ----- start function with logs -----
export async function startRpcWorker() {
    console.log(`[rpc-worker] starting`, { brokers: BROKERS.join(","), groupId: GROUP_ID, requestTopic: REQ_TOPIC });
    const rpc = new RpcKafka({
        brokers: BROKERS,
        groupId: GROUP_ID,
        requestTopic: REQ_TOPIC,
    });
    rpc.setHandler(async (m) => {
        if (!m.value)
            return;
        const keyStr = m.key
            ? (Buffer.isBuffer(m.key) ? m.key.toString("utf8") : String(m.key))
            : "";
        console.log(`[rpc-worker] ⇐ kafka`, {
            topic: m.topic,
            partition: m.partition,
            offset: m.offset,
            key: keyStr,
            valueBytes: m.value.byteLength,
            ts: m.timestamp,
        });
        const bb = bbFrom(m.value);
        const req = SqlRpc.RequestEnvelope.getRootAsRequestEnvelope(bb);
        const correlationId = req.correlationId() || "";
        const replyTopic = req.replyTopic() || "sql.rpc.responses";
        const method = req.method();
        const methodName = MethodName[method] ?? String(method);
        console.log(`[rpc-worker] ⇢ decode`, {
            correlationId, replyTopic, method: methodName,
        });
        const builder = new flatbuffers.Builder(1024);
        try {
            let respBuf;
            switch (method) {
                case SqlRpc.RpcMethod.GET_DATA: {
                    const payload = new SqlRpc.GetDataReq();
                    // @ts-ignore union
                    req.payload(payload);
                    console.log(`[rpc-worker] • GET_DATA payload`, {
                        companyId: payload.companyId(), tableName: payload.tableName(),
                        limit: payload.limit(), offset: payload.offset(), strictAfter: payload.strictAfter()
                    });
                    const { rows } = await handleGetData(payload);
                    const p = encodeRowsJson(builder, rows);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.GET_SINGLE: {
                    const payload = new SqlRpc.GetSingleReq();
                    // @ts-ignore union
                    req.payload(payload);
                    const { row } = await handleGetSingle(payload);
                    const p = encodeRowJson(builder, row ?? "{}");
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.ADD_SINGLE: {
                    const payload = new SqlRpc.AddSingleReq();
                    // @ts-ignore
                    req.payload(payload);
                    const { rows } = await handleAddSingle(payload);
                    const p = encodeRowsJson(builder, rows);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.UPDATE_SINGLE: {
                    const payload = new SqlRpc.UpdateSingleReq();
                    // @ts-ignore
                    req.payload(payload);
                    const { rows } = await handleUpdateSingle(payload);
                    const p = encodeRowsJson(builder, rows);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.DELETE_ROW: {
                    const payload = new SqlRpc.DeleteRowReq();
                    // @ts-ignore
                    req.payload(payload);
                    const { ok } = await handleDeleteRow(payload);
                    const p = encodeBool(builder, ok);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.CREATE_TABLE: {
                    const payload = new SqlRpc.CreateTableReq();
                    // @ts-ignore
                    req.payload(payload);
                    const { ok } = await handleCreateTable(payload);
                    const p = encodeBool(builder, ok);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.TABLE_EXISTS: {
                    const payload = new SqlRpc.TableExistsReq();
                    // @ts-ignore
                    req.payload(payload);
                    const { ok } = await handleTableExists(payload);
                    const p = encodeBool(builder, ok);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                case SqlRpc.RpcMethod.RUN_AGGREGATION: {
                    const payload = new SqlRpc.RunAggregationReq();
                    // @ts-ignore
                    req.payload(payload);
                    const { agg } = await handleRunAggregation(payload);
                    console.log(`[rpc-worker] • RUN_AGGREGATION result keys`, { keys: Object.keys(agg || {}) });
                    const p = encodeAgg(builder);
                    respBuf = okResponse(builder, correlationId, p.off, p.type);
                    break;
                }
                default: {
                    respBuf = errResponse(builder, correlationId, SqlRpc.ErrorCode.BAD_REQUEST, `Unknown method: ${method}`);
                }
            }
            if (respBuf) {
                console.log(`[rpc-worker] ⇒ send`, {
                    correlationId, replyTopic, bytes: respBuf.byteLength
                });
                rpc.produceSafe(replyTopic, correlationId || "", respBuf);
            }
        }
        catch (e) {
            console.error(`[rpc-worker] ✖ handler error`, {
                correlationId, method: methodName, err: String(e?.message || e)
            });
            try {
                const errBuf = errResponse(builder, correlationId, SqlRpc.ErrorCode.INTERNAL, String(e?.message || e));
                rpc.produceSafe(replyTopic, correlationId || "", errBuf);
            }
            catch { /* ignore */ }
        }
    });
    await rpc.start();
    console.log(`[rpc-worker] ready`, { brokers: BROKERS.join(","), reqTopic: REQ_TOPIC, groupId: GROUP_ID });
}
