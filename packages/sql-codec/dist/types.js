// === Public JSON types (exactly the toMap-style shapes you shared) ===
// Wrapper type: always explicit string
export var SQLFilterWrapperType;
(function (SQLFilterWrapperType) {
    SQLFilterWrapperType["or"] = "or";
    SQLFilterWrapperType["and"] = "and";
})(SQLFilterWrapperType || (SQLFilterWrapperType = {}));
// NULL sort ordering
export var NullsSortOrder;
(function (NullsSortOrder) {
    NullsSortOrder["first"] = "first";
    NullsSortOrder["last"] = "last";
    NullsSortOrder["default_"] = "default";
})(NullsSortOrder || (NullsSortOrder = {}));
export var OrderSort;
(function (OrderSort) {
    OrderSort["ASC_DEFAULT"] = "ASC_DEFAULT";
    OrderSort["ASC_NULLS_FIRST"] = "ASC_NULLS_FIRST";
    OrderSort["ASC_NULLS_LAST"] = "ASC_NULLS_LAST";
    OrderSort["DESC_DEFAULT"] = "DESC_DEFAULT";
    OrderSort["DESC_NULLS_FIRST"] = "DESC_NULLS_FIRST";
    OrderSort["DESC_NULLS_LAST"] = "DESC_NULLS_LAST";
})(OrderSort || (OrderSort = {}));
// Filter types: NOTE — flatbuffers version supports a reduced subset.
// We keep your full enum for typing, but the encoder only maps those
// present in SqlSchema.BasicSqlDataFilterType.
export var SQLDataFilterType;
(function (SQLDataFilterType) {
    SQLDataFilterType["equals"] = "equals";
    SQLDataFilterType["notEquals"] = "notEquals";
    SQLDataFilterType["lessThan"] = "lessThan";
    SQLDataFilterType["lessThanOrEquals"] = "lessThanOrEquals";
    SQLDataFilterType["greaterThan"] = "greaterThan";
    SQLDataFilterType["greaterThanOrEquals"] = "greaterThanOrEquals";
    SQLDataFilterType["isNull"] = "isNull";
    SQLDataFilterType["isNotNull"] = "isNotNull";
    SQLDataFilterType["regex"] = "regex";
    SQLDataFilterType["notRegex"] = "notRegex";
    SQLDataFilterType["startsWith"] = "startsWith";
    SQLDataFilterType["endsWith"] = "endsWith";
    SQLDataFilterType["contains"] = "contains";
    SQLDataFilterType["notContains"] = "notContains";
    SQLDataFilterType["arrayContains"] = "arrayContains";
    SQLDataFilterType["arrayContainedBy"] = "arrayContainedBy";
    SQLDataFilterType["arrayOverlaps"] = "arrayOverlaps";
    SQLDataFilterType["arrayEquals"] = "arrayEquals";
    SQLDataFilterType["arrayNotEquals"] = "arrayNotEquals";
    SQLDataFilterType["arrayEmpty"] = "arrayEmpty";
    SQLDataFilterType["arrayNotEmpty"] = "arrayNotEmpty";
    SQLDataFilterType["arrayLength"] = "arrayLength";
    SQLDataFilterType["jsonContains"] = "jsonContains";
    SQLDataFilterType["jsonContainedBy"] = "jsonContainedBy";
    SQLDataFilterType["jsonHasKey"] = "jsonHasKey";
    SQLDataFilterType["jsonHasAnyKey"] = "jsonHasAnyKey";
    SQLDataFilterType["jsonHasAllKeys"] = "jsonHasAllKeys";
    SQLDataFilterType["jsonGetField"] = "jsonGetField";
    SQLDataFilterType["jsonGetFieldAsText"] = "jsonGetFieldAsText";
    SQLDataFilterType["between"] = "between";
    SQLDataFilterType["notBetween"] = "notBetween";
    SQLDataFilterType["rangeContains"] = "rangeContains";
    SQLDataFilterType["rangeContainedBy"] = "rangeContainedBy";
    SQLDataFilterType["in_"] = "in";
    SQLDataFilterType["notIn"] = "notIn";
    // many more in your model — omitted since not supported by FB spec
})(SQLDataFilterType || (SQLDataFilterType = {}));
// ---- Table definition JSON (from your models/table_definition.ts) ----
export var ColumnConstraint;
(function (ColumnConstraint) {
    ColumnConstraint["primaryKey"] = "primaryKey";
    ColumnConstraint["unique"] = "unique";
    ColumnConstraint["notNull"] = "notNull";
    ColumnConstraint["check"] = "check";
    ColumnConstraint["default_"] = "default_";
    ColumnConstraint["indexed"] = "indexed";
    ColumnConstraint["exclusion"] = "exclusion";
    ColumnConstraint["generated"] = "generated";
    ColumnConstraint["identity"] = "identity";
    ColumnConstraint["references"] = "references";
    ColumnConstraint["noInherit"] = "noInherit";
    ColumnConstraint["nullsNotDistinct"] = "nullsNotDistinct";
})(ColumnConstraint || (ColumnConstraint = {}));
export var SQLDataType;
(function (SQLDataType) {
    SQLDataType["text"] = "text";
    SQLDataType["varchar"] = "varchar";
    SQLDataType["char"] = "char";
    SQLDataType["varcharArray"] = "varcharArray";
    SQLDataType["textArray"] = "textArray";
    SQLDataType["charArray"] = "charArray";
    SQLDataType["integer"] = "integer";
    SQLDataType["bigInt"] = "bigInt";
    SQLDataType["smallInt"] = "smallInt";
    SQLDataType["decimal"] = "decimal";
    SQLDataType["numeric"] = "numeric";
    SQLDataType["real"] = "real";
    SQLDataType["doublePrecision"] = "doublePrecision";
    SQLDataType["serial"] = "serial";
    SQLDataType["bigSerial"] = "bigSerial";
    SQLDataType["smallSerial"] = "smallSerial";
    SQLDataType["money"] = "money";
    SQLDataType["date"] = "date";
    SQLDataType["time"] = "time";
    SQLDataType["timestamp"] = "timestamp";
    SQLDataType["timestamptz"] = "timestamptz";
    SQLDataType["interval"] = "interval";
    SQLDataType["timetz"] = "timetz";
    SQLDataType["boolean"] = "boolean";
    SQLDataType["bytea"] = "bytea";
    SQLDataType["json"] = "json";
    SQLDataType["jsonb"] = "jsonb";
    SQLDataType["jsonArray"] = "jsonArray";
    SQLDataType["jsonbArray"] = "jsonbArray";
    SQLDataType["uuid"] = "uuid";
    SQLDataType["xml"] = "xml";
    SQLDataType["array"] = "array";
    SQLDataType["custom"] = "custom";
})(SQLDataType || (SQLDataType = {}));
