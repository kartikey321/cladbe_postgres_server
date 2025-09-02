// src/seed-producer.ts
import pkg from "node-rdkafka";
const { Producer } = pkg;

/**
 * SeedProducer
 *
 * Role: Emits snapshot seed messages for a query/page so downstream state stores (KTables,
 * caches) can be pre-populated immediately after the gateway serves a snapshot. This reduces
 * cold-start latency for streaming consumers that rely on the same key-space.
 */
export class SeedProducer {
  private producer: any;
  private ready = false;

  /**
   * @param brokers Kafka broker list
   * @param topic   Seed topic consumed by Streams processors
   */
  constructor(private brokers: string, private topic: string) {
    this.producer = new Producer({
      "metadata.broker.list": this.brokers,
      "client.id": "ws-gateway-seed",
      "socket.keepalive.enable": true,
      dr_cb: false,
    });
  }

  /** Connects the underlying producer; idempotent. */
  async start(): Promise<void> {
    if (this.ready) return;
    await new Promise<void>((res, rej) => {
      this.producer
        .on("ready", () => { this.ready = true; res(); })
        .on("event.error", rej)
        .connect();
    });
  }

  /** Send a seed record keyed by query id (e.g., company_table|hashId). */
  send(key: string, value: Buffer) {
    if (!this.ready) throw new Error("SeedProducer not ready");
    try { this.producer.produce(this.topic, null, value, key); }
    catch (e) { console.error("[seed] produce error", e); }
  }

  /** Disconnects the producer. */
  stop() { try { this.producer.disconnect(); } catch {} }
}
