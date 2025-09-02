// src/ws/wire.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dependencies provided to the WebSocket layer (handlers/app).
 *
 * getSnapshot:
 *   Called on subscribe to produce an initial dataset and cursor that respects the
 *   subscribe-time LSN fence. Typically uses KeyDB HotCache first, falling back to SQL-RPC.
 *
 * publishQueryMeta (optional):
 *   Hook to publish/clear a query payload (e.g., FlatBuffer) to Kafka so downstream Streams
 *   can warm indexes/state keyed by the same query identifier before diffs arrive.
 *
 * Note on identifiers:
 *   The gateway treats `hashId` as an opaque key for routing and cache lookups. If you run
 *   multi-tenant, ensure the upstream `hashId` is already namespaced (e.g., `<tenant>_<table>|<hash>`).
 */
// src/ws/wire.ts (or wherever WsDeps is defined)
export interface WsDeps {
  /** Publish/clear query meta to Streams (FB bytes or null). */
  publishQueryMeta?: (table: string, hashId: string, fb: Buffer | null) => void;

  /** Snapshot from KeyDB (or service in front of it). */
  getSnapshot: (
    companyId: string,
    table: string,
    hashId: string,
    fenceLsn: string
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
}