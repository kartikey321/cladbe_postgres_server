// src/ws/app.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import uWS from "uWebSockets.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sessions, addSub, removeSub } from "../state.js";
import { type ClientMsg, type ServerMsg, subKey } from "../types.js";
import { PING_INTERVAL_MS } from "../config.js";
import { LAST_SEEN_LSN, SubState } from "../lsn.js";
import {deliverBinaryLSN, SLOW_SOCKETS} from "../delivery.js";

export type WsDeps = {
    getSnapshot: (companyId: string, table: string) => Promise<any[]>;
};

const subscribeSchema = z.object({
    op: z.literal("subscribe"),
    table: z.string().min(1),
    hashId: z.string().min(1),
    queryFbB64: z.string().min(1),
    resumeFromVersion: z.number().int().nonnegative().optional()
});

const unsubscribeSchema = z.object({
    op: z.literal("unsubscribe"),
    table: z.string().min(1),
    hashId: z.string().min(1)
});

function safeSend(s: uWS.WebSocket<any>, msg: ServerMsg) {
    const buf = JSON.stringify(msg);
    const st = sessions.get((s as any).id);
    if (!st) return;
    const wrote = s.send(buf);
    if (wrote) return;

    (st as any).sendQueue.push(buf);
    if (!(st as any)._slow) { (st as any)._slow = true; (SLOW_SOCKETS as any)++; }
    if ((st as any).sendQueue.length > 1000) {
        (st as any).sendQueue.length = 0;
        s.send(JSON.stringify({ op: "error", code: "overflow", message: "reset-to-snapshot" }));
    }
}

// small generic-channel for “type” messages (optional)
const connections = new Map<string, { id: string; socket: uWS.WebSocket<any>; userId?: string }>();
function safeSendGeneric(ws: uWS.WebSocket<any>, payload: any) {
    try { ws.send(JSON.stringify({ ...payload, timestamp: Date.now() })); } catch {}
}
function broadcastAll(payload: any, excludeId?: string) {
    for (const [id, c] of connections) {
        if (excludeId && id === excludeId) continue;
        try { c.socket.send(JSON.stringify({ ...payload, timestamp: Date.now() })); } catch {}
    }
}

export function createWsApp(deps: WsDeps) {
    return uWS.App({})
        .ws("/*", {
            idleTimeout: 60,
            maxBackpressure: 1 << 20,
            maxPayloadLength: 1 << 20,

            upgrade: (res, req, context) => {
                try {
                    const userId = req.getHeader("x-user-id") || "anonymous";
                    const tenantId = req.getHeader("x-tenant") || "demo";
                    res.upgrade(
                        { userId, tenantId },
                        req.getHeader("sec-websocket-key"),
                        req.getHeader("sec-websocket-protocol"),
                        req.getHeader("sec-websocket-extensions"),
                        context
                    );
                } catch (err) {
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
                    subStates: new Map<string, SubState>(),
                } as any;
                sessions.set(id, s);

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

                // simple type-protocol
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

                // subscribe
                if (subscribeSchema.safeParse(msg).success) {
                    const { table, hashId, resumeFromVersion } = msg as any;
                    const key = subKey(table, hashId);
                    const s = sessions.get(id)!;

                    addSub(s, key);
                    safeSend(ws, { op: "ack", hashId } as any);

                    // fence
                    let fence = LAST_SEEN_LSN;
                    if (typeof resumeFromVersion === "number" && Number.isFinite(resumeFromVersion)) {
                        const r = BigInt(resumeFromVersion);
                        if (r > fence) fence = r;
                    }

                    (s as any).subStates.set(key, { cursorLsn: fence, buffering: true, buffer: [] });

                    // snapshot via dependency (RPC)
                    (async () => {
                        try {
                            const companyId = s.tenantId || "demo";
                            const rows = await deps.getSnapshot(companyId, table);
                            safeSend(ws, {
                                op: "snapshot",
                                hashId,
                                version: 0,
                                cursor: { lsn: fence.toString() },
                                rows
                            } as any);

                            // flush buffered
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
                        } catch (err: any) {
                            safeSend(ws, { op: "error", code: "snapshot_failed", message: String(err?.message || err) } as any);
                        }
                    })();

                    return;
                }

                // unsubscribe
                if (unsubscribeSchema.safeParse(msg).success) {
                    const { table, hashId } = msg as any;
                    const key = subKey(table, hashId);
                    const s = sessions.get(id)!;
                    removeSub(s, key);
                    (s as any).subStates?.delete(key);
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

            close: (ws, _code, _message) => {
                const id = (ws as any).id;
                clearInterval((ws as any)._heartbeat);

                const s = sessions.get(id);
                if (s) {
                    for (const key of [...s.subs]) removeSub(s, key);
                    (s as any).subStates?.clear?.();

                    if ((s as any)._slow) {
                        (s as any)._slow = false;
                        if ((SLOW_SOCKETS as any) > 0) (SLOW_SOCKETS as any)--;
                    }
                    sessions.delete(s.id);
                    connections.delete(s.id);
                    broadcastAll({ type: "user_left", data: { userId: s.userId, connectionId: s.id } });
                }
            }
        })
        .get("/health", (res, _req) => {
            res.writeHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
                status: "healthy",
                connections: [...sessions.keys()].length, // lightweight
                sessions: sessions.size,
                uptime: process.uptime(),
                slowSockets: SLOW_SOCKETS
            }));
        })
        .any("/*", (res, _req) => void res.writeStatus("200 OK").end("cladbe-ws-gateway"));
}