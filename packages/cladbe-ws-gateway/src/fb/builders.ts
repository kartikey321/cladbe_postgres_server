// src/fb/builders.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as flatbuffers from "flatbuffers";
import { SqlSchema as sc, SqlRpc as sr } from "@cladbe/sql-protocol";

const SqlSchema = sc.SqlSchema;
const SqlRpc = sr.SqlRpc;

export function orderSortFromWire(s: string): sc.SqlSchema.OrderSort {
  switch (s) {
    case "ASC_DEFAULT": return SqlSchema.OrderSort.ASC_DEFAULT;
    case "ASC_NULLS_FIRST": return SqlSchema.OrderSort.ASC_NULLS_FIRST;
    case "ASC_NULLS_LAST": return SqlSchema.OrderSort.ASC_NULLS_LAST;
    case "DESC_NULLS_FIRST": return SqlSchema.OrderSort.DESC_NULLS_FIRST;
    case "DESC_NULLS_LAST": return SqlSchema.OrderSort.DESC_NULLS_LAST;
    case "DESC_DEFAULT":
    default: return SqlSchema.OrderSort.DESC_DEFAULT;
  }
}

/** Build FilterValue union (returns type id + value offset) */
export function buildFilterValue(
  b: flatbuffers.Builder,
  tagged: any
): { type: sc.SqlSchema.FilterValue; off: number } {
  const entry = (Object.entries(tagged ?? {})[0] as [string, any] | undefined);
  const tag = entry?.[0];
  const payload: any = entry?.[1] ?? {};

  switch (tag) {
    case "StringValue": {
      const v = b.createString(String(payload?.value ?? ""));
      const off = SqlSchema.StringValue.createStringValue(b, v);
      return { type: SqlSchema.FilterValue.StringValue, off };
    }
    case "NumberValue": {
      SqlSchema.NumberValue.startNumberValue(b);
      SqlSchema.NumberValue.addValue(b, Number(payload?.value ?? 0));
      return { type: SqlSchema.FilterValue.NumberValue, off: SqlSchema.NumberValue.endNumberValue(b) };
    }
    case "BoolValue": {
      SqlSchema.BoolValue.startBoolValue(b);
      SqlSchema.BoolValue.addValue(b, !!payload?.value);
      return { type: SqlSchema.FilterValue.BoolValue, off: SqlSchema.BoolValue.endBoolValue(b) };
    }
    case "NullValue": {
      return { type: SqlSchema.FilterValue.NullValue, off: SqlSchema.NullValue.endNullValue(b) };
    }
    case "Int64Value": {
      // Expect JSON like { "Int64Value": { "value": "123" } } or number
      const v = BigInt(String(payload?.value ?? "0"));
      SqlSchema.Int64Value.startInt64Value(b);
      SqlSchema.Int64Value.addValue(b, v);
      return { type: SqlSchema.FilterValue.Int64Value, off: SqlSchema.Int64Value.endInt64Value(b) };
    }
    case "TimestampValue": {
      // { "TimestampValue": { "epoch": "123", "unit": "MICROS" } }
      const epoch = BigInt(String(payload?.epoch ?? "0"));
      const unitStr = String(payload?.unit ?? "MICROS");
      const unit = (SqlSchema.TimeUnit as any)[unitStr] ?? SqlSchema.TimeUnit.MICROS;
      SqlSchema.TimestampValue.startTimestampValue(b);
      SqlSchema.TimestampValue.addEpoch(b, epoch);
      SqlSchema.TimestampValue.addUnit(b, unit);
      return { type: SqlSchema.FilterValue.TimestampValue, off: SqlSchema.TimestampValue.endTimestampValue(b) };
    }
    case "StringList": {
      const items = (payload?.values ?? []).map((s: any) => b.createString(String(s)));
      const vec = SqlSchema.StringList.createValuesVector(b, items);
      SqlSchema.StringList.startStringList(b);
      SqlSchema.StringList.addValues(b, vec);
      return { type: SqlSchema.FilterValue.StringList, off: SqlSchema.StringList.endStringList(b) };
    }
    case "Int64List": {
      const items = (payload?.values ?? []).map((s: any) => BigInt(String(s)));
        const vec = SqlSchema.Int64List.createValuesVector(b, items);
      SqlSchema.Int64List.startInt64List(b);
      SqlSchema.Int64List.addValues(b, vec);
      return { type: SqlSchema.FilterValue.Int64List, off: SqlSchema.Int64List.endInt64List(b) };
    }
    case "Float64List": {
      const items: number[] = (payload?.values ?? []).map((n: any) => Number(n));
      const vec = SqlSchema.Float64List.createValuesVector(b, items);
      SqlSchema.Float64List.startFloat64List(b);
      SqlSchema.Float64List.addValues(b, vec);
      return { type: SqlSchema.FilterValue.Float64List, off: SqlSchema.Float64List.endFloat64List(b) };
    }
    case "BoolList": {
      const items: boolean[] = (payload?.values ?? []).map((v: any) => !!v);
      const vec = SqlSchema.BoolList.createValuesVector(b, items);
      SqlSchema.BoolList.startBoolList(b);
      SqlSchema.BoolList.addValues(b, vec);
      return { type: SqlSchema.FilterValue.BoolList, off: SqlSchema.BoolList.endBoolList(b) };
    }
    default: {
      // default to NullValue
      return { type: SqlSchema.FilterValue.NullValue, off: SqlSchema.NullValue.endNullValue(b) };
    }
  }
}

/** Build a Basic filter node */
export function buildBasic(b: flatbuffers.Builder, node: any): number {
  const fieldOff = b.createString(String(node?.field_name ?? ""));
  const { type: valType, off: valOff } = buildFilterValue(b, node?.value);
  const key = String(node?.filter_type ?? "equals") as keyof typeof SqlSchema.BasicSqlDataFilterType;
  const ft = (SqlSchema.BasicSqlDataFilterType as any)[key] ?? SqlSchema.BasicSqlDataFilterType.equals;

  SqlSchema.BasicSqlDataFilter.startBasicSqlDataFilter(b);
  SqlSchema.BasicSqlDataFilter.addFieldName(b, fieldOff);
  SqlSchema.BasicSqlDataFilter.addValueType(b, valType);
  SqlSchema.BasicSqlDataFilter.addValue(b, valOff);
  SqlSchema.BasicSqlDataFilter.addFilterType(b, ft);
  return SqlSchema.BasicSqlDataFilter.endBasicSqlDataFilter(b);
}

/** Build a Wrapper node (and its nested union vectors) */
export function buildWrapper(b: flatbuffers.Builder, wrapper: any): number {
  if (!wrapper) return 0;
  const typeStr = String(wrapper?.filter_wrapper_type ?? "and");
  const fwt = typeStr === "or" ? SqlSchema.SQLFilterWrapperType.or : SqlSchema.SQLFilterWrapperType.and;

  const filters = Array.isArray(wrapper?.filters) ? wrapper.filters : [];
  const typeArr: number[] = [];
  const valArr: number[] = [];

  for (const child of filters) {
    if (child?.filter_wrapper_type) {
      const nestedOff = buildWrapper(b, child);
      typeArr.push(SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilterWrapper);
      valArr.push(nestedOff);
    } else {
      const basicOff = buildBasic(b, child);
      typeArr.push(SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilter);
      valArr.push(basicOff);
    }
  }

  const typesVec = SqlSchema.BasicSqlDataFilterWrapper.createFiltersTypeVector(b, typeArr);
  const valsVec  = SqlSchema.BasicSqlDataFilterWrapper.createFiltersVector(b, valArr);

  SqlSchema.BasicSqlDataFilterWrapper.startBasicSqlDataFilterWrapper(b);
  SqlSchema.BasicSqlDataFilterWrapper.addFilterWrapperType(b, fwt);
  SqlSchema.BasicSqlDataFilterWrapper.addFiltersType(b, typesVec);
  SqlSchema.BasicSqlDataFilterWrapper.addFilters(b, valsVec);
  return SqlSchema.BasicSqlDataFilterWrapper.endBasicSqlDataFilterWrapper(b);
}

export function buildOrderVec(b: flatbuffers.Builder, orderArr: any[]): number {
  if (!Array.isArray(orderArr) || !orderArr.length) return 0;
  const items = orderArr.map(o => {
    const fOff = b.createString(String(o.field));
    SqlSchema.OrderKeySpec.startOrderKeySpec(b);
    SqlSchema.OrderKeySpec.addField(b, fOff);
    SqlSchema.OrderKeySpec.addSort(b, orderSortFromWire(String(o.sort ?? "DESC_DEFAULT")));
    if (o.is_pk != null) SqlSchema.OrderKeySpec.addIsPk(b, !!o.is_pk);
    return SqlSchema.OrderKeySpec.endOrderKeySpec(b);
  });
  return SqlRpc.GetDataReq.createOrderVector(b, items);
}

export function buildCursorVec(b: flatbuffers.Builder, cursorArr: any[]): number {
  if (!Array.isArray(cursorArr) || !cursorArr.length) return 0;
  const items = cursorArr.map(c => {
    const fieldOff = b.createString(String(c.field));
    const { type: valType, off: valOff } = buildFilterValue(b, c.value);
    SqlSchema.CursorEntry.startCursorEntry(b);
    SqlSchema.CursorEntry.addField(b, fieldOff);
    SqlSchema.CursorEntry.addValueType(b, valType);
    SqlSchema.CursorEntry.addValue(b, valOff);
    return SqlSchema.CursorEntry.endCursorEntry(b);
  });
  return SqlRpc.GetDataReq.createCursorVector(b, items);
}

/**
 * Given the same JSON your client sends (wrapper/order/cursor/limit), return the
 * exact vector/offsets to set on SqlRpc.GetDataReq.
 */
export function buildQueryPartsFromJson(
  b: flatbuffers.Builder,
  spec: any
): { wrapperOff: number; orderVec: number; cursorVec: number; limit: number } {
  const wrapperOff = buildWrapper(b, spec?.wrapper);
  const orderVec   = buildOrderVec(b, spec?.order ?? []);
  const cursorVec  = buildCursorVec(b, spec?.cursor ?? []);
  const limit      = Number.isFinite(Number(spec?.limit)) ? Number(spec.limit) : NaN;
  return { wrapperOff, orderVec, cursorVec, limit };
}