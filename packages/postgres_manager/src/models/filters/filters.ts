// Wrapper type: always explicit string
export enum SQLFilterWrapperType {
    or = "or",   // OR condition
    and = "and"  // AND condition
}

// NULL sort ordering
export enum NullsSortOrder {
    first = "first",       // NULLS FIRST
    last = "last",         // NULLS LAST
    default_ = "default"   // Database default
}

// Sorting spec
export interface DataSort {
    field: string;
    ascending: boolean;
}

export enum OrderSort {
    ASC_DEFAULT = "ASC_DEFAULT",
    ASC_NULLS_FIRST = "ASC_NULLS_FIRST",
    ASC_NULLS_LAST = "ASC_NULLS_LAST",
    DESC_DEFAULT = "DESC_DEFAULT",
    DESC_NULLS_FIRST = "DESC_NULLS_FIRST",
    DESC_NULLS_LAST = "DESC_NULLS_LAST",
}

export interface OrderKeySpec {
    field: string;
    sort: OrderSort;
}

// Filter types: all string values
export enum SQLDataFilterType {
    // Basic Comparison Operations
    equals = "equals",
    notEquals = "notEquals",
    lessThan = "lessThan",
    lessThanOrEquals = "lessThanOrEquals",
    greaterThan = "greaterThan",
    greaterThanOrEquals = "greaterThanOrEquals",

    // NULL Checks
    isNull = "isNull",
    isNotNull = "isNotNull",

    // Regex & Pattern
    regex = "regex",
    notRegex = "notRegex",
    startsWith = "startsWith",
    endsWith = "endsWith",
    contains = "contains",
    notContains = "notContains",

    // Array Operations
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

    // JSONB Operations
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

    // Range Operations
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

    // Set Operations
    in_ = "in",
    notIn = "notIn",
    any = "any",
    all = "all",
    some = "some",

    // Text Search (FTS)
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

    // Date/Time
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

    // Math
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

    // Misc
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


/*
export class DbRequest {
    constructor(public tableName: string) {
    }

}

export class FetchDbRequest extends DbRequest {
    constructor(public tableName: string, public dataSort?: DataSort,
                public filters?: BaseSqlDataFilter[],
                public limit?: number,
                public offset?: number,
    ) {
        super(tableName);
    }

}
export class UpdateDbRequest extends DbRequest {
    constructor(public tableName: string,
                public filters?: BaseSqlDataFilter[],
                public limit?: number,
                public offset?: number,
    ) {
        super(tableName);
    }
}
 */


export interface BaseSqlDataFilter {
}

export interface SqlDataFilterWrapper extends BaseSqlDataFilter {
    filterWrapperType: SQLFilterWrapperType;
    filters: BaseSqlDataFilter[];
}

export interface SqlDataFilter extends BaseSqlDataFilter {


    fieldName: string;
    value: any;
    filterType: SQLDataFilterType,
    modifier?: SqlFilterModifier;
}


export interface SqlFilterModifier {
    distinct?: boolean,
    caseInSensitive: boolean,
    nullsOrder: NullsSortOrder
}