import type { Knex } from "knex";
import { AggregationRequest } from "../models/requests";
import { DataHelperAggregation } from "../models/aggregation";
export declare function runAggregation(query: Knex.QueryBuilder, request: AggregationRequest, knex: Knex): Promise<DataHelperAggregation>;
//# sourceMappingURL=aggregation_processor.d.ts.map