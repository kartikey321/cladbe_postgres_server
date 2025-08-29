// declare module 'node-rdkafka' {
//     // Minimal surface we use; you can replace with community types
//     export interface Message {
//         value?: Buffer;
//         key?: Buffer | string | null;
//         topic: string;
//         partition: number;
//         offset: number;
//         timestamp: number;
//     }
//     export interface LibrdKafkaError extends Error {
//         code: number;
//     }
//     export class KafkaConsumer {
//         constructor(globalConf: any, topicConf?: any);
//         connect(): void;
//         disconnect(): void;
//         subscribe(topics: string[]): void;
//         consume(): void;
//         assignments(): any[];
//         pause(assignments: any[]): void;
//         resume(assignments: any[]): void;
//         on(event: 'ready', cb: () => void): this;
//         on(event: 'data', cb: (message: Message) => void): this;
//         on(event: 'rebalance', cb: (ev: any) => void): this;
//         on(event: 'event.error', cb: (err: LibrdKafkaError) => void): this;
//     }
// }