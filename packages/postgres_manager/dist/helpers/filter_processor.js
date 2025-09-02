"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFilters = processFilters;
const filters_1 = require("../models/filters/filters");
const utils_1 = require("./utils");
function isWrapper(f) {
    return (typeof f.filters !== "undefined" &&
        Array.isArray(f.filters));
}
function isSingleFilter(f) {
    return typeof f.fieldName === "string";
}
function processFilters(qb, filters, knex) {
    filters.forEach((filter) => {
        if (isWrapper(filter)) {
            if (!filter.filters?.length)
                return;
            if (filter.filterWrapperType === filters_1.SQLFilterWrapperType.and) {
                qb.where(function () {
                    applyFiltersRecursive(this, filter.filters, knex);
                });
            }
            else if (filter.filterWrapperType === filters_1.SQLFilterWrapperType.or) {
                qb.orWhere(function () {
                    applyFiltersRecursive(this, filter.filters, knex);
                });
            }
        }
        else if (isSingleFilter(filter)) {
            applySingleFilter(qb, filter, knex);
        }
        else {
            throw new Error(`Unknown filter type: ${JSON.stringify(filter)}`);
        }
    });
    return qb;
}
function applyFiltersRecursive(qb, filters, knex) {
    if (!filters?.length)
        return;
    processFilters(qb, filters, knex);
}
function applySingleFilter(qb, filter, knex) {
    const { fieldName, value, filterType, modifier } = filter;
    const safeField = (0, utils_1.ensureValidColumn)(fieldName);
    const col = modifier?.caseInSensitive
        ? knex.raw("LOWER(??)", [safeField])
        : knex.raw("??", [safeField]);
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
                qb.whereRaw("1 = 0");
            }
            else {
                qb.whereIn(safeField, value);
            }
            break;
        case filters_1.SQLDataFilterType.notIn:
            if (!Array.isArray(value) || value.length === 0) {
                qb.whereRaw("1 = 1");
            }
            else {
                qb.whereNotIn(safeField, value);
            }
            break;
        case filters_1.SQLDataFilterType.regex:
        case filters_1.SQLDataFilterType.notRegex:
            const op = filterType === filters_1.SQLDataFilterType.regex ? "~" : "!~";
            qb.whereRaw(`?? ${op} ?`, [safeField, value]);
            break;
        case filters_1.SQLDataFilterType.between:
        case filters_1.SQLDataFilterType.notBetween:
            if (!Array.isArray(value) || value.length !== 2) {
                throw new Error(`Between filter requires exactly two values for ${safeField}`);
            }
            const tupleValue = [value[0], value[1]];
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
