// src/config.ts
import os from "node:os";

export const PORT = Number(process.env.WS_PORT || 7000);
export const PING_INTERVAL_MS = 25_000;
export const MAX_QUEUE = 1000;

// Kafka (CDC fan-out)
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";
export const KAFKA_GROUP   = process.env.KAFKA_GROUP   || "cladbe-ws-gateway";
export const KAFKA_TOPICS  = (process.env.KAFKA_TOPICS || "server.cdc.filtered").split(",");

// SQL-RPC topics
export const SQL_RPC_REQUEST_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";
export const SQL_RPC_REPLY_TOPIC =
    process.env.SQL_RPC_REPLY_TOPIC ||
    `sql.rpc.responses.ws.${os.hostname()}.${process.pid}.${Math.random().toString(36).slice(2)}`;
export const SQL_RPC_GROUP_ID = `ws-gateway-rpc-${process.pid}`;

// backpressure threshold for pausing the CDC consumer
export const SLOW_SOCKET_PAUSE_THRESHOLD = 100;