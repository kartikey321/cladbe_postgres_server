// src/ws/json-to-fb.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as flatbuffers from "flatbuffers";
import { SqlSchema as sc } from "@cladbe/sql-protocol";
import { orderSortFromWire, buildFilterValue, buildBasic, buildWrapper } from "../fb/builders.js";

type Json = Record<string,any>;
let S = sc.SqlSchema;

export function encodeStreamingFilterJson(jsonSpec: Json): Buffer {
  const b = new flatbuffers.Builder(1024);

  const hashOff = b.createString(String(jsonSpec.hash ?? ""));

  // order
  const orderOffsets: number[] = [];
  if (Array.isArray(jsonSpec.order)) {
    for (const o of jsonSpec.order) {
      const fieldOff = b.createString(String(o.field));
      const sortEnum = orderSortFromWire(String(o.sort ?? "DESC_DEFAULT"));
      S.OrderKeySpec.startOrderKeySpec(b);
      S.OrderKeySpec.addField(b, fieldOff);
      S.OrderKeySpec.addSort(b, sortEnum);
      S.OrderKeySpec.addIsPk(b, !!o.is_pk);
      orderOffsets.push(S.OrderKeySpec.endOrderKeySpec(b));
    }
  }
  const orderVec = S.StreamingSqlDataFilter.createOrderVector(b, orderOffsets);

  // cursor
  const cursorOffsets: number[] = [];
  if (Array.isArray(jsonSpec.cursor)) {
    for (const c of jsonSpec.cursor) {
      const fieldOff = b.createString(String(c.field));
      const { type: valType, off: valOff } = buildFilterValue(b, c.value);
      S.CursorEntry.startCursorEntry(b);
      S.CursorEntry.addField(b, fieldOff);
      S.CursorEntry.addValueType(b, valType);
      S.CursorEntry.addValue(b, valOff);
      cursorOffsets.push(S.CursorEntry.endCursorEntry(b));
    }
  }
  const cursorVec = S.StreamingSqlDataFilter.createCursorVector(b, cursorOffsets);

  // wrapper
  const { off: wrapperOff, type} = (function () {
    const off = buildWrapper(b, jsonSpec.wrapper);
    return { off, type: S.BasicSqlDataFilterUnion.BasicSqlDataFilterWrapper };
  })();

  S.StreamingSqlDataFilter.startStreamingSqlDataFilter(b);
  S.StreamingSqlDataFilter.addHash(b, hashOff);
  S.StreamingSqlDataFilter.addWrapper(b, wrapperOff);
  S.StreamingSqlDataFilter.addLimit(b, Number(jsonSpec.limit ?? 50));
  S.StreamingSqlDataFilter.addOrder(b, orderVec);
  S.StreamingSqlDataFilter.addCursor(b, cursorVec);
  S.StreamingSqlDataFilter.addSchemaVersion(b, Number(jsonSpec.schema_version ?? 1));
  const root = S.StreamingSqlDataFilter.endStreamingSqlDataFilter(b);

  b.finish(root);
  return Buffer.from(b.asUint8Array());
}