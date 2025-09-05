// src/main.ts
import {
    PORT, KAFKA_BROKERS, KAFKA_GROUP, KAFKA_TOPICS,
    SQL_RPC_REQUEST_TOPIC, SQL_RPC_REPLY_TOPIC,
    SQL_RPC_GROUP_ID, SLOW_SOCKET_PAUSE_THRESHOLD,
    QUERY_CONTROL_TOPIC
} from "./config.js";

import { createWsApp } from "./ws/app.js";
import { SqlRpcClient } from "./rpc/sql-rpc.js";
import { GatewayConsumer } from "./kafka.js";
import { readLsnHeader, LAST_SEEN_LSN, updateLastSeenLsn } from "./lsn.js";
import { deliverBinaryLSN, SLOW_SOCKETS } from "./delivery.js";

import { HotCache } from "./keydb.js";
import { SeedProducer } from "./seed-producer.js";
import { QueryControlProducer } from "./query-control-producer.js";
import { sessions } from "./state.js";
import { safeSend } from "./ws/io.js";

const qctl = new QueryControlProducer(KAFKA_BROKERS, QUERY_CONTROL_TOPIC);
await qctl.start();

const PAGE_SEED_TOPIC = process.env.PAGE_SEED_TOPIC || "server.page.seed";

void (async function bootstrap() {
    // --- SQL-RPC client
    const sqlRpc = new SqlRpcClient({
        brokers: KAFKA_BROKERS,
        requestTopic: SQL_RPC_REQUEST_TOPIC,
        replyTopic: SQL_RPC_REPLY_TOPIC,
        groupId: SQL_RPC_GROUP_ID,
        timeoutMs: 10_000
    });
    await sqlRpc.start();
    console.log("[boot] sql-rpc ready", {
        requestTopic: SQL_RPC_REQUEST_TOPIC, replyTopic: SQL_RPC_REPLY_TOPIC, groupId: SQL_RPC_GROUP_ID
    });

    // --- HotCache + seed producer
    const hotCache = new HotCache();
    const seed = new SeedProducer(KAFKA_BROKERS, PAGE_SEED_TOPIC);
    await seed.start();

    function publishSeed(companyId: string, table: string, hashId: string, cursor: any, rows: any[]) {
        const routingKey = `${companyId}_${table}|${hashId}`;
        const payload = Buffer.from(JSON.stringify({ companyId, table, hashId, cursor, rows }));
        seed.send(routingKey, payload);
    }

    // --- WS app
    const app = createWsApp({
        publishQueryMeta: (routingKey, fb) => {
            qctl.send(routingKey, fb ?? null);
        },

        // NOTE: consumes the query payload and calls the JSON-spec RPC
        getSnapshot: async (companyId, table, hashId, fenceLsnStr, query) => {
            const fence = BigInt(fenceLsnStr || "0");
            let rows: any[] = [];
            let cursor = { lsn: fence.toString() };

            try {
                if (query?.json && query.json.length > 0) {
                    const out = await sqlRpc.getDataSnapshotWithQueryJson(companyId, table, query.json);
                    if (Array.isArray(out)) {
                        rows = out;
                    } else if (out && typeof out === "object") {
                        rows = Array.isArray(out.rows) ? out.rows : [];
                        if (out.cursor && typeof out.cursor === "object") {
                            cursor = { ...(out.cursor || {}), lsn: cursor.lsn };
                        }
                    }
                } else {
                    rows = await sqlRpc.getDataSnapshot(companyId, table, 500, 0);
                }
            } catch (e: any) {
                console.error("[ws] rpc snapshot failed; retrying once:", String(e?.message || e));
                rows = await sqlRpc.getDataSnapshot(companyId, table, 500, 0);
            }

            const snap = { rows, cursor, ts: Date.now() };

            const routingKey = `${companyId}_${table}|${hashId}`;
            try {
                // Optional: cache snapshot
                // await hotCache.setSnapshot(routingKey, snap);
            } catch (e) {
                console.warn("[ws] hotcache setSnapshot failed:", String((e as any)?.message || e));
            }

            publishSeed(companyId, table, hashId, cursor, rows);
            return { rows, cursor };
        },

        // pass the rpc client so ws → rpc works
        sqlRpc,
    });

    app.listen(PORT, ok => {
        if (!ok) { console.error("WS listen failed"); process.exit(1); }
        console.log(`WS listening on :${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // --- CDC consumer
    const consumer = new GatewayConsumer(
        KAFKA_TOPICS, KAFKA_GROUP, KAFKA_BROKERS,
        {
            onMessage: (key, value, raw) => {
                const lsn = readLsnHeader(raw);
                if (lsn > LAST_SEEN_LSN) updateLastSeenLsn(lsn);

                switch (raw.topic) {
                    case "server.page.diffs": {
                        console.log("[cdc] page.diff", { key: key, bytes: (value as Buffer).byteLength, lsn: lsn.toString() });
                        deliverBinaryLSN(key, value as Buffer, lsn);
                        break;
                    }
                    case "server.row.events": {
                        try {
                            const env = JSON.parse((value as Buffer).toString("utf8"));
                            let routingKey=env.routingKey;
                            for (const s of sessions.values()) {
                                if (!s.subs.has(routingKey)) continue;
                                safeSend(s.socket, {
                                    op: "rowEvent",
                                    hashId: String(routingKey.split("|")[1] || env.hashId || ""),
                                    event: env,
                                    version: Number(lsn.toString()) || 0
                                } as any);
                            }
                            console.log("[cdc] row.event", { key: key, kind: env, lsn: env?.lsn ?? lsn.toString(), });
                        } catch (e) {
                            console.error("[cdc] row.event parse error", e);
                        }
                        break;
                    }
                    default:
                        console.warn("[cdc] unknown topic", raw.topic);
                }
            },
            onError: (err) => console.error("[kafka] error", err),
            onRebalance: (ev) => console.log("[kafka] rebalance", ev?.code ?? ev),
        }
    );
    consumer.start();

    setInterval(() => {
        if (SLOW_SOCKETS > SLOW_SOCKET_PAUSE_THRESHOLD) {
            console.warn("[cdc] pausing consumer due to slow sockets", { slow: SLOW_SOCKETS });
            consumer.pauseAll();
        } else {
            consumer.resumeAll();
        }
    }, 250);
})();