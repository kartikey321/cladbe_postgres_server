enum ColumnConstraint {
    primaryKey = 'primaryKey', // PRIMARY KEY
    unique = 'unique', // UNIQUE
    notNull = 'notNull', // NOT NULL
    check = 'check', // CHECK
    default_ = 'default_', // DEFAULT
    indexed = 'indexed', // CREATE INDEX
    exclusion = 'exclusion',
    generated = 'generated',
    identity = 'identity',
    references = 'references',
    noInherit = 'noInherit',
    nullsNotDistinct = 'nullsNotDistinct', // EXCLUDE
}

namespace ColumnConstraint {
    export function fromString(constraint: string): ColumnConstraint {
        return <ColumnConstraint>(
            Object.values(ColumnConstraint).find((e) => e === constraint) ||
            ColumnConstraint.primaryKey
        );
    }
}

enum SQLDataType {
    // Text Types
    text = 'text',
    varchar = 'varchar',
    char = 'char',
    varcharArray = 'varcharArray',
    textArray = 'textArray',
    charArray = 'charArray',

    // Numeric Types
    integer = 'integer',
    bigInt = 'bigInt',
    smallInt = 'smallInt',
    decimal = 'decimal',
    numeric = 'numeric',
    real = 'real',
    doublePrecision = 'doublePrecision',
    serial = 'serial',
    bigSerial = 'bigSerial',
    smallSerial = 'smallSerial',
    money = 'money',

    // Date/Time Types
    date = 'date',
    time = 'time',
    timestamp = 'timestamp',
    timestamptz = 'timestamptz',
    interval = 'interval',
    timetz = 'timetz',

    // Boolean Type
    boolean = 'boolean',

    // Binary Types
    bytea = 'bytea',

    // JSON Types
    json = 'json',
    jsonb = 'jsonb',
    jsonArray = 'jsonArray',
    jsonbArray = 'jsonbArray',

    // UUID Type
    uuid = 'uuid',

    // XML Type
    xml = 'xml',

    // Arrays (Generic)
    array = 'array',

    // Custom Types
    custom = 'custom',
}

namespace SQLDataType {
    export function fromString(type: string): SQLDataType {
        return <SQLDataType>Object.values(SQLDataType).find((e) => e === type) || SQLDataType.custom;
    }
}

export {ColumnConstraint, SQLDataType};