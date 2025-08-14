export declare enum SQLFilterWrapperType {
    or = "or",// OR condition
    and = "and"
}
export declare enum NullsSortOrder {
    first = 0,// NULLS FIRST
    last = 1,// NULLS LAST
    default_ = 2
}
export interface DataSort {
    field: string;
    ascending: boolean;
}
export declare enum SQLDataFilterType {
    exists = 0,// EXISTS (already present but should be in this category)
    equals = 1,// =
    notEquals = 2,// !=, <>
    lessThan = 3,// <
    lessThanOrEquals = 4,// <=
    greaterThan = 5,// >
    greaterThanOrEquals = 6,// >=
    isNull = 7,// IS NULL
    isNotNull = 8,// IS NOT NULL
    regex = 9,// ~ (Regular expression match)
    notRegex = 10,// !~ (Regular expression not match)
    startsWith = 11,// LIKE 'value%'
    endsWith = 12,// LIKE '%value'
    contains = 13,// LIKE '%value%'
    notContains = 14,// NOT LIKE '%value%'
    arrayContains = 15,// @>
    arrayContainedBy = 16,// <@
    arrayOverlaps = 17,// &&
    arrayEquals = 18,// =
    arrayNotEquals = 19,// !=
    arrayEmpty = 20,// array_length(field, 1) IS NULL
    arrayNotEmpty = 21,// array_length(field, 1) IS NOT NULL
    arrayLength = 22,// array_length
    arrayDimensions = 23,// array_dims
    arrayPosition = 24,// array_position
    arrayPositions = 25,// array_positions
    arrayToString = 26,// array_to_string
    arrayRemove = 27,// array_remove
    arrayReplace = 28,// array_replace
    arrayAppend = 29,// array_append
    arrayPrepend = 30,// array_prepend
    arrayConcat = 31,// array_cat
    arrayUnion = 32,// array_union
    arrayIntersect = 33,// array_intersect
    arrayRemoveNull = 34,// array_remove_null
    jsonContains = 35,// @>
    jsonContainedBy = 36,// <@
    jsonHasKey = 37,// ?
    jsonHasAnyKey = 38,// ?|
    jsonHasAllKeys = 39,// ?&
    jsonGetField = 40,// ->
    jsonGetFieldAsText = 41,// ->>
    jsonGetPath = 42,// #>
    jsonGetPathAsText = 43,// #>>
    jsonTypeof = 44,// jsonb_typeof
    jsonStripNulls = 45,// jsonb_strip_nulls
    jsonArrayLength = 46,// jsonb_array_length
    jsonObjectKeys = 47,// jsonb_object_keys
    jsonPretty = 48,// jsonb_pretty
    jsonbBuild = 49,// jsonb_build_object
    jsonbSet = 50,// jsonb_set
    jsonbSetPath = 51,// jsonb_set_path
    jsonbDeletePath = 52,// jsonb_delete_path
    jsonbMergePatch = 53,// jsonb_merge_patch
    jsonbStripNulls = 54,// jsonb_strip_nulls
    between = 55,// BETWEEN x AND y
    notBetween = 56,// NOT BETWEEN x AND y
    rangeContains = 57,// @>
    rangeContainedBy = 58,// <@
    rangeOverlap = 59,// &&
    rangeStrictlyLeft = 60,// <<
    rangeStrictlyRight = 61,// >>
    rangeAdjacentTo = 62,// -|-
    rangeUnion = 63,// +
    rangeIntersection = 64,// *
    rangeDifference = 65,// -
    rangeEmpty = 66,// @>
    rangeNotEmpty = 67,// not @>
    rangeLowerInc = 68,// lower_inc
    rangeUpperInc = 69,// upper_inc
    rangeLowerInf = 70,// lower_inf
    rangeUpperInf = 71,// upper_inf
    rangeLength = 72,// range_length
    rangeMerge = 73,// range_merge
    in_ = 74,// IN
    notIn = 75,// NOT IN
    any = 76,// = ANY()
    all = 77,// = ALL()
    some = 78,// SOME
    tsQuery = 79,// @@ (text search match)
    notTsQuery = 80,// NOT @@ (text search not match)
    tsQueryPlain = 81,// plainto_tsquery
    tsQueryPhrase = 82,// phraseto_tsquery
    tsQueryWebsite = 83,// websearch_to_tsquery
    tsHeadline = 84,// ts_headline
    tsSimilarity = 85,// %
    tsrank = 86,// ts_rank
    tsrankcd = 87,// ts_rank_cd
    tsvectorMatch = 88,// @@
    tsvectorAnd = 89,// &&
    tsvectorOr = 90,// ||
    tsvectorNot = 91,// !!
    tsvectorUpdate = 92,// ||
    tsvectorDelete = 93,// !!
    tsConfigWeight = 94,// Text search weight configuration
    tsConfigNorm = 95,// Text search normalization
    tsConfigLang = 96,// Text search language
    tsQueryNormalize = 97,// normalize tsquery
    tsVectorNormalize = 98,// normalize tsvector
    tsParserPlain = 99,// Plain text parser
    tsParserPhrase = 100,// Phrase parser
    tsParserWebsearch = 101,// Web search parser
    tsParserRaw = 102,// Raw text parser
    contained = 103,// <<
    containedOrEquals = 104,// <<=
    contains_ = 105,// >>
    containsOrEquals = 106,// >>=
    sameSubnet = 107,// &&
    notSameSubnet = 108,// !&&
    broadcastAddress = 109,// broadcast
    networkAddress = 110,// network
    netmask = 111,// netmask
    hostmask = 112,// hostmask
    equals2D = 113,// ~=
    overlaps = 114,// &&
    strictlyLeft = 115,// <<
    strictlyRight = 116,// >>
    notExtendRight = 117,// &<
    notExtendLeft = 118,// &>
    adjacent = 119,// -|-
    parallel = 120,// ||
    perpendicular = 121,// #
    center = 122,// @
    intersection = 123,// #
    horizontal = 124,// ?-
    vertical = 125,// ?|
    pointInCircle = 126,// @>
    pointInBox = 127,// <@
    dateTrunc = 128,// date_trunc()
    dateEquals = 129,// = DATE
    dateNotEquals = 130,// != DATE
    dateGreaterThan = 131,// > DATE
    dateLessThan = 132,// < DATE
    dateExtract = 133,// extract(field from )
    datePart = 134,// date_part()
    timeZone = 135,// AT TIME ZONE
    dateAdd = 136,// +
    dateSubtract = 137,// -
    dateOverlaps = 138,// OVERLAPS
    dateDistance = 139,// AGE
    dateBucket = 140,// date_bin
    dateJustify = 141,// justify_interval
    dateJustifyHours = 142,// justify_hours
    dateJustifyDays = 143,// justify_days
    add = 144,// +
    subtract = 145,// -
    multiply = 146,// *
    divide = 147,// /
    modulo = 148,// %
    power = 149,// ^
    squareRoot = 150,// |/
    cubeRoot = 151,// ||/
    factorial = 152,// !
    absolute = 153,// @
    bitAnd = 154,// &
    bitOr = 155,// |
    bitXor = 156,// #
    bitNot = 157,// ~
    bitShiftLeft = 158,// <<
    bitShiftRight = 159,// >>
    round = 160,// ROUND
    ceil = 161,// CEIL
    floor = 162,// FLOOR
    sign = 163,// SIGN
    windowRows = 164,// ROWS window frame
    windowRange = 165,// RANGE window frame
    windowGroups = 166,// GROUPS window frame
    windowExclude = 167,// EXCLUDE window frame option
    rowNumber = 168,// ROW_NUMBER()
    rank = 169,// RANK()
    denseRank = 170,// DENSE_RANK()
    percentRank = 171,// PERCENT_RANK()
    cumeDist = 172,// CUME_DIST()
    ntile = 173,// NTILE()
    lag = 174,// LAG()
    lead = 175,// LEAD()
    firstValue = 176,// FIRST_VALUE()
    lastValue = 177,// LAST_VALUE()
    nthValue = 178,// NTH_VALUE()
    countFilter = 179,// COUNT(*) FILTER (WHERE...)
    sumFilter = 180,// SUM() FILTER (WHERE...)
    avgFilter = 181,// AVG() FILTER (WHERE...)
    minFilter = 182,// MIN() FILTER (WHERE...)
    maxFilter = 183,// MAX() FILTER (WHERE...)
    stringAggFilter = 184,// STRING_AGG() FILTER (WHERE...)
    arrayAggFilter = 185,// ARRAY_AGG() FILTER (WHERE...)
    jsonAggFilter = 186,// JSON_AGG() FILTER (WHERE...)
    ftsSimilar = 187,// %> (similarity threshold)
    ftsWord = 188,// @@ (match word)
    ftsSimilarWord = 189,// @% (similarity word match)
    uuidEquals = 190,// =
    uuidNotEquals = 191,// !=
    uuidLessThan = 192,// <
    uuidGreaterThan = 193,// >
    uuidGenerate = 194,// gen_random_uuid()
    uuidGenerateV4 = 195,// uuid_generate_v4()
    hstoreContains = 196,// @>
    hstoreContainedBy = 197,// <@
    hstoreExists = 198,// ?
    hstoreExistsAny = 199,// ?|
    hstoreExistsAll = 200,// ?&
    hstoreDelete = 201,// delete
    hstoreDeletePath = 202,// delete path
    hstoreConcat = 203,// ||
    btreeIndex = 204,// B-tree index operation
    hashIndex = 205,// Hash index operation
    gistIndex = 206,// GiST index operation
    ginIndex = 207,// GIN index operation
    spgistIndex = 208,// SP-GiST index operation
    brinIndex = 209,// BRIN index operation
    indexScan = 210,// Force index scan
    indexOnlyScan = 211,// Force index-only scan
    bitmapScan = 212,// Force bitmap scan
    seqScan = 213,// Force sequential scan
    collateCI = 214,// Case-insensitive collation
    collateCIAS = 215,// Case-insensitive, accent-sensitive
    collateCIAI = 216,// Case-insensitive, accent-insensitive
    collateCustom = 217,// Custom collation
    parallelWorker = 218,// Parallel worker assignment
    parallelSync = 219,// Parallel synchronization
    parallelAppend = 220,// Parallel append
    parallelHash = 221,// Parallel hash
    distinct = 222,// IS DISTINCT FROM
    notDistinct = 223,// IS NOT DISTINCT FROM
    isTrue = 224,// IS TRUE
    isNotTrue = 225,// IS NOT TRUE
    isFalse = 226,// IS FALSE
    isNotFalse = 227,// IS NOT FALSE
    isUnknown = 228,// IS UNKNOWN
    isNotUnknown = 229,// IS NOT UNKNOWN
    custom = 230,
    in_list = 231
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