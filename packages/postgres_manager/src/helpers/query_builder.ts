import type {Knex} from "knex";
import {BaseSqlDataFilter, OrderKeySpec} from "../models/filters/filters";
import {
    DbRequest,
    FetchDbRequest,
    GetDataDbRequest,
    GetSingleRecordRequest,
    AddSingleDbRequest,
    UpdateSingleDbRequest,
    DeleteRowDbRequest,
    SchemaModifierRequest,
    CreateTableDbRequest,
    AggregationRequest,
    TableExistsRequest
} from "../models/requests";
import {DataHelperAggregation} from "../models/aggregation";
import {createTable} from "./table_creator";
import {runAggregation} from "./aggregation_processor";
import {applyKeysetCursor, parseOrder} from "./keyset_cursor";
import {processFilters} from "./filter_processor";
import {ensureValidColumn} from "./utils";

export class QueryProcessor {
    private readonly knex: Knex;

    constructor(knexInstance: Knex) {
        this.knex = knexInstance;
    }

    public tableExists(request: TableExistsRequest): Promise<boolean> {
        return this.knex.schema.hasTable(request.fullTableName);
    }

    // Method overload signatures
    public buildQuery<TRecord extends {}, TResult>(
        request: DbRequest
    ): Knex.QueryBuilder<TRecord, TResult>;

    public buildQuery<TRecord extends {}, TResult>(
        request: FetchDbRequest
    ): Knex.QueryBuilder<TRecord, TResult[]>;

    // Implementation signature
    public buildQuery<TRecord extends {}, TResult>(
        request: DbRequest | FetchDbRequest
    ): Knex.QueryBuilder<TRecord, any> {
        const safeTable = ensureValidColumn(request.fullTableName);
        let query = this.knex<TRecord, any>(safeTable);

        if (request instanceof GetDataDbRequest) {
            if (request.filters?.length) {
                query = processFilters(query, request.filters, this.knex);
            }

            if (request.orderKeys?.length && request.cursor && Object.keys(request.cursor).length) {
                query = applyKeysetCursor(
                    query,
                    this.knex,
                    request.orderKeys as OrderKeySpec[],
                    request.cursor,
                    request.strictAfter ?? true
                );
            }

            if (request.orderKeys?.length) {
                for (const ok of request.orderKeys as OrderKeySpec[]) {
                    const field = ensureValidColumn(ok.field);
                    const { dir, nulls } = parseOrder(ok.sort);
                    if (nulls) {
                        query = query.orderBy(field, dir, nulls);
                    } else {
                        query = query.orderBy(field, dir);
                    }
                }
            } else if (request.dataSort) {
                const field = ensureValidColumn(request.dataSort.field);
                const dir: "asc" | "desc" = request.dataSort.ascending ? "asc" : "desc";
                query = query.orderBy(field, dir);
            }

            if (request.limit != null) {
                query = query.limit(request.limit);
            }
            if (request.offset != null) {
                query = query.offset(request.offset);
            }
        } else if (request instanceof GetSingleRecordRequest) {
            query = processFilters(query, [
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
        } else if (request instanceof AddSingleDbRequest) {
            const payload: Record<string, any> = {
                ...request.data,
                [request.primaryKeyColumn]: request.data[request.primaryKeyColumn],
            };

            for (const [k, v] of Object.entries(payload)) {
                if (v !== null && typeof v === 'object') {
                    payload[k] = this.knex.raw('?::jsonb', [JSON.stringify(v)]);
                }
            }

            query = this.knex(safeTable).insert(payload);
        } else if (request instanceof UpdateSingleDbRequest) {
            query = this.knex(safeTable).where({[`${request.primaryKeyColumn}`]: request.primaryId}).update(
                request.updates
            );
        } else if (request instanceof DeleteRowDbRequest) {
            query = processFilters(query, request.getFilters(), this.knex).del();
        }

        return query;
    }

    public async runAggregationQuery(request: AggregationRequest): Promise<DataHelperAggregation> {
        const safeTable = ensureValidColumn(request.fullTableName);
        let q = this.knex(safeTable);
        if (request.filters?.length) {
            q = processFilters(q, request.filters, this.knex);
        }
        return runAggregation(q, request, this.knex);
    }

    public buildSchemaModifierQuery(request: SchemaModifierRequest): Knex.SchemaBuilder {
        let query: Knex.SchemaBuilder | undefined = undefined;
        if (request instanceof CreateTableDbRequest) {
            const definition = request.tableDefinition;
            definition.name = request.fullTableName;
            query = createTable(this.knex, request.tableDefinition);
        }
        if (query) {
            return query;
        } else {
            throw Error('Unsupported query');
        }
    }
}