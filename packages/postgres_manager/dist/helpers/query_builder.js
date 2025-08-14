"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryProcessor = void 0;
const filters_1 = require("../models/filters/filters");
const requests_1 = require("../models/requests");
const enums_1 = require("../models/enums");
// ---- Type Guards ----
function isWrapper(f) {
    return (typeof f.filters !== "undefined" &&
        Array.isArray(f.filters));
}
function isSingleFilter(f) {
    return typeof f.fieldName === "string";
}
// ---- Helpers ----
function isValidColumnName(name) {
    // Basic whitelist pattern (letters, numbers, underscore, dot for table.field)
    return /^[a-zA-Z0-9_.]+$/.test(name);
}
function ensureValidColumn(name) {
    if (!isValidColumnName(name)) {
        throw new Error(`Invalid column name: ${name}`);
    }
    return name;
}
// ---- QueryProcessor ----
class QueryProcessor {
    knex;
    constructor(knexInstance) {
        this.knex = knexInstance;
    }
    createTable(request) {
        return this.knex.schema.createTable(request.name, (table) => {
            // Define columns
            request.columns.forEach((column) => {
                let columnDefinition;
                // Map SQLDataType to Knex column types
                switch (column.dataType) {
                    case enums_1.SQLDataType.text:
                        columnDefinition = table.text(column.name);
                        break;
                    case enums_1.SQLDataType.varchar:
                        columnDefinition = table.string(column.name);
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
                        columnDefinition = table.decimal(column.name);
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
                // Apply constraints
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
                                columnDefinition.defaultTo(column.customOptions.defaultValue);
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
                // Apply nullable
                if (column.isNullable && !column.constraints.includes(enums_1.ColumnConstraint.notNull)) {
                    columnDefinition.nullable();
                }
            });
            // Apply table comment
            if (request.comment) {
                table.comment(request.comment);
            }
            // Apply table options (e.g., engine, charset)
            if (request.tableOptions) {
                Object.entries(request.tableOptions).forEach(([key, value]) => {
                    if (key.toLowerCase() === 'engine') {
                        table.engine(value);
                    }
                    // Add more table options as needed (e.g., charset, collation)
                });
            }
        });
    }
    /**
     * Apply all filters recursively to a query
     */
    processFilters(qb, filters) {
        const knex = this.knex;
        filters.forEach((filter) => {
            if (isWrapper(filter)) {
                if (!filter.filters?.length)
                    return; // skip empty wrapper
                if (filter.filterWrapperType === filters_1.SQLFilterWrapperType.and) {
                    qb.where(function () {
                        QueryProcessor.applyFiltersRecursive(this, filter.filters, knex);
                    });
                }
                else if (filter.filterWrapperType === filters_1.SQLFilterWrapperType.or) {
                    qb.orWhere(function () {
                        QueryProcessor.applyFiltersRecursive(this, filter.filters, knex);
                    });
                }
            }
            else if (isSingleFilter(filter)) {
                this.applySingleFilter(qb, filter);
            }
            else {
                throw new Error(`Unknown filter type: ${JSON.stringify(filter)}`);
            }
        });
        return qb;
    }
    static applyFiltersRecursive(qb, filters, knex) {
        if (!filters?.length)
            return;
        const processor = new QueryProcessor(knex);
        processor.processFilters(qb, filters);
    }
    /**
     * Apply a single filter
     */
    applySingleFilter(qb, filter) {
        const { fieldName, value, filterType, modifier } = filter;
        const safeField = ensureValidColumn(fieldName);
        const col = modifier?.caseInSensitive
            ? this.knex.raw("LOWER(??)", [safeField])
            : this.knex.raw("??", [safeField]);
        switch (filterType) {
            case filters_1.SQLDataFilterType.equals:
                modifier?.caseInSensitive
                    ? qb.whereRaw("LOWER(??) = LOWER(?)", [safeField, value])
                    : qb.where(safeField, value);
                break;
            case filters_1.SQLDataFilterType.notEquals:
                qb.whereNot(safeField, value);
                break;
            case filters_1.SQLDataFilterType.isNull:
                qb.whereNull(safeField);
                break;
            case filters_1.SQLDataFilterType.isNotNull:
                qb.whereNotNull(safeField);
                break;
            case filters_1.SQLDataFilterType.startsWith:
                qb.where(col, "like", `${value}%`);
                break;
            case filters_1.SQLDataFilterType.endsWith:
                qb.where(col, "like", `%${value}`);
                break;
            case filters_1.SQLDataFilterType.contains:
                qb.where(col, "like", `%${value}%`);
                break;
            case filters_1.SQLDataFilterType.in_:
                if (!Array.isArray(value) || value.length === 0) {
                    qb.whereRaw("1 = 0"); // never match
                }
                else {
                    qb.whereIn(safeField, value);
                }
                break;
            case filters_1.SQLDataFilterType.notIn:
                if (!Array.isArray(value) || value.length === 0) {
                    qb.whereRaw("1 = 1"); // always match
                }
                else {
                    qb.whereNotIn(safeField, value);
                }
                break;
            case filters_1.SQLDataFilterType.regex:
            case filters_1.SQLDataFilterType.notRegex:
                // PostgreSQL-specific operators
                const op = filterType === filters_1.SQLDataFilterType.regex ? "~" : "!~";
                qb.whereRaw(`?? ${op} ?`, [safeField, value]);
                break;
            case filters_1.SQLDataFilterType.between:
            case filters_1.SQLDataFilterType.notBetween:
                if (!Array.isArray(value) || value.length !== 2) {
                    throw new Error(`Between filter requires exactly two values for ${safeField}`);
                }
                const tupleValue = [value[0], value[1]]; // now TS sees it as tuple
                if (filterType === filters_1.SQLDataFilterType.between) {
                    qb.whereBetween(safeField, tupleValue);
                }
                else {
                    qb.whereNotBetween(safeField, tupleValue);
                }
                break;
            default:
                throw new Error(`Unsupported filter type: ${filterType}`);
        }
    }
    // Implementation signature (must be compatible with all overloads)
    buildQuery(request) {
        const safeTable = ensureValidColumn(request.tableName);
        let query = this.knex(safeTable);
        // Type guard to check if it's a FetchDbRequest
        if (request instanceof requests_1.GetDataDbRequest) {
            if (request.filters?.length) {
                query = this.processFilters(query, request.filters);
            }
            if (request.limit != null) {
                query = query.limit(request.limit);
            }
            if (request.offset != null) {
                query = query.offset(request.offset);
            }
        }
        else if (request instanceof requests_1.GetSingleRecordRequest) {
            query = this.processFilters(query, [
                {
                    fieldName: request.primaryKeyColumn,
                    value: request.primaryId,
                    filterType: filters_1.SQLDataFilterType.equals,
                    modifier: {
                        distinct: true,
                        caseInSensitive: false,
                        nullsOrder: filters_1.NullsSortOrder.default_,
                    }
                }
            ]);
        }
        else if (request instanceof requests_1.AddSingleDbRequest) {
            query = this.knex(safeTable).insert({
                ...request.data,
                [`${request.primaryKeyColumn}`]: request.data[request.primaryKeyColumn],
            });
        }
        else if (request instanceof requests_1.UpdateSingleDbRequest) {
            query = this.knex(safeTable).where({ [`${request.primaryKeyColumn}`]: request.primaryId }).update(request.updates);
        }
        return query;
    }
    buildSchemaModifierQuery(request) {
        let query = undefined;
        if (request instanceof requests_1.CreateTableDbRequest) {
            query = this.createTable(request.tableDefinition);
        }
        if (query)
            return query;
        else
            throw Error('Unsupported query');
    }
}
exports.QueryProcessor = QueryProcessor;
