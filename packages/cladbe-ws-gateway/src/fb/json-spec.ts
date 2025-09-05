/* eslint-disable @typescript-eslint/no-explicit-any */
import * as flatbuffers from "flatbuffers";
import { SqlSchema as sc, SqlRpc as sr } from "@cladbe/sql-protocol";

const S = sc.SqlSchema;
const R = sr.SqlRpc;

/** ----------------- enum mappers (string → schema enum) ----------------- */

const WRAPPER_KIND: Record<string, sc.SqlSchema.SQLFilterWrapperType> = {
    or: S.SQLFilterWrapperType.or,
    and: S.SQLFilterWrapperType.and,
};

const NULLS_ORDER: Record<string, sc.SqlSchema.NullsSortOrder> = {
    first: S.NullsSortOrder.first,
    last: S.NullsSortOrder.last,
    default: S.NullsSortOrder.default_,
    default_: S.NullsSortOrder.default_, // tolerate either
};

const ORDER_SORT: Record<string, sc.SqlSchema.OrderSort> = {
    ASC_DEFAULT: S.OrderSort.ASC_DEFAULT,
    ASC_NULLS_FIRST: S.OrderSort.ASC_NULLS_FIRST,
    ASC_NULLS_LAST: S.OrderSort.ASC_NULLS_LAST,
    DESC_DEFAULT: S.OrderSort.DESC_DEFAULT,
    DESC_NULLS_FIRST: S.OrderSort.DESC_NULLS_FIRST,
    DESC_NULLS_LAST: S.OrderSort.DESC_NULLS_LAST,
};

const FILTER_OP: Record<string, sc.SqlSchema.BasicSqlDataFilterType> = {
    equals: S.BasicSqlDataFilterType.equals,
    notEquals: S.BasicSqlDataFilterType.notEquals,
    lessThan: S.BasicSqlDataFilterType.lessThan,
    lessThanOrEquals: S.BasicSqlDataFilterType.lessThanOrEquals,
    greaterThan: S.BasicSqlDataFilterType.greaterThan,
    greaterThanOrEquals: S.BasicSqlDataFilterType.greaterThanOrEquals,
    isNull: S.BasicSqlDataFilterType.isNull,
    isNotNull: S.BasicSqlDataFilterType.isNotNull,
    regex: S.BasicSqlDataFilterType.regex,
    notRegex: S.BasicSqlDataFilterType.notRegex,
    startsWith: S.BasicSqlDataFilterType.startsWith,
    endsWith: S.BasicSqlDataFilterType.endsWith,
    contains: S.BasicSqlDataFilterType.contains,
    notContains: S.BasicSqlDataFilterType.notContains,
    arrayContains: S.BasicSqlDataFilterType.arrayContains,
    arrayContainedBy: S.BasicSqlDataFilterType.arrayContainedBy,
    arrayOverlaps: S.BasicSqlDataFilterType.arrayOverlaps,
    arrayEquals: S.BasicSqlDataFilterType.arrayEquals,
    arrayNotEquals: S.BasicSqlDataFilterType.arrayNotEquals,
    arrayEmpty: S.BasicSqlDataFilterType.arrayEmpty,
    arrayNotEmpty: S.BasicSqlDataFilterType.arrayNotEmpty,
    arrayLength: S.BasicSqlDataFilterType.arrayLength,
    jsonContains: S.BasicSqlDataFilterType.jsonContains,
    jsonContainedBy: S.BasicSqlDataFilterType.jsonContainedBy,
    jsonHasKey: S.BasicSqlDataFilterType.jsonHasKey,
    jsonHasAnyKey: S.BasicSqlDataFilterType.jsonHasAnyKey,
    jsonHasAllKeys: S.BasicSqlDataFilterType.jsonHasAllKeys,
    jsonGetField: S.BasicSqlDataFilterType.jsonGetField,
    jsonGetFieldAsText: S.BasicSqlDataFilterType.jsonGetFieldAsText,
    between: S.BasicSqlDataFilterType.between,
    notBetween: S.BasicSqlDataFilterType.notBetween,
    rangeContains: S.BasicSqlDataFilterType.rangeContains,
    rangeContainedBy: S.BasicSqlDataFilterType.rangeContainedBy,
    inList: S.BasicSqlDataFilterType.inList,
    notInList: S.BasicSqlDataFilterType.notInList,
};

/** ----------------- FilterValue union builders ----------------- */

type Tagged = Record<string, any>;

function buildFilterValue(
    b: flatbuffers.Builder,
    tagged: Tagged | null | undefined
): { type: sc.SqlSchema.FilterValue; off: number } {
    const [tag, payload] = Object.entries(tagged ?? {})[0] ?? [undefined, undefined];

    switch (tag) {
        case "StringValue": {
            const v = b.createString(String(payload?.value ?? ""));
            const off = S.StringValue.createStringValue(b, v);
            return { type: S.FilterValue.StringValue, off };
        }
        case "NumberValue": {
            S.NumberValue.startNumberValue(b);
            S.NumberValue.addValue(b, Number(payload?.value ?? 0));
            return { type: S.FilterValue.NumberValue, off: S.NumberValue.endNumberValue(b) };
        }
        case "BoolValue": {
            S.BoolValue.startBoolValue(b);
            S.BoolValue.addValue(b, !!payload?.value);
            return { type: S.FilterValue.BoolValue, off: S.BoolValue.endBoolValue(b) };
        }
        case "NullValue": {
            return { type: S.FilterValue.NullValue, off: S.NullValue.endNullValue(b) };
        }
        case "Int64Value": {
            // Accept number or string; coerce through BigInt safely
            const v = BigInt(String(payload?.value ?? "0"));
            S.Int64Value.startInt64Value(b);
            S.Int64Value.addValue(b, v);
            return { type: S.FilterValue.Int64Value, off: S.Int64Value.endInt64Value(b) };
        }
        case "TimestampValue": {
            const epoch = BigInt(String(payload?.epoch ?? "0"));
            const unitStr = String(payload?.unit ?? "MICROS");
            const unit = (S.TimeUnit as any)[unitStr] ?? S.TimeUnit.MICROS;
            S.TimestampValue.startTimestampValue(b);
            S.TimestampValue.addEpoch(b, epoch);
            S.TimestampValue.addUnit(b, unit);
            return { type: S.FilterValue.TimestampValue, off: S.TimestampValue.endTimestampValue(b) };
        }
        case "StringList": {
            const vals = (payload?.values ?? []).map((s: any) => b.createString(String(s)));
            const vec = S.StringList.createValuesVector(b, vals);
            S.StringList.startStringList(b);
            S.StringList.addValues(b, vec);
            return { type: S.FilterValue.StringList, off: S.StringList.endStringList(b) };
        }
        case "Int64List": {
            const vals = (payload?.values ?? []).map((s: any) => BigInt(String(s)));
            const vec = S.Int64List.createValuesVector(b, vals);
            S.Int64List.startInt64List(b);
            S.Int64List.addValues(b, vec);
            return { type: S.FilterValue.Int64List, off: S.Int64List.endInt64List(b) };
        }
        case "Float64List": {
            const vals = (payload?.values ?? []).map((n: any) => Number(n));
            const vec = S.Float64List.createValuesVector(b, vals);
            S.Float64List.startFloat64List(b);
            S.Float64List.addValues(b, vec);
            return { type: S.FilterValue.Float64List, off: S.Float64List.endFloat64List(b) };
        }
        case "BoolList": {
            const vals = (payload?.values ?? []).map((v: any) => !!v);
            const vec = S.BoolList.createValuesVector(b, vals);
            S.BoolList.startBoolList(b);
            S.BoolList.addValues(b, vec);
            return { type: S.FilterValue.BoolList, off: S.BoolList.endBoolList(b) };
        }

        // RangeValue support (if client sends it)
        case "RangeValue": {
            // { low: FilterValue, high: FilterValue, include_low, include_high }
            const { type: loT, off: loOff } = buildFilterValue(b, payload?.low);
            const { type: hiT, off: hiOff } = buildFilterValue(b, payload?.high);

            // FlatBuffers unions in a table would need fields typed; your schema defines RangeValue with unions.
            // We encode it only when used inside a BasicSqlDataFilter value for ops like between/rangeContains.
            // Caller will place it accordingly; returning Null here forces caller to embed RangeValue directly.
            // To keep API uniform, we *do* return a NullValue here and let buildBasic() handle RangeValue path.
            return { type: S.FilterValue.NullValue, off: S.NullValue.endNullValue(b) };
        }

        default: {
            // Default to NullValue (robustness)
            return { type: S.FilterValue.NullValue, off: S.NullValue.endNullValue(b) };
        }
    }
}

/** Build SqlFilterModifier from optional JSON { distinct, case_insensitive, nulls_order } */
function buildModifier(b: flatbuffers.Builder, mod: any | undefined): number {
    if (!mod || typeof mod !== "object") {
        return 0; // not setting = default
    }
    const nulls = NULLS_ORDER[String(mod.nulls_order ?? "default")] ?? S.NullsSortOrder.default_;

    S.SqlFilterModifier.startSqlFilterModifier(b);
    if (mod.distinct != null) S.SqlFilterModifier.addDistinct(b, !!mod.distinct);
    if (mod.case_insensitive != null) S.SqlFilterModifier.addCaseInsensitive(b, !!mod.case_insensitive);
    S.SqlFilterModifier.addNullsOrder(b, nulls);
    return S.SqlFilterModifier.endSqlFilterModifier(b);
}

/** ----------------- Filters (Basic, Wrapper) ----------------- */

function buildBasic(
    b: flatbuffers.Builder,
    node: any
): number {
    const fieldOff = b.createString(String(node?.field_name ?? ""));
    const op = FILTER_OP[String(node?.filter_type ?? "equals")] ?? S.BasicSqlDataFilterType.equals;

    // Standard value path (unions)
    const { type: valType, off: valOff } = buildFilterValue(b, node?.value);

    const modOff = buildModifier(b, node?.modifier);

    S.BasicSqlDataFilter.startBasicSqlDataFilter(b);
    S.BasicSqlDataFilter.addFieldName(b, fieldOff);
    S.BasicSqlDataFilter.addValueType(b, valType);
    S.BasicSqlDataFilter.addValue(b, valOff);
    S.BasicSqlDataFilter.addFilterType(b, op);
    if (modOff) S.BasicSqlDataFilter.addModifier(b, modOff);
    return S.BasicSqlDataFilter.endBasicSqlDataFilter(b);
}

function buildWrapper(
    b: flatbuffers.Builder,
    wrapper: any
): number {
    const kind = WRAPPER_KIND[String(wrapper?.filter_wrapper_type ?? "and")] ?? S.SQLFilterWrapperType.and;
    const filters = Array.isArray(wrapper?.filters) ? wrapper.filters : [];

    // Build child union vectors
    const types: number[] = [];
    const vals: number[] = [];

    for (const f of filters) {
        if (f?.filter_wrapper_type != null) {
            // nested wrapper
            const woff = buildWrapper(b, f);
            types.push(S.BasicSqlDataFilterUnion.BasicSqlDataFilterWrapper);
            vals.push(woff);
        } else {
            // basic
            const boff = buildBasic(b, f);
            types.push(S.BasicSqlDataFilterUnion.BasicSqlDataFilter);
            vals.push(boff);
        }
    }

    const tv = S.BasicSqlDataFilterWrapper.createFiltersTypeVector(b, types);
    const vv = S.BasicSqlDataFilterWrapper.createFiltersVector(b, vals);

    S.BasicSqlDataFilterWrapper.startBasicSqlDataFilterWrapper(b);
    S.BasicSqlDataFilterWrapper.addFilterWrapperType(b, kind);
    S.BasicSqlDataFilterWrapper.addFiltersType(b, tv);
    S.BasicSqlDataFilterWrapper.addFilters(b, vv);
    return S.BasicSqlDataFilterWrapper.endBasicSqlDataFilterWrapper(b);
}

/** ----------------- Order / Cursor builders ----------------- */

function buildOrderVec(b: flatbuffers.Builder, orderArr: any[]): number {
    if (!Array.isArray(orderArr) || !orderArr.length) return 0;
    const items = orderArr.map((o) => {
        const f = b.createString(String(o?.field ?? ""));
        const sort = ORDER_SORT[String(o?.sort ?? "DESC_DEFAULT")] ?? S.OrderSort.DESC_DEFAULT;
        S.OrderKeySpec.startOrderKeySpec(b);
        S.OrderKeySpec.addField(b, f);
        S.OrderKeySpec.addSort(b, sort);
        if (o?.is_pk != null) S.OrderKeySpec.addIsPk(b, !!o.is_pk);
        return S.OrderKeySpec.endOrderKeySpec(b);
    });
    return S.StreamingSqlDataFilter.createOrderVector(b, items);
}

function buildCursorVec(b: flatbuffers.Builder, cursorArr: any[]): number {
    if (!Array.isArray(cursorArr) || !cursorArr.length) return 0;
    const items = cursorArr.map((c) => {
        const f = b.createString(String(c?.field ?? ""));
        const { type: vt, off: vo } = buildFilterValue(b, c?.value);
        S.CursorEntry.startCursorEntry(b);
        S.CursorEntry.addField(b, f);
        S.CursorEntry.addValueType(b, vt);
        S.CursorEntry.addValue(b, vo);
        return S.CursorEntry.endCursorEntry(b);
    });
    return S.StreamingSqlDataFilter.createCursorVector(b, items);
}

/** ----------------- Public: STREAMING spec (FB root) ----------------- */
/**
 * Accepts the client JSON (from your Dart `StreamingSqlDataFilter.toMap()`) and
 * returns a Buffer with a FlatBuffer `SqlSchema.StreamingSqlDataFilter` root.
 */
export function encodeStreamingFilterJson(jsonSpec: any): Buffer {
    const b = new flatbuffers.Builder(1024);

    const hashOff = b.createString(String(jsonSpec?.hash ?? ""));

    const wrapperOff = buildWrapper(b, jsonSpec?.wrapper ?? { filter_wrapper_type: "and", filters: [] });
    const orderVec = buildOrderVec(b, jsonSpec?.order ?? []);
    const cursorVec = buildCursorVec(b, jsonSpec?.cursor ?? []);
    const limit = Number.isFinite(Number(jsonSpec?.limit)) ? Number(jsonSpec.limit) : 50;
    const schemaVer = Number.isFinite(Number(jsonSpec?.schema_version)) ? Number(jsonSpec.schema_version) : 1;

    S.StreamingSqlDataFilter.startStreamingSqlDataFilter(b);
    S.StreamingSqlDataFilter.addHash(b, hashOff);
    S.StreamingSqlDataFilter.addWrapper(b, wrapperOff);
    if (orderVec) S.StreamingSqlDataFilter.addOrder(b, orderVec);
    if (cursorVec) S.StreamingSqlDataFilter.addCursor(b, cursorVec);
    if (limit) S.StreamingSqlDataFilter.addLimit(b, limit >>> 0);
    S.StreamingSqlDataFilter.addSchemaVersion(b, schemaVer >>> 0);
    const root = S.StreamingSqlDataFilter.endStreamingSqlDataFilter(b);

    b.finish(root);
    return Buffer.from(b.asUint8Array());
}

/** ----------------- Public: RPC SqlQuerySpec (no root) ----------------- */
/**
 * Build `SqlSchema.SqlQuerySpec` (for RPC) from the same JSON shape:
 * { wrapper, limit, order, cursor, strict_after? }
 * Returns the offset & table type so callers can place it into `GetDataReq`
 * or another RPC envelope as needed.
 */
export function buildSqlQuerySpecFromJson(
    b: flatbuffers.Builder,
    jsonSpec: any
): number {
    const wrapperOff = buildWrapper(b, jsonSpec?.wrapper ?? { filter_wrapper_type: "and", filters: [] });

    // order/cursor use the same helpers but we must rebuild vectors for SqlQuerySpec
    const orderOffsets: number[] = [];
    for (const o of (jsonSpec?.order ?? [])) {
        const f = b.createString(String(o?.field ?? ""));
        const sort = ORDER_SORT[String(o?.sort ?? "DESC_DEFAULT")] ?? S.OrderSort.DESC_DEFAULT;
        S.OrderKeySpec.startOrderKeySpec(b);
        S.OrderKeySpec.addField(b, f);
        S.OrderKeySpec.addSort(b, sort);
        if (o?.is_pk != null) S.OrderKeySpec.addIsPk(b, !!o.is_pk);
        orderOffsets.push(S.OrderKeySpec.endOrderKeySpec(b));
    }
    const orderVec = sc.SqlSchema.SqlQuerySpec.createOrderVector(b, orderOffsets as unknown as number[]);

    const cursorOffsets: number[] = [];
    for (const c of (jsonSpec?.cursor ?? [])) {
        const f = b.createString(String(c?.field ?? ""));
        const { type: vt, off: vo } = buildFilterValue(b, c?.value);
        S.CursorEntry.startCursorEntry(b);
        S.CursorEntry.addField(b, f);
        S.CursorEntry.addValueType(b, vt);
        S.CursorEntry.addValue(b, vo);
        cursorOffsets.push(S.CursorEntry.endCursorEntry(b));
    }
    const cursorVec = sc.SqlSchema.SqlQuerySpec.createCursorVector(b, cursorOffsets as unknown as number[]);

    const limit = Number.isFinite(Number(jsonSpec?.limit)) ? Number(jsonSpec.limit) : 50;
    const strictAfter = jsonSpec?.strict_after != null ? !!jsonSpec.strict_after : true;

    sc.SqlSchema.SqlQuerySpec.startSqlQuerySpec(b);
    sc.SqlSchema.SqlQuerySpec.addWrapper(b, wrapperOff);
    if (orderOffsets.length) sc.SqlSchema.SqlQuerySpec.addOrder(b, orderVec);
    if (cursorOffsets.length) sc.SqlSchema.SqlQuerySpec.addCursor(b, cursorVec);
    if (limit) sc.SqlSchema.SqlQuerySpec.addLimit(b, limit >>> 0);
    sc.SqlSchema.SqlQuerySpec.addStrictAfter(b, strictAfter);
    return sc.SqlSchema.SqlQuerySpec.endSqlQuerySpec(b);
}

/** ----------------- Convenience: accept either FB or JSON for RPC ----------------- */
/**
 * Given either:
 *  - `queryFbB64`: a base64-encoded StreamingSqlDataFilter (or compatible), OR
 *  - `queryJson`:  a JSON string (Dart `toJson()` of StreamingSqlDataFilter),
 *
 * Build a `GetDataReq` payload ready to put into an SqlRpc envelope.
 */
export function buildGetDataReqFromEither(
    b: flatbuffers.Builder,
    companyId: string,
    tableName: string,
    opts: { queryFbB64?: string; queryJson?: string }
): { type: sr.SqlRpc.RpcPayload; off: number } {
    const companyOff = b.createString(companyId);
    const tableOff = b.createString(tableName);

    // If the caller gave JSON, translate to SqlQuerySpec and embed.
    // If they gave a FB b64, we *don’t* parse it here; Streams uses it.
    // For RPC, we rebuild a SqlQuerySpec to drive the worker.
    let wrapperOff = 0, orderVec = 0, cursorVec = 0, limit = 0;

    if (opts.queryJson) {
        let spec: any = {};
        try { spec = JSON.parse(opts.queryJson); } catch { }
        const qsOff = buildSqlQuerySpecFromJson(b, spec);

        R.GetDataReq.startGetDataReq(b);
        R.GetDataReq.addCompanyId(b, companyOff);
        R.GetDataReq.addTableName(b, tableOff);
        // Inline the SqlQuerySpec pieces into GetDataReq (keeps worker backward-compat)
        // We’ll map fields individually because GetDataReq is the public RPC input.
        // Rebuild inline again to be explicit:
        const w2 = buildWrapper(b, spec?.wrapper ?? { filter_wrapper_type: "and", filters: [] });
        const ord2 = (spec?.order ?? []).map((o: any) => {
            const f = b.createString(String(o?.field ?? ""));
            const sort = ORDER_SORT[String(o?.sort ?? "DESC_DEFAULT")] ?? S.OrderSort.DESC_DEFAULT;
            S.OrderKeySpec.startOrderKeySpec(b);
            S.OrderKeySpec.addField(b, f);
            S.OrderKeySpec.addSort(b, sort);
            if (o?.is_pk != null) S.OrderKeySpec.addIsPk(b, !!o.is_pk);
            return S.OrderKeySpec.endOrderKeySpec(b);
        });
        orderVec = R.GetDataReq.createOrderVector(b, ord2);

        const cur2 = (spec?.cursor ?? []).map((c: any) => {
            const f = b.createString(String(c?.field ?? ""));
            const { type: vt, off: vo } = buildFilterValue(b, c?.value);
            S.CursorEntry.startCursorEntry(b);
            S.CursorEntry.addField(b, f);
            S.CursorEntry.addValueType(b, vt);
            S.CursorEntry.addValue(b, vo);
            return S.CursorEntry.endCursorEntry(b);
        });
        cursorVec = R.GetDataReq.createCursorVector(b, cur2);

        if (Number.isFinite(Number(spec?.limit))) limit = Number(spec.limit) >>> 0;

        R.GetDataReq.addWrapper(b, w2);
        if (orderVec) R.GetDataReq.addOrder(b, orderVec);
        if (cursorVec) R.GetDataReq.addCursor(b, cursorVec);
        if (limit) R.GetDataReq.addLimit(b, limit);
        R.GetDataReq.addStrictAfter(b, spec?.strict_after != null ? !!spec.strict_after : true);
        const off = R.GetDataReq.endGetDataReq(b);
        return { type: R.RpcPayload.GetDataReq, off };
    }

    // No JSON? build a minimal GET_DATA (limit-only) from FB path.
    R.GetDataReq.startGetDataReq(b);
    R.GetDataReq.addCompanyId(b, companyOff);
    R.GetDataReq.addTableName(b, tableOff);
    R.GetDataReq.addStrictAfter(b, true);
    const off = R.GetDataReq.endGetDataReq(b);
    return { type: R.RpcPayload.GetDataReq, off };
}