// tests/fb-helpers.ts
import * as flatbuffers from "flatbuffers";
import { SqlRpc as sr, SqlSchema as sc } from "@cladbe/sql-protocol";

const SqlRpc = sr.SqlRpc;
const SqlSchema = sc.SqlSchema;

export function buildGetDataReqLegacy(opts: {
  companyId: string;
  tableName: string;
  limit?: number;
  offset?: number;
  strictAfter?: boolean;
  correlationId: string;
  replyTopic: string;
}) {
  const b = new flatbuffers.Builder(1024);
  const companyOff = b.createString(opts.companyId);
  const tableOff   = b.createString(opts.tableName);
  const corrOff    = b.createString(opts.correlationId);
  const replyOff   = b.createString(opts.replyTopic);

  SqlRpc.GetDataReq.startGetDataReq(b);
  SqlRpc.GetDataReq.addCompanyId(b, companyOff);
  SqlRpc.GetDataReq.addTableName(b, tableOff);
  if (opts.limit != null)  SqlRpc.GetDataReq.addLimit(b, opts.limit);
  if (opts.offset != null) SqlRpc.GetDataReq.addOffset(b, opts.offset);
  if (opts.strictAfter != null) SqlRpc.GetDataReq.addStrictAfter(b, !!opts.strictAfter);
  const reqOff = SqlRpc.GetDataReq.endGetDataReq(b);

  SqlRpc.RequestEnvelope.startRequestEnvelope(b);
  SqlRpc.RequestEnvelope.addCorrelationId(b, corrOff);
  SqlRpc.RequestEnvelope.addReplyTopic(b, replyOff);
  SqlRpc.RequestEnvelope.addMethod(b, SqlRpc.RpcMethod.GET_DATA);
  SqlRpc.RequestEnvelope.addPayloadType(b, SqlRpc.RpcPayload.GetDataReq);
  SqlRpc.RequestEnvelope.addPayload(b, reqOff);
  const env = SqlRpc.RequestEnvelope.endRequestEnvelope(b);
  b.finish(env);
  return Buffer.from(b.asUint8Array());
}

/** Build GetDataReq with wrapper/order/cursor/strictAfter (all exist on your generated GetDataReq). */
export function buildGetDataReqWithFields(opts: {
  companyId: string;
  tableName: string;
  limit?: number;
  strictAfter?: boolean;
  order?: Array<{ field: string; sort: number; isPk?: boolean }>;
  cursor?: Record<string, string | number | boolean>;
  filterEquals?: { field: string; value: string | number | boolean }; // simple equals
  correlationId: string;
  replyTopic: string;
}) {
  const b = new flatbuffers.Builder(2048);
  const companyOff = b.createString(opts.companyId);
  const tableOff   = b.createString(opts.tableName);
  const corrOff    = b.createString(opts.correlationId);
  const replyOff   = b.createString(opts.replyTopic);

  // optional wrapper (single equals filter)
  let wrapperOff = 0;
  if (opts.filterEquals) {
    const fName = b.createString(opts.filterEquals.field);

    // value → StringValue (keep simple; adjust to other value types if needed)
    const valStr = b.createString(String(opts.filterEquals.value));
    SqlSchema.StringValue.startStringValue(b);
    SqlSchema.StringValue.addValue(b, valStr);
    const vOff = SqlSchema.StringValue.endStringValue(b);

    SqlSchema.BasicSqlDataFilter.startBasicSqlDataFilter(b);
    SqlSchema.BasicSqlDataFilter.addFieldName(b, fName);
    SqlSchema.BasicSqlDataFilter.addValueType(b, SqlSchema.FilterValue.StringValue);
    SqlSchema.BasicSqlDataFilter.addValue(b, vOff);
    SqlSchema.BasicSqlDataFilter.addFilterType(b, SqlSchema.BasicSqlDataFilterType.equals);
    const leafOff = SqlSchema.BasicSqlDataFilter.endBasicSqlDataFilter(b);

    const vec = SqlSchema.BasicSqlDataFilterWrapper.createFiltersVector(b, [leafOff]);
    SqlSchema.BasicSqlDataFilterWrapper.startBasicSqlDataFilterWrapper(b);
    SqlSchema.BasicSqlDataFilterWrapper.addFilterWrapperType(b, SqlSchema.SQLFilterWrapperType.and);
    // IMPORTANT: if your generator needs filtersType, include it only if present in your generated code.
    // SqlSchema.BasicSqlDataFilterWrapper.addFiltersType(b, SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilter);
    SqlSchema.BasicSqlDataFilterWrapper.addFilters(b, vec);
    wrapperOff = SqlSchema.BasicSqlDataFilterWrapper.endBasicSqlDataFilterWrapper(b);
  }

  // order[]
  let orderOff = 0;
  if (opts.order && opts.order.length) {
    const items = opts.order.map(o => {
      const fOff = b.createString(o.field);
      SqlSchema.OrderKeySpec.startOrderKeySpec(b);
      SqlSchema.OrderKeySpec.addField(b, fOff);
      SqlSchema.OrderKeySpec.addSort(b, o.sort);
      if (o.isPk) SqlSchema.OrderKeySpec.addIsPk(b, true);
      return SqlSchema.OrderKeySpec.endOrderKeySpec(b);
    });
    orderOff = SqlRpc.GetDataReq.createOrderVector(b, items);
  }

  // cursor[]
  let cursorOff = 0;
  if (opts.cursor && Object.keys(opts.cursor).length) {
    const entries = Object.entries(opts.cursor).map(([k, v]) => {
      const kOff = b.createString(k);
      const vStr = b.createString(String(v));
      SqlSchema.StringValue.startStringValue(b);
      SqlSchema.StringValue.addValue(b, vStr);
      const vv = SqlSchema.StringValue.endStringValue(b);

      SqlSchema.CursorEntry.startCursorEntry(b);
      SqlSchema.CursorEntry.addField(b, kOff);
      SqlSchema.CursorEntry.addValueType(b, SqlSchema.FilterValue.StringValue);
      SqlSchema.CursorEntry.addValue(b, vv);
      return SqlSchema.CursorEntry.endCursorEntry(b);
    });
    cursorOff = SqlRpc.GetDataReq.createCursorVector(b, entries);
  }

  // GetDataReq
  SqlRpc.GetDataReq.startGetDataReq(b);
  SqlRpc.GetDataReq.addCompanyId(b, companyOff);
  SqlRpc.GetDataReq.addTableName(b, tableOff);
  if (wrapperOff) SqlRpc.GetDataReq.addWrapper(b, wrapperOff);
  if (orderOff)   SqlRpc.GetDataReq.addOrder(b, orderOff);
  if (cursorOff)  SqlRpc.GetDataReq.addCursor(b, cursorOff);
  if (opts.limit != null) SqlRpc.GetDataReq.addLimit(b, opts.limit);
  if (opts.strictAfter != null) SqlRpc.GetDataReq.addStrictAfter(b, !!opts.strictAfter);
  const reqOff = SqlRpc.GetDataReq.endGetDataReq(b);

  // Envelope
  SqlRpc.RequestEnvelope.startRequestEnvelope(b);
  SqlRpc.RequestEnvelope.addCorrelationId(b, corrOff);
  SqlRpc.RequestEnvelope.addReplyTopic(b, replyOff);
  SqlRpc.RequestEnvelope.addMethod(b, SqlRpc.RpcMethod.GET_DATA);
  SqlRpc.RequestEnvelope.addPayloadType(b, SqlRpc.RpcPayload.GetDataReq);
  SqlRpc.RequestEnvelope.addPayload(b, reqOff);
  const env = SqlRpc.RequestEnvelope.endRequestEnvelope(b);
  b.finish(env);
  return Buffer.from(b.asUint8Array());
}

export function decodeRowsJson(buf: Buffer) {
  const bb = new flatbuffers.ByteBuffer(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  const env = SqlRpc.ResponseEnvelope.getRootAsResponseEnvelope(bb);
  const ok = env.ok();
  const t  = env.dataType();
  const rows: string[] = [];
  if (t === SqlRpc.RpcResponse.RowsJson) {
    const tbl = new SqlRpc.RowsJson();
    env.data(tbl);
    const n = tbl.rowsLength() || 0;
    for (let i = 0; i < n; i++) {
      const s = tbl.rows(i);
      if (s) rows.push(s);
    }
  }
  return { ok, type: t, rows };
}