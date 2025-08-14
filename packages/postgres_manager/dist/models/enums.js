"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLDataType = exports.ColumnConstraint = void 0;
var ColumnConstraint;
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
})(ColumnConstraint || (exports.ColumnConstraint = ColumnConstraint = {}));
(function (ColumnConstraint) {
    function fromString(constraint) {
        return (Object.values(ColumnConstraint).find((e) => e === constraint) ||
            ColumnConstraint.primaryKey);
    }
    ColumnConstraint.fromString = fromString;
})(ColumnConstraint || (exports.ColumnConstraint = ColumnConstraint = {}));
var SQLDataType;
(function (SQLDataType) {
    // Text Types
    SQLDataType["text"] = "text";
    SQLDataType["varchar"] = "varchar";
    SQLDataType["char"] = "char";
    SQLDataType["varcharArray"] = "varcharArray";
    SQLDataType["textArray"] = "textArray";
    SQLDataType["charArray"] = "charArray";
    // Numeric Types
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
    // Date/Time Types
    SQLDataType["date"] = "date";
    SQLDataType["time"] = "time";
    SQLDataType["timestamp"] = "timestamp";
    SQLDataType["timestamptz"] = "timestamptz";
    SQLDataType["interval"] = "interval";
    SQLDataType["timetz"] = "timetz";
    // Boolean Type
    SQLDataType["boolean"] = "boolean";
    // Binary Types
    SQLDataType["bytea"] = "bytea";
    // JSON Types
    SQLDataType["json"] = "json";
    SQLDataType["jsonb"] = "jsonb";
    SQLDataType["jsonArray"] = "jsonArray";
    SQLDataType["jsonbArray"] = "jsonbArray";
    // UUID Type
    SQLDataType["uuid"] = "uuid";
    // XML Type
    SQLDataType["xml"] = "xml";
    // Arrays (Generic)
    SQLDataType["array"] = "array";
    // Custom Types
    SQLDataType["custom"] = "custom";
})(SQLDataType || (exports.SQLDataType = SQLDataType = {}));
(function (SQLDataType) {
    function fromString(type) {
        return Object.values(SQLDataType).find((e) => e === type) || SQLDataType.custom;
    }
    SQLDataType.fromString = fromString;
})(SQLDataType || (exports.SQLDataType = SQLDataType = {}));
