"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresManager = void 0;
const knex_1 = __importDefault(require("knex"));
const query_builder_1 = require("./query_builder");
const requests_1 = require("../models/requests");
const dotenv_1 = __importDefault(require("dotenv"));
class PostgresManager {
    static instance;
    knex;
    queryProcessor;
    constructor() {
        dotenv_1.default.config();
        this.knex = (0, knex_1.default)({
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
        this.queryProcessor = new query_builder_1.QueryProcessor(this.knex);
    }
    static getInstance() {
        if (!PostgresManager.instance) {
            PostgresManager.instance = new PostgresManager();
        }
        return PostgresManager.instance;
    }
    async getData(request) {
        let query = this.queryProcessor.buildQuery(request);
        console.log(query.toQuery());
        return request instanceof requests_1.GetDataDbRequest ? query.select('*') : query.select('*').first();
    }
    async editData(request) {
        let query = this.queryProcessor.buildQuery(request);
        console.log(query.toQuery());
        return query.returning('*');
    }
    async createTable(request) {
        let query = this.queryProcessor.buildSchemaModifierQuery(request);
        console.log(query.toQuery());
        return query;
    }
    async runAggregationQuery(request) {
        return this.queryProcessor.runAggregationQuery(request);
    }
    async tableExists(request) {
        return await this.queryProcessor.tableExists(request);
    }
    async deleteRequest(request) {
        let query = this.queryProcessor.buildQuery(request);
        console.log(query.toQuery());
        return query.returning('*');
    }
}
exports.PostgresManager = PostgresManager;
