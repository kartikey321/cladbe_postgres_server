/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dotenv from "dotenv";
import { Buffer } from "node:buffer";
import * as flatbuffers from "flatbuffers";
// generated protocol barrels
import * as SqlProtocol from "@cladbe/sql-protocol";
// postgres manager (your own lib)
import * as pgm from "@cladbe/postgres_manager";
// kafka wrapper (the file at src/rpc/kafka.ts)
import { RpcKafka } from "./kafka.js";
// ----------------------------------------------------------------------------------
const SqlRpc = SqlProtocol.SqlRpc.SqlRpc;
dotenv.config();
const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const REQ_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
const RES_TOPIC = process.env.SQL_RPC_RESPONSE_TOPIC || "sql.rpc.responses";
const GROUP_ID = process.env.SQL_RPC_GROUP_ID || "cladbe-postgres-rpc";
const rpc = new RpcKafka({
    brokers: BROKERS,
    groupId: GROUP_ID,
    requestTopic: REQ_TOPIC,
});
// ----------------------------- helpers ---------------------------------
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
// ----- encode payload variants -----
function encodeRowsJson(builder, rows) {
    const rowOffsets = rows.map((r) => builder.createString(r));
    const vec = SqlRpc.RowsJson.createRowsVector(builder, rowOffsets);
    SqlRpc.RowsJson.startRowsJson(builder);
    SqlRpc.RowsJson.addRows(builder, vec);
    const off = SqlRpc.RowsJson.endRowsJson(builder);
    return { off, type: SqlProtocol.SqlRpc.SqlRpc.RpcResponse.RowsJson };
}
function encodeRowJson(builder, row) {
    const r = builder.createString(row);
    SqlRpc.RowJson.startRowJson(builder);
    SqlRpc.RowJson.addRow(builder, r);
    const off = SqlRpc.RowJson.endRowJson(builder);
    return { off, type: SqlProtocol.SqlRpc.SqlRpc.RpcResponse.RowJson };
}
function encodeBool(builder, value) {
    SqlRpc.BoolRes.startBoolRes(builder);
    SqlRpc.BoolRes.addValue(builder, value);
    const off = SqlRpc.BoolRes.endBoolRes(builder);
    return { off, type: SqlProtocol.SqlRpc.SqlRpc.RpcResponse.BoolRes };
}
function encodeAgg(builder, 
// eslint-disable-next-line @typescript-eslint/ban-types
_aggObj) {
    // TODO: map aggObj → SqlSchema.DataHelperAggregation and set on AggRes
    SqlRpc.AggRes.startAggRes(builder);
    // SqlRpc.AggRes.addAgg(builder, <SqlSchema.DataHelperAggregation offset>);
    const off = SqlRpc.AggRes.endAggRes(builder);
    return { off, type: SqlProtocol.SqlRpc.SqlRpc.RpcResponse.AggRes };
}
// ----------------------------- dispatcher ---------------------------------
async function handleGetData(req) {
    const companyId = req.companyId() || "";
    const tableName = req.tableName() || "";
    const limit = req.limit();
    const offset = req.offset();
    // TODO: map wrapper/order/cursor/strictAfter to your manager
    const rows = await pgm.getData({
        companyId,
        tableName,
        limit: limit || undefined,
        offset: offset || undefined,
    });
    const rowsJson = (rows || []).map((r) => JSON.stringify(r));
    return { rows: rowsJson };
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
    const rowsJson = (added || []).map((r) => JSON.stringify(r));
    return { rows: rowsJson };
}
async function handleUpdateSingle(req) {
    const updated = await pgm.updateSingleRecord({
        companyId: req.companyId(),
        tableName: req.tableName(),
        primaryKeyColumn: req.primaryKeyColumn(),
        primaryId: req.primaryId(),
        updates: JSON.parse(req.updatesJson() || "{}"),
    });
    const rowsJson = (updated || []).map((r) => JSON.stringify(r));
    return { rows: rowsJson };
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
async function handleCreateTable(req) {
    // TODO: map SqlSchema.TableDefinition → your manager's TableDefinition
    const ok = await pgm.createTable({
        companyId: req.companyId(),
        definition: /* map from req.definition() */ {},
    });
    return { ok: !!ok };
}
async function handleTableExists(req) {
    const ok = await pgm.tableExists({
        companyId: req.companyId(),
        tableName: req.tableName(),
    });
    return { ok: !!ok };
}
async function handleRunAggregation(req) {
    const agg = await pgm.runAggregation({
        companyId: req.companyId(),
        tableName: req.tableName(),
        countEnabled: req.countEnabled(),
        sumFields: arrayFromVec(req.sumFieldsLength(), (i) => req.sumFields(i)),
        averageFields: arrayFromVec(req.averageFieldsLength(), (i) => req.averageFields(i)),
        minimumFields: arrayFromVec(req.minimumFieldsLength(), (i) => req.minimumFields(i)),
        maximumFields: arrayFromVec(req.maximumFieldsLength(), (i) => req.maximumFields(i)),
        // TODO: wrapper mapping
    });
    return { agg };
}
function arrayFromVec(len, getter) {
    const out = [];
    for (let i = 0; i < len; i++) {
        const v = getter(i);
        if (v != null)
            out.push(v);
    }
    return out;
}
// ----------------------------- main loop ---------------------------------
rpc.setHandler(async (m) => {
    if (!m.value)
        return; // guard
    const value = m.value;
    const bb = bbFrom(value);
    const req = SqlRpc.RequestEnvelope.getRootAsRequestEnvelope(bb);
    const correlationId = req.correlationId() || "";
    const replyTopic = req.replyTopic() || RES_TOPIC;
    const method = req.method();
    const builder = new flatbuffers.Builder(1024);
    try {
        let respBuf;
        switch (method) {
            case SqlRpc.RpcMethod.GET_DATA: {
                const payload = new SqlRpc.GetDataReq();
                // @ts-ignore generated union API
                req.payload(payload);
                const { rows } = await handleGetData(payload);
                const p = encodeRowsJson(builder, rows);
                respBuf = okResponse(builder, correlationId, p.off, p.type);
                break;
            }
            case SqlRpc.RpcMethod.GET_SINGLE: {
                const payload = new SqlRpc.GetSingleReq();
                // @ts-ignore
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
                const p = encodeAgg(builder, agg); // TODO: build real SqlSchema.DataHelperAggregation
                respBuf = okResponse(builder, correlationId, p.off, p.type);
                break;
            }
            default: {
                respBuf = errResponse(builder, correlationId, SqlRpc.ErrorCode.BAD_REQUEST, `Unknown method: ${method}`);
            }
        }
        if (respBuf) {
            const key = correlationId || "";
            rpc.produceSafe(replyTopic, key, respBuf);
        }
    }
    catch (e) {
        const msg = e?.message || String(e);
        const errBuf = errResponse(builder, correlationId, SqlRpc.ErrorCode.INTERNAL, msg);
        const key = correlationId || "";
        rpc.produceSafe(replyTopic, key, errBuf);
        // eslint-disable-next-line no-console
        console.error("[rpc] handler error", e);
    }
});
// ----------------------------- exported starter ---------------------------------
export async function startRpcWorker() {
    await rpc.start();
    // eslint-disable-next-line no-console
    console.log(`[rpc] worker started: brokers=${BROKERS.join(",")} req=${REQ_TOPIC} res=${RES_TOPIC} group=${GROUP_ID}`);
}
/** Optional: allow running worker directly */
if (import.meta.url === `file://${process.argv[1]}`) {
    startRpcWorker().catch((err) => {
        console.error("RPC worker failed to start:", err);
        process.exit(1);
    });
}
