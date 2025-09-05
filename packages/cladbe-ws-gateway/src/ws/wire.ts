// src/ws/wire.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SqlRpcClient } from "../rpc/sql-rpc.js";

/**
 * Dependencies provided to the WebSocket layer (handlers/app).
 */
export interface WsDeps {
    /** Publish/clear query meta to Streams (FB bytes or null). */
    publishQueryMeta?: (routingKey: string, fb: Buffer | null) => void;

    /** Snapshot from KeyDB (or service in front of it). */
    getSnapshot: (
        companyId: string,
        table: string,
        hashId: string,
        fenceLsn: string,
        query?: { fbB64?: string; json?: string }
    ) => Promise<{ rows: any[]; cursor: { lsn: string } }>;

    /**
     * OPTIONAL: Return the ordered PK list for the current page.
     * If omitted, subscribe.ts will fall back to HotCache.range(hashId).
     */
    getRangeIndex?: (
        companyId: string,
        table: string,
        hashId: string
    ) => Promise<string[] | undefined>;

    /** SqlRpc client — used by the generic "rpc" WebSocket op. */
    sqlRpc?: SqlRpcClient;
}