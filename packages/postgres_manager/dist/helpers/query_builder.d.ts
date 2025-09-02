import type { Knex } from "knex";
import { DbRequest, FetchDbRequest, SchemaModifierRequest, AggregationRequest, TableExistsRequest } from "../models/requests";
import { DataHelperAggregation } from "../models/aggregation";
export declare class QueryProcessor {
    private readonly knex;
    constructor(knexInstance: Knex);
    tableExists(request: TableExistsRequest): Promise<boolean>;
    buildQuery<TRecord extends {}, TResult>(request: DbRequest): Knex.QueryBuilder<TRecord, TResult>;
    buildQuery<TRecord extends {}, TResult>(request: FetchDbRequest): Knex.QueryBuilder<TRecord, TResult[]>;
    runAggregationQuery(request: AggregationRequest): Promise<DataHelperAggregation>;
    buildSchemaModifierQuery(request: SchemaModifierRequest): Knex.SchemaBuilder;
}
//# sourceMappingURL=query_builder.d.ts.map