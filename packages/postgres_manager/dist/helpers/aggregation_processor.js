"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAggregation = runAggregation;
const utils_1 = require("./utils");
async function runAggregation(query, request, knex) {
    const { sumFields, averageFields, minimumFields, maximumFields, countEnabled } = request;
    sumFields?.forEach(field => {
        (0, utils_1.ensureValidColumn)(field);
        query.sum({ [`sum_${field}`]: field });
    });
    averageFields?.forEach(field => {
        (0, utils_1.ensureValidColumn)(field);
        query.avg({ [`avg_${field}`]: field });
    });
    minimumFields?.forEach(field => {
        (0, utils_1.ensureValidColumn)(field);
        query.min({ [`min_${field}`]: field });
    });
    maximumFields?.forEach(field => {
        (0, utils_1.ensureValidColumn)(field);
        query.max({ [`max_${field}`]: field });
    });
    if (countEnabled) {
        query.count({ total_count: "*" });
    }
    const result = await query.first();
    if (!result)
        return {};
    const aggregation = {
        count: countEnabled ? Number(result.total_count) : undefined,
        sumValues: sumFields?.length
            ? Object.fromEntries(sumFields.map(f => [f, Number(result[`sum_${f}`] ?? 0)]))
            : undefined,
        avgValues: averageFields?.length
            ? Object.fromEntries(averageFields.map(f => [f, Number(result[`avg_${f}`] ?? 0)]))
            : undefined,
        minimumValues: minimumFields?.length
            ? Object.fromEntries(minimumFields.map(f => [f, Number(result[`min_${f}`] ?? 0)]))
            : undefined,
        maximumValues: maximumFields?.length
            ? Object.fromEntries(maximumFields.map(f => [f, Number(result[`max_${f}`] ?? 0)]))
            : undefined,
    };
    console.log(aggregation);
    return aggregation;
}
