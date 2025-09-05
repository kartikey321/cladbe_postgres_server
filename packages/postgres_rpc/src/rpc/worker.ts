/* eslint-disable @typescript-eslint/no-explicit-any */

import * as dotenv from "dotenv";
import { Buffer } from "node:buffer";
import * as flatbuffers from "flatbuffers";
import { RpcKafka } from "./kafka.js";

// ---- Generated protocol barrels (FlatBuffers) ----
import { SqlRpc as sr, SqlSchema as sc } from "@cladbe/sql-protocol";
const SqlRpc = sr.SqlRpc;
const SqlSchema = sc.SqlSchema;

// ---- Your Postgres manager (singleton) + request classes ----
import {
  BaseSqlDataFilter,
  NullsSortOrder,
  PostgresManager,
  SqlDataFilter,
  SQLDataFilterType,
  SqlDataFilterWrapper,
  SQLFilterWrapperType,
} from "@cladbe/postgres_manager";
import {
  GetDataDbRequest,
  GetSingleRecordRequest,
  AddSingleDbRequest,
  UpdateSingleDbRequest,
  DeleteRowDbRequest,
  CreateTableDbRequest,
  TableExistsRequest,
  AggregationRequest,
  OrderKeySpec as MgrOrderKeySpec,
  OrderSort,
} from "@cladbe/postgres_manager";

// ----------------------------------------------------------------------------------

dotenv.config();

const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const REQ_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
const GROUP_ID = process.env.SQL_RPC_GROUP_ID || "cladbe-postgres-rpc";

// Kafka wrapper: consume requests, produce replies
const rpc = new RpcKafka({
  brokers: BROKERS,
  groupId: GROUP_ID,
  requestTopic: REQ_TOPIC,
});

// ============================ FlatBuffers helpers ============================

function bbFrom(buf: Buffer) {
  return new flatbuffers.ByteBuffer(
    new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  );
}

function okResponse(
  builder: flatbuffers.Builder,
  correlationId: string,
  dataOffset: number,
  dataType: sr.SqlRpc.RpcResponse
): Buffer {
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

function errResponse(
  builder: flatbuffers.Builder,
  correlationId: string,
  code: sr.SqlRpc.ErrorCode,
  message: string
): Buffer {
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

// ----- response payload encoders (FlatBuffers) -----

function encodeRowsJson(
  builder: flatbuffers.Builder,
  rows: string[]
): { off: number; type: sr.SqlRpc.RpcResponse } {
  const rowOffsets = rows.map((r) => builder.createString(r));
  const vec = SqlRpc.RowsJson.createRowsVector(builder, rowOffsets);
  SqlRpc.RowsJson.startRowsJson(builder);
  SqlRpc.RowsJson.addRows(builder, vec);
  const off = SqlRpc.RowsJson.endRowsJson(builder);
  return { off, type: SqlRpc.RpcResponse.RowsJson };
}

function encodeRowJson(
  builder: flatbuffers.Builder,
  row: string
): { off: number; type: sr.SqlRpc.RpcResponse } {
  const r = builder.createString(row);
  SqlRpc.RowJson.startRowJson(builder);
  SqlRpc.RowJson.addRow(builder, r);
  const off = SqlRpc.RowJson.endRowJson(builder);
  return { off, type: sr.SqlRpc.RpcResponse.RowJson };
}

function encodeBool(
  builder: flatbuffers.Builder,
  value: boolean
): { off: number; type: sr.SqlRpc.RpcResponse } {
  SqlRpc.BoolRes.startBoolRes(builder);
  SqlRpc.BoolRes.addValue(builder, value);
  const off = SqlRpc.BoolRes.endBoolRes(builder);
  return { off, type: sr.SqlRpc.RpcResponse.BoolRes };
}

// NEW: RowsWithCursor (rows + cursor[] as CursorEntry[])
function encodeRowsWithCursor(
  builder: flatbuffers.Builder,
  rows: string[],
  cursor: Record<string, unknown>
): { off: number; type: sr.SqlRpc.RpcResponse } {
  // rows
  const rowOffsets = rows.map((r) => builder.createString(r));
  const rowsVec = SqlRpc.RowsWithCursor.createRowsVector(builder, rowOffsets);

  // cursor → encode each value as StringValue (safe default)
  const cursorEntries: number[] = [];
  for (const [field, value] of Object.entries(cursor)) {
    const fOff = builder.createString(field);
    const vOff = builder.createString(String(value));

    SqlSchema.StringValue.startStringValue(builder);
    SqlSchema.StringValue.addValue(builder, vOff);
    const strValOff = SqlSchema.StringValue.endStringValue(builder);

    SqlSchema.CursorEntry.startCursorEntry(builder);
    SqlSchema.CursorEntry.addField(builder, fOff);
    SqlSchema.CursorEntry.addValueType(builder, SqlSchema.FilterValue.StringValue);
    SqlSchema.CursorEntry.addValue(builder, strValOff);
    const ceOff = SqlSchema.CursorEntry.endCursorEntry(builder);
    cursorEntries.push(ceOff);
  }
  const cursorVec = SqlRpc.RowsWithCursor.createCursorVector(builder, cursorEntries);

  SqlRpc.RowsWithCursor.startRowsWithCursor(builder);
  SqlRpc.RowsWithCursor.addRows(builder, rowsVec);
  SqlRpc.RowsWithCursor.addCursor(builder, cursorVec);
  const off = SqlRpc.RowsWithCursor.endRowsWithCursor(builder);
  return { off, type: sr.SqlRpc.RpcResponse.RowsWithCursor };
}

// Until you wire a real FB response for aggregations, keep placeholder.
function encodeAggPlaceholder(
  builder: flatbuffers.Builder
): { off: number; type: sr.SqlRpc.RpcResponse } {
  SqlRpc.AggRes.startAggRes(builder);
  const off = SqlRpc.AggRes.endAggRes(builder);
  return { off, type: sr.SqlRpc.RpcResponse.AggRes };
}

// ============================ Enum + union mappers ============================

function mapOrderSort(s: sc.SqlSchema.OrderSort): OrderSort {
  switch (s) {
    case SqlSchema.OrderSort.ASC_DEFAULT:
      return OrderSort.ASC_DEFAULT;
    case SqlSchema.OrderSort.ASC_NULLS_FIRST:
      return OrderSort.ASC_NULLS_FIRST;
    case SqlSchema.OrderSort.ASC_NULLS_LAST:
      return OrderSort.ASC_NULLS_LAST;
    case SqlSchema.OrderSort.DESC_DEFAULT:
      return OrderSort.DESC_DEFAULT;
    case SqlSchema.OrderSort.DESC_NULLS_FIRST:
      return OrderSort.DESC_NULLS_FIRST;
    case SqlSchema.OrderSort.DESC_NULLS_LAST:
      return OrderSort.DESC_NULLS_LAST;
    default:
      return OrderSort.DESC_DEFAULT;
  }
}

function mapWrapperType(t: sc.SqlSchema.SQLFilterWrapperType | null): SQLFilterWrapperType | undefined {
  if (t == null) return undefined;
  switch (t) {
    case SqlSchema.SQLFilterWrapperType.and:
      return SQLFilterWrapperType.and;
    case SqlSchema.SQLFilterWrapperType.or:
      return SQLFilterWrapperType.or;
    default:
      return undefined;
  }
}

function mapNullsSortOrder(n: sc.SqlSchema.NullsSortOrder | null | undefined): NullsSortOrder {
  switch (n) {
    case SqlSchema.NullsSortOrder.first:
      return NullsSortOrder.first;
    case SqlSchema.NullsSortOrder.last:
      return NullsSortOrder.last;
    case SqlSchema.NullsSortOrder.default_:
    default:
      return NullsSortOrder.default_;
  }
}

function mapFilterType(ft: sc.SqlSchema.BasicSqlDataFilterType | null): SQLDataFilterType | undefined {
  if (ft == null) return undefined;

  switch (ft) {
    // Basic Comparison
    case SqlSchema.BasicSqlDataFilterType.equals: return SQLDataFilterType.equals;
    case SqlSchema.BasicSqlDataFilterType.notEquals: return SQLDataFilterType.notEquals;
    case SqlSchema.BasicSqlDataFilterType.lessThan: return SQLDataFilterType.lessThan;
    case SqlSchema.BasicSqlDataFilterType.lessThanOrEquals: return SQLDataFilterType.lessThanOrEquals;
    case SqlSchema.BasicSqlDataFilterType.greaterThan: return SQLDataFilterType.greaterThan;
    case SqlSchema.BasicSqlDataFilterType.greaterThanOrEquals: return SQLDataFilterType.greaterThanOrEquals;

    // NULL
    case SqlSchema.BasicSqlDataFilterType.isNull: return SQLDataFilterType.isNull;
    case SqlSchema.BasicSqlDataFilterType.isNotNull: return SQLDataFilterType.isNotNull;

    // Regex & Pattern
    case SqlSchema.BasicSqlDataFilterType.regex: return SQLDataFilterType.regex;
    case SqlSchema.BasicSqlDataFilterType.notRegex: return SQLDataFilterType.notRegex;
    case SqlSchema.BasicSqlDataFilterType.startsWith: return SQLDataFilterType.startsWith;
    case SqlSchema.BasicSqlDataFilterType.endsWith: return SQLDataFilterType.endsWith;
    case SqlSchema.BasicSqlDataFilterType.contains: return SQLDataFilterType.contains;
    case SqlSchema.BasicSqlDataFilterType.notContains: return SQLDataFilterType.notContains;

    // Array
    case SqlSchema.BasicSqlDataFilterType.arrayContains: return SQLDataFilterType.arrayContains;
    case SqlSchema.BasicSqlDataFilterType.arrayContainedBy: return SQLDataFilterType.arrayContainedBy;
    case SqlSchema.BasicSqlDataFilterType.arrayOverlaps: return SQLDataFilterType.arrayOverlaps;
    case SqlSchema.BasicSqlDataFilterType.arrayEquals: return SQLDataFilterType.arrayEquals;
    case SqlSchema.BasicSqlDataFilterType.arrayNotEquals: return SQLDataFilterType.arrayNotEquals;
    case SqlSchema.BasicSqlDataFilterType.arrayEmpty: return SQLDataFilterType.arrayEmpty;
    case SqlSchema.BasicSqlDataFilterType.arrayNotEmpty: return SQLDataFilterType.arrayNotEmpty;
    case SqlSchema.BasicSqlDataFilterType.arrayLength: return SQLDataFilterType.arrayLength;

    // JSON
    case SqlSchema.BasicSqlDataFilterType.jsonContains: return SQLDataFilterType.jsonContains;
    case SqlSchema.BasicSqlDataFilterType.jsonContainedBy: return SQLDataFilterType.jsonContainedBy;
    case SqlSchema.BasicSqlDataFilterType.jsonHasKey: return SQLDataFilterType.jsonHasKey;
    case SqlSchema.BasicSqlDataFilterType.jsonHasAnyKey: return SQLDataFilterType.jsonHasAnyKey;
    case SqlSchema.BasicSqlDataFilterType.jsonHasAllKeys: return SQLDataFilterType.jsonHasAllKeys;
    case SqlSchema.BasicSqlDataFilterType.jsonGetField: return SQLDataFilterType.jsonGetField;
    case SqlSchema.BasicSqlDataFilterType.jsonGetFieldAsText: return SQLDataFilterType.jsonGetFieldAsText;

    // Range
    case SqlSchema.BasicSqlDataFilterType.between: return SQLDataFilterType.between;
    case SqlSchema.BasicSqlDataFilterType.notBetween: return SQLDataFilterType.notBetween;
    case SqlSchema.BasicSqlDataFilterType.rangeContains: return SQLDataFilterType.rangeContains;
    case SqlSchema.BasicSqlDataFilterType.rangeContainedBy: return SQLDataFilterType.rangeContainedBy;

    // Set
    case SqlSchema.BasicSqlDataFilterType.inList: return SQLDataFilterType.in_;
    case SqlSchema.BasicSqlDataFilterType.notInList: return SQLDataFilterType.notIn;

    default:
      return undefined;
  }
}

/** Convert a FilterValue union (type + value getter) to a plain JS value */
function readFilterFromUnion<T>(
  type: sc.SqlSchema.FilterValue,
  getVal: <U>(obj: U) => U | null
): unknown {
  switch (type) {
    case SqlSchema.FilterValue.StringValue: {
      const o = new SqlSchema.StringValue();
      return getVal(o) ? o.value() : null;
    }
    case SqlSchema.FilterValue.NumberValue: {
      const o = new SqlSchema.NumberValue();
      return getVal(o) ? o.value() : null;
    }
    case SqlSchema.FilterValue.Int64Value: {
      const o = new SqlSchema.Int64Value();
      return getVal(o) ? Number(o.value()) : null;
    }
    case SqlSchema.FilterValue.BoolValue: {
      const o = new SqlSchema.BoolValue();
      return getVal(o) ? !!o.value() : null;
    }
    case SqlSchema.FilterValue.NullValue:
      return null;
    case SqlSchema.FilterValue.TimestampValue: {
      const o = new SqlSchema.TimestampValue();
      return getVal(o) ? Number(o.epoch()) : null;
    }
    case SqlSchema.FilterValue.StringList: {
      const o = new SqlSchema.StringList();
      if (!getVal(o)) return null;
      const arr: string[] = [];
      for (let i = 0; i < (o.valuesLength() || 0); i++) {
        const s = o.values(i);
        if (s != null) arr.push(s);
      }
      return arr;
    }
    case SqlSchema.FilterValue.Int64List: {
      const o = new SqlSchema.Int64List();
      if (!getVal(o)) return null;
      const arr: number[] = [];
      for (let i = 0; i < (o.valuesLength() || 0); i++) {
        const n = o.values(i);
        if (n != null) arr.push(Number(n));
      }
      return arr;
    }
    case SqlSchema.FilterValue.Float64List: {
      const o = new SqlSchema.Float64List();
      if (!getVal(o)) return null;
      const arr: number[] = [];
      for (let i = 0; i < (o.valuesLength() || 0); i++) {
        const n = o.values(i);
        if (n != null) arr.push(n);
      }
      return arr;
    }
    case SqlSchema.FilterValue.BoolList: {
      const o = new SqlSchema.BoolList();
      if (!getVal(o)) return null;
      const arr: boolean[] = [];
      for (let i = 0; i < (o.valuesLength() || 0); i++) {
        const n = o.values(i);
        if (n != null) arr.push(!!n);
      }
      return arr;
    }
    default:
      return null;
  }
}

// ============================ Spec → Manager mappers ============================

/** Recursively read BasicSqlDataFilterWrapper into manager’s filter tree */
function readFilterWrapper(
  w: sc.SqlSchema.BasicSqlDataFilterWrapper | null
): BaseSqlDataFilter | undefined {
  if (!w) return undefined;

  const wrapperType = mapWrapperType(w.filterWrapperType());
  const filtersLen = w.filtersLength() || 0;
  const outFilters: BaseSqlDataFilter[] = [];

  for (let i = 0; i < filtersLen; i++) {
    const kind = w.filtersType(i);

    if (kind === SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilterWrapper) {
      const nested = new SqlSchema.BasicSqlDataFilterWrapper();
      const got = w.filters(i, nested);
      const nestedMapped = readFilterWrapper(got);
      if (nestedMapped) outFilters.push(nestedMapped);
      continue;
    }

    if (kind === SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilter) {
      const filt = new SqlSchema.BasicSqlDataFilter();
      const got = w.filters(i, filt);
      if (!got) continue;

      const ft = mapFilterType(got.filterType());
      if (!ft) continue;

      const mod = got.modifier();
      const valueType = got.valueType();
      const value = readFilterFromUnion(valueType, (o) => got.value(o));

      const mapped: SqlDataFilter = {
        fieldName: got.fieldName() || "",
        value,
        filterType: ft,
        modifier: mod
          ? {
              distinct: !!mod.distinct(),
              caseInSensitive: !!(mod.caseInsensitive?.() ?? false),
              nullsOrder: mapNullsSortOrder(mod.nullsOrder?.()),
            }
          : {
              caseInSensitive: false,
              nullsOrder: NullsSortOrder.default_,
            },
      };

      outFilters.push(mapped);
      continue;
    }
  }

  return {
    filterWrapperType: wrapperType ?? SQLFilterWrapperType.and,
    filters: outFilters,
  };
}

/** Extract SqlQuerySpec from GetDataReq if present (prefer simple accessor) */
function getQuerySpec(req: sr.SqlRpc.GetDataReq): sc.SqlSchema.SqlQuerySpec | null {
  try {
    const maybe = (req as any).spec?.();
    return maybe || null;
  } catch {
    return null;
  }
}

/** Extract AggregationSpec from RunAggregationReq if present */
function getAggSpec(req: sr.SqlRpc.RunAggregationReq): sc.SqlSchema.AggregationSpec | null {
  try {
    const maybe = (req as any).spec?.();
    return maybe || null;
  } catch {
    return null;
  }
}

// ============================ Handlers ============================

let __pgSingleton: PostgresManager | undefined;

/** Lazy accessor so tests/mocks can swap before first use */
export function getPg(): PostgresManager {
  if (!__pgSingleton) __pgSingleton = PostgresManager.getInstance();
  return __pgSingleton;
}

/** (Optional) test hook to inject a fake */
export function __setPgForTest(x: PostgresManager | undefined) {
  __pgSingleton = x;
}

// Return type for GET_DATA
type GetDataResult = { rows: string[]; cursor?: Record<string, unknown> };

/** GET_DATA → GetDataDbRequest (supports legacy fields and union spec) */
async function handleGetData(req: sr.SqlRpc.GetDataReq): Promise<GetDataResult> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";

  // wrapper → filters tree
  const wrapper = req.wrapper();
  const filters = wrapper ? [readFilterWrapper(wrapper)].filter(Boolean) as BaseSqlDataFilter[] : undefined;

  // order[]
  let orderKeys: MgrOrderKeySpec[] | undefined;
  const orderLen = req.orderLength?.() ?? 0;
  if (orderLen > 0) {
    orderKeys = [];
    for (let i = 0; i < orderLen; i++) {
      const ok = req.order(i);
      if (!ok) continue;
      orderKeys.push({
        field: ok.field() || "",
        sort: mapOrderSort(ok.sort()),
      });
    }
  }

  // cursor[]
  let cursor: Record<string, unknown> | undefined;
  const cursorLen = req.cursorLength?.() ?? 0;
  if (cursorLen > 0) {
    const c: Record<string, unknown> = {};
    for (let i = 0; i < cursorLen; i++) {
      const ce = req.cursor(i);
      if (!ce) continue;
      const name = ce.field() || "";
      const t = ce.valueType();
      const value = readFilterFromUnion(t, (obj) => ce.value(obj));
      if (name) c[name] = value as unknown;
    }
    if (Object.keys(c).length) cursor = c;
  }

  const mgrReq = new GetDataDbRequest({
    tableName,
    companyId,
    filters,
    orderKeys,
    cursor,
    strictAfter: req.strictAfter(),         // default true in schema
    limit: req.limit?.() ?? undefined,     // 0 → undefined (no limit)
    offset: req.offset?.() ?? undefined,   // legacy; avoid with cursor
  });

  const mgrResp = await getPg().getData(mgrReq);

  if (Array.isArray(mgrResp)) {
    const rows = (mgrResp || []).map((r: unknown) => JSON.stringify(r));
    return { rows };
  }

  const rows = (mgrResp?.rows || []).map((r: unknown) => JSON.stringify(r));
  const nextCursor =
    mgrResp?.cursor && typeof mgrResp.cursor === "object" && Object.keys(mgrResp.cursor).length
      ? (mgrResp.cursor as Record<string, unknown>)
      : undefined;

  return { rows, cursor: nextCursor };
}

/** GET_SINGLE → GetSingleRecordRequest */
async function handleGetSingle(req: sr.SqlRpc.GetSingleReq): Promise<string | null> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";
  const primaryKeyColumn = (req as any).primaryKeyColumn?.() || "id";
  const primaryId = (req as any).primaryId?.() || "";

  const mgrReq = new GetSingleRecordRequest({
    tableName,
    companyId,
    primaryKeyColumn,
    primaryId,
  });

  const row = await getPg().getData(mgrReq);
  return row ? JSON.stringify(row) : null;
}

/** ADD_SINGLE → AddSingleDbRequest */
async function handleAddSingle(req: sr.SqlRpc.AddSingleReq): Promise<string[]> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";
  const primaryKeyColumn = (req as any).primaryKeyColumn?.() || "id";
  const rowJson = (req as any).rowJson?.() || "{}";

  const mgrReq = new AddSingleDbRequest({
    tableName,
    companyId,
    primaryKeyColumn,
    data: JSON.parse(rowJson),
  });

  const added = await getPg().editData(mgrReq);
  return (added || []).map((r: unknown) => JSON.stringify(r));
}

/** UPDATE_SINGLE → UpdateSingleDbRequest */
async function handleUpdateSingle(req: sr.SqlRpc.UpdateSingleReq): Promise<string[]> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";
  const primaryKeyColumn = (req as any).primaryKeyColumn?.() || "id";
  const primaryId = (req as any).primaryId?.() || "";
  const updatesJson = (req as any).updatesJson?.() || "{}";

  const mgrReq = new UpdateSingleDbRequest({
    tableName,
    companyId,
    primaryKeyColumn,
    primaryId,
    updates: JSON.parse(updatesJson),
  });

  const updated = await getPg().editData(mgrReq);
  return (updated || []).map((r: unknown) => JSON.stringify(r));
}

/** DELETE_ROW → DeleteRowDbRequest */
async function handleDeleteRow(req: sr.SqlRpc.DeleteRowReq): Promise<boolean> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";
  const primaryKeyColumn = (req as any).primaryKeyColumn?.() || "id";
  const primaryId = (req as any).primaryId?.() || "";

  const mgrReq = new DeleteRowDbRequest({
    tableName,
    companyId,
    primaryKeyColumn,
    primaryId,
  });

  const deleted = await getPg().deleteRequest(mgrReq);
  return Array.isArray(deleted) ? deleted.length > 0 : !!deleted;
}

/** CREATE_TABLE → CreateTableDbRequest (stub for now) */
async function handleCreateTable(_req: sr.SqlRpc.CreateTableReq): Promise<boolean> {
  throw new Error("CreateTable is not implemented yet");
}

/** TABLE_EXISTS → TableExistsRequest */
async function handleTableExists(req: sr.SqlRpc.TableExistsReq): Promise<boolean> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";

  const mgrReq = new TableExistsRequest({ tableName, companyId });
  return await getPg().tableExists(mgrReq);
}

/** RUN_AGGREGATION → AggregationRequest (maps AggregationSpec if present) */
async function handleRunAggregation(req: sr.SqlRpc.RunAggregationReq): Promise<unknown> {
  const companyId = req.companyId() || "";
  const tableName = req.tableName() || "";

  const spec = getAggSpec(req);

  const sumFieldsLegacy = vecToArray((req as any).sumFieldsLength?.() ?? 0, (i) => (req as any).sumFields?.(i));
  const averageFieldsLegacy = vecToArray((req as any).averageFieldsLength?.() ?? 0, (i) => (req as any).averageFields?.(i));
  const minimumFieldsLegacy = vecToArray((req as any).minimumFieldsLength?.() ?? 0, (i) => (req as any).minimumFields?.(i));
  const maximumFieldsLegacy = vecToArray((req as any).maximumFieldsLength?.() ?? 0, (i) => (req as any).maximumFields?.(i));
  const countEnabledLegacy = (req as any).countEnabled?.() ?? false;

  const sumFields = spec
    ? vecToArray(spec.sumFieldsLength?.() ?? 0, (i) => spec.sumFields?.(i))
    : sumFieldsLegacy;
  const averageFields = spec
    ? vecToArray(spec.averageFieldsLength?.() ?? 0, (i) => spec.averageFields?.(i))
    : averageFieldsLegacy;
  const minimumFields = spec
    ? vecToArray(spec.minimumFieldsLength?.() ?? 0, (i) => spec.minimumFields?.(i))
    : minimumFieldsLegacy;
  const maximumFields = spec
    ? vecToArray(spec.maximumFieldsLength?.() ?? 0, (i) => spec.maximumFields?.(i))
    : maximumFieldsLegacy;
  const countEnabled = spec ? !!(spec.countEnabled?.() ?? false) : countEnabledLegacy;

  const filters = spec ? [readFilterWrapper(spec.wrapper())].filter(Boolean) as BaseSqlDataFilter[] : undefined;

  const mgrReq = new AggregationRequest({
    tableName,
    companyId,
    sumFields,
    averageFields,
    minimumFields,
    maximumFields,
    countEnabled,
    filters,
  });

  return await getPg().runAggregationQuery(mgrReq);
}

function vecToArray<T>(len: number, get: (i: number) => T | null | undefined): T[] {
  const out: T[] = [];
  for (let i = 0; i < len; i++) {
    const v = get(i);
    if (v != null) out.push(v as T);
  }
  return out;
}

// ============================ main dispatcher ============================

rpc.setHandler(async (m) => {
  const value = m.value!;
  const bb = bbFrom(value);
  const req = SqlRpc.RequestEnvelope.getRootAsRequestEnvelope(bb);

  const correlationId = req.correlationId() || "";
  const replyTopic =
    req.replyTopic() || process.env.SQL_RPC_RESPONSE_TOPIC || "sql.rpc.responses";
  const method = req.method();

  const b = new flatbuffers.Builder(1024);

  try {
    console.log("[rpc] ⇐ request", {
      method: SqlRpc.RpcMethod[method],
      corr: correlationId,
      replyTopic,
    });

    switch (method) {
      case SqlRpc.RpcMethod.GET_DATA: {
        const payload = new SqlRpc.GetDataReq();
        // @ts-ignore union read
        req.payload(payload);

        const { rows, cursor } = await handleGetData(payload);

        const p = cursor
          ? encodeRowsWithCursor(b, rows, cursor)
          : encodeRowsJson(b, rows);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response GET_DATA", { corr: correlationId, rows: rows.length, withCursor: !!cursor });
        return;
      }

      case SqlRpc.RpcMethod.GET_SINGLE: {
        const payload = new SqlRpc.GetSingleReq();
        // @ts-ignore
        req.payload(payload);

        const rowJson = await handleGetSingle(payload);
        const p = encodeRowJson(b, rowJson ?? "{}");

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response GET_SINGLE", { corr: correlationId, found: !!rowJson });
        return;
      }

      case SqlRpc.RpcMethod.ADD_SINGLE: {
        const payload = new SqlRpc.AddSingleReq();
        // @ts-ignore
        req.payload(payload);

        const rows = await handleAddSingle(payload);
        const p = encodeRowsJson(b, rows);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response ADD_SINGLE", { corr: correlationId, rows: rows.length });
        return;
      }

      case SqlRpc.RpcMethod.UPDATE_SINGLE: {
        const payload = new SqlRpc.UpdateSingleReq();
        // @ts-ignore
        req.payload(payload);

        const rows = await handleUpdateSingle(payload);
        const p = encodeRowsJson(b, rows);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response UPDATE_SINGLE", { corr: correlationId, rows: rows.length });
        return;
      }

      case SqlRpc.RpcMethod.DELETE_ROW: {
        const payload = new SqlRpc.DeleteRowReq();
        // @ts-ignore
        req.payload(payload);

        const ok = await handleDeleteRow(payload);
        const p = encodeBool(b, ok);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response DELETE_ROW", { corr: correlationId, ok });
        return;
      }

      case SqlRpc.RpcMethod.CREATE_TABLE: {
        const payload = new SqlRpc.CreateTableReq();
        // @ts-ignore
        req.payload(payload);

        const ok = await handleCreateTable(payload);
        const p = encodeBool(b, ok);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response CREATE_TABLE", { corr: correlationId, ok });
        return;
      }

      case SqlRpc.RpcMethod.TABLE_EXISTS: {
        const payload = new SqlRpc.TableExistsReq();
        // @ts-ignore
        req.payload(payload);

        const ok = await handleTableExists(payload);
        const p = encodeBool(b, ok);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response TABLE_EXISTS", { corr: correlationId, ok });
        return;
      }

      case SqlRpc.RpcMethod.RUN_AGGREGATION: {
        const payload = new SqlRpc.RunAggregationReq();
        // @ts-ignore
        req.payload(payload);

        const _agg = await handleRunAggregation(payload);
        const p = encodeAggPlaceholder(b);

        rpc.produceSafe(replyTopic, correlationId, okResponse(b, correlationId, p.off, p.type));
        console.log("[rpc] ⇒ response RUN_AGGREGATION", { corr: correlationId, note: "placeholder AggRes" });
        return;
      }

      default: {
        const msg = `Unknown method: ${method}`;
        rpc.produceSafe(
          replyTopic,
          correlationId,
          errResponse(b, correlationId, SqlRpc.ErrorCode.BAD_REQUEST, msg)
        );
        console.warn("[rpc] ✖ bad method", { corr: correlationId, method });
        return;
      }
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    const buf = errResponse(b, correlationId, SqlRpc.ErrorCode.INTERNAL, msg);
    rpc.produceSafe(replyTopic, correlationId, buf);
    console.error("[rpc] handler error", { corr: correlationId, method: SqlRpc.RpcMethod[method], err: e });
  }
});

// exported entry so your index.ts can start the worker
export async function startRpcWorker() {
  await rpc.start();
  console.log("[rpc] worker started", {
    brokers: BROKERS.join(","),
    req: REQ_TOPIC,
    groupId: GROUP_ID,
  });
}