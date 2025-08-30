// src/kafka.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import pkg from 'node-rdkafka';
const { KafkaConsumer } = pkg;
import type { LibrdKafkaError, Message } from 'node-rdkafka';

export type KafkaHandlers = {
    onMessage: (key: string, value: Buffer, raw: Message) => void;
    onError?: (err: LibrdKafkaError) => void;
    onRebalance?: (ev: any) => void;
};

export class GatewayConsumer {
    private consumer: any; // KafkaConsumer type
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
                // console.log('[cdc] message', { topic: m.topic, partition: m.partition, offset: m.offset, key, bytes: (m.value as Buffer).byteLength });

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

    pauseAll() {
        if (this.paused) return;
        const asg = this.consumer.assignments();
        if (asg.length) {
            this.consumer.pause(asg);
            this.paused = true;
        }
    }

    resumeAll() {
        if (!this.paused) return;
        const asg = this.consumer.assignments();
        if (asg.length) {
            this.consumer.resume(asg);
            this.paused = false;
        }
    }

    stop() {
        try { this.consumer.disconnect(); } catch {}
    }
}