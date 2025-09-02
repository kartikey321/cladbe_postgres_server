// src/config.ts
/**
 * Configuration surface for the WS gateway.
 *
 * Why: Centralizes tunables for WebSocket, Kafka (CDC + RPC), and KeyDB HotCache.
 * How it fits: Values are consumed by the bootstrap (main.ts), Kafka consumers/producers,
 * SQL-RPC client, and the HotCache so the gateway coordinates the CDC→WS pipeline with
 * consistent parameters across modules.
 */
import os from "node:os";

/** TCP port for the uWS HTTP/WS server. */
export const PORT = Number(process.env.WS_PORT || 7000);
/** WebSocket ping interval in ms (keepalive; helps detect dead connections). */
export const PING_INTERVAL_MS = 25_000;
/** Maximum buffered JSON frames per slow socket before forcing a reset. */
export const MAX_QUEUE = 1000;

// Kafka (CDC fan-out)
/** Comma-separated broker list for both CDC and RPC topics. */
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";
export const KAFKA_GROUP   = process.env.KAFKA_GROUP   || "cladbe-ws-gateway";
export const KAFKA_TOPICS  = (process.env.KAFKA_TOPICS || "server.cdc.filtered").split(",");

// SQL-RPC topics
/** Request topic for SQL-RPC calls to the worker. */
export const SQL_RPC_REQUEST_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
export const SQL_RPC_REPLY_TOPIC =
  process.env.SQL_RPC_REPLY_TOPIC ||
  `sql.rpc.responses.ws.${os.hostname()}.${process.pid}.${Math.random().toString(36).slice(2)}`;
export const SQL_RPC_GROUP_ID = `ws-gateway-rpc-${process.pid}`;

// backpressure threshold for pausing the CDC consumer
/** When slow sockets exceed this, pause CDC consumer for coarse flow control. */
export const SLOW_SOCKET_PAUSE_THRESHOLD = 100;

// --- KeyDB / HotCache ---
/** Connection URL for KeyDB/Redis used by the HotCache. */
export const KEYDB_URL = process.env.KEYDB_URL || "redis://127.0.0.1:6379";
export const KEYDB_PREFIX = (process.env.KEYDB_PREFIX || "hcache:").replace(/\s+/g, "");
/** Max number of diffs to persist per hashId (FIFO). */
export const HOTCACHE_MAX_DIFFS = Number(process.env.HOTCACHE_MAX_DIFFS || 5000);
/** TTL for snapshots and diffs in ms; ensures cache self-cleans (set 0 to disable). */
export const HOTCACHE_RETENTION_MS = Number(process.env.HOTCACHE_RETENTION_MS || 10 * 60_000);

/** Topic for publishing/clearing per-query metadata (qmeta) used by Streams. */
export const QUERY_CONTROL_TOPIC = process.env.QUERY_CONTROL_TOPIC || "server.query.control";
