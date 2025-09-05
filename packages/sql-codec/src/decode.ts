import { SqlRpc as sr, SqlSchema as sc } from "@cladbe/sql-protocol";
import * as flatbuffers from "flatbuffers";
import { ResponseEnvelopeJson, RpcResponseJson } from "./types.js";
import { decodeFilterValue } from "./helpers/values.js";
import { mapErrorCode } from "./helpers/enums.js";

function rowsJson(env: sr.SqlRpc.ResponseEnvelope): RpcResponseJson {
  const r = new sr.SqlRpc.RowsJson();
  const got = env.data(r);
  const n = got ? (r.rowsLength() ?? 0) : 0;
  const rows: string[] = [];
  for (let i = 0; i < n; i++) {
    const s = r.rows(i);
    if (s != null) rows.push(s);
  }
  return { type: "RowsJson", rows };
}

function rowJson(env: sr.SqlRpc.ResponseEnvelope): RpcResponseJson {
  const r = new sr.SqlRpc.RowJson();
  const got = env.data(r);
  const s = got ? r.row() ?? "" : "";
  return { type: "RowJson", row: s };
}

function boolRes(env: sr.SqlRpc.ResponseEnvelope): RpcResponseJson {
  const r = new sr.SqlRpc.BoolRes();
  const got = env.data(r);
  const v = got ? !!r.value() : false;
  return { type: "BoolRes", value: v };
}

function aggRes(env: sr.SqlRpc.ResponseEnvelope): RpcResponseJson {
  const r = new sr.SqlRpc.AggRes();
  const got = env.data(r);
  const a = got ? r.agg() : null;
  const out: NonNullable<Extract<RpcResponseJson, { type: "AggRes" }>["agg"]> = {};

  if (a) {
    const count = a.count?.() ?? 0;
    if (count) out.count = count;

    function kvToMap(
      lenFn: () => number | null | undefined,
      getFn: (i: number) => sc.SqlSchema.KeyValuePair | null | undefined
    ) {
      const m: Record<string, number> = {};
      const n = lenFn() ?? 0;
      for (let i = 0; i < n; i++) {
        const kv = getFn(i);
        if (!kv) continue;
        const k = kv.key() ?? "";
        const v = Number(kv.value?.() ?? "0");
        if (k) m[k] = v;
      }
      return m;
    }

    const sum = kvToMap(() => a.sumValuesLength?.(), (i) => a.sumValues?.(i)!);
    const avg = kvToMap(() => a.avgValuesLength?.(), (i) => a.avgValues?.(i)!);
    const min = kvToMap(() => a.minimumValuesLength?.(), (i) => a.minimumValues?.(i)!);
    const max = kvToMap(() => a.maximumValuesLength?.(), (i) => a.maximumValues?.(i)!);

    if (Object.keys(sum).length) out.sumValues = sum;
    if (Object.keys(avg).length) out.avgValues = avg;
    if (Object.keys(min).length) out.minimumValues = min;
    if (Object.keys(max).length) out.maximumValues = max;
  }

  return { type: "AggRes", agg: out };
}

function rowsWithCursor(env: sr.SqlRpc.ResponseEnvelope): RpcResponseJson {
  const r = new sr.SqlRpc.RowsWithCursor();
  const got = env.data(r);

  const rows: string[] = [];
  const nrows = got ? (r.rowsLength() ?? 0) : 0;
  for (let i = 0; i < nrows; i++) {
    const s = r.rows(i);
    if (s != null) rows.push(s);
  }

  const cursor: Record<string, unknown> = {};
  const nc = got ? (r.cursorLength() ?? 0) : 0;
  for (let i = 0; i < nc; i++) {
    const ce = r.cursor(i);
    if (!ce) continue;
    const name = ce.field() ?? "";
    const t = ce.valueType();
    const v = decodeFilterValue(t, (o) => ce.value(o));
    if (name) cursor[name] = v;
  }

  return { type: "RowsWithCursor", rows, cursor };
}

// ---- Public: parse a ResponseEnvelope buffer ----

export function parseResponseBuffer(buf: Buffer): ResponseEnvelopeJson {
  const bb = new flatbuffers.ByteBuffer(
    new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  );
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
  let data: RpcResponseJson | undefined;

  switch (t) {
    case sr.SqlRpc.RpcResponse.RowsJson: data = rowsJson(env); break;
    case sr.SqlRpc.RpcResponse.RowJson: data = rowJson(env); break;
    case sr.SqlRpc.RpcResponse.BoolRes: data = boolRes(env); break;
    case sr.SqlRpc.RpcResponse.AggRes: data = aggRes(env); break;
    case sr.SqlRpc.RpcResponse.RowsWithCursor: data = rowsWithCursor(env); break;
    default: data = undefined; break;
  }

  return {
    correlationId: corr,
    ok,
    errorCode: code,
    data
  };
}