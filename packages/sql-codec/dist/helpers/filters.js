import { SqlSchema as sc } from "@cladbe/sql-protocol";
import { encodeFilterValue } from "./values.js";
import { mapFilterType, mapNullsSortOrder, mapWrapperType } from "./enums.js";
// Type guards
export function isWrapper(f) {
    return f.filters !== undefined;
}
function isSingle(f) {
    return f.fieldName !== undefined;
}
function encodeModifier(b, m) {
    if (!m)
        return 0;
    sc.SqlSchema.SqlFilterModifier.startSqlFilterModifier(b);
    sc.SqlSchema.SqlFilterModifier.addDistinct(b, !!m.distinct);
    sc.SqlSchema.SqlFilterModifier.addCaseInsensitive(b, !!m.caseInSensitive);
    sc.SqlSchema.SqlFilterModifier.addNullsOrder(b, mapNullsSortOrder(m.nullsOrder));
    return sc.SqlSchema.SqlFilterModifier.endSqlFilterModifier(b);
}
function encodeSingleFilter(b, f) {
    const field = b.createString(f.fieldName);
    const { type, off } = encodeFilterValue(b, f.value);
    const modOff = encodeModifier(b, f.modifier);
    sc.SqlSchema.BasicSqlDataFilter.startBasicSqlDataFilter(b);
    sc.SqlSchema.BasicSqlDataFilter.addFieldName(b, field);
    sc.SqlSchema.BasicSqlDataFilter.addValueType(b, type);
    sc.SqlSchema.BasicSqlDataFilter.addValue(b, off);
    sc.SqlSchema.BasicSqlDataFilter.addFilterType(b, mapFilterType(f.filterType));
    if (modOff)
        sc.SqlSchema.BasicSqlDataFilter.addModifier(b, modOff);
    return sc.SqlSchema.BasicSqlDataFilter.endBasicSqlDataFilter(b);
}
export function encodeWrapper(b, w) {
    const filterOffsets = [];
    for (const node of w.filters) {
        if (isWrapper(node)) {
            const wrapOff = encodeWrapper(b, node);
            filterOffsets.push(wrapOff);
        }
        else if (isSingle(node)) {
            const sfOff = encodeSingleFilter(b, node);
            filterOffsets.push(sfOff);
        }
        else {
            throw new Error("Unknown filter node");
        }
    }
    const types = w.filters.map((node) => isWrapper(node)
        ? sc.SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilterWrapper
        : sc.SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilter);
    const typesVec = sc.SqlSchema.BasicSqlDataFilterWrapper.createFiltersTypeVector(b, types);
    const filtersVec = sc.SqlSchema.BasicSqlDataFilterWrapper.createFiltersVector(b, filterOffsets);
    sc.SqlSchema.BasicSqlDataFilterWrapper.startBasicSqlDataFilterWrapper(b);
    sc.SqlSchema.BasicSqlDataFilterWrapper.addFilterWrapperType(b, mapWrapperType(w.filterWrapperType));
    sc.SqlSchema.BasicSqlDataFilterWrapper.addFiltersType(b, typesVec);
    sc.SqlSchema.BasicSqlDataFilterWrapper.addFilters(b, filtersVec);
    return sc.SqlSchema.BasicSqlDataFilterWrapper.endBasicSqlDataFilterWrapper(b);
}
