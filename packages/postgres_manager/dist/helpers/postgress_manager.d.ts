import type { Knex } from "knex";
import { QueryProcessor } from "./query_builder";
import { CreateTableDbRequest, EditDbRequest, FetchDbRequest } from "../models/requests";
export declare class PostgresManager {
    private static instance;
    knex: Knex;
    queryProcessor: QueryProcessor;
    private constructor();
    static getInstance(): PostgresManager;
    getData(request: FetchDbRequest): Promise<any>;
    editData(request: EditDbRequest): Promise<any[]>;
    createTable(request: CreateTableDbRequest): Promise<void>;
}
//# sourceMappingURL=postgress_manager.d.ts.map