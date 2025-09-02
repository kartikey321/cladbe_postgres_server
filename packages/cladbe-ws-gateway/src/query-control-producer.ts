// src/query-control-producer.ts
import pkg from "node-rdkafka";
const { Producer } = pkg;

/**
 * QueryControlProducer
 *
 * Role: Publishes or clears per-query metadata (qmeta), such as encoded filters or
 * query plans, to a Kafka topic read by downstream Streams processors. This allows
 * servers to warm materialized indexes or stores keyed by `hashId` before diffs arrive.
 */
export class QueryControlProducer {
  private prod: any;
  private ready = false;

  /**
   * @param brokers Kafka broker list
   * @param topic   Topic that downstream processors consume to react to query lifecycle
   */
  constructor(private brokers: string, private topic: string) {
    this.prod = new Producer({
      "metadata.broker.list": brokers,
      "client.id": "ws-gateway-qctl",
      "socket.keepalive.enable": true,
    });
  }

  /** Connects the underlying producer; idempotent. */
  async start() {
    if (this.ready) return;
    await new Promise<void>((res, rej) => {
      this.prod.on("ready", () => { this.ready = true; res(); })
               .on("event.error", rej)
               .connect();
    });
  }

  /**
   * Publish qmeta for a given key (typically the query `hashId`).
   * Pass `null` value to signal clearing/removal of query metadata.
   */
  send(key: string, value: Buffer | null) {
    if (!this.ready) throw new Error("QueryControlProducer not ready");
    try { this.prod.produce(this.topic, null, value ?? undefined, key); }
    catch (e) { console.error("[qctl] produce error", e); }
  }

  /** Disconnects the producer. */
  stop() { try { this.prod.disconnect(); } catch {} }
}
