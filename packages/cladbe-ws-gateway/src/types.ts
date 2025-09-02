// src/types.ts
/**
 * WebSocket wire protocol and routing helpers.
 *
 * The gateway speaks a small op-based protocol to clients. Important ops:
 * - subscribe/unsubscribe identify a table + query `hashId` and optionally a resume LSN.
 * - snapshot/diff/diffB64 frames are used to initialize and update client state.
 */
export type ClientMsg =
    | { op: "ping" }
    | { op: "subscribe"; table: string; hashId: string; queryFbB64: string; resumeFromVersion?: number }
    | { op: "unsubscribe"; table: string; hashId: string };

/** Server → client messages across snapshot/diff and control paths. */
export type ServerMsg =
    | { op: "pong" }
    | { op: "ack"; hashId: string }
    | { op: "snapshot"; hashId: string; version: number; cursor: Record<string, any>; rows: any[] }
    | { op: "diff"; hashId: string; version: number; cursor: Record<string, any>; changes: any[] }
    | { op: "diffB64"; hashId: string; b64: string }
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