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

void (async function bootstrap() {
    // --- start SQL-RPC client
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

    // --- create WS app with deps
    const app = createWsApp({
        getSnapshot: (companyId, table) => sqlRpc.getDataSnapshot(companyId, table, 500, 0),
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
                deliverBinaryLSN(key, value, lsn);
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