// test-producer.js
// Tiny producer used to verify a local Kafka setup by sending a single message.
const Kafka = require('node-rdkafka');
console.log('librdkafkaVersion:', Kafka.librdkafkaVersion);
const producer = new Kafka.Producer({'metadata.broker.list':'localhost:9092','dr_cb':true});
producer.on('ready', () => {
    console.log('producer ready');
    producer.produce('test_topic', null, Buffer.from('hello'), 'key1', Date.now());
    producer.flush(5000, () => { console.log('flushed'); process.exit(0); });
});
producer.on('event.error', (e)=>console.error('producer error', e));
producer.connect();
