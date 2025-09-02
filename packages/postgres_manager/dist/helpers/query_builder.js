"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryProcessor = void 0;
const requests_1 = require("../models/requests");
const table_creator_1 = require("./table_creator");
const aggregation_processor_1 = require("./aggregation_processor");
const keyset_cursor_1 = require("./keyset_cursor");
const filter_processor_1 = require("./filter_processor");
const utils_1 = require("./utils");
class QueryProcessor {
    knex;
    constructor(knexInstance) {
        this.knex = knexInstance;
    }
    tableExists(request) {
        return this.knex.schema.hasTable(request.fullTableName);
    }
    // Implementation signature
    buildQuery(request) {
        const safeTable = (0, utils_1.ensureValidColumn)(request.fullTableName);
        let query = this.knex(safeTable);
        if (request instanceof requests_1.GetDataDbRequest) {
            if (request.filters?.length) {
                query = (0, filter_processor_1.processFilters)(query, request.filters, this.knex);
            }
            if (request.orderKeys?.length && request.cursor && Object.keys(request.cursor).length) {
                query = (0, keyset_cursor_1.applyKeysetCursor)(query, this.knex, request.orderKeys, request.cursor, request.strictAfter ?? true);
            }
            if (request.orderKeys?.length) {
                for (const ok of request.orderKeys) {
                    const field = (0, utils_1.ensureValidColumn)(ok.field);
                    const { dir, nulls } = (0, keyset_cursor_1.parseOrder)(ok.sort);
                    if (nulls) {
                        query = query.orderBy(field, dir, nulls);
                    }
                    else {
                        query = query.orderBy(field, dir);
                    }
                }
            }
            else if (request.dataSort) {
                const field = (0, utils_1.ensureValidColumn)(request.dataSort.field);
                const dir = request.dataSort.ascending ? "asc" : "desc";
                query = query.orderBy(field, dir);
            }
            if (request.limit != null) {
                query = query.limit(request.limit);
            }
            if (request.offset != null) {
                query = query.offset(request.offset);
            }
        }
        else if (request instanceof requests_1.GetSingleRecordRequest) {
            query = (0, filter_processor_1.processFilters)(query, [
                {
                    fieldName: request.primaryKeyColumn,
                    value: request.primaryId,
                    filterType: "equals",
                    modifier: {
                        distinct: true,
                        caseInSensitive: false,
                        nullsOrder: "default",
                    }
                }
            ], this.knex);
        }
        else if (request instanceof requests_1.AddSingleDbRequest) {
            const payload = {
                ...request.data,
                [request.primaryKeyColumn]: request.data[request.primaryKeyColumn],
            };
            for (const [k, v] of Object.entries(payload)) {
                if (v !== null && typeof v === 'object') {
                    payload[k] = this.knex.raw('?::jsonb', [JSON.stringify(v)]);
                }
            }
            query = this.knex(safeTable).insert(payload);
        }
        else if (request instanceof requests_1.UpdateSingleDbRequest) {
            query = this.knex(safeTable).where({ [`${request.primaryKeyColumn}`]: request.primaryId }).update(request.updates);
        }
        else if (request instanceof requests_1.DeleteRowDbRequest) {
            query = (0, filter_processor_1.processFilters)(query, request.getFilters(), this.knex).del();
        }
        return query;
    }
    async runAggregationQuery(request) {
        const safeTable = (0, utils_1.ensureValidColumn)(request.fullTableName);
        let q = this.knex(safeTable);
        if (request.filters?.length) {
            q = (0, filter_processor_1.processFilters)(q, request.filters, this.knex);
        }
        return (0, aggregation_processor_1.runAggregation)(q, request, this.knex);
    }
    buildSchemaModifierQuery(request) {
        let query = undefined;
        if (request instanceof requests_1.CreateTableDbRequest) {
            const definition = request.tableDefinition;
            definition.name = request.fullTableName;
            query = (0, table_creator_1.createTable)(this.knex, request.tableDefinition);
        }
        if (query) {
            return query;
        }
        else {
            throw Error('Unsupported query');
        }
    }
}
exports.QueryProcessor = QueryProcessor;
