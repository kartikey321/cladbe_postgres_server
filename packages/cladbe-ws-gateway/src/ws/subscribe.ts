// src/ws/subscribe.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type uWS from "uWebSockets.js";
import { sessions, addSub, removeSub } from "../state.js";
import { type ClientMsg } from "../types.js";
import { LAST_SEEN_LSN, type SubState } from "../lsn.js";
import { deliverBinaryLSN } from "../delivery.js";
import { HotCache } from "../keydb.js";
import { safeSend } from "./io.js";
import type { WsDeps } from "./wire.js";
import { encodeStreamingFilterJson } from "./json-to-fb.js";

const hotCache = new HotCache();

/**
 * Handle a subscribe op from a client.
 *
 * Flow:
 * - Ack + publish query meta (fb) to Streams (qmeta topic) using the full routingKey.
 * - Compute subscribe-time LSN fence (max of LAST_SEEN_LSN and resumeFromVersion).
 * - Buffer live diffs while snapshot is fetched.
 * - Send snapshot, flush buffered diffs strictly-after fence.
 * - Optional: publish range index.
 * - Replay persisted diffs from KeyDB strictly-after fence.
 */
export async function handleSubscribe(
  ws: uWS.WebSocket<any>,
  msg: ClientMsg,
  deps: WsDeps
) {
  const { table, hashId, resumeFromVersion, queryFbB64, queryJson } = (msg as any);
  const id = (ws as any).id;
  const s  = sessions.get(id)!;

  // Fully-qualified routing key for EVERYTHING downstream (Streams, cache, fan-out)
  const routingKey = `${s.tenantId}_${table}|${hashId}`;

  // Track this subscription by routingKey (so it matches CDC/KeyDB/Streams)
  addSub(s, routingKey);
  safeSend(ws, { op: "ack", hashId } as any);

  // --- Publish qmeta (build from JSON if provided, else use FB b64) ---
  try {
    let buf: Buffer | null = null;
    if (typeof queryJson === "string" && queryJson.length > 0) {
      buf = encodeStreamingFilterJson(JSON.parse(queryJson));
    } else if (typeof queryFbB64 === "string" && queryFbB64.length > 0) {
      buf = Buffer.from(queryFbB64, "base64");
    }
    if (buf) deps.publishQueryMeta?.(routingKey, buf);
  } catch (e) {
    console.warn("[ws] invalid query payload", { table, hashId, err: String((e as any)?.message || e) });
  }

  // --- LSN fence (subscribe watermark) ---
  let fence = LAST_SEEN_LSN;
  if (typeof resumeFromVersion === "number" && Number.isFinite(resumeFromVersion)) {
    const r = BigInt(resumeFromVersion);
    if (r > fence) fence = r;
  }

  (s as any).subStates.set(routingKey, { cursorLsn: fence, buffering: true, buffer: [] } as SubState);

  console.log("[ws] subscribe", {
    id, tenant: s.tenantId, table, hashId,
    resumeFrom: resumeFromVersion ?? 0,
    fenceLSN: fence.toString(),
    routingKey
  });

  try {
    // 1) Snapshot (KeyDB-first via deps.getSnapshot)
    const snap = await deps.getSnapshot(s.tenantId || "demo", table, hashId, fence.toString(), {
      fbB64: queryFbB64,
      json:  queryJson
    });
    const rows   = snap.rows   || [];
    const cursor = snap.cursor || { lsn: fence.toString() };

    safeSend(ws, { op: "snapshot", hashId, version: 0, cursor, rows } as any);

    // 1b) Optional range index
    try {
      let range: string[] | undefined;
      if (typeof (deps as any).getRangeIndex === "function") {
        range = await (deps as any).getRangeIndex(s.tenantId || "demo", table, hashId);
      } else if (typeof (hotCache as any).range === "function") {
        range = await (hotCache as any).range(routingKey);
      }
      if (Array.isArray(range) && range.length) {
        safeSend(ws, { op: "rangeIndex", hashId, pks: range } as any);
      }
    } catch (e) {
      console.warn("[ws] rangeIndex fetch failed", { hashId, err: String((e as any)?.message || e) });
    }

    // 2) Flush buffered diffs strictly-after fence
    const sub = (s as any).subStates.get(routingKey) as SubState | undefined;
    if (sub) {
      sub.buffer.sort((a, b) => (a.lsn < b.lsn ? -1 : a.lsn > b.lsn ? 1 : 0));
      for (const m of sub.buffer) {
        if (m.lsn > sub.cursorLsn) {
          deliverBinaryLSN(routingKey, m.payload, m.lsn, s);
          sub.cursorLsn = m.lsn;
        }
      }
      sub.buffer = [];
      sub.buffering = false;
    }

    // 3) Replay persisted diffs from KeyDB strictly AFTER the fence
    try {
      const diffs = await hotCache.diffsAfter(routingKey, fence);
      const st = (s as any).subStates.get(routingKey) as SubState | undefined;
      for (const d of diffs) {
        const lsn = BigInt(d.lsn);
        if (st && lsn <= st.cursorLsn) continue;
        safeSend(ws, { op: "diffB64", hashId, b64: d.b64 } as any);
        if (st) st.cursorLsn = lsn;
      }
    } catch {
      // cache miss — ok
    }
  } catch (err: any) {
    console.error("[ws] snapshot FAILED", {
      id, table, message: err?.message, err
    });
    safeSend(ws, { op: "error", code: "snapshot_failed", message: String(err?.message || err) } as any);
  }
}

/** Unsubscribe: remove state and clear qmeta */
export function handleUnsubscribe(
  ws: uWS.WebSocket<any>,
  msg: ClientMsg,
  deps: WsDeps
) {
  const { table, hashId } = (msg as any);
  const id = (ws as any).id;
  const s  = sessions.get(id)!;
  const routingKey = `${s.tenantId}_${table}|${hashId}`;

  removeSub(s, routingKey);
  (s as any).subStates?.delete(routingKey);
  console.log("[ws] unsubscribe", { id, table, hashId, routingKey });

  try { deps.publishQueryMeta?.(routingKey, null); } catch { /* no-op */ }
}