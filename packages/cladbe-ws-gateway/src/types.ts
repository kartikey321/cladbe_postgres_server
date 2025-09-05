// src/types.ts
/**
 * WebSocket wire protocol and routing helpers.
 *
 * The gateway speaks a small op-based protocol to clients. Important ops:
 * - subscribe/unsubscribe identify a table + query `hashId` and optionally a resume LSN.
 * - rpc is a generic passthrough to SQL-RPC (Kafka+FB).
 * - snapshot/diff/diffB64 frames are used to initialize and update client state.
 */
export type ClientMsg =
    | { op: "ping" }
    | {
    op: "subscribe";
    table: string;
    hashId: string;
    // accept either a FlatBuffer (b64) or JSON query string
    queryFbB64?: string;
    queryJson?: string;
    resumeFromVersion?: number;
}
    | { op: "unsubscribe"; table: string; hashId: string }
    | {
    /** Generic RPC call over WS */
    op: "rpc";
    /** One of SqlRpc.RpcMethod names, e.g. "GET_SINGLE" */
    method: string;
    /** Optional override; defaults to the socket tenantId */
    companyId?: string;
    /** Optional; many methods still need a table */
    table?: string;
    /** Free-form payload matching the RPC method’s expected fields */
    payload?: any;
    /** Echoed back in the result */
    correlationId?: string;
};

/** Server → client messages across snapshot/diff and control paths. */
export type ServerMsg =
    | { op: "pong" }
    | { op: "ack"; hashId: string }
    | { op: "snapshot"; hashId: string; version: number; cursor: Record<string, any>; rows: any[] }
    | { op: "diff"; hashId: string; version: number; cursor: Record<string, any>; changes: any[] }
    | { op: "diffB64"; hashId: string; b64: string }
    | {
    op: "rowEvent"; hashId: string; lsn: string; kind: "added" | "modified" | "removed"; pk: string;
    pos?: number | null; from?: number | null; needFetch?: boolean; row?: any
}
    | { op: "rpcResult"; method: string; correlationId?: string; ok: true; data: any }
    | { op: "rpcResult"; method: string; correlationId?: string; ok: false; error: string }
    | { op: "error"; code: string; message: string };

/** Subscription index key. Conventionally `${table}|${hashId}`, but routing uses the `hashId` string itself. */
export type SubKey = string;
/**
 * Compute a subscription key for indexing.
 * Note: The gateway routes by the provided `hashId` string. If you have a multi-tenant setup,
 * ensure the `hashId` you pass is already namespaced (e.g., `<tenant>_<table>|<hash>`), so
 * there are no collisions inside the gateway. The gateway does not enforce any uniqueness
 * policy itself; it just treats `hashId` as an opaque key.
 */
export const subKey = (_table: string, hashId: string) => hashId;