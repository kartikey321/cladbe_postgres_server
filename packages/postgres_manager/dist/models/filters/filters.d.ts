export declare enum SQLFilterWrapperType {
    or = "or",// OR condition
    and = "and"
}
export declare enum NullsSortOrder {
    first = "first",// NULLS FIRST
    last = "last",// NULLS LAST
    default_ = "default"
}
export interface DataSort {
    field: string;
    ascending: boolean;
}
export declare enum OrderSort {
    ASC_DEFAULT = "ASC_DEFAULT",
    ASC_NULLS_FIRST = "ASC_NULLS_FIRST",
    ASC_NULLS_LAST = "ASC_NULLS_LAST",
    DESC_DEFAULT = "DESC_DEFAULT",
    DESC_NULLS_FIRST = "DESC_NULLS_FIRST",
    DESC_NULLS_LAST = "DESC_NULLS_LAST"
}
export interface OrderKeySpec {
    field: string;
    sort: OrderSort;
}
export declare enum SQLDataFilterType {
    equals = "equals",
    notEquals = "notEquals",
    lessThan = "lessThan",
    lessThanOrEquals = "lessThanOrEquals",
    greaterThan = "greaterThan",
    greaterThanOrEquals = "greaterThanOrEquals",
    isNull = "isNull",
    isNotNull = "isNotNull",
    regex = "regex",
    notRegex = "notRegex",
    startsWith = "startsWith",
    endsWith = "endsWith",
    contains = "contains",
    notContains = "notContains",
    arrayContains = "arrayContains",
    arrayContainedBy = "arrayContainedBy",
    arrayOverlaps = "arrayOverlaps",
    arrayEquals = "arrayEquals",
    arrayNotEquals = "arrayNotEquals",
    arrayEmpty = "arrayEmpty",
    arrayNotEmpty = "arrayNotEmpty",
    arrayLength = "arrayLength",
    arrayDimensions = "arrayDimensions",
    arrayPosition = "arrayPosition",
    arrayPositions = "arrayPositions",
    arrayToString = "arrayToString",
    arrayRemove = "arrayRemove",
    arrayReplace = "arrayReplace",
    arrayAppend = "arrayAppend",
    arrayPrepend = "arrayPrepend",
    arrayConcat = "arrayConcat",
    arrayUnion = "arrayUnion",
    arrayIntersect = "arrayIntersect",
    arrayRemoveNull = "arrayRemoveNull",
    jsonContains = "jsonContains",
    jsonContainedBy = "jsonContainedBy",
    jsonHasKey = "jsonHasKey",
    jsonHasAnyKey = "jsonHasAnyKey",
    jsonHasAllKeys = "jsonHasAllKeys",
    jsonGetField = "jsonGetField",
    jsonGetFieldAsText = "jsonGetFieldAsText",
    jsonGetPath = "jsonGetPath",
    jsonGetPathAsText = "jsonGetPathAsText",
    jsonTypeof = "jsonTypeof",
    jsonStripNulls = "jsonStripNulls",
    jsonArrayLength = "jsonArrayLength",
    jsonObjectKeys = "jsonObjectKeys",
    jsonPretty = "jsonPretty",
    jsonbBuild = "jsonbBuild",
    jsonbSet = "jsonbSet",
    jsonbSetPath = "jsonbSetPath",
    jsonbDeletePath = "jsonbDeletePath",
    jsonbMergePatch = "jsonbMergePatch",
    jsonbStripNulls = "jsonbStripNulls",
    between = "between",
    notBetween = "notBetween",
    rangeContains = "rangeContains",
    rangeContainedBy = "rangeContainedBy",
    rangeOverlap = "rangeOverlap",
    rangeStrictlyLeft = "rangeStrictlyLeft",
    rangeStrictlyRight = "rangeStrictlyRight",
    rangeAdjacentTo = "rangeAdjacentTo",
    rangeUnion = "rangeUnion",
    rangeIntersection = "rangeIntersection",
    rangeDifference = "rangeDifference",
    rangeEmpty = "rangeEmpty",
    rangeNotEmpty = "rangeNotEmpty",
    rangeLowerInc = "rangeLowerInc",
    rangeUpperInc = "rangeUpperInc",
    rangeLowerInf = "rangeLowerInf",
    rangeUpperInf = "rangeUpperInf",
    rangeLength = "rangeLength",
    rangeMerge = "rangeMerge",
    in_ = "in",
    notIn = "notIn",
    any = "any",
    all = "all",
    some = "some",
    tsQuery = "tsQuery",
    notTsQuery = "notTsQuery",
    tsQueryPlain = "tsQueryPlain",
    tsQueryPhrase = "tsQueryPhrase",
    tsQueryWebsite = "tsQueryWebsite",
    tsHeadline = "tsHeadline",
    tsSimilarity = "tsSimilarity",
    tsrank = "tsrank",
    tsrankcd = "tsrankcd",
    tsvectorMatch = "tsvectorMatch",
    tsvectorAnd = "tsvectorAnd",
    tsvectorOr = "tsvectorOr",
    tsvectorNot = "tsvectorNot",
    tsvectorUpdate = "tsvectorUpdate",
    tsvectorDelete = "tsvectorDelete",
    tsConfigWeight = "tsConfigWeight",
    tsConfigNorm = "tsConfigNorm",
    tsConfigLang = "tsConfigLang",
    tsQueryNormalize = "tsQueryNormalize",
    tsVectorNormalize = "tsVectorNormalize",
    dateTrunc = "dateTrunc",
    dateEquals = "dateEquals",
    dateNotEquals = "dateNotEquals",
    dateGreaterThan = "dateGreaterThan",
    dateLessThan = "dateLessThan",
    dateExtract = "dateExtract",
    datePart = "datePart",
    timeZone = "timeZone",
    dateAdd = "dateAdd",
    dateSubtract = "dateSubtract",
    dateOverlaps = "dateOverlaps",
    dateDistance = "dateDistance",
    dateBucket = "dateBucket",
    dateJustify = "dateJustify",
    dateJustifyHours = "dateJustifyHours",
    dateJustifyDays = "dateJustifyDays",
    add = "add",
    subtract = "subtract",
    multiply = "multiply",
    divide = "divide",
    modulo = "modulo",
    power = "power",
    squareRoot = "squareRoot",
    cubeRoot = "cubeRoot",
    factorial = "factorial",
    absolute = "absolute",
    bitAnd = "bitAnd",
    bitOr = "bitOr",
    bitXor = "bitXor",
    bitNot = "bitNot",
    bitShiftLeft = "bitShiftLeft",
    bitShiftRight = "bitShiftRight",
    round = "round",
    ceil = "ceil",
    floor = "floor",
    sign = "sign",
    distinct = "distinct",
    notDistinct = "notDistinct",
    isTrue = "isTrue",
    isNotTrue = "isNotTrue",
    isFalse = "isFalse",
    isNotFalse = "isNotFalse",
    isUnknown = "isUnknown",
    isNotUnknown = "isNotUnknown",
    custom = "custom",
    in_list = "in_list"
}
export interface BaseSqlDataFilter {
}
export interface SqlDataFilterWrapper extends BaseSqlDataFilter {
    filterWrapperType: SQLFilterWrapperType;
    filters: BaseSqlDataFilter[];
}
export interface SqlDataFilter extends BaseSqlDataFilter {
    fieldName: string;
    value: any;
    filterType: SQLDataFilterType;
    modifier?: SqlFilterModifier;
}
export interface SqlFilterModifier {
    distinct?: boolean;
    caseInSensitive: boolean;
    nullsOrder: NullsSortOrder;
}
//# sourceMappingURL=filters.d.ts.map