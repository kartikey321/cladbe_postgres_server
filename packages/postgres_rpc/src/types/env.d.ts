declare namespace NodeJS {
    interface ProcessEnv {
        KAFKA_BROKERS?: string;             // "localhost:9092,localhost:9093"
        SQL_RPC_REQUEST_TOPIC?: string;     // default: sql.rpc.requests
        SQL_RPC_RESPONSE_TOPIC?: string;    // default: sql.rpc.responses
        SQL_RPC_GROUP_ID?: string;          // default: cladbe-postgres-rpc
    }
}
