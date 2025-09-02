// src/ws/subscribe.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type uWS from "uWebSockets.js";
import { sessions, addSub, removeSub } from "../state.js";
import { type ClientMsg, subKey } from "../types.js";
import { LAST_SEEN_LSN, type SubState } from "../lsn.js";
import { deliverBinaryLSN } from "../delivery.js";
import { HotCache } from "../keydb.js";
import { safeSend } from "./io.js";
import type { WsDeps } from "./wire.js";

const hotCache = new HotCache();

/**
 * Handle a subscribe op from a client.
 *
 * Flow:
 * - Ack + publish query meta (optional FB bytes).
 * - Compute subscribe-time LSN fence (max of LAST_SEEN_LSN and resumeFromVersion).
 * - Buffer live diffs while snapshot is fetched.
 * - Send snapshot, flush buffered diffs strictly-after fence.
 * - Publish optional range index.
 * - Replay persisted diffs from KeyDB strictly-after fence (as diffB64 frames).
 */
export async function handleSubscribe(
  ws: uWS.WebSocket<any>,
  msg: ClientMsg,
  deps: WsDeps
) {
  const { table, hashId, resumeFromVersion, queryFbB64 } = (msg as any);
  const id = (ws as any).id;
  const key = subKey(table, hashId);
  const s = sessions.get(id)!;

  addSub(s, key);
  safeSend(ws, { op: "ack", hashId } as any);

  // Publish qmeta (optional; ignore parse errors)
  try {
    if (queryFbB64 && typeof queryFbB64 === "string" && queryFbB64.length > 0) {
      const qfb = Buffer.from(queryFbB64, "base64");
      deps.publishQueryMeta?.(table, hashId, qfb);
    }
  } catch (e) {
    console.warn("[ws] invalid queryFbB64", { table, hashId, err: String((e as any)?.message || e) });
  }

  // LSN fence
  let fence = LAST_SEEN_LSN;
  if (typeof resumeFromVersion === "number" && Number.isFinite(resumeFromVersion)) {
    const r = BigInt(resumeFromVersion);
    if (r > fence) fence = r;
  }

  (s as any).subStates.set(key, { cursorLsn: fence, buffering: true, buffer: [] });
  console.log("[ws] subscribe", {
    id, tenant: s.tenantId, table, hashId,
    resumeFrom: resumeFromVersion ?? 0,
    fenceLSN: fence.toString()
  });

  try {
    // 1) Snapshot (KeyDB-first via deps)
    const companyId = s.tenantId || "demo";
    const snap = await deps.getSnapshot(companyId, table, hashId, fence.toString());
    const rows = snap.rows || [];
    const cursor = snap.cursor || { lsn: fence.toString() };

    safeSend(ws, { op: "snapshot", hashId, version: 0, cursor, rows } as any);

    // 1b) Optional: publish range index (pos→pk) if available
    try {
      let range: string[] | undefined;
      if (typeof (deps as any).getRangeIndex === "function") {
        range = await (deps as any).getRangeIndex(companyId, table, hashId);
      } else if (typeof (hotCache as any).range === "function") {
        // If you added hotCache.range(hashId: string): Promise<string[]>
        range = await (hotCache as any).range(hashId);
      }
      if (Array.isArray(range) && range.length) {
        safeSend(ws, { op: "rangeIndex", hashId, pks: range } as any);
      }
    } catch (e) {
      // best-effort; ignore if missing or cold
      console.warn("[ws] rangeIndex fetch failed", { hashId, err: String((e as any)?.message || e) });
    }

    // 2) Flush buffered in-memory diffs strictly-after fence
    const sub = (s as any).subStates.get(key) as SubState;
    if (sub) {
      sub.buffer.sort((a, b) => (a.lsn < b.lsn ? -1 : a.lsn > b.lsn ? 1 : 0));
      for (const m of sub.buffer) {
        if (m.lsn > sub.cursorLsn) {
          deliverBinaryLSN(hashId, m.payload, m.lsn, s);
          sub.cursorLsn = m.lsn;
        }
      }
      sub.buffer = [];
      sub.buffering = false;
    }

    // 3) Replay persisted diffs from KeyDB strictly AFTER the fence
    try {
      const diffs = await hotCache.diffsAfter(hashId, fence);
      for (const d of diffs) {
        const lsn = BigInt(d.lsn);
        const subState = (s as any).subStates.get(key) as SubState | undefined;
        if (subState && lsn <= subState.cursorLsn) continue;

        // Streams stores base64-encoded diff batches in KeyDB.
        // Send as JSON {op:"diffB64"} so clients decode/apply with the same logic.
        safeSend(ws, { op: "diffB64", hashId, b64: d.b64 } as any);

        if (subState) subState.cursorLsn = lsn;
      }
    } catch {
      // KeyDB replay is best-effort; ignore cache miss/cold start
    }
  } catch (err: any) {
    console.error("[ws] snapshot FAILED", { id, table, err: String(err?.message || err) });
    safeSend(ws, { op: "error", code: "snapshot_failed", message: String(err?.message || err) } as any);
  }
}

/** Handle an unsubscribe op: remove subscription state and clear qmeta downstream. */
export function handleUnsubscribe(
  ws: uWS.WebSocket<any>,
  msg: ClientMsg,
  deps: WsDeps
) {
  const { table, hashId } = (msg as any);
  const id = (ws as any).id;
  const key = subKey(table, hashId);
  const s = sessions.get(id)!;
  removeSub(s, key);
  (s as any).subStates?.delete(key);
  console.log("[ws] unsubscribe", { id, table, hashId });

  // Clear qmeta in Streams (optional hook)
  try { deps.publishQueryMeta?.(table, hashId, null); } catch { /* no-op */ }
}