import type {Knex} from "knex";
import knex from "knex";
import {QueryProcessor} from "./query_builder";
import {CreateTableDbRequest, EditDbRequest, FetchDbRequest, GetDataDbRequest} from "../models/requests";
import dotenv from 'dotenv';

export class PostgresManager {
    private static instance: PostgresManager;
    public knex: Knex;
    public queryProcessor: QueryProcessor;

    private constructor() {
        dotenv.config();
        this.knex = knex({
            client: "pg",
            connection: {

                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWORD,
                database: process.env.PGDATABASE,
                port: Number(process.env.PGPORT),
                debug: true,

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
        console.log(query.toQuery());
        return request instanceof GetDataDbRequest ? query.select('*') : query.select('*').first();
    }


    async editData(request: EditDbRequest) {
        let query = this.queryProcessor.buildQuery(request);
        console.log(query.toQuery());
        return query.returning('*');
    }

    async createTable(request: CreateTableDbRequest) {
        let query = this.queryProcessor.buildSchemaModifierQuery(request);
        console.log(query.toQuery());
        return query;
    }

}