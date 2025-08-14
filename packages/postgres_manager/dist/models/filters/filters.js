"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLDataFilterType = exports.NullsSortOrder = exports.SQLFilterWrapperType = void 0;
var SQLFilterWrapperType;
(function (SQLFilterWrapperType) {
    SQLFilterWrapperType["or"] = "or";
    SQLFilterWrapperType["and"] = "and"; // AND condition
})(SQLFilterWrapperType || (exports.SQLFilterWrapperType = SQLFilterWrapperType = {}));
var NullsSortOrder;
(function (NullsSortOrder) {
    NullsSortOrder[NullsSortOrder["first"] = 0] = "first";
    NullsSortOrder[NullsSortOrder["last"] = 1] = "last";
    NullsSortOrder[NullsSortOrder["default_"] = 2] = "default_"; // Database default
})(NullsSortOrder || (exports.NullsSortOrder = NullsSortOrder = {}));
var SQLDataFilterType;
(function (SQLDataFilterType) {
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
    SQLDataFilterType[SQLDataFilterType["exists"] = 0] = "exists";
    // notExists, // NOT EXISTS (already present but should be in this category)
    // inSubquery, // IN (subquery)
    // notInSubquery, // NOT IN (subquery)
    // anySubquery, // ANY (subquery)
    // allSubquery, // ALL (subquery)
    // CTE Operations
    // withQuery, // WITH clause
    // withRecursive, // WITH RECURSIVE clause
    // Basic Comparison Operations
    SQLDataFilterType[SQLDataFilterType["equals"] = 1] = "equals";
    SQLDataFilterType[SQLDataFilterType["notEquals"] = 2] = "notEquals";
    SQLDataFilterType[SQLDataFilterType["lessThan"] = 3] = "lessThan";
    SQLDataFilterType[SQLDataFilterType["lessThanOrEquals"] = 4] = "lessThanOrEquals";
    SQLDataFilterType[SQLDataFilterType["greaterThan"] = 5] = "greaterThan";
    SQLDataFilterType[SQLDataFilterType["greaterThanOrEquals"] = 6] = "greaterThanOrEquals";
    // NULL Checks and Ordering
    SQLDataFilterType[SQLDataFilterType["isNull"] = 7] = "isNull";
    SQLDataFilterType[SQLDataFilterType["isNotNull"] = 8] = "isNotNull";
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
    SQLDataFilterType[SQLDataFilterType["regex"] = 9] = "regex";
    SQLDataFilterType[SQLDataFilterType["notRegex"] = 10] = "notRegex";
    // regexI, // ~* (Case-insensitive regex match)
    // notRegexI, // !~* (Case-insensitive regex not match)
    // Common Pattern Shortcuts
    SQLDataFilterType[SQLDataFilterType["startsWith"] = 11] = "startsWith";
    SQLDataFilterType[SQLDataFilterType["endsWith"] = 12] = "endsWith";
    SQLDataFilterType[SQLDataFilterType["contains"] = 13] = "contains";
    SQLDataFilterType[SQLDataFilterType["notContains"] = 14] = "notContains";
    // Array Operations
    SQLDataFilterType[SQLDataFilterType["arrayContains"] = 15] = "arrayContains";
    SQLDataFilterType[SQLDataFilterType["arrayContainedBy"] = 16] = "arrayContainedBy";
    SQLDataFilterType[SQLDataFilterType["arrayOverlaps"] = 17] = "arrayOverlaps";
    SQLDataFilterType[SQLDataFilterType["arrayEquals"] = 18] = "arrayEquals";
    SQLDataFilterType[SQLDataFilterType["arrayNotEquals"] = 19] = "arrayNotEquals";
    SQLDataFilterType[SQLDataFilterType["arrayEmpty"] = 20] = "arrayEmpty";
    SQLDataFilterType[SQLDataFilterType["arrayNotEmpty"] = 21] = "arrayNotEmpty";
    SQLDataFilterType[SQLDataFilterType["arrayLength"] = 22] = "arrayLength";
    SQLDataFilterType[SQLDataFilterType["arrayDimensions"] = 23] = "arrayDimensions";
    SQLDataFilterType[SQLDataFilterType["arrayPosition"] = 24] = "arrayPosition";
    SQLDataFilterType[SQLDataFilterType["arrayPositions"] = 25] = "arrayPositions";
    SQLDataFilterType[SQLDataFilterType["arrayToString"] = 26] = "arrayToString";
    SQLDataFilterType[SQLDataFilterType["arrayRemove"] = 27] = "arrayRemove";
    SQLDataFilterType[SQLDataFilterType["arrayReplace"] = 28] = "arrayReplace";
    SQLDataFilterType[SQLDataFilterType["arrayAppend"] = 29] = "arrayAppend";
    SQLDataFilterType[SQLDataFilterType["arrayPrepend"] = 30] = "arrayPrepend";
    SQLDataFilterType[SQLDataFilterType["arrayConcat"] = 31] = "arrayConcat";
    SQLDataFilterType[SQLDataFilterType["arrayUnion"] = 32] = "arrayUnion";
    SQLDataFilterType[SQLDataFilterType["arrayIntersect"] = 33] = "arrayIntersect";
    SQLDataFilterType[SQLDataFilterType["arrayRemoveNull"] = 34] = "arrayRemoveNull";
    // JSON/JSONB Operations
    SQLDataFilterType[SQLDataFilterType["jsonContains"] = 35] = "jsonContains";
    SQLDataFilterType[SQLDataFilterType["jsonContainedBy"] = 36] = "jsonContainedBy";
    SQLDataFilterType[SQLDataFilterType["jsonHasKey"] = 37] = "jsonHasKey";
    SQLDataFilterType[SQLDataFilterType["jsonHasAnyKey"] = 38] = "jsonHasAnyKey";
    SQLDataFilterType[SQLDataFilterType["jsonHasAllKeys"] = 39] = "jsonHasAllKeys";
    SQLDataFilterType[SQLDataFilterType["jsonGetField"] = 40] = "jsonGetField";
    SQLDataFilterType[SQLDataFilterType["jsonGetFieldAsText"] = 41] = "jsonGetFieldAsText";
    SQLDataFilterType[SQLDataFilterType["jsonGetPath"] = 42] = "jsonGetPath";
    SQLDataFilterType[SQLDataFilterType["jsonGetPathAsText"] = 43] = "jsonGetPathAsText";
    SQLDataFilterType[SQLDataFilterType["jsonTypeof"] = 44] = "jsonTypeof";
    SQLDataFilterType[SQLDataFilterType["jsonStripNulls"] = 45] = "jsonStripNulls";
    SQLDataFilterType[SQLDataFilterType["jsonArrayLength"] = 46] = "jsonArrayLength";
    SQLDataFilterType[SQLDataFilterType["jsonObjectKeys"] = 47] = "jsonObjectKeys";
    SQLDataFilterType[SQLDataFilterType["jsonPretty"] = 48] = "jsonPretty";
    SQLDataFilterType[SQLDataFilterType["jsonbBuild"] = 49] = "jsonbBuild";
    SQLDataFilterType[SQLDataFilterType["jsonbSet"] = 50] = "jsonbSet";
    SQLDataFilterType[SQLDataFilterType["jsonbSetPath"] = 51] = "jsonbSetPath";
    SQLDataFilterType[SQLDataFilterType["jsonbDeletePath"] = 52] = "jsonbDeletePath";
    SQLDataFilterType[SQLDataFilterType["jsonbMergePatch"] = 53] = "jsonbMergePatch";
    SQLDataFilterType[SQLDataFilterType["jsonbStripNulls"] = 54] = "jsonbStripNulls";
    // Range Operations
    SQLDataFilterType[SQLDataFilterType["between"] = 55] = "between";
    SQLDataFilterType[SQLDataFilterType["notBetween"] = 56] = "notBetween";
    SQLDataFilterType[SQLDataFilterType["rangeContains"] = 57] = "rangeContains";
    SQLDataFilterType[SQLDataFilterType["rangeContainedBy"] = 58] = "rangeContainedBy";
    SQLDataFilterType[SQLDataFilterType["rangeOverlap"] = 59] = "rangeOverlap";
    SQLDataFilterType[SQLDataFilterType["rangeStrictlyLeft"] = 60] = "rangeStrictlyLeft";
    SQLDataFilterType[SQLDataFilterType["rangeStrictlyRight"] = 61] = "rangeStrictlyRight";
    SQLDataFilterType[SQLDataFilterType["rangeAdjacentTo"] = 62] = "rangeAdjacentTo";
    SQLDataFilterType[SQLDataFilterType["rangeUnion"] = 63] = "rangeUnion";
    SQLDataFilterType[SQLDataFilterType["rangeIntersection"] = 64] = "rangeIntersection";
    SQLDataFilterType[SQLDataFilterType["rangeDifference"] = 65] = "rangeDifference";
    SQLDataFilterType[SQLDataFilterType["rangeEmpty"] = 66] = "rangeEmpty";
    SQLDataFilterType[SQLDataFilterType["rangeNotEmpty"] = 67] = "rangeNotEmpty";
    SQLDataFilterType[SQLDataFilterType["rangeLowerInc"] = 68] = "rangeLowerInc";
    SQLDataFilterType[SQLDataFilterType["rangeUpperInc"] = 69] = "rangeUpperInc";
    SQLDataFilterType[SQLDataFilterType["rangeLowerInf"] = 70] = "rangeLowerInf";
    SQLDataFilterType[SQLDataFilterType["rangeUpperInf"] = 71] = "rangeUpperInf";
    SQLDataFilterType[SQLDataFilterType["rangeLength"] = 72] = "rangeLength";
    SQLDataFilterType[SQLDataFilterType["rangeMerge"] = 73] = "rangeMerge";
    // Set Operations
    SQLDataFilterType[SQLDataFilterType["in_"] = 74] = "in_";
    SQLDataFilterType[SQLDataFilterType["notIn"] = 75] = "notIn";
    SQLDataFilterType[SQLDataFilterType["any"] = 76] = "any";
    SQLDataFilterType[SQLDataFilterType["all"] = 77] = "all";
    SQLDataFilterType[SQLDataFilterType["some"] = 78] = "some";
    // Text Search Operations
    SQLDataFilterType[SQLDataFilterType["tsQuery"] = 79] = "tsQuery";
    SQLDataFilterType[SQLDataFilterType["notTsQuery"] = 80] = "notTsQuery";
    SQLDataFilterType[SQLDataFilterType["tsQueryPlain"] = 81] = "tsQueryPlain";
    SQLDataFilterType[SQLDataFilterType["tsQueryPhrase"] = 82] = "tsQueryPhrase";
    SQLDataFilterType[SQLDataFilterType["tsQueryWebsite"] = 83] = "tsQueryWebsite";
    SQLDataFilterType[SQLDataFilterType["tsHeadline"] = 84] = "tsHeadline";
    SQLDataFilterType[SQLDataFilterType["tsSimilarity"] = 85] = "tsSimilarity";
    SQLDataFilterType[SQLDataFilterType["tsrank"] = 86] = "tsrank";
    SQLDataFilterType[SQLDataFilterType["tsrankcd"] = 87] = "tsrankcd";
    SQLDataFilterType[SQLDataFilterType["tsvectorMatch"] = 88] = "tsvectorMatch";
    SQLDataFilterType[SQLDataFilterType["tsvectorAnd"] = 89] = "tsvectorAnd";
    SQLDataFilterType[SQLDataFilterType["tsvectorOr"] = 90] = "tsvectorOr";
    SQLDataFilterType[SQLDataFilterType["tsvectorNot"] = 91] = "tsvectorNot";
    SQLDataFilterType[SQLDataFilterType["tsvectorUpdate"] = 92] = "tsvectorUpdate";
    SQLDataFilterType[SQLDataFilterType["tsvectorDelete"] = 93] = "tsvectorDelete";
    SQLDataFilterType[SQLDataFilterType["tsConfigWeight"] = 94] = "tsConfigWeight";
    SQLDataFilterType[SQLDataFilterType["tsConfigNorm"] = 95] = "tsConfigNorm";
    SQLDataFilterType[SQLDataFilterType["tsConfigLang"] = 96] = "tsConfigLang";
    SQLDataFilterType[SQLDataFilterType["tsQueryNormalize"] = 97] = "tsQueryNormalize";
    SQLDataFilterType[SQLDataFilterType["tsVectorNormalize"] = 98] = "tsVectorNormalize";
    // Text Search Parser Modes
    SQLDataFilterType[SQLDataFilterType["tsParserPlain"] = 99] = "tsParserPlain";
    SQLDataFilterType[SQLDataFilterType["tsParserPhrase"] = 100] = "tsParserPhrase";
    SQLDataFilterType[SQLDataFilterType["tsParserWebsearch"] = 101] = "tsParserWebsearch";
    SQLDataFilterType[SQLDataFilterType["tsParserRaw"] = 102] = "tsParserRaw";
    // Network Address Operations
    SQLDataFilterType[SQLDataFilterType["contained"] = 103] = "contained";
    SQLDataFilterType[SQLDataFilterType["containedOrEquals"] = 104] = "containedOrEquals";
    SQLDataFilterType[SQLDataFilterType["contains_"] = 105] = "contains_";
    SQLDataFilterType[SQLDataFilterType["containsOrEquals"] = 106] = "containsOrEquals";
    SQLDataFilterType[SQLDataFilterType["sameSubnet"] = 107] = "sameSubnet";
    SQLDataFilterType[SQLDataFilterType["notSameSubnet"] = 108] = "notSameSubnet";
    SQLDataFilterType[SQLDataFilterType["broadcastAddress"] = 109] = "broadcastAddress";
    SQLDataFilterType[SQLDataFilterType["networkAddress"] = 110] = "networkAddress";
    SQLDataFilterType[SQLDataFilterType["netmask"] = 111] = "netmask";
    SQLDataFilterType[SQLDataFilterType["hostmask"] = 112] = "hostmask";
    // Geometric Operations
    SQLDataFilterType[SQLDataFilterType["equals2D"] = 113] = "equals2D";
    SQLDataFilterType[SQLDataFilterType["overlaps"] = 114] = "overlaps";
    SQLDataFilterType[SQLDataFilterType["strictlyLeft"] = 115] = "strictlyLeft";
    SQLDataFilterType[SQLDataFilterType["strictlyRight"] = 116] = "strictlyRight";
    SQLDataFilterType[SQLDataFilterType["notExtendRight"] = 117] = "notExtendRight";
    SQLDataFilterType[SQLDataFilterType["notExtendLeft"] = 118] = "notExtendLeft";
    SQLDataFilterType[SQLDataFilterType["adjacent"] = 119] = "adjacent";
    SQLDataFilterType[SQLDataFilterType["parallel"] = 120] = "parallel";
    SQLDataFilterType[SQLDataFilterType["perpendicular"] = 121] = "perpendicular";
    SQLDataFilterType[SQLDataFilterType["center"] = 122] = "center";
    SQLDataFilterType[SQLDataFilterType["intersection"] = 123] = "intersection";
    SQLDataFilterType[SQLDataFilterType["horizontal"] = 124] = "horizontal";
    SQLDataFilterType[SQLDataFilterType["vertical"] = 125] = "vertical";
    SQLDataFilterType[SQLDataFilterType["pointInCircle"] = 126] = "pointInCircle";
    SQLDataFilterType[SQLDataFilterType["pointInBox"] = 127] = "pointInBox";
    // Date/Time Operations
    SQLDataFilterType[SQLDataFilterType["dateTrunc"] = 128] = "dateTrunc";
    SQLDataFilterType[SQLDataFilterType["dateEquals"] = 129] = "dateEquals";
    SQLDataFilterType[SQLDataFilterType["dateNotEquals"] = 130] = "dateNotEquals";
    SQLDataFilterType[SQLDataFilterType["dateGreaterThan"] = 131] = "dateGreaterThan";
    SQLDataFilterType[SQLDataFilterType["dateLessThan"] = 132] = "dateLessThan";
    SQLDataFilterType[SQLDataFilterType["dateExtract"] = 133] = "dateExtract";
    SQLDataFilterType[SQLDataFilterType["datePart"] = 134] = "datePart";
    SQLDataFilterType[SQLDataFilterType["timeZone"] = 135] = "timeZone";
    SQLDataFilterType[SQLDataFilterType["dateAdd"] = 136] = "dateAdd";
    SQLDataFilterType[SQLDataFilterType["dateSubtract"] = 137] = "dateSubtract";
    SQLDataFilterType[SQLDataFilterType["dateOverlaps"] = 138] = "dateOverlaps";
    SQLDataFilterType[SQLDataFilterType["dateDistance"] = 139] = "dateDistance";
    SQLDataFilterType[SQLDataFilterType["dateBucket"] = 140] = "dateBucket";
    SQLDataFilterType[SQLDataFilterType["dateJustify"] = 141] = "dateJustify";
    SQLDataFilterType[SQLDataFilterType["dateJustifyHours"] = 142] = "dateJustifyHours";
    SQLDataFilterType[SQLDataFilterType["dateJustifyDays"] = 143] = "dateJustifyDays";
    // Mathematical Operations
    SQLDataFilterType[SQLDataFilterType["add"] = 144] = "add";
    SQLDataFilterType[SQLDataFilterType["subtract"] = 145] = "subtract";
    SQLDataFilterType[SQLDataFilterType["multiply"] = 146] = "multiply";
    SQLDataFilterType[SQLDataFilterType["divide"] = 147] = "divide";
    SQLDataFilterType[SQLDataFilterType["modulo"] = 148] = "modulo";
    SQLDataFilterType[SQLDataFilterType["power"] = 149] = "power";
    SQLDataFilterType[SQLDataFilterType["squareRoot"] = 150] = "squareRoot";
    SQLDataFilterType[SQLDataFilterType["cubeRoot"] = 151] = "cubeRoot";
    SQLDataFilterType[SQLDataFilterType["factorial"] = 152] = "factorial";
    SQLDataFilterType[SQLDataFilterType["absolute"] = 153] = "absolute";
    SQLDataFilterType[SQLDataFilterType["bitAnd"] = 154] = "bitAnd";
    SQLDataFilterType[SQLDataFilterType["bitOr"] = 155] = "bitOr";
    SQLDataFilterType[SQLDataFilterType["bitXor"] = 156] = "bitXor";
    SQLDataFilterType[SQLDataFilterType["bitNot"] = 157] = "bitNot";
    SQLDataFilterType[SQLDataFilterType["bitShiftLeft"] = 158] = "bitShiftLeft";
    SQLDataFilterType[SQLDataFilterType["bitShiftRight"] = 159] = "bitShiftRight";
    SQLDataFilterType[SQLDataFilterType["round"] = 160] = "round";
    SQLDataFilterType[SQLDataFilterType["ceil"] = 161] = "ceil";
    SQLDataFilterType[SQLDataFilterType["floor"] = 162] = "floor";
    SQLDataFilterType[SQLDataFilterType["sign"] = 163] = "sign";
    // Window Function Operations
    SQLDataFilterType[SQLDataFilterType["windowRows"] = 164] = "windowRows";
    SQLDataFilterType[SQLDataFilterType["windowRange"] = 165] = "windowRange";
    SQLDataFilterType[SQLDataFilterType["windowGroups"] = 166] = "windowGroups";
    SQLDataFilterType[SQLDataFilterType["windowExclude"] = 167] = "windowExclude";
    SQLDataFilterType[SQLDataFilterType["rowNumber"] = 168] = "rowNumber";
    SQLDataFilterType[SQLDataFilterType["rank"] = 169] = "rank";
    SQLDataFilterType[SQLDataFilterType["denseRank"] = 170] = "denseRank";
    SQLDataFilterType[SQLDataFilterType["percentRank"] = 171] = "percentRank";
    SQLDataFilterType[SQLDataFilterType["cumeDist"] = 172] = "cumeDist";
    SQLDataFilterType[SQLDataFilterType["ntile"] = 173] = "ntile";
    SQLDataFilterType[SQLDataFilterType["lag"] = 174] = "lag";
    SQLDataFilterType[SQLDataFilterType["lead"] = 175] = "lead";
    SQLDataFilterType[SQLDataFilterType["firstValue"] = 176] = "firstValue";
    SQLDataFilterType[SQLDataFilterType["lastValue"] = 177] = "lastValue";
    SQLDataFilterType[SQLDataFilterType["nthValue"] = 178] = "nthValue";
    // Aggregate Functions with Filters
    SQLDataFilterType[SQLDataFilterType["countFilter"] = 179] = "countFilter";
    SQLDataFilterType[SQLDataFilterType["sumFilter"] = 180] = "sumFilter";
    SQLDataFilterType[SQLDataFilterType["avgFilter"] = 181] = "avgFilter";
    SQLDataFilterType[SQLDataFilterType["minFilter"] = 182] = "minFilter";
    SQLDataFilterType[SQLDataFilterType["maxFilter"] = 183] = "maxFilter";
    SQLDataFilterType[SQLDataFilterType["stringAggFilter"] = 184] = "stringAggFilter";
    SQLDataFilterType[SQLDataFilterType["arrayAggFilter"] = 185] = "arrayAggFilter";
    SQLDataFilterType[SQLDataFilterType["jsonAggFilter"] = 186] = "jsonAggFilter";
    // Full Text Search Specific
    SQLDataFilterType[SQLDataFilterType["ftsSimilar"] = 187] = "ftsSimilar";
    SQLDataFilterType[SQLDataFilterType["ftsWord"] = 188] = "ftsWord";
    SQLDataFilterType[SQLDataFilterType["ftsSimilarWord"] = 189] = "ftsSimilarWord";
    // UUID Operations
    SQLDataFilterType[SQLDataFilterType["uuidEquals"] = 190] = "uuidEquals";
    SQLDataFilterType[SQLDataFilterType["uuidNotEquals"] = 191] = "uuidNotEquals";
    SQLDataFilterType[SQLDataFilterType["uuidLessThan"] = 192] = "uuidLessThan";
    SQLDataFilterType[SQLDataFilterType["uuidGreaterThan"] = 193] = "uuidGreaterThan";
    SQLDataFilterType[SQLDataFilterType["uuidGenerate"] = 194] = "uuidGenerate";
    SQLDataFilterType[SQLDataFilterType["uuidGenerateV4"] = 195] = "uuidGenerateV4";
    // HSTORE Operations
    SQLDataFilterType[SQLDataFilterType["hstoreContains"] = 196] = "hstoreContains";
    SQLDataFilterType[SQLDataFilterType["hstoreContainedBy"] = 197] = "hstoreContainedBy";
    SQLDataFilterType[SQLDataFilterType["hstoreExists"] = 198] = "hstoreExists";
    SQLDataFilterType[SQLDataFilterType["hstoreExistsAny"] = 199] = "hstoreExistsAny";
    SQLDataFilterType[SQLDataFilterType["hstoreExistsAll"] = 200] = "hstoreExistsAll";
    SQLDataFilterType[SQLDataFilterType["hstoreDelete"] = 201] = "hstoreDelete";
    SQLDataFilterType[SQLDataFilterType["hstoreDeletePath"] = 202] = "hstoreDeletePath";
    SQLDataFilterType[SQLDataFilterType["hstoreConcat"] = 203] = "hstoreConcat";
    // Index Types and Operations
    SQLDataFilterType[SQLDataFilterType["btreeIndex"] = 204] = "btreeIndex";
    SQLDataFilterType[SQLDataFilterType["hashIndex"] = 205] = "hashIndex";
    SQLDataFilterType[SQLDataFilterType["gistIndex"] = 206] = "gistIndex";
    SQLDataFilterType[SQLDataFilterType["ginIndex"] = 207] = "ginIndex";
    SQLDataFilterType[SQLDataFilterType["spgistIndex"] = 208] = "spgistIndex";
    SQLDataFilterType[SQLDataFilterType["brinIndex"] = 209] = "brinIndex";
    SQLDataFilterType[SQLDataFilterType["indexScan"] = 210] = "indexScan";
    SQLDataFilterType[SQLDataFilterType["indexOnlyScan"] = 211] = "indexOnlyScan";
    SQLDataFilterType[SQLDataFilterType["bitmapScan"] = 212] = "bitmapScan";
    SQLDataFilterType[SQLDataFilterType["seqScan"] = 213] = "seqScan";
    // Collation Operations
    SQLDataFilterType[SQLDataFilterType["collateCI"] = 214] = "collateCI";
    SQLDataFilterType[SQLDataFilterType["collateCIAS"] = 215] = "collateCIAS";
    SQLDataFilterType[SQLDataFilterType["collateCIAI"] = 216] = "collateCIAI";
    SQLDataFilterType[SQLDataFilterType["collateCustom"] = 217] = "collateCustom";
    // Parallel Processing Operations
    SQLDataFilterType[SQLDataFilterType["parallelWorker"] = 218] = "parallelWorker";
    SQLDataFilterType[SQLDataFilterType["parallelSync"] = 219] = "parallelSync";
    SQLDataFilterType[SQLDataFilterType["parallelAppend"] = 220] = "parallelAppend";
    SQLDataFilterType[SQLDataFilterType["parallelHash"] = 221] = "parallelHash";
    // Other Operations
    SQLDataFilterType[SQLDataFilterType["distinct"] = 222] = "distinct";
    SQLDataFilterType[SQLDataFilterType["notDistinct"] = 223] = "notDistinct";
    SQLDataFilterType[SQLDataFilterType["isTrue"] = 224] = "isTrue";
    SQLDataFilterType[SQLDataFilterType["isNotTrue"] = 225] = "isNotTrue";
    SQLDataFilterType[SQLDataFilterType["isFalse"] = 226] = "isFalse";
    SQLDataFilterType[SQLDataFilterType["isNotFalse"] = 227] = "isNotFalse";
    SQLDataFilterType[SQLDataFilterType["isUnknown"] = 228] = "isUnknown";
    SQLDataFilterType[SQLDataFilterType["isNotUnknown"] = 229] = "isNotUnknown";
    // Custom Operations
    SQLDataFilterType[SQLDataFilterType["custom"] = 230] = "custom";
    SQLDataFilterType[SQLDataFilterType["in_list"] = 231] = "in_list"; // For custom SQL conditions
})(SQLDataFilterType || (exports.SQLDataFilterType = SQLDataFilterType = {}));
