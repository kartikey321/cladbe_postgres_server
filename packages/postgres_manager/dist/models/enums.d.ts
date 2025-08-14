declare enum ColumnConstraint {
    primaryKey = "primaryKey",// PRIMARY KEY
    unique = "unique",// UNIQUE
    notNull = "notNull",// NOT NULL
    check = "check",// CHECK
    default_ = "default_",// DEFAULT
    indexed = "indexed",// CREATE INDEX
    exclusion = "exclusion",
    generated = "generated",
    identity = "identity",
    references = "references",
    noInherit = "noInherit",
    nullsNotDistinct = "nullsNotDistinct"
}
declare namespace ColumnConstraint {
    function fromString(constraint: string): ColumnConstraint;
}
declare enum SQLDataType {
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
declare namespace SQLDataType {
    function fromString(type: string): SQLDataType;
}
export { ColumnConstraint, SQLDataType };
//# sourceMappingURL=enums.d.ts.map