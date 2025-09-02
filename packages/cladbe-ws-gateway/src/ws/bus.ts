// src/ws/bus.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type uWS from "uWebSockets.js";

/** Registry of active connections for generic typed messages (non-CDC). */
export const connections = new Map<
  string,
  { id: string; socket: uWS.WebSocket<any>; userId?: string }
>();

/** Best-effort JSON send for the generic bus; attaches a server timestamp. */
export function safeSendGeneric(ws: uWS.WebSocket<any>, payload: any) {
  try { ws.send(JSON.stringify({ ...payload, timestamp: Date.now() })); } catch {}
}

/** Broadcast a JSON payload to all connections, optionally excluding one id. */
export function broadcastAll(payload: any, excludeId?: string) {
  for (const [id, c] of connections) {
    if (excludeId && id === excludeId) continue;
    try { c.socket.send(JSON.stringify({ ...payload, timestamp: Date.now() })); } catch {}
  }
}
