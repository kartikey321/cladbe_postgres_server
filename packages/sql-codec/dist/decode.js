import { SqlRpc as sr } from "@cladbe/sql-protocol";
import * as flatbuffers from "flatbuffers";
import { decodeFilterValue } from "./helpers/values.js";
import { mapErrorCode } from "./helpers/enums.js";
function rowsJson(env) {
    const r = new sr.SqlRpc.RowsJson();
    const got = env.data(r);
    const n = got ? (r.rowsLength() ?? 0) : 0;
    const rows = [];
    for (let i = 0; i < n; i++) {
        const s = r.rows(i);
        if (s != null)
            rows.push(s);
    }
    return { type: "RowsJson", rows };
}
function rowJson(env) {
    const r = new sr.SqlRpc.RowJson();
    const got = env.data(r);
    const s = got ? r.row() ?? "" : "";
    return { type: "RowJson", row: s };
}
function boolRes(env) {
    const r = new sr.SqlRpc.BoolRes();
    const got = env.data(r);
    const v = got ? !!r.value() : false;
    return { type: "BoolRes", value: v };
}
function aggRes(env) {
    const r = new sr.SqlRpc.AggRes();
    const got = env.data(r);
    const a = got ? r.agg() : null;
    const out = {};
    if (a) {
        const count = a.count?.() ?? 0;
        if (count)
            out.count = count;
        function kvToMap(lenFn, getFn) {
            const m = {};
            const n = lenFn() ?? 0;
            for (let i = 0; i < n; i++) {
                const kv = getFn(i);
                if (!kv)
                    continue;
                const k = kv.key() ?? "";
                const v = Number(kv.value?.() ?? "0");
                if (k)
                    m[k] = v;
            }
            return m;
        }
        const sum = kvToMap(() => a.sumValuesLength?.(), (i) => a.sumValues?.(i));
        const avg = kvToMap(() => a.avgValuesLength?.(), (i) => a.avgValues?.(i));
        const min = kvToMap(() => a.minimumValuesLength?.(), (i) => a.minimumValues?.(i));
        const max = kvToMap(() => a.maximumValuesLength?.(), (i) => a.maximumValues?.(i));
        if (Object.keys(sum).length)
            out.sumValues = sum;
        if (Object.keys(avg).length)
            out.avgValues = avg;
        if (Object.keys(min).length)
            out.minimumValues = min;
        if (Object.keys(max).length)
            out.maximumValues = max;
    }
    return { type: "AggRes", agg: out };
}
function rowsWithCursor(env) {
    const r = new sr.SqlRpc.RowsWithCursor();
    const got = env.data(r);
    const rows = [];
    const nrows = got ? (r.rowsLength() ?? 0) : 0;
    for (let i = 0; i < nrows; i++) {
        const s = r.rows(i);
        if (s != null)
            rows.push(s);
    }
    const cursor = {};
    const nc = got ? (r.cursorLength() ?? 0) : 0;
    for (let i = 0; i < nc; i++) {
        const ce = r.cursor(i);
        if (!ce)
            continue;
        const name = ce.field() ?? "";
        const t = ce.valueType();
        const v = decodeFilterValue(t, (o) => ce.value(o));
        if (name)
            cursor[name] = v;
    }
    return { type: "RowsWithCursor", rows, cursor };
}
// ---- Public: parse a ResponseEnvelope buffer ----
export function parseResponseBuffer(buf) {
    const bb = new flatbuffers.ByteBuffer(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
    const env = sr.SqlRpc.ResponseEnvelope.getRootAsResponseEnvelope(bb);
    const ok = !!env.ok();
    const corr = env.correlationId() ?? "";
    const code = mapErrorCode(env.errorCode());
    if (!ok) {
        return {
            correlationId: corr,
            ok,
            errorCode: code,
            errorMessage: env.errorMessage()
        };
    }
    const t = env.dataType();
    let data;
    switch (t) {
        case sr.SqlRpc.RpcResponse.RowsJson:
            data = rowsJson(env);
            break;
        case sr.SqlRpc.RpcResponse.RowJson:
            data = rowJson(env);
            break;
        case sr.SqlRpc.RpcResponse.BoolRes:
            data = boolRes(env);
            break;
        case sr.SqlRpc.RpcResponse.AggRes:
            data = aggRes(env);
            break;
        case sr.SqlRpc.RpcResponse.RowsWithCursor:
            data = rowsWithCursor(env);
            break;
        default:
            data = undefined;
            break;
    }
    return {
        correlationId: corr,
        ok,
        errorCode: code,
        data
    };
}
