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
        // Non-collection requests keep old behavior
        if (!(request instanceof requests_1.GetDataDbRequest)) {
            let query = this.queryProcessor.buildQuery(request);
            console.log(query.toQuery());
            return query.select("*").first();
        }
        // Collection requests: snapshot + fence LSN in a REPEATABLE READ tx
        return await this.knex.transaction(async (trx) => {
            // 1) Fence snapshot at tx start
            await trx.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
            // 2) Capture LSN under this txn so the snapshot is fixed
            const fenceRow = await trx
                .raw(`SELECT pg_current_wal_lsn()::text AS lsn`)
                .then((r) => (Array.isArray(r.rows) ? r.rows[0] : r[0]));
            const fence = fenceRow?.lsn || null;
            // 3) Build & run query inside the same txn
            let query = this.queryProcessor.buildQuery(request).transacting(trx);
            console.log(query.toQuery());
            const rows = await query.select('*');
            // 4) Derive next-page cursor from last row (if orderKeys)
            let cursor;
            if (Array.isArray(request.orderKeys) && request.orderKeys.length && rows.length) {
                const last = rows[rows.length - 1];
                cursor = {};
                for (const ok of request.orderKeys) {
                    cursor[ok.field] = last[ok.field];
                }
            }
            // Always include fence LSN so the gateway can resume CDC safely
            cursor = { ...(cursor || {}), ...(fence ? { lsn: fence } : {}) };
            return { rows, cursor };
        }, { isolationLevel: 'repeatable read' } // if TS complains, use the raw SET above (kept anyway)
        );
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
