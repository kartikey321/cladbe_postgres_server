// src/lsn.ts

/**
 * Monotonic watermark of the latest WAL LSN observed from the CDC stream.
 *
 * Why: Used to fence snapshots at subscribe time so diffs delivered after the
 * subscription are strictly-after the snapshot’s LSN. This enforces ordering and
 * avoids duplicates.
 */
export let LAST_SEEN_LSN: bigint = 0n;

/** Copy a Node Buffer into a standalone ArrayBuffer (uWS binary frame friendly). */
export function asArrayBuffer(buf: Buffer): ArrayBuffer {
  const out = new ArrayBuffer(buf.byteLength);
  new Uint8Array(out).set(buf); // copies bytes from Node Buffer
  return out;
}

/**
 * Decode an LSN from Kafka headers or message metadata.
 *
 * Assumptions: Debezium/Streams encode LSN in headers; adapt field names as needed.
 * Returns 0n if absent or unparsable. LSN values must be monotonically increasing
 * across the CDC stream partitions the gateway consumes.
 */
export function readLsnHeader(msg: { headers?: any }): bigint {
  const h = (msg as any)?.headers?.() ?? (msg as any)?.headers;
  const raw = h?.lsn ?? h?.LSN ?? h?.__lsn;
  if (!raw) return 0n;
  try { return BigInt(Buffer.isBuffer(raw) ? raw.toString() : String(raw)); }
  catch { return 0n; }
}

/**
 * SubState
 *
 * Tracks per-subscription delivery state:
 * - cursorLsn: last WAL position successfully delivered to the client.
 * - buffering: true while initial snapshot is in flight; diffs buffered instead of sent.
 * - buffer: in-memory backlog (lsn, payload) to flush after snapshot.
 */
export interface SubState {
  cursorLsn: bigint;
  buffering: boolean;
  buffer: { lsn: bigint; payload: Buffer }[];
}
