export enum SQLFilterWrapperType {
    or = 'or', // OR condition
    and = 'and'// AND condition
}

export enum NullsSortOrder {
    first, // NULLS FIRST
    last, // NULLS LAST
    default_ // Database default
}

export interface DataSort {

    field: string,
    ascending: boolean,
}

export enum SQLDataFilterType {
    // SQL Clause Operations
    // where, // WHERE clause
    // having, // HAVING clause
    // groupBy, // GROUP BY clause
    // orderBy, // ORDER BY clause
    // limit, // LIMIT clause
    // offset, // OFFSET clause

    // JOIN Operations
    // innerJoin, // INNER JOIN
    // leftJoin, // LEFT JOIN
    // rightJoin, // RIGHT JOIN
    // fullJoin, // FULL JOIN
    // crossJoin, // CROSS JOIN
    // naturalJoin, // NATURAL JOIN
    // lateralJoin, // LATERAL JOIN

    // Subquery Operations
    exists, // EXISTS (already present but should be in this category)
    // notExists, // NOT EXISTS (already present but should be in this category)
    // inSubquery, // IN (subquery)
    // notInSubquery, // NOT IN (subquery)
    // anySubquery, // ANY (subquery)
    // allSubquery, // ALL (subquery)

    // CTE Operations
    // withQuery, // WITH clause
    // withRecursive, // WITH RECURSIVE clause

    // Basic Comparison Operations
    equals, // =
    notEquals, // !=, <>
    lessThan, // <
    lessThanOrEquals, // <=
    greaterThan, // >
    greaterThanOrEquals, // >=

    // NULL Checks and Ordering
    isNull, // IS NULL
    isNotNull, // IS NOT NULL
    // nullsFirst, // NULLS FIRST
    // nullsLast, // NULLS LAST
    // nullsDefault, // Database default NULL ordering

    // // Pattern Matching Operations
    // like, // LIKE
    // notLike, // NOT LIKE
    // ilike, // ILIKE (case-insensitive)
    // notIlike, // NOT ILIKE (case-insensitive)
    // similar, // SIMILAR TO
    // notSimilar, // NOT SIMILAR TO
    regex, // ~ (Regular expression match)
    notRegex, // !~ (Regular expression not match)
    // regexI, // ~* (Case-insensitive regex match)
    // notRegexI, // !~* (Case-insensitive regex not match)

    // Common Pattern Shortcuts
    startsWith, // LIKE 'value%'
    endsWith, // LIKE '%value'
    contains, // LIKE '%value%'
    notContains, // NOT LIKE '%value%'

    // Array Operations
    arrayContains, // @>
    arrayContainedBy, // <@
    arrayOverlaps, // &&
    arrayEquals, // =
    arrayNotEquals, // !=
    arrayEmpty, // array_length(field, 1) IS NULL
    arrayNotEmpty, // array_length(field, 1) IS NOT NULL
    arrayLength, // array_length
    arrayDimensions, // array_dims
    arrayPosition, // array_position
    arrayPositions, // array_positions
    arrayToString, // array_to_string
    arrayRemove, // array_remove
    arrayReplace, // array_replace
    arrayAppend, // array_append
    arrayPrepend, // array_prepend
    arrayConcat, // array_cat
    arrayUnion, // array_union
    arrayIntersect, // array_intersect
    arrayRemoveNull, // array_remove_null

    // JSON/JSONB Operations
    jsonContains, // @>
    jsonContainedBy, // <@
    jsonHasKey, // ?
    jsonHasAnyKey, // ?|
    jsonHasAllKeys, // ?&
    jsonGetField, // ->
    jsonGetFieldAsText, // ->>
    jsonGetPath, // #>
    jsonGetPathAsText, // #>>
    jsonTypeof, // jsonb_typeof
    jsonStripNulls, // jsonb_strip_nulls
    jsonArrayLength, // jsonb_array_length
    jsonObjectKeys, // jsonb_object_keys
    jsonPretty, // jsonb_pretty
    jsonbBuild, // jsonb_build_object
    jsonbSet, // jsonb_set
    jsonbSetPath, // jsonb_set_path
    jsonbDeletePath, // jsonb_delete_path
    jsonbMergePatch, // jsonb_merge_patch
    jsonbStripNulls, // jsonb_strip_nulls

    // Range Operations
    between, // BETWEEN x AND y
    notBetween, // NOT BETWEEN x AND y
    rangeContains, // @>
    rangeContainedBy, // <@
    rangeOverlap, // &&
    rangeStrictlyLeft, // <<
    rangeStrictlyRight, // >>
    rangeAdjacentTo, // -|-
    rangeUnion, // +
    rangeIntersection, // *
    rangeDifference, // -
    rangeEmpty, // @>
    rangeNotEmpty, // not @>
    rangeLowerInc, // lower_inc
    rangeUpperInc, // upper_inc
    rangeLowerInf, // lower_inf
    rangeUpperInf, // upper_inf
    rangeLength, // range_length
    rangeMerge, // range_merge

    // Set Operations
    in_, // IN
    notIn, // NOT IN
    any, // = ANY()
    all, // = ALL()
    some, // SOME

    // Text Search Operations
    tsQuery, // @@ (text search match)
    notTsQuery, // NOT @@ (text search not match)
    tsQueryPlain, // plainto_tsquery
    tsQueryPhrase, // phraseto_tsquery
    tsQueryWebsite, // websearch_to_tsquery
    tsHeadline, // ts_headline
    tsSimilarity, // %
    tsrank, // ts_rank
    tsrankcd, // ts_rank_cd
    tsvectorMatch, // @@
    tsvectorAnd, // &&
    tsvectorOr, // ||
    tsvectorNot, // !!
    tsvectorUpdate, // ||
    tsvectorDelete, // !!
    tsConfigWeight, // Text search weight configuration
    tsConfigNorm, // Text search normalization
    tsConfigLang, // Text search language
    tsQueryNormalize, // normalize tsquery
    tsVectorNormalize, // normalize tsvector

    // Text Search Parser Modes
    tsParserPlain, // Plain text parser
    tsParserPhrase, // Phrase parser
    tsParserWebsearch, // Web search parser
    tsParserRaw, // Raw text parser

    // Network Address Operations
    contained, // <<
    containedOrEquals, // <<=
    contains_, // >>
    containsOrEquals, // >>=
    sameSubnet, // &&
    notSameSubnet, // !&&
    broadcastAddress, // broadcast
    networkAddress, // network
    netmask, // netmask
    hostmask, // hostmask

    // Geometric Operations
    equals2D, // ~=
    overlaps, // &&
    strictlyLeft, // <<
    strictlyRight, // >>
    notExtendRight, // &<
    notExtendLeft, // &>
    adjacent, // -|-
    parallel, // ||
    perpendicular, // #
    center, // @
    intersection, // #
    horizontal, // ?-
    vertical, // ?|
    pointInCircle, // @>
    pointInBox, // <@

    // Date/Time Operations
    dateTrunc, // date_trunc()
    dateEquals, // = DATE
    dateNotEquals, // != DATE
    dateGreaterThan, // > DATE
    dateLessThan, // < DATE
    dateExtract, // extract(field from )
    datePart, // date_part()
    timeZone, // AT TIME ZONE
    dateAdd, // +
    dateSubtract, // -
    dateOverlaps, // OVERLAPS
    dateDistance, // AGE
    dateBucket, // date_bin
    dateJustify, // justify_interval
    dateJustifyHours, // justify_hours
    dateJustifyDays, // justify_days

    // Mathematical Operations
    add, // +
    subtract, // -
    multiply, // *
    divide, // /
    modulo, // %
    power, // ^
    squareRoot, // |/
    cubeRoot, // ||/
    factorial, // !
    absolute, // @
    bitAnd, // &
    bitOr, // |
    bitXor, // #
    bitNot, // ~
    bitShiftLeft, // <<
    bitShiftRight, // >>
    round, // ROUND
    ceil, // CEIL
    floor, // FLOOR
    sign, // SIGN

    // Window Function Operations
    windowRows, // ROWS window frame
    windowRange, // RANGE window frame
    windowGroups, // GROUPS window frame
    windowExclude, // EXCLUDE window frame option
    rowNumber, // ROW_NUMBER()
    rank, // RANK()
    denseRank, // DENSE_RANK()
    percentRank, // PERCENT_RANK()
    cumeDist, // CUME_DIST()
    ntile, // NTILE()
    lag, // LAG()
    lead, // LEAD()
    firstValue, // FIRST_VALUE()
    lastValue, // LAST_VALUE()
    nthValue, // NTH_VALUE()

    // Aggregate Functions with Filters
    countFilter, // COUNT(*) FILTER (WHERE...)
    sumFilter, // SUM() FILTER (WHERE...)
    avgFilter, // AVG() FILTER (WHERE...)
    minFilter, // MIN() FILTER (WHERE...)
    maxFilter, // MAX() FILTER (WHERE...)
    stringAggFilter, // STRING_AGG() FILTER (WHERE...)
    arrayAggFilter, // ARRAY_AGG() FILTER (WHERE...)
    jsonAggFilter, // JSON_AGG() FILTER (WHERE...)

    // Full Text Search Specific
    ftsSimilar, // %> (similarity threshold)
    ftsWord, // @@ (match word)
    ftsSimilarWord, // @% (similarity word match)

    // UUID Operations
    uuidEquals, // =
    uuidNotEquals, // !=
    uuidLessThan, // <
    uuidGreaterThan, // >
    uuidGenerate, // gen_random_uuid()
    uuidGenerateV4, // uuid_generate_v4()

    // HSTORE Operations
    hstoreContains, // @>
    hstoreContainedBy, // <@
    hstoreExists, // ?
    hstoreExistsAny, // ?|
    hstoreExistsAll, // ?&
    hstoreDelete, // delete
    hstoreDeletePath, // delete path
    hstoreConcat, // ||

    // Index Types and Operations
    btreeIndex, // B-tree index operation
    hashIndex, // Hash index operation
    gistIndex, // GiST index operation
    ginIndex, // GIN index operation
    spgistIndex, // SP-GiST index operation
    brinIndex, // BRIN index operation
    indexScan, // Force index scan
    indexOnlyScan, // Force index-only scan
    bitmapScan, // Force bitmap scan
    seqScan, // Force sequential scan

    // Collation Operations
    collateCI, // Case-insensitive collation
    collateCIAS, // Case-insensitive, accent-sensitive
    collateCIAI, // Case-insensitive, accent-insensitive
    collateCustom, // Custom collation

    // Parallel Processing Operations
    parallelWorker, // Parallel worker assignment
    parallelSync, // Parallel synchronization
    parallelAppend, // Parallel append
    parallelHash, // Parallel hash

    // Other Operations
    distinct, // IS DISTINCT FROM
    notDistinct, // IS NOT DISTINCT FROM
    isTrue, // IS TRUE
    isNotTrue, // IS NOT TRUE
    isFalse, // IS FALSE
    isNotFalse, // IS NOT FALSE
    isUnknown, // IS UNKNOWN
    isNotUnknown, // IS NOT UNKNOWN

    // Custom Operations
    custom,
    in_list // For custom SQL conditions
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