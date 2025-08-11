import type {Knex} from "knex";
import knex from "knex";
import {QueryProcessor} from "./query_builder";
import {FetchDbRequest} from "../models/filters/filters";

export class PostgresManager {
    private static instance: PostgresManager;
    public knex: Knex;
    public queryProcessor: QueryProcessor;

    private constructor() {
        this.knex = knex({
            client: "pg",
            connection: {
                host: "127.0.0.1",
                user: "your_user",
                password: "your_password",
                database: "your_database"
            }
        });
        this.queryProcessor = new QueryProcessor(this.knex);
    }

    public static getInstance(): PostgresManager {
        if (!PostgresManager.instance) {
            PostgresManager.instance = new PostgresManager();
        }
        return PostgresManager.instance;
    }

    async getData(request: FetchDbRequest) {
        let query = this.queryProcessor.buildQuery(request);
        return query.select('*');
    }

}