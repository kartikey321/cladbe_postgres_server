// packages/postgres_rpc/src/rpc/fb_decode.ts
import { SQLDataFilterType, SQLFilterWrapperType, NullsSortOrder, } from "@cladbe/postgres_manager/dist/models/filters/filters";
import { orderSortTokenFromOrdinal } from "./fb_maps";
// Adjust this import to match where flatc put your TS outputs
import * as FBG from "./generated/sql_rpc";
function toOrderSort(ord) {
    return orderSortTokenFromOrdinal(ord);
}
export function decodeOrderKey(ok) {
    const field = ok.field();
    const sort = toOrderSort(Number(ok.sort?.() ?? ok.sort));
    const isPk = (ok.isPk?.() ?? false);
    return { field, sort, };
}
export function decodeWrapper(w) {
    const filters = [];
    for (let i = 0; i < w.filtersLength(); i++) {
        const utype = w.filtersType(i);
        if (utype === FBG.SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilterWrapper) {
            const childW = new FBG.SqlSchema.BasicSqlDataFilterWrapper();
            w.filters(childW, i);
            filters.push(decodeWrapper(childW));
        }
        else {
            const childL = new FBG.SqlSchema.BasicSqlDataFilter();
            w.filters(childL, i);
            filters.push(decodeLeaf(childL));
        }
    }
    const wrapperType = w.filterWrapperType() === FBG.SqlSchema.SQLFilterWrapperType.and
        ? SQLFilterWrapperType.and
        : SQLFilterWrapperType.or;
    return { filterWrapperType: wrapperType, filters };
}
function decodeLeaf(lf) {
    const fieldName = lf.fieldName();
    // Build a *typed* modifier so nullsOrder is NullsSortOrder (not string)
    const modifierFB = lf.modifier?.();
    const modifier = {
        distinct: !!(modifierFB?.distinct?.() ?? false),
        caseInSensitive: !!(modifierFB?.caseInsensitive?.() ?? false),
        nullsOrder: NullsSortOrder.default_,
    };
    const filterTypeOrdinal = Number(lf.filterType?.() ?? lf.filterType);
    const filterType = mapFilterType(filterTypeOrdinal);
    const value = getFilterValue(lf);
    return { fieldName, value, filterType, modifier };
}
function mapFilterType(ord) {
    const T = FBG.SqlSchema.BasicSqlDataFilterType;
    switch (ord) {
        case T.equals: return SQLDataFilterType.equals;
        case T.notEquals: return SQLDataFilterType.notEquals;
        case T.isNull: return SQLDataFilterType.isNull;
        case T.isNotNull: return SQLDataFilterType.isNotNull;
        case T.startsWith: return SQLDataFilterType.startsWith;
        case T.endsWith: return SQLDataFilterType.endsWith;
        case T.contains: return SQLDataFilterType.contains;
        case T.between: return SQLDataFilterType.between;
        case T.notBetween: return SQLDataFilterType.notBetween;
        case T.inList: return SQLDataFilterType.in_;
        case T.notInList: return SQLDataFilterType.notIn;
        default:
            throw new Error(`Unsupported filter type ordinal: ${ord}`);
    }
}
function getFilterValue(lf) {
    const vt = lf.valueType();
    const V = FBG.SqlSchema.FilterValue;
    if (vt === V.NullValue)
        return null;
    if (vt === V.StringValue) {
        const v = new FBG.SqlSchema.StringValue();
        lf.value(v);
        return v.value();
    }
    if (vt === V.NumberValue) {
        const v = new FBG.SqlSchema.NumberValue();
        lf.value(v);
        return v.value();
    }
    if (vt === V.Int64Value) {
        const v = new FBG.SqlSchema.Int64Value();
        lf.value(v);
        return Number(v.value());
    }
    if (vt === V.BoolValue) {
        const v = new FBG.SqlSchema.BoolValue();
        lf.value(v);
        return v.value();
    }
    if (vt === V.StringList) {
        const v = new FBG.SqlSchema.StringList();
        lf.value(v);
        return collectList(v.valuesLength(), i => v.values(i));
    }
    if (vt === V.Int64List) {
        const v = new FBG.SqlSchema.Int64List();
        lf.value(v);
        return collectList(v.valuesLength(), i => Number(v.values(i)));
    }
    if (vt === V.Float64List) {
        const v = new FBG.SqlSchema.Float64List();
        lf.value(v);
        return collectList(v.valuesLength(), i => v.values(i));
    }
    // Add TimestampValue/RangeValue mapping later if you start using them
    throw new Error(`Unsupported filter value type: ${vt}`);
}
function collectList(len, getter) {
    const out = [];
    for (let i = 0; i < len; i++) {
        const val = getter(i);
        if (val !== undefined && val !== null)
            out.push(val);
    }
    return out;
}
