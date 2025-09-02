import type { Knex } from "knex";
import knex from "knex";
import { QueryProcessor } from "./query_builder";
import {
    CreateTableDbRequest,
    AggregationRequest,
    EditDbRequest,
    FetchDbRequest,
    GetDataDbRequest, DeleteRowDbRequest, TableExistsRequest
} from "../models/requests";
import dotenv from 'dotenv';
import { DataHelperAggregation } from "../models/aggregation";

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
        // Non-collection requests keep old behavior
        if (!(request instanceof GetDataDbRequest)) {
            let query = this.queryProcessor.buildQuery(request);
            console.log(query.toQuery());
            return query.select("*").first();
        }

        // Collection requests: snapshot + fence LSN in a REPEATABLE READ tx
        return await this.knex.transaction(
            async (trx) => {
                // 1) Fence snapshot at tx start
                await trx.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

                // 2) Capture LSN under this txn so the snapshot is fixed
                const fenceRow = await trx
                    .raw(`SELECT pg_current_wal_lsn()::text AS lsn`)
                    .then((r: any) => (Array.isArray(r.rows) ? r.rows[0] : r[0]));
                const fence = fenceRow?.lsn || null;

                // 3) Build & run query inside the same txn
                let query = this.queryProcessor.buildQuery(request).transacting(trx);
                console.log(query.toQuery());
                const rows = await query.select('*');

                // 4) Derive next-page cursor from last row (if orderKeys)
                let cursor: Record<string, any> | undefined;
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
            },
            { isolationLevel: 'repeatable read' as any } // if TS complains, use the raw SET above (kept anyway)
        );
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
    async runAggregationQuery(request: AggregationRequest): Promise<DataHelperAggregation> {

        return this.queryProcessor.runAggregationQuery(request);
    }
    async tableExists(request: TableExistsRequest): Promise<boolean> {
        return await this.queryProcessor.tableExists(request);
    }

    async deleteRequest(request: DeleteRowDbRequest) {
        let query = this.queryProcessor.buildQuery(request);
        console.log(query.toQuery());
        return query.returning('*');
    }

}