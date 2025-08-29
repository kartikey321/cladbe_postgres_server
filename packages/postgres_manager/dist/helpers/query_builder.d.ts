import type { Knex } from "knex";
import { BaseSqlDataFilter } from "../models/filters/filters";
import { AggregationRequest, DbRequest, FetchDbRequest, SchemaModifierRequest, TableExistsRequest } from "../models/requests";
import { TableDefinition } from "../models/table_definition";
import { DataHelperAggregation } from "../models/aggregation";
export declare class QueryProcessor {
    private readonly knex;
    constructor(knexInstance: Knex);
    createTable(request: TableDefinition): Knex.SchemaBuilder;
    private runAggregation;
    /**
     * Apply all filters recursively to a query
     */
    processFilters<TRecord extends {}, TResult>(qb: Knex.QueryBuilder<TRecord, TResult>, filters: BaseSqlDataFilter[]): Knex.QueryBuilder<TRecord, TResult>;
    private static applyFiltersRecursive;
    /**
     * Apply a single filter
     */
    private applySingleFilter;
    /**
     * Build a query for a given request
     */
    tableExists(request: TableExistsRequest): Promise<boolean>;
    buildQuery<TRecord extends {}, TResult>(request: DbRequest): Knex.QueryBuilder<TRecord, TResult>;
    buildQuery<TRecord extends {}, TResult>(request: FetchDbRequest): Knex.QueryBuilder<TRecord, TResult[]>;
    runAggregationQuery(request: AggregationRequest): Promise<DataHelperAggregation>;
    buildSchemaModifierQuery(request: SchemaModifierRequest): Knex.SchemaBuilder;
}
//# sourceMappingURL=query_builder.d.ts.map