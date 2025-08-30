export const TOPICS = {
    SQL_REQ: "sql.rpc.requests",
    SQL_RES: "sql.rpc.responses",
    CDC_FILTERED: "server.cdc.filtered"
} as const;

export const HEADERS = {
    LSN: "lsn"
} as const;

export const WS = {
    PING_INTERVAL_MS: 25_000,
    MAX_QUEUE: 1_000
} as const;