import type {Knex} from "knex";
import {
    BaseSqlDataFilter,
    NullsSortOrder,
    SqlDataFilter,
    SQLDataFilterType,
    SqlDataFilterWrapper,
    SQLFilterWrapperType
} from "../models/filters/filters";
import {
    AddSingleDbRequest,
    CreateTableDbRequest,
    DbRequest,
    FetchDbRequest,
    GetDataDbRequest,
    GetSingleRecordRequest,
    SchemaModifierRequest,
    UpdateSingleDbRequest
} from "../models/requests";
import {TableColumn, TableDefinition} from "../models/table_definition";
import {ColumnConstraint, SQLDataType} from "../models/enums";

// ---- Type Guards ----
function isWrapper(f: BaseSqlDataFilter): f is SqlDataFilterWrapper {
    return (
        typeof (f as SqlDataFilterWrapper).filters !== "undefined" &&
        Array.isArray((f as SqlDataFilterWrapper).filters)
    );
}

function isSingleFilter(f: BaseSqlDataFilter): f is SqlDataFilter {
    return typeof (f as SqlDataFilter).fieldName === "string";
}

// ---- Helpers ----
function isValidColumnName(name: string): boolean {
    // Basic whitelist pattern (letters, numbers, underscore, dot for table.field)
    return /^[a-zA-Z0-9_.]+$/.test(name);
}

function ensureValidColumn(name: string): string {
    if (!isValidColumnName(name)) {
        throw new Error(`Invalid column name: ${name}`);
    }
    return name;
}

// ---- QueryProcessor ----
export class QueryProcessor {
    private readonly knex: Knex;

    constructor(knexInstance: Knex) {
        this.knex = knexInstance;
    }

    createTable(request: TableDefinition): Knex.SchemaBuilder {
        return this.knex.schema.createTable(request.name, (table) => {
            // Define columns
            request.columns.forEach((column: TableColumn) => {
                let columnDefinition: Knex.ColumnBuilder;

                // Map SQLDataType to Knex column types
                switch (column.dataType) {
                    case SQLDataType.text:
                        columnDefinition = table.text(column.name);
                        break;
                    case SQLDataType.varchar:
                        columnDefinition = table.string(column.name);
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
                        columnDefinition = table.decimal(column.name);
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

                // Apply constraints
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
                                columnDefinition.defaultTo(column.customOptions.defaultValue);
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

                // Apply nullable
                if (column.isNullable && !column.constraints.includes(ColumnConstraint.notNull)) {
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
    public processFilters<TRecord extends {}, TResult>(
        qb: Knex.QueryBuilder<TRecord, TResult>,
        filters: BaseSqlDataFilter[]
    ): Knex.QueryBuilder<TRecord, TResult> {
        const knex = this.knex;

        filters.forEach((filter) => {
            if (isWrapper(filter)) {
                if (!filter.filters?.length) return; // skip empty wrapper

                if (filter.filterWrapperType === SQLFilterWrapperType.and) {
                    qb.where(function () {
                        QueryProcessor.applyFiltersRecursive(this, filter.filters, knex);
                    });
                } else if (filter.filterWrapperType === SQLFilterWrapperType.or) {
                    qb.orWhere(function () {
                        QueryProcessor.applyFiltersRecursive(this, filter.filters, knex);
                    });
                }
            } else if (isSingleFilter(filter)) {
                this.applySingleFilter(qb, filter);
            } else {
                throw new Error(`Unknown filter type: ${JSON.stringify(filter)}`);
            }
        });

        return qb;
    }

    private static applyFiltersRecursive<TRecord extends {}, TResult>(
        qb: Knex.QueryBuilder<TRecord, TResult>,
        filters: BaseSqlDataFilter[],
        knex: Knex
    ) {
        if (!filters?.length) return;
        const processor = new QueryProcessor(knex);
        processor.processFilters(qb, filters);
    }

    /**
     * Apply a single filter
     */
    private applySingleFilter<TRecord extends {}, TResult>(
        qb: Knex.QueryBuilder<TRecord, TResult>,
        filter: SqlDataFilter
    ) {
        const {fieldName, value, filterType, modifier} = filter;

        const safeField = ensureValidColumn(fieldName);
        const col = modifier?.caseInSensitive
            ? this.knex.raw("LOWER(??)", [safeField])
            : this.knex.raw("??", [safeField]);

        switch (filterType) {
            case SQLDataFilterType.equals:
                modifier?.caseInSensitive
                    ? qb.whereRaw("LOWER(??) = LOWER(?)", [safeField, value])
                    : qb.where(safeField, value);
                break;
            case SQLDataFilterType.notEquals:
                qb.whereNot(safeField, value);
                break;
            case SQLDataFilterType.isNull:
                qb.whereNull(safeField);
                break;
            case SQLDataFilterType.isNotNull:
                qb.whereNotNull(safeField);
                break;
            case SQLDataFilterType.startsWith:
                qb.where(col, "like", `${value}%`);
                break;
            case SQLDataFilterType.endsWith:
                qb.where(col, "like", `%${value}`);
                break;
            case SQLDataFilterType.contains:
                qb.where(col, "like", `%${value}%`);
                break;
            case SQLDataFilterType.in_:
                if (!Array.isArray(value) || value.length === 0) {
                    qb.whereRaw("1 = 0"); // never match
                } else {
                    qb.whereIn(safeField, value);
                }
                break;
            case SQLDataFilterType.notIn:
                if (!Array.isArray(value) || value.length === 0) {
                    qb.whereRaw("1 = 1"); // always match
                } else {
                    qb.whereNotIn(safeField, value);
                }
                break;
            case SQLDataFilterType.regex:
            case SQLDataFilterType.notRegex:
                // PostgreSQL-specific operators
                const op = filterType === SQLDataFilterType.regex ? "~" : "!~";
                qb.whereRaw(`?? ${op} ?`, [safeField, value]);
                break;
            case SQLDataFilterType.between:
            case SQLDataFilterType.notBetween:
                if (!Array.isArray(value) || value.length !== 2) {
                    throw new Error(`Between filter requires exactly two values for ${safeField}`);
                }

                const tupleValue = [value[0], value[1]] as [any, any]; // now TS sees it as tuple

                if (filterType === SQLDataFilterType.between) {
                    qb.whereBetween(safeField as string, tupleValue);
                } else {
                    qb.whereNotBetween(safeField as string, tupleValue);
                }
                break;
            default:
                throw new Error(`Unsupported filter type: ${filterType}`);
        }
    }

    /**
     * Build a query for a given request
     */


    // Method overload signatures
    public buildQuery<TRecord extends {}, TResult>(
        request: DbRequest
    ): Knex.QueryBuilder<TRecord, TResult>;

    public buildQuery<TRecord extends {}, TResult>(
        request: FetchDbRequest
    ): Knex.QueryBuilder<TRecord, TResult[]>;

    // Implementation signature (must be compatible with all overloads)
    public buildQuery<TRecord extends {}, TResult>(
        request: DbRequest | FetchDbRequest
    ): Knex.QueryBuilder<TRecord, any> {
        const safeTable = ensureValidColumn(request.tableName);
        let query = this.knex<TRecord, any>(safeTable);

        // Type guard to check if it's a FetchDbRequest
        if (request instanceof GetDataDbRequest) {
            if (request.filters?.length) {
                query = this.processFilters(query, request.filters);
            }
            if (request.limit != null) {
                query = query.limit(request.limit);
            }
            if (request.offset != null) {
                query = query.offset(request.offset);
            }
        } else if (request instanceof GetSingleRecordRequest) {
            query = this.processFilters(query, [
                {
                    fieldName: request.primaryKeyColumn,
                    value: request.primaryId,
                    filterType: SQLDataFilterType.equals,
                    modifier: {
                        distinct: true,
                        caseInSensitive: false,
                        nullsOrder: NullsSortOrder.default_,
                    }

                } as SqlDataFilter
            ]);
        } else if (request instanceof AddSingleDbRequest) {
            query = this.knex(safeTable).insert({
                ...request.data,
                [`${request.primaryKeyColumn}`]: request.data[request.primaryKeyColumn],
            });
        } else if (request instanceof UpdateSingleDbRequest) {
            query = this.knex(safeTable).where({[`${request.primaryKeyColumn}`]: request.primaryId}).update(
                request.updates
            );
        }

        return query;
    }

    public buildSchemaModifierQuery(request: SchemaModifierRequest): Knex.SchemaBuilder {
        let query: Knex.SchemaBuilder | undefined = undefined;
        if (request instanceof CreateTableDbRequest) {
            query = this.createTable(request.tableDefinition);
        }
        if (query)
            return query;
        else throw Error('Unsupported query');
    }
}
