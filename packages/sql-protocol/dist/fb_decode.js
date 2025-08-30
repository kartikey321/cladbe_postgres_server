"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeOrderKey = decodeOrderKey;
exports.decodeWrapper = decodeWrapper;
// packages/postgres_rpc/src/rpc/fb_decode.ts
const filters_1 = require("@cladbe/postgres_manager/dist/models/filters/filters");
const fb_maps_1 = require("./fb_maps");
// Adjust this import to match where flatc put your TS outputs
const FBG = __importStar(require("./generated/sql_rpc"));
function toOrderSort(ord) {
    return (0, fb_maps_1.orderSortTokenFromOrdinal)(ord);
}
function decodeOrderKey(ok) {
    const field = ok.field();
    const sort = toOrderSort(Number(ok.sort?.() ?? ok.sort));
    const isPk = (ok.isPk?.() ?? false);
    return { field, sort, };
}
function decodeWrapper(w) {
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
        ? filters_1.SQLFilterWrapperType.and
        : filters_1.SQLFilterWrapperType.or;
    return { filterWrapperType: wrapperType, filters };
}
function decodeLeaf(lf) {
    const fieldName = lf.fieldName();
    // Build a *typed* modifier so nullsOrder is NullsSortOrder (not string)
    const modifierFB = lf.modifier?.();
    const modifier = {
        distinct: !!(modifierFB?.distinct?.() ?? false),
        caseInSensitive: !!(modifierFB?.caseInsensitive?.() ?? false),
        nullsOrder: filters_1.NullsSortOrder.default_,
    };
    const filterTypeOrdinal = Number(lf.filterType?.() ?? lf.filterType);
    const filterType = mapFilterType(filterTypeOrdinal);
    const value = getFilterValue(lf);
    return { fieldName, value, filterType, modifier };
}
function mapFilterType(ord) {
    const T = FBG.SqlSchema.BasicSqlDataFilterType;
    switch (ord) {
        case T.equals: return filters_1.SQLDataFilterType.equals;
        case T.notEquals: return filters_1.SQLDataFilterType.notEquals;
        case T.isNull: return filters_1.SQLDataFilterType.isNull;
        case T.isNotNull: return filters_1.SQLDataFilterType.isNotNull;
        case T.startsWith: return filters_1.SQLDataFilterType.startsWith;
        case T.endsWith: return filters_1.SQLDataFilterType.endsWith;
        case T.contains: return filters_1.SQLDataFilterType.contains;
        case T.between: return filters_1.SQLDataFilterType.between;
        case T.notBetween: return filters_1.SQLDataFilterType.notBetween;
        case T.inList: return filters_1.SQLDataFilterType.in_;
        case T.notInList: return filters_1.SQLDataFilterType.notIn;
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
