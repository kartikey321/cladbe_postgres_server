import * as flatbuffers from "flatbuffers";
import { SqlRpc as sr, SqlSchema as sc } from "@cladbe/sql-protocol";
import { encodeFilterValue } from "./helpers/values.js";
import { encodeWrapper, isWrapper } from "./helpers/filters.js";
import { encodeTableDefinition } from "./helpers/tabledef.js";
import { mapOrderSort } from "./helpers/enums.js";
// ---- Field/vector helpers ----
function encodeOrder(b, order) {
    if (!order?.length)
        return 0;
    const offsets = [];
    for (const o of order) {
        const field = b.createString(o.field);
        sc.SqlSchema.OrderKeySpec.startOrderKeySpec(b);
        sc.SqlSchema.OrderKeySpec.addField(b, field);
        sc.SqlSchema.OrderKeySpec.addSort(b, mapOrderSort(o.sort));
        const off = sc.SqlSchema.OrderKeySpec.endOrderKeySpec(b);
        offsets.push(off);
    }
    // Vector must be created by the owning table helper
    return sr.SqlRpc.GetDataReq.createOrderVector(b, offsets);
}
function encodeCursor(b, cursor) {
    if (!cursor)
        return 0;
    const entries = [];
    for (const [field, val] of Object.entries(cursor)) {
        const f = b.createString(field);
        const { type, off } = encodeFilterValue(b, val);
        sc.SqlSchema.CursorEntry.startCursorEntry(b);
        sc.SqlSchema.CursorEntry.addField(b, f);
        sc.SqlSchema.CursorEntry.addValueType(b, type);
        sc.SqlSchema.CursorEntry.addValue(b, off);
        const e = sc.SqlSchema.CursorEntry.endCursorEntry(b);
        entries.push(e);
    }
    // Vector must be created by the owning table helper
    return sr.SqlRpc.GetDataReq.createCursorVector(b, entries);
}
function encodeWrapperMaybe(b, filters) {
    if (!filters)
        return 0;
    // Accept either a single wrapper or the common [wrapper] shape.
    const candidate = Array.isArray(filters) ? filters[0] : filters;
    if (!candidate)
        return 0;
    if (!isWrapper(candidate)) {
        throw new Error("filters must be a SqlDataFilterWrapper or [SqlDataFilterWrapper]");
    }
    return encodeWrapper(b, candidate);
}
// ---- Request encoders ----
function encodeGetData(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    const wrapperOff = encodeWrapperMaybe(b, j.filters);
    const orderVec = encodeOrder(b, j.orderKeys);
    const cursorVec = encodeCursor(b, j.cursor);
    sr.SqlRpc.GetDataReq.startGetDataReq(b);
    sr.SqlRpc.GetDataReq.addCompanyId(b, company);
    sr.SqlRpc.GetDataReq.addTableName(b, table);
    if (wrapperOff)
        sr.SqlRpc.GetDataReq.addWrapper(b, wrapperOff);
    if (j.limit !== undefined)
        sr.SqlRpc.GetDataReq.addLimit(b, j.limit >>> 0);
    if (j.offset !== undefined)
        sr.SqlRpc.GetDataReq.addOffset(b, j.offset >>> 0);
    if (orderVec)
        sr.SqlRpc.GetDataReq.addOrder(b, orderVec);
    if (cursorVec)
        sr.SqlRpc.GetDataReq.addCursor(b, cursorVec);
    sr.SqlRpc.GetDataReq.addStrictAfter(b, j.strictAfter ?? true);
    return sr.SqlRpc.GetDataReq.endGetDataReq(b);
}
function encodeRunAggregation(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    const sumVec = j.sumFields?.length
        ? sr.SqlRpc.RunAggregationReq.createSumFieldsVector(b, j.sumFields.map((s) => b.createString(s)))
        : 0;
    const avgVec = j.averageFields?.length
        ? sr.SqlRpc.RunAggregationReq.createAverageFieldsVector(b, j.averageFields.map((s) => b.createString(s)))
        : 0;
    const minVec = j.minimumFields?.length
        ? sr.SqlRpc.RunAggregationReq.createMinimumFieldsVector(b, j.minimumFields.map((s) => b.createString(s)))
        : 0;
    const maxVec = j.maximumFields?.length
        ? sr.SqlRpc.RunAggregationReq.createMaximumFieldsVector(b, j.maximumFields.map((s) => b.createString(s)))
        : 0;
    const wrapperOff = encodeWrapperMaybe(b, j.filters);
    sr.SqlRpc.RunAggregationReq.startRunAggregationReq(b);
    sr.SqlRpc.RunAggregationReq.addCompanyId(b, company);
    sr.SqlRpc.RunAggregationReq.addTableName(b, table);
    sr.SqlRpc.RunAggregationReq.addCountEnabled(b, !!j.countEnabled);
    if (sumVec)
        sr.SqlRpc.RunAggregationReq.addSumFields(b, sumVec);
    if (avgVec)
        sr.SqlRpc.RunAggregationReq.addAverageFields(b, avgVec);
    if (minVec)
        sr.SqlRpc.RunAggregationReq.addMinimumFields(b, minVec);
    if (maxVec)
        sr.SqlRpc.RunAggregationReq.addMaximumFields(b, maxVec);
    if (wrapperOff)
        sr.SqlRpc.RunAggregationReq.addWrapper(b, wrapperOff);
    return sr.SqlRpc.RunAggregationReq.endRunAggregationReq(b);
}
function encodeGetSingle(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    const pkc = b.createString(j.primaryKeyColumn);
    const pk = b.createString(j.primaryId);
    sr.SqlRpc.GetSingleReq.startGetSingleReq(b);
    sr.SqlRpc.GetSingleReq.addCompanyId(b, company);
    sr.SqlRpc.GetSingleReq.addTableName(b, table);
    sr.SqlRpc.GetSingleReq.addPrimaryKeyColumn(b, pkc);
    sr.SqlRpc.GetSingleReq.addPrimaryId(b, pk);
    return sr.SqlRpc.GetSingleReq.endGetSingleReq(b);
}
function encodeAddSingle(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    const pkc = b.createString(j.primaryKeyColumn);
    const row = b.createString(JSON.stringify(j.data ?? {}));
    sr.SqlRpc.AddSingleReq.startAddSingleReq(b);
    sr.SqlRpc.AddSingleReq.addCompanyId(b, company);
    sr.SqlRpc.AddSingleReq.addTableName(b, table);
    sr.SqlRpc.AddSingleReq.addPrimaryKeyColumn(b, pkc);
    sr.SqlRpc.AddSingleReq.addRowJson(b, row);
    return sr.SqlRpc.AddSingleReq.endAddSingleReq(b);
}
function encodeUpdateSingle(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    const pkc = b.createString(j.primaryKeyColumn);
    const pk = b.createString(j.primaryId);
    const upd = b.createString(JSON.stringify(j.updates ?? {}));
    sr.SqlRpc.UpdateSingleReq.startUpdateSingleReq(b);
    sr.SqlRpc.UpdateSingleReq.addCompanyId(b, company);
    sr.SqlRpc.UpdateSingleReq.addTableName(b, table);
    sr.SqlRpc.UpdateSingleReq.addPrimaryKeyColumn(b, pkc);
    sr.SqlRpc.UpdateSingleReq.addPrimaryId(b, pk);
    sr.SqlRpc.UpdateSingleReq.addUpdatesJson(b, upd);
    return sr.SqlRpc.UpdateSingleReq.endUpdateSingleReq(b);
}
function encodeDeleteRow(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    const pkc = b.createString(j.primaryKeyColumn);
    const pk = b.createString(j.primaryId);
    sr.SqlRpc.DeleteRowReq.startDeleteRowReq(b);
    sr.SqlRpc.DeleteRowReq.addCompanyId(b, company);
    sr.SqlRpc.DeleteRowReq.addTableName(b, table);
    sr.SqlRpc.DeleteRowReq.addPrimaryKeyColumn(b, pkc);
    sr.SqlRpc.DeleteRowReq.addPrimaryId(b, pk);
    return sr.SqlRpc.DeleteRowReq.endDeleteRowReq(b);
}
function encodeCreateTable(b, j) {
    const company = b.createString(j.companyId);
    const defOff = encodeTableDefinition(b, j.definition);
    sr.SqlRpc.CreateTableReq.startCreateTableReq(b);
    sr.SqlRpc.CreateTableReq.addCompanyId(b, company);
    sr.SqlRpc.CreateTableReq.addDefinition(b, defOff);
    return sr.SqlRpc.CreateTableReq.endCreateTableReq(b);
}
function encodeTableExists(b, j) {
    const company = b.createString(j.companyId);
    const table = b.createString(j.tableName);
    sr.SqlRpc.TableExistsReq.startTableExistsReq(b);
    sr.SqlRpc.TableExistsReq.addCompanyId(b, company);
    sr.SqlRpc.TableExistsReq.addTableName(b, table);
    return sr.SqlRpc.TableExistsReq.endTableExistsReq(b);
}
// ---- Payload union builder ----
function asUnion(type, off) {
    return { type, off };
}
function encodePayload(b, req) {
    switch (req.method) {
        case "GET_DATA": return asUnion(sr.SqlRpc.RpcPayload.GetDataReq, encodeGetData(b, req.payload));
        case "GET_SINGLE": return asUnion(sr.SqlRpc.RpcPayload.GetSingleReq, encodeGetSingle(b, req.payload));
        case "ADD_SINGLE": return asUnion(sr.SqlRpc.RpcPayload.AddSingleReq, encodeAddSingle(b, req.payload));
        case "UPDATE_SINGLE": return asUnion(sr.SqlRpc.RpcPayload.UpdateSingleReq, encodeUpdateSingle(b, req.payload));
        case "DELETE_ROW": return asUnion(sr.SqlRpc.RpcPayload.DeleteRowReq, encodeDeleteRow(b, req.payload));
        case "CREATE_TABLE": return asUnion(sr.SqlRpc.RpcPayload.CreateTableReq, encodeCreateTable(b, req.payload));
        case "TABLE_EXISTS": return asUnion(sr.SqlRpc.RpcPayload.TableExistsReq, encodeTableExists(b, req.payload));
        case "RUN_AGGREGATION": return asUnion(sr.SqlRpc.RpcPayload.RunAggregationReq, encodeRunAggregation(b, req.payload));
    }
}
// ---- Public: build a RequestEnvelope buffer ----
export function buildRequestBuffer(req) {
    const b = new flatbuffers.Builder(2048);
    const corr = b.createString(req.correlationId);
    const reply = b.createString(req.replyTopic);
    const { type, off } = encodePayload(b, req);
    sr.SqlRpc.RequestEnvelope.startRequestEnvelope(b);
    sr.SqlRpc.RequestEnvelope.addCorrelationId(b, corr);
    sr.SqlRpc.RequestEnvelope.addReplyTopic(b, reply);
    const methodNum = (() => {
        switch (req.method) {
            case "GET_DATA": return sr.SqlRpc.RpcMethod.GET_DATA;
            case "GET_SINGLE": return sr.SqlRpc.RpcMethod.GET_SINGLE;
            case "ADD_SINGLE": return sr.SqlRpc.RpcMethod.ADD_SINGLE;
            case "UPDATE_SINGLE": return sr.SqlRpc.RpcMethod.UPDATE_SINGLE;
            case "DELETE_ROW": return sr.SqlRpc.RpcMethod.DELETE_ROW;
            case "CREATE_TABLE": return sr.SqlRpc.RpcMethod.CREATE_TABLE;
            case "TABLE_EXISTS": return sr.SqlRpc.RpcMethod.TABLE_EXISTS;
            case "RUN_AGGREGATION": return sr.SqlRpc.RpcMethod.RUN_AGGREGATION;
        }
    })(); // exhaustive due to union type
    sr.SqlRpc.RequestEnvelope.addMethod(b, methodNum);
    sr.SqlRpc.RequestEnvelope.addPayloadType(b, type);
    sr.SqlRpc.RequestEnvelope.addPayload(b, off);
    const env = sr.SqlRpc.RequestEnvelope.endRequestEnvelope(b);
    b.finish(env);
    return Buffer.from(b.asUint8Array());
}
