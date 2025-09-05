// scripts/tap-sql-replies.cjs
/* Tap the SQL RPC reply topic and log decoded envelopes */
const Kafka = require("node-rdkafka");
const flatbuffers = require("flatbuffers");
const { SqlRpc: sr } = require("@cladbe/sql-protocol");
const SqlRpc = sr.SqlRpc;

const BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";
const TOPIC = process.env.SQL_RPC_REPLY_TOPIC || "sql.rpc.responses.ws";
const GROUP = process.env.SQL_RPC_TAP_GROUP || "sql-rpc-reply-tap";

function bbFrom(buf) {
  return new flatbuffers.ByteBuffer(
    new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  );
}

const cons = new Kafka.KafkaConsumer(
  {
    "metadata.broker.list": BROKERS,
    "group.id": GROUP,
    "enable.auto.commit": true,
    "socket.keepalive.enable": true,
    "allow.auto.create.topics": true,
    "client.id": "tap-sql-replies",
  },
  { "auto.offset.reset": "latest" }
);

cons
  .on("ready", () => {
    console.log("[tap] ready; subscribing to", { BROKERS, TOPIC, GROUP });
    cons.subscribe([TOPIC]);
    cons.consume();
  })
  .on("data", (m) => {
    const key = m.key
      ? Buffer.isBuffer(m.key)
        ? m.key.toString()
        : String(m.key)
      : "";
    const bytes = m.value ? m.value.length : 0;

    let corr = "";
    let ok = false;
    let code = 0;
    let dtype = 0;

    try {
      console.log(m.value);
      const bb = bbFrom(m.value);
      const env = SqlRpc.ResponseEnvelope.getRootAsResponseEnvelope(bb);
      corr = env.correlationId() || "";
      ok = env.ok();
      code = env.errorCode();
      dtype = env.dataType();
    } catch (e) {
      console.error("[tap] decode error", e);
    }

    console.log("[tap] msg", {
      topic: m.topic,
      partition: m.partition,
      offset: m.offset,
      key,
      corr,
      ok,
      errorCode: code,
      dataType: dtype,
      bytes,
      ts: new Date(m.timestamp).toISOString(),
    });
  })
  .on("event.error", (e) => console.error("[tap] consumer error", e))
  .on("rebalance", (ev) => console.log("[tap] rebalance", ev));

cons.connect();
