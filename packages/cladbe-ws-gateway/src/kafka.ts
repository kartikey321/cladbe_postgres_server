// src/kafka.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import pkg from 'node-rdkafka';
const { KafkaConsumer } = pkg;
import type { LibrdKafkaError, Message } from 'node-rdkafka';

/**
 * Callbacks used by the CDC Kafka consumer to integrate with the gateway.
 *
 * Why: Decouples wire-level consumption from business logic (fan-out, metrics, etc.).
 * How it fits: `onMessage` hands off raw change events to delivery, while error/rebalance
 * hooks surface operational signals to logs and control flow (pause/resume).
 */
export type KafkaHandlers = {
    onMessage: (key: string, value: Buffer, raw: Message) => void;
    onError?: (err: LibrdKafkaError) => void;
    onRebalance?: (ev: any) => void;
};

/**
 * GatewayConsumer
 *
 * Thin wrapper around node-rdkafka to consume CDC topics with sensible throughput
 * defaults. Exposes `pauseAll`/`resumeAll` to implement coarse backpressure: the
 * gateway pauses reading from Kafka when too many sockets are slow to avoid
 * unbounded buffering and heap growth.
 */
export class GatewayConsumer {
    private consumer: pkg.KafkaConsumer; // KafkaConsumer type
    private paused = false;

    constructor(
        private topics: string[],
        private groupId: string,
        private brokers: string,
        private handlers: KafkaHandlers,
    ) {
        this.consumer = new KafkaConsumer(
            {
                'metadata.broker.list': brokers,
                'group.id': groupId,
                'enable.auto.commit': true,
                'socket.keepalive.enable': true,
                // throughput tuning
                'fetch.wait.max.ms': 50,
                'fetch.min.bytes': 65536,              // 64 KiB
                'queued.max.messages.kbytes': 102400,  // 100 MiB
                'allow.auto.create.topics': true,
                'client.id': 'cladbe-ws-gateway',
            },
            { 'auto.offset.reset': 'latest' }
        );
    }

    /** Connects, subscribes to topics, and begins message consumption. */
    start() {
        this.consumer
            .on('ready', () => {
                console.log('[cdc] consumer ready', { groupId: this.groupId, topics: this.topics, brokers: this.brokers });
                this.consumer.subscribe(this.topics);
                this.consumer.consume();
            })
            .on('data', (m: Message) => {
                const key = m.key
                    ? (Buffer.isBuffer(m.key) ? m.key.toString('utf8') : String(m.key))
                    : '';
                if (!key || !m.value) return;

                // Toggle this for very noisy per-message logs:
                console.log('[cdc] message', { topic: m.topic, partition: m.partition, offset: m.offset, key, bytes: (m.value as Buffer).byteLength });

                this.handlers.onMessage(key, m.value as Buffer, m);
            })
            .on('event.error', (err: LibrdKafkaError) => {
                console.error('[cdc] consumer error', err);
                this.handlers.onError?.(err);
            })
            .on('rebalance', (ev: any) => {
                console.log('[cdc] rebalance', ev);
                this.handlers.onRebalance?.(ev);
            });

        this.consumer.connect();
    }

    /** Pauses all current assignments; used when slow sockets exceed threshold. */
    pauseAll() {
        if (this.paused) return;
        const asg = this.consumer.assignments();
        if (asg.length) {
            this.consumer.pause(asg);
            this.paused = true;
        }
    }

    /** Resumes all current assignments once pressure subsides. */
    resumeAll() {
        if (!this.paused) return;
        const asg = this.consumer.assignments();
        if (asg.length) {
            this.consumer.resume(asg);
            this.paused = false;
        }
    }

    /** Gracefully disconnects the consumer. */
    stop() {
        try { this.consumer.disconnect(); } catch {}
    }
}
