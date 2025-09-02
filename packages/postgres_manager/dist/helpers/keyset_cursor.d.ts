import type { Knex } from "knex";
import { OrderKeySpec, OrderSort } from "../models/filters/filters";
export declare function cmpOp(dir: "asc" | "desc", strict: boolean): ">" | ">=" | "<" | "<=";
export declare function parseOrder(sort: OrderSort): {
    dir: "asc" | "desc";
    nulls?: "first" | "last";
};
export declare function applyKeysetCursor<TRecord extends {}, TResult>(qb: Knex.QueryBuilder<TRecord, TResult>, knex: Knex, orderKeys: OrderKeySpec[], cursor: Record<string, any>, strictAfter: boolean): Knex.QueryBuilder<TRecord, TResult>;
//# sourceMappingURL=keyset_cursor.d.ts.map