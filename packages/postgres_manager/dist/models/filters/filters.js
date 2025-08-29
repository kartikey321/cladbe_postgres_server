"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLDataFilterType = exports.OrderSort = exports.NullsSortOrder = exports.SQLFilterWrapperType = void 0;
// Wrapper type: always explicit string
var SQLFilterWrapperType;
(function (SQLFilterWrapperType) {
    SQLFilterWrapperType["or"] = "or";
    SQLFilterWrapperType["and"] = "and"; // AND condition
})(SQLFilterWrapperType || (exports.SQLFilterWrapperType = SQLFilterWrapperType = {}));
// NULL sort ordering
var NullsSortOrder;
(function (NullsSortOrder) {
    NullsSortOrder["first"] = "first";
    NullsSortOrder["last"] = "last";
    NullsSortOrder["default_"] = "default"; // Database default
})(NullsSortOrder || (exports.NullsSortOrder = NullsSortOrder = {}));
var OrderSort;
(function (OrderSort) {
    OrderSort["ASC_DEFAULT"] = "ASC_DEFAULT";
    OrderSort["ASC_NULLS_FIRST"] = "ASC_NULLS_FIRST";
    OrderSort["ASC_NULLS_LAST"] = "ASC_NULLS_LAST";
    OrderSort["DESC_DEFAULT"] = "DESC_DEFAULT";
    OrderSort["DESC_NULLS_FIRST"] = "DESC_NULLS_FIRST";
    OrderSort["DESC_NULLS_LAST"] = "DESC_NULLS_LAST";
})(OrderSort || (exports.OrderSort = OrderSort = {}));
// Filter types: all string values
var SQLDataFilterType;
(function (SQLDataFilterType) {
    // Basic Comparison Operations
    SQLDataFilterType["equals"] = "equals";
    SQLDataFilterType["notEquals"] = "notEquals";
    SQLDataFilterType["lessThan"] = "lessThan";
    SQLDataFilterType["lessThanOrEquals"] = "lessThanOrEquals";
    SQLDataFilterType["greaterThan"] = "greaterThan";
    SQLDataFilterType["greaterThanOrEquals"] = "greaterThanOrEquals";
    // NULL Checks
    SQLDataFilterType["isNull"] = "isNull";
    SQLDataFilterType["isNotNull"] = "isNotNull";
    // Regex & Pattern
    SQLDataFilterType["regex"] = "regex";
    SQLDataFilterType["notRegex"] = "notRegex";
    SQLDataFilterType["startsWith"] = "startsWith";
    SQLDataFilterType["endsWith"] = "endsWith";
    SQLDataFilterType["contains"] = "contains";
    SQLDataFilterType["notContains"] = "notContains";
    // Array Operations
    SQLDataFilterType["arrayContains"] = "arrayContains";
    SQLDataFilterType["arrayContainedBy"] = "arrayContainedBy";
    SQLDataFilterType["arrayOverlaps"] = "arrayOverlaps";
    SQLDataFilterType["arrayEquals"] = "arrayEquals";
    SQLDataFilterType["arrayNotEquals"] = "arrayNotEquals";
    SQLDataFilterType["arrayEmpty"] = "arrayEmpty";
    SQLDataFilterType["arrayNotEmpty"] = "arrayNotEmpty";
    SQLDataFilterType["arrayLength"] = "arrayLength";
    SQLDataFilterType["arrayDimensions"] = "arrayDimensions";
    SQLDataFilterType["arrayPosition"] = "arrayPosition";
    SQLDataFilterType["arrayPositions"] = "arrayPositions";
    SQLDataFilterType["arrayToString"] = "arrayToString";
    SQLDataFilterType["arrayRemove"] = "arrayRemove";
    SQLDataFilterType["arrayReplace"] = "arrayReplace";
    SQLDataFilterType["arrayAppend"] = "arrayAppend";
    SQLDataFilterType["arrayPrepend"] = "arrayPrepend";
    SQLDataFilterType["arrayConcat"] = "arrayConcat";
    SQLDataFilterType["arrayUnion"] = "arrayUnion";
    SQLDataFilterType["arrayIntersect"] = "arrayIntersect";
    SQLDataFilterType["arrayRemoveNull"] = "arrayRemoveNull";
    // JSONB Operations
    SQLDataFilterType["jsonContains"] = "jsonContains";
    SQLDataFilterType["jsonContainedBy"] = "jsonContainedBy";
    SQLDataFilterType["jsonHasKey"] = "jsonHasKey";
    SQLDataFilterType["jsonHasAnyKey"] = "jsonHasAnyKey";
    SQLDataFilterType["jsonHasAllKeys"] = "jsonHasAllKeys";
    SQLDataFilterType["jsonGetField"] = "jsonGetField";
    SQLDataFilterType["jsonGetFieldAsText"] = "jsonGetFieldAsText";
    SQLDataFilterType["jsonGetPath"] = "jsonGetPath";
    SQLDataFilterType["jsonGetPathAsText"] = "jsonGetPathAsText";
    SQLDataFilterType["jsonTypeof"] = "jsonTypeof";
    SQLDataFilterType["jsonStripNulls"] = "jsonStripNulls";
    SQLDataFilterType["jsonArrayLength"] = "jsonArrayLength";
    SQLDataFilterType["jsonObjectKeys"] = "jsonObjectKeys";
    SQLDataFilterType["jsonPretty"] = "jsonPretty";
    SQLDataFilterType["jsonbBuild"] = "jsonbBuild";
    SQLDataFilterType["jsonbSet"] = "jsonbSet";
    SQLDataFilterType["jsonbSetPath"] = "jsonbSetPath";
    SQLDataFilterType["jsonbDeletePath"] = "jsonbDeletePath";
    SQLDataFilterType["jsonbMergePatch"] = "jsonbMergePatch";
    SQLDataFilterType["jsonbStripNulls"] = "jsonbStripNulls";
    // Range Operations
    SQLDataFilterType["between"] = "between";
    SQLDataFilterType["notBetween"] = "notBetween";
    SQLDataFilterType["rangeContains"] = "rangeContains";
    SQLDataFilterType["rangeContainedBy"] = "rangeContainedBy";
    SQLDataFilterType["rangeOverlap"] = "rangeOverlap";
    SQLDataFilterType["rangeStrictlyLeft"] = "rangeStrictlyLeft";
    SQLDataFilterType["rangeStrictlyRight"] = "rangeStrictlyRight";
    SQLDataFilterType["rangeAdjacentTo"] = "rangeAdjacentTo";
    SQLDataFilterType["rangeUnion"] = "rangeUnion";
    SQLDataFilterType["rangeIntersection"] = "rangeIntersection";
    SQLDataFilterType["rangeDifference"] = "rangeDifference";
    SQLDataFilterType["rangeEmpty"] = "rangeEmpty";
    SQLDataFilterType["rangeNotEmpty"] = "rangeNotEmpty";
    SQLDataFilterType["rangeLowerInc"] = "rangeLowerInc";
    SQLDataFilterType["rangeUpperInc"] = "rangeUpperInc";
    SQLDataFilterType["rangeLowerInf"] = "rangeLowerInf";
    SQLDataFilterType["rangeUpperInf"] = "rangeUpperInf";
    SQLDataFilterType["rangeLength"] = "rangeLength";
    SQLDataFilterType["rangeMerge"] = "rangeMerge";
    // Set Operations
    SQLDataFilterType["in_"] = "in";
    SQLDataFilterType["notIn"] = "notIn";
    SQLDataFilterType["any"] = "any";
    SQLDataFilterType["all"] = "all";
    SQLDataFilterType["some"] = "some";
    // Text Search (FTS)
    SQLDataFilterType["tsQuery"] = "tsQuery";
    SQLDataFilterType["notTsQuery"] = "notTsQuery";
    SQLDataFilterType["tsQueryPlain"] = "tsQueryPlain";
    SQLDataFilterType["tsQueryPhrase"] = "tsQueryPhrase";
    SQLDataFilterType["tsQueryWebsite"] = "tsQueryWebsite";
    SQLDataFilterType["tsHeadline"] = "tsHeadline";
    SQLDataFilterType["tsSimilarity"] = "tsSimilarity";
    SQLDataFilterType["tsrank"] = "tsrank";
    SQLDataFilterType["tsrankcd"] = "tsrankcd";
    SQLDataFilterType["tsvectorMatch"] = "tsvectorMatch";
    SQLDataFilterType["tsvectorAnd"] = "tsvectorAnd";
    SQLDataFilterType["tsvectorOr"] = "tsvectorOr";
    SQLDataFilterType["tsvectorNot"] = "tsvectorNot";
    SQLDataFilterType["tsvectorUpdate"] = "tsvectorUpdate";
    SQLDataFilterType["tsvectorDelete"] = "tsvectorDelete";
    SQLDataFilterType["tsConfigWeight"] = "tsConfigWeight";
    SQLDataFilterType["tsConfigNorm"] = "tsConfigNorm";
    SQLDataFilterType["tsConfigLang"] = "tsConfigLang";
    SQLDataFilterType["tsQueryNormalize"] = "tsQueryNormalize";
    SQLDataFilterType["tsVectorNormalize"] = "tsVectorNormalize";
    // Date/Time
    SQLDataFilterType["dateTrunc"] = "dateTrunc";
    SQLDataFilterType["dateEquals"] = "dateEquals";
    SQLDataFilterType["dateNotEquals"] = "dateNotEquals";
    SQLDataFilterType["dateGreaterThan"] = "dateGreaterThan";
    SQLDataFilterType["dateLessThan"] = "dateLessThan";
    SQLDataFilterType["dateExtract"] = "dateExtract";
    SQLDataFilterType["datePart"] = "datePart";
    SQLDataFilterType["timeZone"] = "timeZone";
    SQLDataFilterType["dateAdd"] = "dateAdd";
    SQLDataFilterType["dateSubtract"] = "dateSubtract";
    SQLDataFilterType["dateOverlaps"] = "dateOverlaps";
    SQLDataFilterType["dateDistance"] = "dateDistance";
    SQLDataFilterType["dateBucket"] = "dateBucket";
    SQLDataFilterType["dateJustify"] = "dateJustify";
    SQLDataFilterType["dateJustifyHours"] = "dateJustifyHours";
    SQLDataFilterType["dateJustifyDays"] = "dateJustifyDays";
    // Math
    SQLDataFilterType["add"] = "add";
    SQLDataFilterType["subtract"] = "subtract";
    SQLDataFilterType["multiply"] = "multiply";
    SQLDataFilterType["divide"] = "divide";
    SQLDataFilterType["modulo"] = "modulo";
    SQLDataFilterType["power"] = "power";
    SQLDataFilterType["squareRoot"] = "squareRoot";
    SQLDataFilterType["cubeRoot"] = "cubeRoot";
    SQLDataFilterType["factorial"] = "factorial";
    SQLDataFilterType["absolute"] = "absolute";
    SQLDataFilterType["bitAnd"] = "bitAnd";
    SQLDataFilterType["bitOr"] = "bitOr";
    SQLDataFilterType["bitXor"] = "bitXor";
    SQLDataFilterType["bitNot"] = "bitNot";
    SQLDataFilterType["bitShiftLeft"] = "bitShiftLeft";
    SQLDataFilterType["bitShiftRight"] = "bitShiftRight";
    SQLDataFilterType["round"] = "round";
    SQLDataFilterType["ceil"] = "ceil";
    SQLDataFilterType["floor"] = "floor";
    SQLDataFilterType["sign"] = "sign";
    // Misc
    SQLDataFilterType["distinct"] = "distinct";
    SQLDataFilterType["notDistinct"] = "notDistinct";
    SQLDataFilterType["isTrue"] = "isTrue";
    SQLDataFilterType["isNotTrue"] = "isNotTrue";
    SQLDataFilterType["isFalse"] = "isFalse";
    SQLDataFilterType["isNotFalse"] = "isNotFalse";
    SQLDataFilterType["isUnknown"] = "isUnknown";
    SQLDataFilterType["isNotUnknown"] = "isNotUnknown";
    SQLDataFilterType["custom"] = "custom";
    SQLDataFilterType["in_list"] = "in_list";
})(SQLDataFilterType || (exports.SQLDataFilterType = SQLDataFilterType = {}));
