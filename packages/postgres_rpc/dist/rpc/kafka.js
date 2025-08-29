// src/rpc/kafka.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KafkaConsumer, Producer, } from "node-rdkafka";
export class RpcKafka {
    constructor(cfg) {
        this.cfg = cfg;
        this.producer = new Producer({
            "metadata.broker.list": cfg.brokers.join(","),
            "client.id": "cladbe-postgres-rpc",
            "socket.keepalive.enable": true,
            // delivery reports disabled for simplicity; we poll to drain queue
            "dr_cb": false,
        }, {});
        this.consumer = new KafkaConsumer({
            "metadata.broker.list": cfg.brokers.join(","),
            "group.id": cfg.groupId,
            "enable.auto.commit": true,
            "socket.keepalive.enable": true,
            "allow.auto.create.topics": true,
            "client.id": "cladbe-postgres-rpc",
        }, { "auto.offset.reset": "latest" });
    }
    setHandler(onMessage) {
        this.onMessage = onMessage;
    }
    async start() {
        // connect producer first
        await new Promise((resolve, reject) => {
            this.producer
                .on("ready", () => resolve())
                .on("event.error", (err) => reject(err));
            this.producer.connect();
        });
        // drain internal queue regularly
        this.pollTimer = setInterval(() => {
            try {
                this.producer.poll();
            }
            catch { /* ignore */ }
        }, 100);
        // then consumer
        await new Promise((resolve, _reject) => {
            this.consumer
                .on("ready", () => {
                this.consumer.subscribe([this.cfg.requestTopic]);
                this.consumer.consume();
                resolve();
            })
                .on("data", (m) => {
                if (!m.value)
                    return;
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
    }
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
    /** resilient produce with small retry when librdkafka queue is full */
    produceSafe(topic, key, value, attempt = 0) {
        try {
            this.producer.produce(topic, null, value, key);
        }
        catch (e) {
            const msg = String(e?.message || e);
            const queueFull = e?.code === -184 /* RD_KAFKA_RESP_ERR__QUEUE_FULL */ ||
                msg.toLowerCase().includes("queue");
            if (queueFull && attempt < 10) {
                this.producer.poll();
                setTimeout(() => this.produceSafe(topic, key, value, attempt + 1), 25);
                return;
            }
            console.error("[rpc] produce failed", e);
        }
    }
}
