import type {Knex} from "knex";
import {AggregationRequest} from "../models/requests";
import {DataHelperAggregation} from "../models/aggregation";
import {ensureValidColumn} from "./utils";

export async function runAggregation(
    query: Knex.QueryBuilder,
    request: AggregationRequest,
    knex: Knex
): Promise<DataHelperAggregation> {
    const {
        sumFields,
        averageFields,
        minimumFields,
        maximumFields,
        countEnabled
    } = request;

    sumFields?.forEach(field => {
        ensureValidColumn(field);
        query.sum({ [`sum_${field}`]: field });
    });

    averageFields?.forEach(field => {
        ensureValidColumn(field);
        query.avg({ [`avg_${field}`]: field });
    });

    minimumFields?.forEach(field => {
        ensureValidColumn(field);
        query.min({ [`min_${field}`]: field });
    });

    maximumFields?.forEach(field => {
        ensureValidColumn(field);
        query.max({ [`max_${field}`]: field });
    });

    if (countEnabled) {
        query.count({ total_count: "*" });
    }

    const result = await query.first<{ [key: string]: any }>();
    if (!result) return {};

    const aggregation: DataHelperAggregation = {
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