// src/ws/rpc.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type uWS from "uWebSockets.js";
import { safeSend } from "./io.js";
import type { WsDeps } from "./wire.js";

/**
 * Handle a generic WS RPC op by delegating to SqlRpcClient.
 * Expects a message like:
 *  {
 *    op: "rpc",
 *    method: "GET_SINGLE" | "GET_DATA" | ...,
 *    companyId?: string,       // defaults to socket.tenantId
 *    table?: string,           // required for table-scoped calls
 *    correlationId?: string,   // echoed back
 *    payload?: any             // method-specific
 *  }
 */
export async function handleRpc(
    ws: uWS.WebSocket<any>,
    msg: {
        op: "rpc";
        method: string;
        companyId?: string;
        table?: string;
        payload?: any;
        correlationId?: string;
    },
    deps: WsDeps
) {
    const rpc = deps.sqlRpc;
    if (!rpc) {
        safeSend(ws, {
            op: "rpcResult",
            method: msg.method,
            correlationId: msg.correlationId,
            ok: false,
            error: "SQL RPC client is not available",
        } as any);
        return;
    }

    const tenantId = (ws as any).tenantId || "demo";
    const companyId = msg.companyId || tenantId;
    const method = String(msg.method || "");
    const table = msg.table || msg.payload?.tableName || msg.payload?.table || "";
    const corr = msg.correlationId;

    try {
        let data: any;

        switch (method) {
            // -------------------- READS --------------------
            case "GET_DATA": {
                // Accept either: payload.queryJson (preferred) or legacy { limit, offset, wrapper/order/cursor }
                const p = msg.payload || {};
                if (typeof p.queryJson === "string" && p.queryJson.length > 0) {
                    data = await rpc.getDataSnapshotWithQueryJson(companyId, table, p.queryJson);
                } else if (p.wrapper || p.order || p.cursor || p.limit != null) {
                    // Build a JSON spec from the loose fields if caller didn't pre-stringify
                    const spec = {
                        wrapper: p.wrapper,
                        order: p.order,
                        cursor: p.cursor,
                        limit: p.limit,
                        strict_after: p.strict_after ?? true,
                    };
                    data = await rpc.getDataSnapshotWithQueryJson(
                        companyId,
                        table,
                        JSON.stringify(spec)
                    );
                } else {
                    const limit = Number.isFinite(Number(p.limit)) ? Number(p.limit) : 500;
                    const offset = Number.isFinite(Number(p.offset)) ? Number(p.offset) : 0;
                    data = await rpc.getDataSnapshot(companyId, table, limit, offset);
                }
                break;
            }

            case "GET_SINGLE": {
                const p = msg.payload || {};
                data = await rpc.getSingle(
                    companyId,
                    table,
                    String(p.primaryKeyColumn || p.primary_key_column || "id"),
                    String(p.primaryId ?? p.primary_id ?? "")
                );
                break;
            }

            // -------------------- WRITES --------------------
            case "ADD_SINGLE": {
                const p = msg.payload || {};
                data = await rpc.addSingle(
                    companyId,
                    table,
                    String(p.primaryKeyColumn || p.primary_key_column || "id"),
                    (p.row || p.row_json || p.data || p.rowJson || p.row_json_parsed) ??
                    (typeof p.row_json === "string" ? JSON.parse(p.row_json) : {})
                );
                break;
            }

            case "UPDATE_SINGLE": {
                const p = msg.payload || {};
                const updates =
                    p.updates ??
                    p.updates_json ??
                    (typeof p.updates_json === "string" ? JSON.parse(p.updates_json) : {});
                data = await rpc.updateSingle(
                    companyId,
                    table,
                    String(p.primaryKeyColumn || p.primary_key_column || "id"),
                    String(p.primaryId ?? p.primary_id ?? ""),
                    updates
                );
                break;
            }

            case "DELETE_ROW": {
                const p = msg.payload || {};
                data = await rpc.deleteRow(
                    companyId,
                    table,
                    String(p.primaryKeyColumn || p.primary_key_column || "id"),
                    String(p.primaryId ?? p.primary_id ?? "")
                );
                break;
            }

            // -------------------- DDL / META --------------------
            case "CREATE_TABLE": {
                const p = msg.payload || {};
                const def =
                    p.definition ??
                    (typeof p.definition_json === "string" ? JSON.parse(p.definition_json) : p.definition_json);
                data = await rpc.createTable(companyId, def);
                break;
            }

            case "TABLE_EXISTS": {
                data = await rpc.tableExists(companyId, table);
                break;
            }

            // -------------------- AGGREGATION --------------------
            case "RUN_AGGREGATION": {
                const p = msg.payload || {};
                data = await rpc.runAggregation({
                    companyId,
                    tableName: table,
                    countEnabled: !!p.countEnabled || !!p.count_enabled,
                    sumFields: p.sumFields ?? p.sum_fields,
                    averageFields: p.averageFields ?? p.average_fields,
                    minimumFields: p.minimumFields ?? p.minimum_fields,
                    maximumFields: p.maximumFields ?? p.maximum_fields,
                    wrapper: p.wrapper, // client wrapper JSON (filter_wrapper_type/filters)
                });
                break;
            }

            default: {
                safeSend(ws, {
                    op: "rpcResult",
                    method,
                    correlationId: corr,
                    ok: false,
                    error: `Unknown RPC method: ${method}`,
                } as any);
                return;
            }
        }

        safeSend(ws, {
            op: "rpcResult",
            method,
            correlationId: corr,
            ok: true,
            data,
        } as any);
    } catch (err: any) {
        safeSend(ws, {
            op: "rpcResult",
            method,
            correlationId: corr,
            ok: false,
            error: String(err?.message || err),
        } as any);
    }
}