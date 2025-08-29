import type {Knex} from "knex";
import {
    BaseSqlDataFilter,
    SqlDataFilterWrapper,
    SqlDataFilter,
    SQLFilterWrapperType,
    SQLDataFilterType,
    SqlFilterModifier,
    NullsSortOrder
} from "../models/filters/filters";
import {ensureValidColumn} from "./utils";

function isWrapper(f: BaseSqlDataFilter): f is SqlDataFilterWrapper {
    return (
        typeof (f as SqlDataFilterWrapper).filters !== "undefined" &&
        Array.isArray((f as SqlDataFilterWrapper).filters)
    );
}

function isSingleFilter(f: BaseSqlDataFilter): f is SqlDataFilter {
    return typeof (f as SqlDataFilter).fieldName === "string";
}

export function processFilters<TRecord extends {}, TResult>(
    qb: Knex.QueryBuilder<TRecord, TResult>,
    filters: BaseSqlDataFilter[],
    knex: Knex
): Knex.QueryBuilder<TRecord, TResult> {
    filters.forEach((filter) => {
        if (isWrapper(filter)) {
            if (!filter.filters?.length) return;

            if (filter.filterWrapperType === SQLFilterWrapperType.and) {
                qb.where(function () {
                    applyFiltersRecursive(this, filter.filters, knex);
                });
            } else if (filter.filterWrapperType === SQLFilterWrapperType.or) {
                qb.orWhere(function () {
                    applyFiltersRecursive(this, filter.filters, knex);
                });
            }
        } else if (isSingleFilter(filter)) {
            applySingleFilter(qb, filter, knex);
        } else {
            throw new Error(`Unknown filter type: ${JSON.stringify(filter)}`);
        }
    });

    return qb;
}

function applyFiltersRecursive<TRecord extends {}, TResult>(
    qb: Knex.QueryBuilder<TRecord, TResult>,
    filters: BaseSqlDataFilter[],
    knex: Knex
) {
    if (!filters?.length) return;
    processFilters(qb, filters, knex);
}

function applySingleFilter<TRecord extends {}, TResult>(
    qb: Knex.QueryBuilder<TRecord, TResult>,
    filter: SqlDataFilter,
    knex: Knex
) {
    const {fieldName, value, filterType, modifier} = filter;

    const safeField = ensureValidColumn(fieldName);
    const col = modifier?.caseInSensitive
        ? knex.raw("LOWER(??)", [safeField])
        : knex.raw("??", [safeField]);

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
                qb.whereRaw("1 = 0");
            } else {
                qb.whereIn(safeField, value);
            }
            break;
        case SQLDataFilterType.notIn:
            if (!Array.isArray(value) || value.length === 0) {
                qb.whereRaw("1 = 1");
            } else {
                qb.whereNotIn(safeField, value);
            }
            break;
        case SQLDataFilterType.regex:
        case SQLDataFilterType.notRegex:
            const op = filterType === SQLDataFilterType.regex ? "~" : "!~";
            qb.whereRaw(`?? ${op} ?`, [safeField, value]);
            break;
        case SQLDataFilterType.between:
        case SQLDataFilterType.notBetween:
            if (!Array.isArray(value) || value.length !== 2) {
                throw new Error(`Between filter requires exactly two values for ${safeField}`);
            }
            const tupleValue = [value[0], value[1]] as [any, any];
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