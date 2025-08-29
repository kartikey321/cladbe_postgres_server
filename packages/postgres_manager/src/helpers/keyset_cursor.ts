import type {Knex} from "knex";
import {OrderKeySpec, OrderSort} from "../models/filters/filters";
import {ensureValidColumn} from "./utils";

export function cmpOp(dir: "asc" | "desc", strict: boolean): ">" | ">=" | "<" | "<=" {
    if (dir === "asc") return strict ? ">" : ">=";
    return strict ? "<" : "<=";
}

export function parseOrder(sort: OrderSort): { dir: "asc" | "desc"; nulls?: "first" | "last" } {
    switch (sort) {
        case "ASC_DEFAULT": return { dir: "asc" };
        case "ASC_NULLS_FIRST": return { dir: "asc", nulls: "first" };
        case "ASC_NULLS_LAST": return { dir: "asc", nulls: "last" };
        case "DESC_DEFAULT": return { dir: "desc" };
        case "DESC_NULLS_FIRST": return { dir: "desc", nulls: "first" };
        case "DESC_NULLS_LAST": return { dir: "desc", nulls: "last" };
        default: return { dir: "desc" };
    }
}

export function applyKeysetCursor<TRecord extends {}, TResult>(
    qb: Knex.QueryBuilder<TRecord, TResult>,
    knex: Knex,
    orderKeys: OrderKeySpec[],
    cursor: Record<string, any>,
    strictAfter: boolean
) {
    const keys = orderKeys.filter(k => Object.prototype.hasOwnProperty.call(cursor, k.field));
    if (!keys.length) return qb;

    const cols = keys.map(k => {
        const safe = ensureValidColumn(k.field);
        const { dir } = parseOrder(k.sort);
        return { field: safe, dir };
    });

    qb.andWhere(function () {
        const root = this as Knex.QueryBuilder<TRecord, TResult>;
        cols.forEach((k, i) => {
            root.orWhere(function () {
                const level = this as Knex.QueryBuilder<TRecord, TResult>;
                for (let j = 0; j < i; j++) {
                    level.andWhereRaw("?? = ?", [cols[j].field, cursor[cols[j].field]]);
                }
                const op = cmpOp(k.dir, strictAfter);
                level.andWhereRaw(`?? ${op} ?`, [k.field, cursor[k.field]]);
            });
        });
    });

    return qb;
}