import { SqlSchema as sc } from "@cladbe/sql-protocol";
import * as flatbuffers from "flatbuffers";

// Decide list type: prefer StringList if strings, Int64List if ints safe, Float64List if numbers
function isInteger(n: number): boolean {
  return Number.isInteger(n);
}

function isStringArray(a: unknown[]): a is string[] {
  return a.every((x) => typeof x === "string");
}
function isBoolArray(a: unknown[]): a is boolean[] {
  return a.every((x) => typeof x === "boolean");
}
function isNumberArray(a: unknown[]): a is number[] {
  return a.every((x) => typeof x === "number" && Number.isFinite(x));
}

/** JSON value -> (FilterValue.type, offset) */
export function encodeFilterValue(b: flatbuffers.Builder, v: unknown): { type: number; off: number } {
  // null
  if (v === null || v === undefined) {
    sc.SqlSchema.NullValue.startNullValue(b);
    const off = sc.SqlSchema.NullValue.endNullValue(b);
    return { type: sc.SqlSchema.FilterValue.NullValue, off };
  }

  // scalar
  if (typeof v === "string") {
    const s = b.createString(v);
    sc.SqlSchema.StringValue.startStringValue(b);
    sc.SqlSchema.StringValue.addValue(b, s);
    const off = sc.SqlSchema.StringValue.endStringValue(b);
    return { type: sc.SqlSchema.FilterValue.StringValue, off };
  }
  if (typeof v === "boolean") {
    sc.SqlSchema.BoolValue.startBoolValue(b);
    sc.SqlSchema.BoolValue.addValue(b, v);
    const off = sc.SqlSchema.BoolValue.endBoolValue(b);
    return { type: sc.SqlSchema.FilterValue.BoolValue, off };
  }
  if (typeof v === "number") {
    // Use NumberValue (double) to avoid JS int64 issues
    sc.SqlSchema.NumberValue.startNumberValue(b);
    sc.SqlSchema.NumberValue.addValue(b, v);
    const off = sc.SqlSchema.NumberValue.endNumberValue(b);
    return { type: sc.SqlSchema.FilterValue.NumberValue, off };
  }

  // array
  if (Array.isArray(v)) {
    if (v.length === 0) {
      // empty → encode as StringList empty (choice is arbitrary but consistent)
      const vec = sc.SqlSchema.StringList.createValuesVector(b, []);
      sc.SqlSchema.StringList.startStringList(b);
      sc.SqlSchema.StringList.addValues(b, vec);
      const off = sc.SqlSchema.StringList.endStringList(b);
      return { type: sc.SqlSchema.FilterValue.StringList, off };
    }
    if (isStringArray(v)) {
      const offs = v.map((s) => b.createString(s));
      const vec = sc.SqlSchema.StringList.createValuesVector(b, offs);
      sc.SqlSchema.StringList.startStringList(b);
      sc.SqlSchema.StringList.addValues(b, vec);
      const off = sc.SqlSchema.StringList.endStringList(b);
      return { type: sc.SqlSchema.FilterValue.StringList, off };
    }
    if (isBoolArray(v)) {
      const vec = sc.SqlSchema.BoolList.createValuesVector(b, v);
      sc.SqlSchema.BoolList.startBoolList(b);
      sc.SqlSchema.BoolList.addValues(b, vec);
      const off = sc.SqlSchema.BoolList.endBoolList(b);
      return { type: sc.SqlSchema.FilterValue.BoolList, off };
    }
    if (isNumberArray(v)) {
      // If all integers, still prefer Float64List to avoid int64 range issues
      const vec = sc.SqlSchema.Float64List.createValuesVector(b, v);
      sc.SqlSchema.Float64List.startFloat64List(b);
      sc.SqlSchema.Float64List.addValues(b, vec);
      const off = sc.SqlSchema.Float64List.endFloat64List(b);
      return { type: sc.SqlSchema.FilterValue.Float64List, off };
    }
  }

  // fallback: stringify
  const s = b.createString(String(v));
  sc.SqlSchema.StringValue.startStringValue(b);
  sc.SqlSchema.StringValue.addValue(b, s);
  const off = sc.SqlSchema.StringValue.endStringValue(b);
  return { type: sc.SqlSchema.FilterValue.StringValue, off };
}

/** FB FilterValue -> JSON value */
export function decodeFilterValue(valType: number, get: <T>(o: T) => T | null): unknown {
  switch (valType) {
    case sc.SqlSchema.FilterValue.StringValue: {
      const o = new sc.SqlSchema.StringValue();
      const got = get(o);
      return got ? o.value() : null;
    }
    case sc.SqlSchema.FilterValue.NumberValue: {
      const o = new sc.SqlSchema.NumberValue();
      const got = get(o);
      return got ? o.value() : null;
    }
    case sc.SqlSchema.FilterValue.BoolValue: {
      const o = new sc.SqlSchema.BoolValue();
      const got = get(o);
      return got ? !!o.value() : null;
    }
    case sc.SqlSchema.FilterValue.Int64Value: {
      const o = new sc.SqlSchema.Int64Value();
      const got = get(o);
      return got ? Number(o.value()) : null;
    }
    case sc.SqlSchema.FilterValue.NullValue:
      return null;
    case sc.SqlSchema.FilterValue.TimestampValue: {
      const o = new sc.SqlSchema.TimestampValue();
      const got = get(o);
      return got ? Number(o.epoch()) : null;
    }
    case sc.SqlSchema.FilterValue.StringList: {
      const o = new sc.SqlSchema.StringList();
      const got = get(o);
      if (!got) return null;
      const arr: string[] = [];
      const n = o.valuesLength() ?? 0;
      for (let i = 0; i < n; i++) {
        const s = o.values(i);
        if (s != null) arr.push(s);
      }
      return arr;
    }
    case sc.SqlSchema.FilterValue.Int64List: {
      const o = new sc.SqlSchema.Int64List();
      const got = get(o);
      if (!got) return null;
      const arr: number[] = [];
      const n = o.valuesLength() ?? 0;
      for (let i = 0; i < n; i++) {
        const v = o.values(i);
        if (v != null) arr.push(Number(v));
      }
      return arr;
    }
    case sc.SqlSchema.FilterValue.Float64List: {
      const o = new sc.SqlSchema.Float64List();
      const got = get(o);
      if (!got) return null;
      const arr: number[] = [];
      const n = o.valuesLength() ?? 0;
      for (let i = 0; i < n; i++) {
        const v = o.values(i);
        if (v != null) arr.push(v);
      }
      return arr;
    }
    case sc.SqlSchema.FilterValue.BoolList: {
      const o = new sc.SqlSchema.BoolList();
      const got = get(o);
      if (!got) return null;
      const arr: boolean[] = [];
      const n = o.valuesLength() ?? 0;
      for (let i = 0; i < n; i++) {
        const v = o.values(i);
        if (v != null) arr.push(!!v);
      }
      return arr;
    }
    default:
      return null;
  }
}