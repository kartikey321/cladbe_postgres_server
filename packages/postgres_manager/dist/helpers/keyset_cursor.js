"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmpOp = cmpOp;
exports.parseOrder = parseOrder;
exports.applyKeysetCursor = applyKeysetCursor;
const utils_1 = require("./utils");
function cmpOp(dir, strict) {
    if (dir === "asc")
        return strict ? ">" : ">=";
    return strict ? "<" : "<=";
}
function parseOrder(sort) {
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
function applyKeysetCursor(qb, knex, orderKeys, cursor, strictAfter) {
    const keys = orderKeys.filter(k => Object.prototype.hasOwnProperty.call(cursor, k.field));
    if (!keys.length)
        return qb;
    const cols = keys.map(k => {
        const safe = (0, utils_1.ensureValidColumn)(k.field);
        const { dir } = parseOrder(k.sort);
        return { field: safe, dir };
    });
    qb.andWhere(function () {
        const root = this;
        cols.forEach((k, i) => {
            root.orWhere(function () {
                const level = this;
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
