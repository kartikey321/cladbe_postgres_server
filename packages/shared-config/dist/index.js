"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS = exports.HEADERS = exports.TOPICS = void 0;
exports.TOPICS = {
    SQL_REQ: "sql.rpc.requests",
    SQL_RES: "sql.rpc.responses",
    CDC_FILTERED: "server.cdc.filtered"
};
exports.HEADERS = {
    LSN: "lsn"
};
exports.WS = {
    PING_INTERVAL_MS: 25_000,
    MAX_QUEUE: 1_000
};
