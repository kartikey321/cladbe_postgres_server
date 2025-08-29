import uWS from "uWebSockets.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sessions, addSub, removeSub, subToSessions } from "./state.js";
import { type ClientMsg, type ServerMsg, subKey } from "./types.js";
import { GatewayConsumer } from "./kafka.js";

const PORT = Number(process.env.WS_PORT || 7000);
const PING_INTERVAL_MS = 25_000;
const MAX_QUEUE = 1000; // frames per connection

// Kafka config (filtered CDC fan-out)
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";
const KAFKA_GROUP   = process.env.KAFKA_GROUP   || "cladbe-ws-gateway";
const KAFKA_TOPICS  = (process.env.KAFKA_TOPICS || "server.cdc.filtered").split(",");

// ---------------- LSN support (headers-only; no payload decoding) ----------------
type SubState = {
    cursorLsn: bigint;   // watermark for this subscription
    buffering: boolean;  // true until snapshot sent
    buffer: Array<{ lsn: bigint; payload: Buffer }>;
};

let LAST_SEEN_LSN: bigint = 0n;

// node-rdkafka headers arrive as Array<{ key: string, value: Buffer|string|null }>
function readLsnHeader(raw: any): bigint {
    const hs: Array<{ key: string; value: any; }> | undefined = (raw as any).headers;
    if (!hs || !Array.isArray(hs)) return 0n;
    const h = hs.find(x => x && x.key === 'lsn');
    if (!h || !h.value) return 0n;
    const v = h.value as Buffer | string;
    const buf = Buffer.isBuffer(v) ? v : Buffer.from(String(v), 'binary');
    if (buf.length !== 8) return 0n;
    return buf.readBigUInt64BE(0);
}

// -------------------------------------------------------------------------------

// global backpressure tracking for coarse consumer flow control
let SLOW_SOCKETS = 0;

function asArrayBuffer(buf: Buffer): ArrayBuffer {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function parseSubprotocol(req: uWS.HttpRequest) {
    const raw = req.getHeader("sec-websocket-protocol") || "";
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);

    // If the client sent any subprotocols, the first one is “chosen”
    const chosen = parts.length ? parts[0] : undefined;

    // Accept bearer even if empty: "bearer." → token === ""
    const bearerPart = parts.find(p => p.startsWith("bearer."));
    const token = bearerPart !== undefined ? bearerPart.slice("bearer.".length) : undefined;

    return { chosen, token, rawProto: raw };
}

// --- minimal auth stub ---
function authenticate(req: uWS.HttpRequest) {
    const { chosen, token, rawProto } = parseSubprotocol(req);

    // Keep tenant/user plumbing, fall back safely
    const tenantId = req.getHeader("x-tenant") || "demo";
    const userId   = req.getHeader("x-user") || (token ?? "anon");

    // Auth “shape” stays intact; allow empty/missing token for now
    const isAuthenticated = token !== undefined && token.length > 0;

    // TODO: when ready, verify token here and set ok=false on failure
    return { ok: true, userId, tenantId, chosen, rawProto, isAuthenticated };
}

function safeSend(s: uWS.WebSocket<any>, msg: ServerMsg) {
    const buf = JSON.stringify(msg);
    const st = sessions.get((s as any).id);
    if (!st) return;

    // Fast path
    const wrote = s.send(buf);
    if (wrote) return;

    // Socket buffered: queue JSON fallback
    (st as any).sendQueue.push(buf);
    if (!(st as any)._slow) { (st as any)._slow = true; SLOW_SOCKETS++; }
    if ((st as any).sendQueue.length > MAX_QUEUE) {
        (st as any).sendQueue.length = 0;
        s.send(JSON.stringify({ op: "error", code: "overflow", message: "reset-to-snapshot" }));
    }
}

// LSN-aware delivery: buffer during snapshot, gate after by cursor
function deliverBinaryLSN(hashId: string, payload: Buffer, lsn: bigint, onlySession?: any) {
    const targetSessions = onlySession ? [onlySession] : [...sessions.values()];
    let delivered = 0;

    for (const st of targetSessions) {
        // Iterate this session's subs and find those matching this hashId
        for (const key of st.subs) {
            if (!key.endsWith(hashId)) continue; // subKey currently = hashId

            const subStates: Map<string, SubState> = st.subStates ?? new Map();
            const sub = subStates.get(key);
            if (!sub) continue;

            if (sub.buffering) {
                sub.buffer.push({ lsn, payload });
                continue;
            }
            if (lsn <= sub.cursorLsn) continue;

            // send as binary
            const ok = st.socket.send(asArrayBuffer(payload), true, false);
            if (ok) {
                sub.cursorLsn = lsn;
                delivered++;
            } else {
                // backpressure → JSON fallback (base64)
                const b64 = payload.toString("base64");
                st.sendQueue.push(JSON.stringify({ op: "diffB64", hashId, b64 }));
                if (!st._slow) { st._slow = true; SLOW_SOCKETS++; }
                if (st.sendQueue.length > MAX_QUEUE) {
                    st.sendQueue.length = 0;
                    st.socket.send(JSON.stringify({ op: "error", code: "overflow", message: "reset-to-snapshot" }));
                }
            }
        }
    }
    return delivered;
}

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

uWS.App({})
    .ws("/*", {
        idleTimeout: 60,
        maxBackpressure: 1 << 20, // 1 MiB per socket
        maxPayloadLength: 1 << 20,

        upgrade: (res, req, context) => {
            const auth = authenticate(req);

            // For now we always allow, even with empty/no token
            if (auth.chosen) {
                // Echo only if a subprotocol was actually sent by the client
                res.writeHeader("Sec-WebSocket-Protocol", auth.chosen);
            }

            res.upgrade(
                { userId: auth.userId, tenantId: auth.tenantId, isAuthenticated: auth.isAuthenticated },
                req.getHeader("sec-websocket-key"),
                req.getHeader("sec-websocket-protocol"),   // pass through as sent (may be empty)
                req.getHeader("sec-websocket-extensions"),
                context
            );
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
            } as any;

            // NEW: per-session subscription state (hashId/table-key -> SubState)
            s.subStates = new Map<string, SubState>();

            sessions.set(id, s);

            // heartbeat
            const interval = setInterval(() => {
                try { ws.ping(); } catch { /* ignore */ }
            }, PING_INTERVAL_MS);
            (ws as any)._heartbeat = interval;
        },

        message: (ws, arrayBuffer, isBinary) => {
            if (isBinary) return; // client should send JSON
            let msg: ClientMsg;
            try {
                msg = JSON.parse(Buffer.from(arrayBuffer).toString("utf8"));
            } catch {
                safeSend(ws, { op: "error", code: "bad_json", message: "invalid JSON" });
                return;
            }

            if (msg.op === "ping") { safeSend(ws, { op: "pong" }); return; }

            // subscribe (LSN-fenced)
            if (subscribeSchema.safeParse(msg).success) {
                const { table, hashId, resumeFromVersion } = msg as any;
                const key = subKey(table, hashId); // = hashId (routing key)
                const s = sessions.get((ws as any).id)!;

                // TODO(tenant safety): enforce tenant predicate injection up-front.

                addSub(s, key);
                safeSend(ws, { op: "ack", hashId });

                // 1) Fence at current global LSN (or client's resume if higher)
                let fence = LAST_SEEN_LSN;
                if (typeof resumeFromVersion === 'number' && Number.isFinite(resumeFromVersion)) {
                    const r = BigInt(resumeFromVersion);
                    if (r > fence) fence = r;
                }

                // 2) Create subState in buffering mode
                (s as any).subStates.set(key, { cursorLsn: fence, buffering: true, buffer: [] });

                // 3) Snapshot (placeholder; integrate SQL-RPC here)
                const snapshotRows: any[] = []; // TODO: replace with actual SQL RPC rows
                safeSend(ws, {
                    op: "snapshot",
                    hashId,
                    version: 0,
                    cursor: { lsn: fence.toString() },
                    rows: snapshotRows
                });

                // 4) Flush buffered diffs strictly newer than fence
                const sub = (s as any).subStates.get(key) as SubState;
                if (sub) {
                    sub.buffer.sort((a, b) => (a.lsn < b.lsn ? -1 : (a.lsn > b.lsn ? 1 : 0)));
                    for (const m of sub.buffer) {
                        if (m.lsn > sub.cursorLsn) {
                            deliverBinaryLSN(hashId, m.payload, m.lsn, s);
                            sub.cursorLsn = m.lsn;
                        }
                    }
                    sub.buffer = [];
                    sub.buffering = false;
                }
                return;
            }

            // unsubscribe
            if (unsubscribeSchema.safeParse(msg).success) {
                const { table, hashId } = msg as any;
                const key = subKey(table, hashId);
                const s = sessions.get((ws as any).id)!;
                removeSub(s, key);
                (s as any).subStates?.delete(key);
                return;
            }

            safeSend(ws, { op: "error", code: "bad_op", message: "unknown message" });
        },

        drain: (ws) => {
            const s = sessions.get((ws as any).id);
            if (!s) return;

            // socket writable again
            if ((s as any)._slow) {
                (s as any)._slow = false;
                if (SLOW_SOCKETS > 0) SLOW_SOCKETS--;
            }

            while (s.sendQueue.length) {
                const next = s.sendQueue.shift()!;
                const ok = ws.send(next);
                if (!ok) { s.sendQueue.unshift(next); break; }
            }
        },

        close: (ws) => {
            clearInterval((ws as any)._heartbeat);
            const s = sessions.get((ws as any).id);
            if (s) {
                for (const key of [...s.subs]) removeSub(s, key);
                (s as any).subStates?.clear?.();
                if ((s as any)._slow) { (s as any)._slow = false; if (SLOW_SOCKETS > 0) SLOW_SOCKETS--; }
                sessions.delete(s.id);
            }
        }
    })
    .any("/*", (res, _req) => void res.writeStatus("200 OK").end("cladbe-ws-gateway"))
    .listen(PORT, (ok) => {
        if (!ok) { console.error("WS listen failed"); process.exit(1); }
        console.log(`WS listening on :${PORT}`);
    });

// ---- Kafka consumer → fan-out ----
const consumer = new GatewayConsumer(
    KAFKA_TOPICS,
    KAFKA_GROUP,
    KAFKA_BROKERS,
    {
        onMessage: (hashId, value /* Buffer */, raw) => {
            // Read LSN header and keep a global watermark
            const lsn = readLsnHeader(raw);
            if (lsn > LAST_SEEN_LSN) LAST_SEEN_LSN = lsn;

            // Deliver with LSN gating/buffering
            deliverBinaryLSN(hashId, value, lsn);
        },
        onError: (err) => console.error("[kafka] error", err),
        onRebalance: (ev) => console.log("[kafka] rebalance", ev?.code ?? ev),
    }
);
consumer.start();

// coarse flow control: pause/resume if too many slow sockets
setInterval(() => {
    if (SLOW_SOCKETS > 100) consumer.pauseAll();
    else consumer.resumeAll();
}, 250);