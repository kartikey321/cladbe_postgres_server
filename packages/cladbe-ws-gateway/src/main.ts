// src/main.ts
import {
  PORT, KAFKA_BROKERS, KAFKA_GROUP, KAFKA_TOPICS,
  SQL_RPC_REQUEST_TOPIC, SQL_RPC_REPLY_TOPIC,
  SQL_RPC_GROUP_ID, SLOW_SOCKET_PAUSE_THRESHOLD
} from "./config.js";

import { createWsApp } from "./ws/app.js";
import { SqlRpcClient } from "./rpc/sql-rpc.js";
import { GatewayConsumer } from "./kafka.js";
import { readLsnHeader, LAST_SEEN_LSN } from "./lsn.js";
import { deliverBinaryLSN, SLOW_SOCKETS } from "./delivery.js";

import { HotCache } from "./keydb.js";
import { SeedProducer } from "./seed-producer.js";

import { QueryControlProducer } from "./query-control-producer.js";
import { QUERY_CONTROL_TOPIC } from "./config.js";


const qctl = new QueryControlProducer(KAFKA_BROKERS, QUERY_CONTROL_TOPIC);
await qctl.start();

const PAGE_SEED_TOPIC = process.env.PAGE_SEED_TOPIC || "server.page.seed";

void (async function bootstrap() {
  // --- start SQL-RPC client (needed for fallback snapshots)
  const sqlRpc = new SqlRpcClient({
    brokers: KAFKA_BROKERS,
    requestTopic: SQL_RPC_REQUEST_TOPIC,
    replyTopic: SQL_RPC_REPLY_TOPIC,
    groupId: SQL_RPC_GROUP_ID,
    timeoutMs: 10_000
  });
  await sqlRpc.start();
  console.log("[boot] sql-rpc client ready",
    { requestTopic: SQL_RPC_REQUEST_TOPIC, replyTopic: SQL_RPC_REPLY_TOPIC, groupId: SQL_RPC_GROUP_ID });

  // --- init KeyDB hot cache & seeds producer
  const hotCache = new HotCache();
  const seed = new SeedProducer(KAFKA_BROKERS, PAGE_SEED_TOPIC);
  await seed.start();

  function publishSeed(companyId: string, table: string, hashId: string, cursor: any, rows: any[]) {
    const key = `${companyId}_${table}|${hashId}`;
    const payload = Buffer.from(JSON.stringify({ companyId, table, hashId, cursor, rows }));
    seed.send(key, payload);
  }

  // --- create WS app with KeyDB-first snapshot strategy
  const app = createWsApp({
    // fenceLsnStr is subscribe-time fence; return { rows, cursor:{lsn} }
    getSnapshot: async (companyId, table, hashId, fenceLsnStr?: string) => {
      const fence = BigInt(fenceLsnStr || "0");

      // 1) try KeyDB cache
      const cached = await hotCache.getSnapshot(hashId);
      if (cached && BigInt(cached.cursor?.lsn || "0") >= fence) {
        console.log("[ws] snapshot from keydb", { hashId, rows: cached.rows.length, lsn: cached.cursor.lsn });
        return cached; // { rows, cursor }
      }

      // 2) fallback to RPC
      const rows = await sqlRpc.getDataSnapshot(companyId, table, 500, 0);
      const snap = { rows, cursor: { lsn: fence.toString() }, ts: Date.now() };
      await hotCache.setSnapshot(hashId, snap);

      // 3) seed Streams to warm KTables/KV stores
      publishSeed(companyId, table, hashId, snap.cursor, rows);
      return snap;
    },
  });

  // --- listen
  app.listen(PORT, ok => {
    if (!ok) { console.error("WS listen failed"); process.exit(1); }
    console.log(`WS listening on :${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  // --- CDC consumer → fan-out
  const consumer = new GatewayConsumer(
    KAFKA_TOPICS, KAFKA_GROUP, KAFKA_BROKERS,
    {
      onMessage: (_hashId, value, raw) => {
        const lsn = readLsnHeader(raw);
        if (lsn > LAST_SEEN_LSN) (LAST_SEEN_LSN as any) = lsn;

        const key = raw.key
          ? (Buffer.isBuffer(raw.key) ? raw.key.toString("utf8") : String(raw.key))
          : "";
        if (!key) return;

        // NOTE: this can be noisy — keep for now to trace end-to-end
        console.log("[cdc] fan-out", { key, bytes: value.byteLength, lsn: lsn.toString() });
        deliverBinaryLSN(key, value as Buffer, lsn);
      },
      onError: (err) => console.error("[kafka] error", err),
      onRebalance: (ev) => console.log("[kafka] rebalance", ev?.code ?? ev),
    }
  );
  consumer.start();

  // coarse flow control for CDC
  setInterval(() => {
    if (SLOW_SOCKETS > SLOW_SOCKET_PAUSE_THRESHOLD) {
      console.warn("[cdc] pausing consumer due to slow sockets", { slow: SLOW_SOCKETS });
      consumer.pauseAll();
    } else {
      consumer.resumeAll();
    }
  }, 250);
})();
