import * as flatbuffers from "flatbuffers";
import { SqlSchema as sc } from "@cladbe/sql-protocol";
import {
  TableDefinitionJson,
  TableColumnJson
} from "../types.js";
import { mapConstraint, mapSqlType } from "./enums.js";

function encodeKeyValueVec(
  b: flatbuffers.Builder,
  obj?: Record<string, string | number | boolean>
): number {
  if (!obj || !Object.keys(obj).length) return 0;
  const entries: number[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const ko = b.createString(k);
    const vo = b.createString(String(v));
    sc.SqlSchema.KeyValuePair.startKeyValuePair(b);
    sc.SqlSchema.KeyValuePair.addKey(b, ko);
    sc.SqlSchema.KeyValuePair.addValue(b, vo);
    const off = sc.SqlSchema.KeyValuePair.endKeyValuePair(b);
    entries.push(off);
  }
  const vec = sc.SqlSchema.CustomOptions.createOptionsVector(b, entries);
  sc.SqlSchema.CustomOptions.startCustomOptions(b);
  sc.SqlSchema.CustomOptions.addOptions(b, vec);
  return sc.SqlSchema.CustomOptions.endCustomOptions(b);
}

function encodeTableOptions(
  b: flatbuffers.Builder,
  obj?: Record<string, string | number | boolean>
): number {
  if (!obj || !Object.keys(obj).length) return 0;
  const entries: number[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const ko = b.createString(k);
    const vo = b.createString(String(v));
    sc.SqlSchema.KeyValuePair.startKeyValuePair(b);
    sc.SqlSchema.KeyValuePair.addKey(b, ko);
    sc.SqlSchema.KeyValuePair.addValue(b, vo);
    const off = sc.SqlSchema.KeyValuePair.endKeyValuePair(b);
    entries.push(off);
  }
  const vec = sc.SqlSchema.TableOptions.createOptionsVector(b, entries);
  sc.SqlSchema.TableOptions.startTableOptions(b);
  sc.SqlSchema.TableOptions.addOptions(b, vec);
  return sc.SqlSchema.TableOptions.endTableOptions(b);
}

function encodeColumn(b: flatbuffers.Builder, c: TableColumnJson): number {
  const name = b.createString(c.name);
  const cons = c.constraints.map(mapConstraint);
  const consVec = sc.SqlSchema.TableColumn.createConstraintsVector(b, cons);
  const customOff = encodeKeyValueVec(b, c.customOptions);

  sc.SqlSchema.TableColumn.startTableColumn(b);
  sc.SqlSchema.TableColumn.addName(b, name);
  sc.SqlSchema.TableColumn.addDataType(b, mapSqlType(c.dataType));
  sc.SqlSchema.TableColumn.addIsNullable(b, !!c.isNullable);
  sc.SqlSchema.TableColumn.addConstraints(b, consVec);
  if (customOff) sc.SqlSchema.TableColumn.addCustomOptions(b, customOff);
  return sc.SqlSchema.TableColumn.endTableColumn(b);
}

export function encodeTableDefinition(b: flatbuffers.Builder, td: TableDefinitionJson): number {
  const name = b.createString(td.name);
  const cols = td.columns.map((c) => encodeColumn(b, c));
  const colsVec = sc.SqlSchema.TableDefinition.createColumnsVector(b, cols);
  const commentOff = td.comment ? b.createString(td.comment) : 0;
  const optsOff = encodeTableOptions(b, td.tableOptions);

  sc.SqlSchema.TableDefinition.startTableDefinition(b);
  sc.SqlSchema.TableDefinition.addName(b, name);
  sc.SqlSchema.TableDefinition.addColumns(b, colsVec);
  if (commentOff) sc.SqlSchema.TableDefinition.addComment(b, commentOff);
  if (optsOff) sc.SqlSchema.TableDefinition.addTableOptions(b, optsOff);
  return sc.SqlSchema.TableDefinition.endTableDefinition(b);
}