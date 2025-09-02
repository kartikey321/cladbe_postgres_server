// mock-sql-worker.mjs
// Dev helper: minimal Kafka-based RPC worker that responds to SQL RPC requests
// with a dummy RowsJson payload, for local testing of the client wiring.
import pkg from "node-rdkafka";
const { KafkaConsumer, Producer } = pkg;
import * as flatbuffers from "flatbuffers";
import { SqlRpc as sr } from "@cladbe/sql-protocol";
const SqlRpc = sr.SqlRpc;

const BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";
const REQ_TOPIC = process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests";

const cons = new KafkaConsumer({
    "metadata.broker.list": BROKERS,
    "group.id": "mock-sql-worker",
    "enable.auto.commit": true,
    "allow.auto.create.topics": true
}, { "auto.offset.reset": "latest" });

const prod = new Producer({ "metadata.broker.list": BROKERS });

await new Promise((res, rej) => prod.on("ready", res).on("event.error", rej).connect());
await new Promise((res) => {
    cons.on("ready", () => { cons.subscribe([REQ_TOPIC]); cons.consume(); res(); })
        .on("data", onData)
        .on("event.error", (e) => console.error("[mock] consumer error", e));
    cons.connect();
});

function onData(m) {
    if (!m.value) return;
    const bb = new flatbuffers.ByteBuffer(new Uint8Array(m.value));
    const req = SqlRpc.RequestEnvelope.getRootAsRequestEnvelope(bb);
    const corr = req.correlationId() || "";
    const replyTopic = req.replyTopic() || "sql.rpc.responses";
    const method = req.method();

    console.log("[mock] ⇐", { method, corr, replyTopic });

    // build dummy RowsJson: [{"mock":true}]
    const b = new flatbuffers.Builder(256);
    const rowStr = b.createString(JSON.stringify({ mock: true }));
    const rowsVec = SqlRpc.RowsJson.createRowsVector(b, [rowStr]);
    SqlRpc.RowsJson.startRowsJson(b);
    SqlRpc.RowsJson.addRows(b, rowsVec);
    const rowsOff = SqlRpc.RowsJson.endRowsJson(b);

    const corrOff = b.createString(corr);
    SqlRpc.ResponseEnvelope.startResponseEnvelope(b);
    SqlRpc.ResponseEnvelope.addCorrelationId(b, corrOff);
    SqlRpc.ResponseEnvelope.addOk(b, true);
    SqlRpc.ResponseEnvelope.addErrorCode(b, SqlRpc.ErrorCode.NONE);
    SqlRpc.ResponseEnvelope.addDataType(b, SqlRpc.RpcResponse.RowsJson);
    SqlRpc.ResponseEnvelope.addData(b, rowsOff);
    const envOff = SqlRpc.ResponseEnvelope.endResponseEnvelope(b);
    b.finish(envOff);
    const buf = Buffer.from(b.asUint8Array());

    try {
        prod.produce(replyTopic, null, buf, corr);
        console.log("[mock] ⇒", { corr, replyTopic });
    } catch (e) {
        console.error("[mock] produce error", e);
    }
}
