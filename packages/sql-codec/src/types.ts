// === Public JSON types (exactly the toMap-style shapes you shared) ===

// Wrapper type: always explicit string
export enum SQLFilterWrapperType {
  or = "or",
  and = "and"
}

// NULL sort ordering
export enum NullsSortOrder {
  first = "first",
  last = "last",
  default_ = "default"
}

// Sorting spec
export interface DataSort {
  field: string;
  ascending: boolean;
}

export enum OrderSort {
  ASC_DEFAULT = "ASC_DEFAULT",
  ASC_NULLS_FIRST = "ASC_NULLS_FIRST",
  ASC_NULLS_LAST = "ASC_NULLS_LAST",
  DESC_DEFAULT = "DESC_DEFAULT",
  DESC_NULLS_FIRST = "DESC_NULLS_FIRST",
  DESC_NULLS_LAST = "DESC_NULLS_LAST"
}

export interface OrderKeySpec {
  field: string;
  sort: OrderSort;
}

// Filter types: NOTE — flatbuffers version supports a reduced subset.
// We keep your full enum for typing, but the encoder only maps those
// present in SqlSchema.BasicSqlDataFilterType.
export enum SQLDataFilterType {
  equals = "equals",
  notEquals = "notEquals",
  lessThan = "lessThan",
  lessThanOrEquals = "lessThanOrEquals",
  greaterThan = "greaterThan",
  greaterThanOrEquals = "greaterThanOrEquals",

  isNull = "isNull",
  isNotNull = "isNotNull",

  regex = "regex",
  notRegex = "notRegex",
  startsWith = "startsWith",
  endsWith = "endsWith",
  contains = "contains",
  notContains = "notContains",

  arrayContains = "arrayContains",
  arrayContainedBy = "arrayContainedBy",
  arrayOverlaps = "arrayOverlaps",
  arrayEquals = "arrayEquals",
  arrayNotEquals = "arrayNotEquals",
  arrayEmpty = "arrayEmpty",
  arrayNotEmpty = "arrayNotEmpty",
  arrayLength = "arrayLength",

  jsonContains = "jsonContains",
  jsonContainedBy = "jsonContainedBy",
  jsonHasKey = "jsonHasKey",
  jsonHasAnyKey = "jsonHasAnyKey",
  jsonHasAllKeys = "jsonHasAllKeys",
  jsonGetField = "jsonGetField",
  jsonGetFieldAsText = "jsonGetFieldAsText",

  between = "between",
  notBetween = "notBetween",
  rangeContains = "rangeContains",
  rangeContainedBy = "rangeContainedBy",

  in_ = "in",
  notIn = "notIn",

  // many more in your model — omitted since not supported by FB spec
}

export interface BaseSqlDataFilter { }

export interface SqlFilterModifier {
  distinct?: boolean;
  caseInSensitive: boolean;
  nullsOrder: NullsSortOrder;
}

export interface SqlDataFilter extends BaseSqlDataFilter {
  fieldName: string;
  value: unknown; // can be scalar | array for between/in/etc.
  filterType: SQLDataFilterType;
  modifier?: SqlFilterModifier;
}

export interface SqlDataFilterWrapper extends BaseSqlDataFilter {
  filterWrapperType: SQLFilterWrapperType;
  filters: BaseSqlDataFilter[];
}

// ---- Table definition JSON (from your models/table_definition.ts) ----

export enum ColumnConstraint {
  primaryKey = "primaryKey",
  unique = "unique",
  notNull = "notNull",
  check = "check",
  default_ = "default_",
  indexed = "indexed",
  exclusion = "exclusion",
  generated = "generated",
  identity = "identity",
  references = "references",
  noInherit = "noInherit",
  nullsNotDistinct = "nullsNotDistinct"
}

export enum SQLDataType {
  text = "text",
  varchar = "varchar",
  char = "char",
  varcharArray = "varcharArray",
  textArray = "textArray",
  charArray = "charArray",
  integer = "integer",
  bigInt = "bigInt",
  smallInt = "smallInt",
  decimal = "decimal",
  numeric = "numeric",
  real = "real",
  doublePrecision = "doublePrecision",
  serial = "serial",
  bigSerial = "bigSerial",
  smallSerial = "smallSerial",
  money = "money",
  date = "date",
  time = "time",
  timestamp = "timestamp",
  timestamptz = "timestamptz",
  interval = "interval",
  timetz = "timetz",
  boolean = "boolean",
  bytea = "bytea",
  json = "json",
  jsonb = "jsonb",
  jsonArray = "jsonArray",
  jsonbArray = "jsonbArray",
  uuid = "uuid",
  xml = "xml",
  array = "array",
  custom = "custom"
}

export interface TableColumnJson {
  name: string;
  dataType: SQLDataType;
  isNullable: boolean;
  constraints: ColumnConstraint[];
  customOptions?: Record<string, string | number | boolean>;
}

export interface TableDefinitionJson {
  name: string;
  columns: TableColumnJson[];
  comment?: string;
  tableOptions?: Record<string, string | number | boolean>;
}

// ---- Request JSONs (exact toMap outputs) ----

export interface BaseDbJson {
  tableName: string;
  companyId: string;
}

export interface GetDataJson extends BaseDbJson {
  dataSort?: DataSort;
  filters?: BaseSqlDataFilter[];
  limit?: number;
  offset?: number;
  orderKeys?: OrderKeySpec[];
  cursor?: Record<string, unknown>;
  strictAfter?: boolean;
}

export interface GetSingleJson extends BaseDbJson {
  primaryKeyColumn: string;
  primaryId: string;
}

export interface AddSingleJson extends BaseDbJson {
  primaryKeyColumn: string;
  data: Record<string, unknown>;
}

export interface UpdateSingleJson extends BaseDbJson {
  primaryKeyColumn: string;
  primaryId: string;
  updates: Record<string, unknown>;
}

export interface DeleteRowJson extends BaseDbJson {
  primaryKeyColumn: string;
  primaryId: string;
}

export interface CreateTableJson {
  companyId: string;
  definition: TableDefinitionJson;
}

export interface TableExistsJson extends BaseDbJson { }

export interface RunAggregationJson extends BaseDbJson {
  sumFields?: string[];
  averageFields?: string[];
  minimumFields?: string[];
  maximumFields?: string[];
  countEnabled?: boolean;
  filters?: BaseSqlDataFilter[];
}

// ---- Envelope for requests ----

export type RequestPayloadJson =
  | { method: "GET_DATA"; payload: GetDataJson }
  | { method: "GET_SINGLE"; payload: GetSingleJson }
  | { method: "ADD_SINGLE"; payload: AddSingleJson }
  | { method: "UPDATE_SINGLE"; payload: UpdateSingleJson }
  | { method: "DELETE_ROW"; payload: DeleteRowJson }
  | { method: "CREATE_TABLE"; payload: CreateTableJson }
  | { method: "TABLE_EXISTS"; payload: TableExistsJson }
  | { method: "RUN_AGGREGATION"; payload: RunAggregationJson };

export type RequestEnvelopeJson = {
  correlationId: string;
  replyTopic: string;
} & RequestPayloadJson;

// ---- Responses (decoded JSON) ----

export type RpcErrorCode = "NONE" | "BAD_REQUEST" | "INTERNAL";

export type RpcResponseJson =
  | { type: "RowsJson"; rows: string[] }
  | { type: "RowJson"; row: string }
  | { type: "BoolRes"; value: boolean }
  | { type: "AggRes"; agg: { count?: number; sumValues?: Record<string, number>; avgValues?: Record<string, number>; minimumValues?: Record<string, number>; maximumValues?: Record<string, number> } }
  | { type: "RowsWithCursor"; rows: string[]; cursor: Record<string, unknown> };

export interface ResponseEnvelopeJson {
  correlationId: string;
  ok: boolean;
  errorCode: RpcErrorCode;
  errorMessage?: string | null;
  data?: RpcResponseJson | undefined;
}