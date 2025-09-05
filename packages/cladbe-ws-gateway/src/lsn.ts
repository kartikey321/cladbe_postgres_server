// src/lsn.ts

/**
 * Monotonic watermark of the latest WAL LSN observed from the CDC stream.
 *
 * Why: Used to fence snapshots at subscribe time so diffs delivered after the
 * subscription are strictly-after the snapshot’s LSN. This enforces ordering and
 * avoids duplicates.
 */
// src/lsn.ts
export let LAST_SEEN_LSN: bigint = 0n;

export function updateLastSeenLsn(v: bigint) {
  if (v > LAST_SEEN_LSN) LAST_SEEN_LSN = v;
}

/** unchanged helpers below **/
export function asArrayBuffer(buf: Buffer): ArrayBuffer {
  const out = new ArrayBuffer(buf.byteLength);
  new Uint8Array(out).set(buf);
  return out;
}

export function readLsnHeader(msg: { headers?: any }): bigint {
  const h = (msg as any)?.headers?.() ?? (msg as any)?.headers;
  const raw = h?.lsn ?? h?.LSN ?? h?.__lsn;
  if (!raw) return 0n;
  try { return BigInt(Buffer.isBuffer(raw) ? raw.toString() : String(raw)); }
  catch { return 0n; }
}

export interface SubState {
  cursorLsn: bigint;
  buffering: boolean;
  buffer: { lsn: bigint; payload: Buffer }[];
}