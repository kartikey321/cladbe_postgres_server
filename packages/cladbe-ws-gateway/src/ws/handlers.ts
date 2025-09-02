// src/ws/handlers.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type uWS from "uWebSockets.js";
import { randomUUID } from "node:crypto";
import { PING_INTERVAL_MS } from "../config.js";
import { sessions, removeSub } from "../state.js";
import { type ClientMsg } from "../types.js";
import { connections, safeSendGeneric, broadcastAll } from "./bus.js";
import { safeSend } from "./io.js";
import { SLOW_SOCKETS } from "../delivery.js";
import { handleSubscribe, handleUnsubscribe } from "./subscribe.js";
import type { WsDeps } from "./wire.js";
import { subscribeSchema, unsubscribeSchema } from "./schemas.js";

/**
 * Build the uWebSockets.js behavior handlers for the WS endpoint.
 *
 * Encapsulates:
 * - connection lifecycle (upgrade/open/close),
 * - a small typed channel (ping/echo/broadcast/status),
 * - op-protocol dispatch (subscribe/unsubscribe) that ties into snapshot + diff delivery.
 */
export function createWsHandlers(deps: WsDeps): uWS.WebSocketBehavior<any> {
  return {
    idleTimeout: 60,
    maxBackpressure: 1 << 20,
    maxPayloadLength: 1 << 20,

    upgrade: (res, req, context) => {
      try {
        const userId = req.getHeader("x-user-id") || "anonymous";
        const tenantId = req.getHeader("x-tenant") || "demo";
        console.log("[ws] upgrade", { userId, tenantId, url: req.getUrl() });
        res.upgrade(
          { userId, tenantId },
          req.getHeader("sec-websocket-key"),
          req.getHeader("sec-websocket-protocol"),
          req.getHeader("sec-websocket-extensions"),
          context
        );
      } catch (err) {
        console.error("[ws] upgrade failed", err);
        res.writeStatus("400 Bad Request").end("Upgrade failed");
      }
    },

    open: (ws) => {
      const id = randomUUID();
      (ws as any).id = id;

      const s = {
        id,
        socket: ws,
        userId: (ws as any).userId,
        tenantId: (ws as any).tenantId,
        subs: new Set<string>(),
        sendQueue: [] as string[],
        subStates: new Map<string, any>(),
      } as any;
      sessions.set(id, s);

      console.log("[ws] open", { id, userId: s.userId, tenantId: s.tenantId });

      connections.set(id, { id, socket: ws, userId: s.userId });
      safeSendGeneric(ws, { type: "welcome", data: { connectionId: id, connectedClients: connections.size } });
      broadcastAll({ type: "user_joined", data: { userId: s.userId, connectionId: id } }, id);

      const interval = setInterval(() => { try { ws.ping(); } catch {} }, PING_INTERVAL_MS);
      (ws as any)._heartbeat = interval;
    },

    message: (ws, arrayBuffer, isBinary) => {
      const id = (ws as any).id;
      if (isBinary) return;

      let raw: any;
      try {
        raw = JSON.parse(Buffer.from(arrayBuffer).toString("utf8"));
      } catch {
        safeSendGeneric(ws, { type: "error", data: { message: "Invalid JSON message" } });
        return;
      }

      // typed channel
      if (raw && typeof raw.type === "string") {
        const s = sessions.get(id);
        switch (raw.type) {
          case "ping": safeSendGeneric(ws, { type: "pong" }); return;
          case "echo": safeSendGeneric(ws, { type: "echo_response", data: raw.data }); return;
          case "broadcast":
            broadcastAll({ type: "broadcast_message", data: { from: s?.userId, message: raw.data } });
            return;
          case "get_status":
            safeSendGeneric(ws, {
              type: "status",
              data: { connectedClients: connections.size, sessions: sessions.size, uptime: process.uptime() }
            });
            return;
        }
      }

      // op-protocol
      const msg: ClientMsg = raw;
      if ((msg as any).op === "ping") { safeSend(ws, { op: "pong" } as any); return; }

      if (subscribeSchema.safeParse(msg).success) {
        void handleSubscribe(ws, msg, deps);
        return;
      }

      if (unsubscribeSchema.safeParse(msg).success) {
        handleUnsubscribe(ws, msg, deps);
        return;
      }

      safeSend(ws, { op: "error", code: "bad_op", message: "unknown message" } as any);
    },

    drain: (ws) => {
      const s = sessions.get((ws as any).id);
      if (!s) return;

      if ((s as any)._slow) {
        (s as any)._slow = false;
        if ((SLOW_SOCKETS as any) > 0) (SLOW_SOCKETS as any)--;
      }

      while (s.sendQueue.length) {
        const next = s.sendQueue.shift()!;
        const ok = ws.send(next);
        if (!ok) { s.sendQueue.unshift(next); break; }
      }
    },

    pong: (_ws) => {},

    close: (ws) => {
      const id = (ws as any).id;
      clearInterval((ws as any)._heartbeat);

      const s = sessions.get(id);
      if (s) {
        // actively remove subs so reverse index stays consistent
        for (const key of [...s.subs]) removeSub(s, key);
        (s as any).subStates?.clear?.();

        if ((s as any)._slow) {
          (s as any)._slow = false;
          // SLOW_SOCKETS is decremented in drain; nothing to do here.
        }
        sessions.delete(s.id);
        connections.delete(s.id);
        broadcastAll({ type: "user_left", data: { userId: s.userId, connectionId: s.id } });
        console.log("[ws] close", { id, userId: s.userId, tenantId: s.tenantId });
      }
    }
  };
}