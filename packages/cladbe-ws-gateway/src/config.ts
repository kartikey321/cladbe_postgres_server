// src/config.ts
/**
 * Central config for the WS gateway.
 *
 * Routing key (everywhere: Kafka + KeyDB + WS):
 *   companyId|table|hashId
 */
import { config as configDotenv } from "dotenv";
import os from "node:os";
configDotenv();

// ---- WebSocket ----
export const PORT = Number(process.env.WS_PORT || 7000);
export const PING_INTERVAL_MS = 25_000;
export const MAX_QUEUE = 1000;

// ---- Kafka (CDC + RPC) ----
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";
export const KAFKA_GROUP   = process.env.KAFKA_GROUP   || "cladbe-ws-gateway";

/**
 * Topics the gateway consumes for real-time CDC:
 *  - server.page.diffs  (batched page mutations; binary FB payloads)
 *  - server.row.events  (per-row change envelopes; JSON, optional)
 */
export const KAFKA_TOPICS = (process.env.KAFKA_TOPICS ||
  "server.page.diffs,server.row.events").split(",").map(s => s.trim()).filter(Boolean);

// ---- SQL-RPC topics ----
export const SQL_RPC_REQUEST_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
/** Unique reply topic per process so we can correlate responses safely. */
export const SQL_RPC_REPLY_TOPIC =
  process.env.SQL_RPC_REPLY_TOPIC ||
  `sql.rpc.responses.ws.${os.hostname()}.${process.pid}.${Math.random().toString(36).slice(2)}`;
export const SQL_RPC_GROUP_ID = `ws-gateway-rpc-${process.pid}`;

// ---- CDC backpressure threshold ----
export const SLOW_SOCKET_PAUSE_THRESHOLD = Number(process.env.SLOW_SOCKET_PAUSE_THRESHOLD || 100);

// ---- KeyDB / HotCache ----
export const KEYDB_HOST   = process.env.KEYDB_HOST;
export const KEYDB_PORT   = process.env.KEYDB_PORT || 6379 as any;
export const KEYDB_PASS   = process.env.KEYDB_PASSWORD;
export const KEYDB_PREFIX = (process.env.KEYDB_PREFIX || "hcache:").replace(/\s+/g, "");

/** Keep at most this many diffs per hashId in KeyDB (FIFO). */
export const HOTCACHE_MAX_DIFFS   = Number(process.env.HOTCACHE_MAX_DIFFS || 5000);
/** TTL (ms) for snapshots & diffs; 0 disables expiration. */
export const HOTCACHE_RETENTION_MS = Number(process.env.HOTCACHE_RETENTION_MS || 10 * 60_000);

// ---- Query control (publish/clear qmeta to Streams) ----
export const QUERY_CONTROL_TOPIC = process.env.QUERY_CONTROL_TOPIC || "server.query.control";