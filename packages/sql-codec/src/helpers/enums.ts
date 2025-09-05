import { SqlSchema as sc, SqlRpc as sr } from "@cladbe/sql-protocol";
import {
  ColumnConstraint,
  NullsSortOrder,
  OrderSort,
  SQLDataFilterType,
  SQLFilterWrapperType,
  SQLDataType
} from "../types.js";

// ---- JSON → FB enum mappers ----

export function mapOrderSort(v: OrderSort): sc.SqlSchema.OrderSort {
  switch (v) {
    case OrderSort.ASC_DEFAULT: return sc.SqlSchema.OrderSort.ASC_DEFAULT;
    case OrderSort.ASC_NULLS_FIRST: return sc.SqlSchema.OrderSort.ASC_NULLS_FIRST;
    case OrderSort.ASC_NULLS_LAST: return sc.SqlSchema.OrderSort.ASC_NULLS_LAST;
    case OrderSort.DESC_DEFAULT: return sc.SqlSchema.OrderSort.DESC_DEFAULT;
    case OrderSort.DESC_NULLS_FIRST: return sc.SqlSchema.OrderSort.DESC_NULLS_FIRST;
    case OrderSort.DESC_NULLS_LAST: return sc.SqlSchema.OrderSort.DESC_NULLS_LAST;
  }
}

export function mapWrapperType(v: SQLFilterWrapperType): sc.SqlSchema.SQLFilterWrapperType {
  return v === SQLFilterWrapperType.and
    ? sc.SqlSchema.SQLFilterWrapperType.and
    : sc.SqlSchema.SQLFilterWrapperType.or;
}

export function mapNullsSortOrder(v: NullsSortOrder): sc.SqlSchema.NullsSortOrder {
  switch (v) {
    case NullsSortOrder.first: return sc.SqlSchema.NullsSortOrder.first;
    case NullsSortOrder.last: return sc.SqlSchema.NullsSortOrder.last;
    default: return sc.SqlSchema.NullsSortOrder.default_;
  }
}

export function mapFilterType(v: SQLDataFilterType): sc.SqlSchema.BasicSqlDataFilterType {
  // Only map those that exist in BasicSqlDataFilterType
  switch (v) {
    case "equals": return sc.SqlSchema.BasicSqlDataFilterType.equals;
    case "notEquals": return sc.SqlSchema.BasicSqlDataFilterType.notEquals;
    case "lessThan": return sc.SqlSchema.BasicSqlDataFilterType.lessThan;
    case "lessThanOrEquals": return sc.SqlSchema.BasicSqlDataFilterType.lessThanOrEquals;
    case "greaterThan": return sc.SqlSchema.BasicSqlDataFilterType.greaterThan;
    case "greaterThanOrEquals": return sc.SqlSchema.BasicSqlDataFilterType.greaterThanOrEquals;

    case "isNull": return sc.SqlSchema.BasicSqlDataFilterType.isNull;
    case "isNotNull": return sc.SqlSchema.BasicSqlDataFilterType.isNotNull;

    case "regex": return sc.SqlSchema.BasicSqlDataFilterType.regex;
    case "notRegex": return sc.SqlSchema.BasicSqlDataFilterType.notRegex;
    case "startsWith": return sc.SqlSchema.BasicSqlDataFilterType.startsWith;
    case "endsWith": return sc.SqlSchema.BasicSqlDataFilterType.endsWith;
    case "contains": return sc.SqlSchema.BasicSqlDataFilterType.contains;
    case "notContains": return sc.SqlSchema.BasicSqlDataFilterType.notContains;

    case "arrayContains": return sc.SqlSchema.BasicSqlDataFilterType.arrayContains;
    case "arrayContainedBy": return sc.SqlSchema.BasicSqlDataFilterType.arrayContainedBy;
    case "arrayOverlaps": return sc.SqlSchema.BasicSqlDataFilterType.arrayOverlaps;
    case "arrayEquals": return sc.SqlSchema.BasicSqlDataFilterType.arrayEquals;
    case "arrayNotEquals": return sc.SqlSchema.BasicSqlDataFilterType.arrayNotEquals;
    case "arrayEmpty": return sc.SqlSchema.BasicSqlDataFilterType.arrayEmpty;
    case "arrayNotEmpty": return sc.SqlSchema.BasicSqlDataFilterType.arrayNotEmpty;
    case "arrayLength": return sc.SqlSchema.BasicSqlDataFilterType.arrayLength;

    case "jsonContains": return sc.SqlSchema.BasicSqlDataFilterType.jsonContains;
    case "jsonContainedBy": return sc.SqlSchema.BasicSqlDataFilterType.jsonContainedBy;
    case "jsonHasKey": return sc.SqlSchema.BasicSqlDataFilterType.jsonHasKey;
    case "jsonHasAnyKey": return sc.SqlSchema.BasicSqlDataFilterType.jsonHasAnyKey;
    case "jsonHasAllKeys": return sc.SqlSchema.BasicSqlDataFilterType.jsonHasAllKeys;
    case "jsonGetField": return sc.SqlSchema.BasicSqlDataFilterType.jsonGetField;
    case "jsonGetFieldAsText": return sc.SqlSchema.BasicSqlDataFilterType.jsonGetFieldAsText;

    case "between": return sc.SqlSchema.BasicSqlDataFilterType.between;
    case "notBetween": return sc.SqlSchema.BasicSqlDataFilterType.notBetween;
    case "rangeContains": return sc.SqlSchema.BasicSqlDataFilterType.rangeContains;
    case "rangeContainedBy": return sc.SqlSchema.BasicSqlDataFilterType.rangeContainedBy;

    case "in": return sc.SqlSchema.BasicSqlDataFilterType.inList;
    case "notIn": return sc.SqlSchema.BasicSqlDataFilterType.notInList;

    default:
      throw new Error(`Unsupported filterType for FlatBuffers: ${v}`);
  }
}

export function mapSqlType(v: SQLDataType): sc.SqlSchema.SQLDataType {
  switch (v) {
    case SQLDataType.text: return sc.SqlSchema.SQLDataType.text;
    case SQLDataType.varchar: return sc.SqlSchema.SQLDataType.varchar;
    case SQLDataType.char: return sc.SqlSchema.SQLDataType.char_;
    case SQLDataType.varcharArray: return sc.SqlSchema.SQLDataType.varcharArray;
    case SQLDataType.textArray: return sc.SqlSchema.SQLDataType.textArray;
    case SQLDataType.charArray: return sc.SqlSchema.SQLDataType.charArray;
    case SQLDataType.integer: return sc.SqlSchema.SQLDataType.integer;
    case SQLDataType.bigInt: return sc.SqlSchema.SQLDataType.bigInt;
    case SQLDataType.smallInt: return sc.SqlSchema.SQLDataType.smallInt;
    case SQLDataType.decimal: return sc.SqlSchema.SQLDataType.decimal;
    case SQLDataType.numeric: return sc.SqlSchema.SQLDataType.numeric;
    case SQLDataType.real: return sc.SqlSchema.SQLDataType.real;
    case SQLDataType.doublePrecision: return sc.SqlSchema.SQLDataType.doublePrecision;
    case SQLDataType.serial: return sc.SqlSchema.SQLDataType.serial;
    case SQLDataType.bigSerial: return sc.SqlSchema.SQLDataType.bigSerial;
    case SQLDataType.smallSerial: return sc.SqlSchema.SQLDataType.smallSerial;
    case SQLDataType.money: return sc.SqlSchema.SQLDataType.money;
    case SQLDataType.date: return sc.SqlSchema.SQLDataType.date;
    case SQLDataType.time: return sc.SqlSchema.SQLDataType.time;
    case SQLDataType.timestamp: return sc.SqlSchema.SQLDataType.timestamp;
    case SQLDataType.timestamptz: return sc.SqlSchema.SQLDataType.timestamptz;
    case SQLDataType.interval: return sc.SqlSchema.SQLDataType.interval;
    case SQLDataType.timetz: return sc.SqlSchema.SQLDataType.timetz;
    case SQLDataType.boolean: return sc.SqlSchema.SQLDataType.boolean_;
    case SQLDataType.bytea: return sc.SqlSchema.SQLDataType.bytea;
    case SQLDataType.json: return sc.SqlSchema.SQLDataType.json;
    case SQLDataType.jsonb: return sc.SqlSchema.SQLDataType.jsonb;
    case SQLDataType.jsonArray: return sc.SqlSchema.SQLDataType.jsonArray;
    case SQLDataType.jsonbArray: return sc.SqlSchema.SQLDataType.jsonbArray;
    case SQLDataType.uuid: return sc.SqlSchema.SQLDataType.uuid;
    case SQLDataType.xml: return sc.SqlSchema.SQLDataType.xml;
    case SQLDataType.array: return sc.SqlSchema.SQLDataType.array;
    case SQLDataType.custom: return sc.SqlSchema.SQLDataType.custom;
  }
}

export function mapConstraint(v: ColumnConstraint): sc.SqlSchema.ColumnConstraint {
  switch (v) {
    case ColumnConstraint.primaryKey: return sc.SqlSchema.ColumnConstraint.primaryKey;
    case ColumnConstraint.unique: return sc.SqlSchema.ColumnConstraint.unique;
    case ColumnConstraint.notNull: return sc.SqlSchema.ColumnConstraint.notNull;
    case ColumnConstraint.check: return sc.SqlSchema.ColumnConstraint.check;
    case ColumnConstraint.default_: return sc.SqlSchema.ColumnConstraint.default_;
    case ColumnConstraint.indexed: return sc.SqlSchema.ColumnConstraint.indexed;
    case ColumnConstraint.exclusion: return sc.SqlSchema.ColumnConstraint.exclusion;
    case ColumnConstraint.generated: return sc.SqlSchema.ColumnConstraint.generated;
    case ColumnConstraint.identity: return sc.SqlSchema.ColumnConstraint.identity;
    case ColumnConstraint.references: return sc.SqlSchema.ColumnConstraint.references;
    case ColumnConstraint.noInherit: return sc.SqlSchema.ColumnConstraint.noInherit;
    case ColumnConstraint.nullsNotDistinct: return sc.SqlSchema.ColumnConstraint.nullsNotDistinct;
  }
}

// ---- FB → JSON error enum ----
export function mapErrorCode(code: sr.SqlRpc.ErrorCode): "NONE" | "BAD_REQUEST" | "INTERNAL" {
  switch (code) {
    case sr.SqlRpc.ErrorCode.NONE: return "NONE";
    case sr.SqlRpc.ErrorCode.BAD_REQUEST: return "BAD_REQUEST";
    default: return "INTERNAL";
  }
}