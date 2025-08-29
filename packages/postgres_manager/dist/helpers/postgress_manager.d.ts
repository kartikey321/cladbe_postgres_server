import type { Knex } from "knex";
import { QueryProcessor } from "./query_builder";
import { CreateTableDbRequest, AggregationRequest, EditDbRequest, FetchDbRequest, DeleteRowDbRequest, TableExistsRequest } from "../models/requests";
import { DataHelperAggregation } from "../models/aggregation";
export declare class PostgresManager {
    private static instance;
    knex: Knex;
    queryProcessor: QueryProcessor;
    private constructor();
    static getInstance(): PostgresManager;
    getData(request: FetchDbRequest): Promise<any>;
    editData(request: EditDbRequest): Promise<any[]>;
    createTable(request: CreateTableDbRequest): Promise<void>;
    runAggregationQuery(request: AggregationRequest): Promise<DataHelperAggregation>;
    tableExists(request: TableExistsRequest): Promise<boolean>;
    deleteRequest(request: DeleteRowDbRequest): Promise<any[]>;
}
//# sourceMappingURL=postgress_manager.d.ts.map