"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTable = createTable;
const enums_1 = require("../models/enums");
function createTable(knex, request) {
    return knex.schema.createTable(request.name, (table) => {
        request.columns.forEach((column) => {
            let columnDefinition;
            switch (column.dataType) {
                case enums_1.SQLDataType.text:
                    columnDefinition = table.text(column.name);
                    break;
                case enums_1.SQLDataType.varchar:
                    columnDefinition = table.string(column.name, column.customOptions?.length || 255);
                    break;
                case enums_1.SQLDataType.char:
                    columnDefinition = table.specificType(column.name, 'char');
                    break;
                case enums_1.SQLDataType.varcharArray:
                    columnDefinition = table.specificType(column.name, 'varchar[]');
                    break;
                case enums_1.SQLDataType.textArray:
                    columnDefinition = table.specificType(column.name, 'text[]');
                    break;
                case enums_1.SQLDataType.charArray:
                    columnDefinition = table.specificType(column.name, 'char[]');
                    break;
                case enums_1.SQLDataType.integer:
                    columnDefinition = table.integer(column.name);
                    break;
                case enums_1.SQLDataType.bigInt:
                    columnDefinition = table.bigInteger(column.name);
                    break;
                case enums_1.SQLDataType.smallInt:
                    columnDefinition = table.smallint(column.name);
                    break;
                case enums_1.SQLDataType.decimal:
                    columnDefinition = table.decimal(column.name, 8, 2);
                    break;
                case enums_1.SQLDataType.numeric:
                    columnDefinition = table.specificType(column.name, 'numeric');
                    break;
                case enums_1.SQLDataType.real:
                    columnDefinition = table.float(column.name);
                    break;
                case enums_1.SQLDataType.doublePrecision:
                    columnDefinition = table.double(column.name);
                    break;
                case enums_1.SQLDataType.serial:
                    columnDefinition = table.increments(column.name);
                    break;
                case enums_1.SQLDataType.bigSerial:
                    columnDefinition = table.bigIncrements(column.name);
                    break;
                case enums_1.SQLDataType.smallSerial:
                    columnDefinition = table.specificType(column.name, 'smallserial');
                    break;
                case enums_1.SQLDataType.money:
                    columnDefinition = table.specificType(column.name, 'money');
                    break;
                case enums_1.SQLDataType.date:
                    columnDefinition = table.date(column.name);
                    break;
                case enums_1.SQLDataType.time:
                    columnDefinition = table.time(column.name);
                    break;
                case enums_1.SQLDataType.timestamp:
                    columnDefinition = table.timestamp(column.name);
                    break;
                case enums_1.SQLDataType.timestamptz:
                    columnDefinition = table.specificType(column.name, 'timestamptz');
                    break;
                case enums_1.SQLDataType.interval:
                    columnDefinition = table.specificType(column.name, 'interval');
                    break;
                case enums_1.SQLDataType.timetz:
                    columnDefinition = table.specificType(column.name, 'timetz');
                    break;
                case enums_1.SQLDataType.boolean:
                    columnDefinition = table.boolean(column.name);
                    break;
                case enums_1.SQLDataType.bytea:
                    columnDefinition = table.specificType(column.name, 'bytea');
                    break;
                case enums_1.SQLDataType.json:
                    columnDefinition = table.json(column.name);
                    break;
                case enums_1.SQLDataType.jsonb:
                    columnDefinition = table.jsonb(column.name);
                    break;
                case enums_1.SQLDataType.jsonArray:
                    columnDefinition = table.specificType(column.name, 'json[]');
                    break;
                case enums_1.SQLDataType.jsonbArray:
                    columnDefinition = table.specificType(column.name, 'jsonb[]');
                    break;
                case enums_1.SQLDataType.uuid:
                    columnDefinition = table.uuid(column.name);
                    break;
                case enums_1.SQLDataType.xml:
                    columnDefinition = table.specificType(column.name, 'xml');
                    break;
                case enums_1.SQLDataType.array:
                    columnDefinition = table.specificType(column.name, 'text[]');
                    break;
                case enums_1.SQLDataType.custom:
                    columnDefinition = table.specificType(column.name, column.customOptions?.type || 'text');
                    break;
                default:
                    columnDefinition = table.text(column.name);
            }
            column.constraints.forEach((constraint) => {
                switch (constraint) {
                    case enums_1.ColumnConstraint.primaryKey:
                        columnDefinition.primary();
                        break;
                    case enums_1.ColumnConstraint.unique:
                        columnDefinition.unique();
                        break;
                    case enums_1.ColumnConstraint.notNull:
                        columnDefinition.notNullable();
                        break;
                    case enums_1.ColumnConstraint.default_:
                        if (column.customOptions?.defaultValue) {
                            if (column.dataType === enums_1.SQLDataType.timestamptz && column.customOptions.defaultValue === 'CURRENT_TIMESTAMP') {
                                columnDefinition.defaultTo(knex.raw('CURRENT_TIMESTAMP'));
                            }
                            else {
                                columnDefinition.defaultTo(column.customOptions.defaultValue);
                            }
                        }
                        break;
                    case enums_1.ColumnConstraint.references:
                        if (column.customOptions?.foreignKey) {
                            const { table: refTable, column: refColumn } = column.customOptions.foreignKey;
                            columnDefinition.references(refColumn).inTable(refTable);
                        }
                        break;
                    case enums_1.ColumnConstraint.indexed:
                        columnDefinition.index();
                        break;
                }
            });
            if (column.isNullable && !column.constraints.includes(enums_1.ColumnConstraint.notNull)) {
                columnDefinition.nullable();
            }
        });
        if (request.comment) {
            table.comment(request.comment);
        }
        if (request.tableOptions) {
            Object.entries(request.tableOptions).forEach(([key, value]) => {
                if (key.toLowerCase() === 'engine') {
                    table.engine(value);
                }
            });
        }
    });
}
