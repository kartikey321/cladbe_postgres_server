import type {Knex} from "knex";
import {TableDefinition, TableColumn} from "../models/table_definition";
import {ColumnConstraint, SQLDataType} from "../models/enums";

export function createTable(knex: Knex, request: TableDefinition): Knex.SchemaBuilder {
    return knex.schema.createTable(request.name, (table) => {
        request.columns.forEach((column: TableColumn) => {
            let columnDefinition: Knex.ColumnBuilder;

            switch (column.dataType) {
                case SQLDataType.text:
                    columnDefinition = table.text(column.name);
                    break;
                case SQLDataType.varchar:
                    columnDefinition = table.string(column.name, column.customOptions?.length || 255);
                    break;
                case SQLDataType.char:
                    columnDefinition = table.specificType(column.name, 'char');
                    break;
                case SQLDataType.varcharArray:
                    columnDefinition = table.specificType(column.name, 'varchar[]');
                    break;
                case SQLDataType.textArray:
                    columnDefinition = table.specificType(column.name, 'text[]');
                    break;
                case SQLDataType.charArray:
                    columnDefinition = table.specificType(column.name, 'char[]');
                    break;
                case SQLDataType.integer:
                    columnDefinition = table.integer(column.name);
                    break;
                case SQLDataType.bigInt:
                    columnDefinition = table.bigInteger(column.name);
                    break;
                case SQLDataType.smallInt:
                    columnDefinition = table.smallint(column.name);
                    break;
                case SQLDataType.decimal:
                    columnDefinition = table.decimal(column.name, 8, 2);
                    break;
                case SQLDataType.numeric:
                    columnDefinition = table.specificType(column.name, 'numeric');
                    break;
                case SQLDataType.real:
                    columnDefinition = table.float(column.name);
                    break;
                case SQLDataType.doublePrecision:
                    columnDefinition = table.double(column.name);
                    break;
                case SQLDataType.serial:
                    columnDefinition = table.increments(column.name);
                    break;
                case SQLDataType.bigSerial:
                    columnDefinition = table.bigIncrements(column.name);
                    break;
                case SQLDataType.smallSerial:
                    columnDefinition = table.specificType(column.name, 'smallserial');
                    break;
                case SQLDataType.money:
                    columnDefinition = table.specificType(column.name, 'money');
                    break;
                case SQLDataType.date:
                    columnDefinition = table.date(column.name);
                    break;
                case SQLDataType.time:
                    columnDefinition = table.time(column.name);
                    break;
                case SQLDataType.timestamp:
                    columnDefinition = table.timestamp(column.name);
                    break;
                case SQLDataType.timestamptz:
                    columnDefinition = table.specificType(column.name, 'timestamptz');
                    break;
                case SQLDataType.interval:
                    columnDefinition = table.specificType(column.name, 'interval');
                    break;
                case SQLDataType.timetz:
                    columnDefinition = table.specificType(column.name, 'timetz');
                    break;
                case SQLDataType.boolean:
                    columnDefinition = table.boolean(column.name);
                    break;
                case SQLDataType.bytea:
                    columnDefinition = table.specificType(column.name, 'bytea');
                    break;
                case SQLDataType.json:
                    columnDefinition = table.json(column.name);
                    break;
                case SQLDataType.jsonb:
                    columnDefinition = table.jsonb(column.name);
                    break;
                case SQLDataType.jsonArray:
                    columnDefinition = table.specificType(column.name, 'json[]');
                    break;
                case SQLDataType.jsonbArray:
                    columnDefinition = table.specificType(column.name, 'jsonb[]');
                    break;
                case SQLDataType.uuid:
                    columnDefinition = table.uuid(column.name);
                    break;
                case SQLDataType.xml:
                    columnDefinition = table.specificType(column.name, 'xml');
                    break;
                case SQLDataType.array:
                    columnDefinition = table.specificType(column.name, 'text[]');
                    break;
                case SQLDataType.custom:
                    columnDefinition = table.specificType(column.name, column.customOptions?.type || 'text');
                    break;
                default:
                    columnDefinition = table.text(column.name);
            }

            column.constraints.forEach((constraint) => {
                switch (constraint) {
                    case ColumnConstraint.primaryKey:
                        columnDefinition.primary();
                        break;
                    case ColumnConstraint.unique:
                        columnDefinition.unique();
                        break;
                    case ColumnConstraint.notNull:
                        columnDefinition.notNullable();
                        break;
                    case ColumnConstraint.default_:
                        if (column.customOptions?.defaultValue) {
                            if (column.dataType === SQLDataType.timestamptz && column.customOptions.defaultValue === 'CURRENT_TIMESTAMP') {
                                columnDefinition.defaultTo(knex.raw('CURRENT_TIMESTAMP'));
                            } else {
                                columnDefinition.defaultTo(column.customOptions.defaultValue);
                            }
                        }
                        break;
                    case ColumnConstraint.references:
                        if (column.customOptions?.foreignKey) {
                            const {table: refTable, column: refColumn} = column.customOptions.foreignKey;
                            columnDefinition.references(refColumn).inTable(refTable);
                        }
                        break;
                    case ColumnConstraint.indexed:
                        columnDefinition.index();
                        break;
                }
            });

            if (column.isNullable && !column.constraints.includes(ColumnConstraint.notNull)) {
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