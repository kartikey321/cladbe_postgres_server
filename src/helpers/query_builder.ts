import type {Knex} from "knex";
import {
    BaseSqlDataFilter,
    DbRequest,
    FetchDbRequest,
    SqlDataFilter,
    SQLDataFilterType,
    SqlDataFilterWrapper,
    SQLFilterWrapperType
} from "../models/filters/filters";

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
    ): Knex.QueryBuilder<TRecord, TResult | TResult[]> {
        const safeTable = ensureValidColumn(request.tableName);
        let query = this.knex<TRecord, TResult | TResult[]>(safeTable);

        // Type guard to check if it's a FetchDbRequest
        if ('filters' in request || 'limit' in request || 'offset' in request) {

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

        return query;
    }
}
