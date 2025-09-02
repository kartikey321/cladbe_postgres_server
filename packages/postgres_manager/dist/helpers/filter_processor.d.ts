import type { Knex } from "knex";
import { BaseSqlDataFilter } from "../models/filters/filters";
export declare function processFilters<TRecord extends {}, TResult>(qb: Knex.QueryBuilder<TRecord, TResult>, filters: BaseSqlDataFilter[], knex: Knex): Knex.QueryBuilder<TRecord, TResult>;
//# sourceMappingURL=filter_processor.d.ts.map