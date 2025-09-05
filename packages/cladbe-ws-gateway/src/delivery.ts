// src/delivery.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SubState } from "./lsn.js";
import { MAX_QUEUE } from "./config.js";
import { sessions } from "./state.js";
import { safeSend } from "./ws/io.js";
import { HotCache } from "./keydb.js";
const hotCache = new HotCache();

/**
 * Global count of sessions currently marked as slow (backpressured).
 *
 * Why: Exposed to health and used by the CDC consumer flow-control loop to
 * pause consumption when too many clients cannot keep up. This prevents the
 * gateway process from buffering unbounded data and helps bound end-to-end lag.
 */
export let SLOW_SOCKETS = 0;
export function markSlow() { SLOW_SOCKETS++; }
export function markFast() { if (SLOW_SOCKETS > 0) SLOW_SOCKETS--; }
/**
 * Fan-out a binary CDC diff (FlatBuffer payload) to all subscribed sessions for a given query hashId.
 *
 * System role:
 * - This function is called by the Kafka consumer whenever a new CDC event arrives.
 * - It ensures that every WebSocket client with an active subscription to `hashId` gets the update,
 *   but only if their subscription’s cursor LSN is behind the new event’s LSN.
 * - It also persists the diff into the KeyDB HotCache so late subscribers or reconnecting clients
 *   can replay missed diffs strictly after their LSN fence.
 *
 * Behavior details:
 * - If a session is still waiting for its initial snapshot (`sub.buffering = true`), the diff is
 *   temporarily buffered in memory until the snapshot completes.
 * - If the socket is writable, the diff is sent as a raw binary frame (fast path).
 * - If the socket is backpressured, the diff is queued as a base64 JSON frame (`diffB64`) and the
 *   session is marked as "slow". Too many queued frames triggers a reset-to-snapshot error to avoid
 *   unbounded memory growth.
 * - The `sub.cursorLsn` is updated after successful delivery to track progress.
 *
 * Parameters:
 * - hashId: unique identifier for the query (tenant_table|queryHash).
 * - payload: raw Buffer containing the FlatBuffer CDC diff.
 * - lsn: WAL position of this event (bigint, monotonically increasing).
 * - onlySession: optional — if provided, restrict delivery to a single session (used when flushing
 *   buffered diffs after a snapshot).
 *
 * Returns:
 * - The number of sessions successfully delivered to.
 *
 * Related modules:
 * - HotCache.addDiff → persists diffs keyed by LSN.
 * - SubState in lsn.ts → tracks per-subscription cursor and buffering state.
 * - KeyDB replay in ws/app.ts → uses these stored diffs to catch up new subscribers.
 */
export function deliverBinaryLSN(hashId: string, payload: Buffer, lsn: bigint, onlySession?: any) {
  const targetSessions = onlySession ? [onlySession] : [...sessions.values()];
  let delivered = 0;

  // Fire-and-forget: store the diff in KeyDB for replay
  // We prefer base64 as the neutral storage format.
  const b64 = payload.toString("base64");
  void hotCache.addDiff(hashId, lsn.toString(), b64).catch(() => { /* non-fatal */ });

 for (const st of targetSessions) {
  for (const subKey of st.subs) {
    if (subKey !== hashId) continue; // exact match on routingKey
    
      const subStates: Map<string, SubState> = (st as any).subStates ?? new Map();
    const sub = subStates.get(subKey);
      if (!sub) continue;

      // If snapshot still in-flight, buffer
      if (sub.buffering) { sub.buffer.push({ lsn, payload }); continue; }
      if (lsn <= sub.cursorLsn) continue;

      // Send Buffer directly (uWS accepts Node Buffers)
      const ok = st.socket.send(payload, true, false);
      if (ok) {
        sub.cursorLsn = lsn;
        delivered++;
      } else {
        // Fall back to base64 frame, mark slow and apply local backpressure
        st.sendQueue.push(JSON.stringify({ op: "diffB64", hashId, b64 }));
        if (!(st as any)._slow) { (st as any)._slow = true; SLOW_SOCKETS++; }
        if (st.sendQueue.length > MAX_QUEUE) {
          st.sendQueue.length = 0;
          st.socket.send(JSON.stringify({ op: "error", code: "overflow", message: "reset-to-snapshot" }));
        }
      }
    }
  }
  return delivered;
}


/**
 * Fan-out a JSON row-event envelope to all sessions subscribed to `routingKey` (== hashId).
 * Uses the same backpressure path as other JSON frames via safeSend.
 */
export function deliverRowEvent(
  routingKey: string,
  ev: { hashId: string; lsn: string; kind: "added"|"modified"|"removed"; pk: string; pos?: number | null; from?: number | null; needFetch?: boolean; row?: any }
) {
  let delivered = 0;
  for (const s of sessions.values()) {
    if (!s.subs.has(routingKey)) continue;
    safeSend(s.socket as any, { op: "rowEvent", ...ev } as any);
    delivered++;
  }
  return delivered;
}

