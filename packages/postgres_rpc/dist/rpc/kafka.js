/* eslint-disable @typescript-eslint/no-explicit-any */
import pkg from "node-rdkafka";
const { KafkaConsumer, Producer } = pkg;
/**
 * Small Kafka wrapper used by the Postgres RPC worker:
 * - 1 Producer (for replies)
 * - 1 Consumer (subscribed to the request topic)
 * - ESM-safe import pattern for node-rdkafka
 */
export class RpcKafka {
    cfg;
    // keep concrete types from pkg so TS knows the methods we call
    producer;
    consumer;
    // poll timer so librdkafka can drain callbacks in ESM/Node event loop
    pollTimer;
    // user handler (we call this when a request message arrives)
    onMessage;
    constructor(cfg) {
        this.cfg = cfg;
        // ---- Producer (used to send responses back to "replyTopic") ----
        this.producer = new Producer({
            "metadata.broker.list": cfg.brokers.join(","), // comma-separated string
            "client.id": "cladbe-postgres-rpc",
            "socket.keepalive.enable": true,
            dr_cb: false, // we don't need delivery reports for RPC
        }, {});
        // ---- Consumer (listens on the single request topic) ----
        this.consumer = new KafkaConsumer({
            "metadata.broker.list": cfg.brokers.join(","),
            "group.id": cfg.groupId,
            "enable.auto.commit": true,
            "socket.keepalive.enable": true,
            "allow.auto.create.topics": true,
            "client.id": "cladbe-postgres-rpc",
        }, { "auto.offset.reset": "latest" });
    }
    /** Register request handler; called for each consumed message. */
    setHandler(onMessage) {
        this.onMessage = onMessage;
    }
    /** Connect producer + consumer; subscribe to request topic. */
    async start() {
        // Producer connect (await "ready")
        await new Promise((resolve, reject) => {
            this.producer
                .on("ready", () => resolve())
                .on("event.error", (err) => reject(err));
            this.producer.connect();
        });
        // Poll producer periodically (good practice with librdkafka in Node)
        this.pollTimer = setInterval(() => {
            try {
                this.producer.poll();
            }
            catch {
                // ignore
            }
        }, 100);
        // Consumer connect (await "ready"), then subscribe & consume
        await new Promise((resolve) => {
            this.consumer
                .on("ready", () => {
                this.consumer.subscribe([this.cfg.requestTopic]);
                this.consumer.consume();
                resolve();
            })
                .on("data", (m) => {
                // only pass through messages with a value
                if (m.value)
                    this.onMessage?.(m);
            })
                .on("event.error", (err) => {
                console.error("[rpc] consumer error", err);
            })
                .on("rebalance", (ev) => {
                console.log("[rpc] rebalance", ev);
            });
            this.consumer.connect();
        });
        console.log("[rpc] kafka ready", this.cfg);
    }
    /** Disconnect both ends and clear timers */
    stop() {
        if (this.pollTimer)
            clearInterval(this.pollTimer);
        try {
            this.consumer.disconnect();
        }
        catch { }
        try {
            this.producer.disconnect();
        }
        catch { }
    }
    /**
     * Resilient produce with small retries when the local queue is full.
     * This happens transiently under load; we poll & retry quickly.
     */
    produceSafe(topic, key, value, attempt = 0) {
        try {
            this.producer.produce(topic, null, value, key);
        }
        catch (e) {
            const msg = String(e?.message || e);
            const queueFull = e?.code === -184 || msg.toLowerCase().includes("queue");
            if (queueFull && attempt < 10) {
                // give librdkafka a chance to drain and retry quickly
                this.producer.poll();
                setTimeout(() => this.produceSafe(topic, key, value, attempt + 1), 25);
                return;
            }
            console.error("[rpc] produce failed", e);
        }
    }
}
