// src/ws/io.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type uWS from "uWebSockets.js";
import { sessions } from "../state.js";
import type { ServerMsg } from "../types.js";
import {markSlow, SLOW_SOCKETS} from "../delivery.js";

/**
 * Send a JSON frame to a single WebSocket with backpressure handling.
 *
 * Why: uWS can signal a socket is backpressured (send returns false). We queue messages
 * per-session and mark the session as "slow" to let the CDC flow-control pause if too
 * many sockets are lagging. A hard cap prevents unbounded growth and forces clients to
 * refresh via snapshot.
 *
 * How it fits: Used by handlers to send control frames (ack, error, snapshot metadata)
 * and by fallback paths when binary diff delivery is not possible.
 */
export function safeSend(s: uWS.WebSocket<any>, msg: ServerMsg) {
  const buf = JSON.stringify(msg);
  const st = sessions.get((s as any).id);
  if (!st) return;
  const wrote = s.send(buf);
  if (wrote) return;

  (st as any).sendQueue.push(buf);
  if (!(st as any)._slow) { (st as any)._slow = true; markSlow(); }
  if ((st as any).sendQueue.length > 1000) {
    (st as any).sendQueue.length = 0;
    s.send(JSON.stringify({ op: "error", code: "overflow", message: "reset-to-snapshot" }));
  }
}
