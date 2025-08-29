module.exports = {
    apps: [
        {
            name: 'cladbe_postgres_server',
            cwd: "./packages/server",
            script: './dist/index.js',
            instances: 1,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 7500,
            },
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 3000,
            max_memory_restart: '300M',
        },
        {
            name: "cladbe-ws-gateway",
            cwd: "./packages/cladbe-ws-gateway",
            script: "dist/main.js",                 // built by `npm run build`
            exec_mode: "fork",
            instances: 1,                           // uWS binds a port: keep 1 per port
            watch: false,
            autorestart: true,
            max_memory_restart: "300M",
            time: true,
            env: {
                NODE_ENV: "production",
                // gateway env
                WS_PORT: "7000",
                KAFKA_BROKERS: "localhost:9092",
                KAFKA_GROUP: "cladbe-ws-gateway",
                KAFKA_TOPICS: "server.cdc.filtered"
            },
            merge_logs: true,
            out_file: "/var/log/pm2/cladbe-ws-gateway.out.log",
            error_file: "/var/log/pm2/cladbe-ws-gateway.err.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z"
        },
        {
            name: "postgres-rpc",
            cwd: "./packages/postgres_rpc",
            script: "dist/index.js",                // built by `npm run build`
            exec_mode: "fork",
            instances: 1,
            watch: false,
            autorestart: true,
            max_memory_restart: "350M",
            time: true,
            env: {
                NODE_ENV: "production",
                // rpc env
                KAFKA_BROKERS: "localhost:9092",
                SQL_RPC_REQUEST_TOPIC: "sql.rpc.requests",
                SQL_RPC_RESPONSE_TOPIC: "sql.rpc.responses",
                SQL_RPC_GROUP_ID: "cladbe-postgres-rpc"
            },
            merge_logs: true,
            out_file: "/var/log/pm2/postgres-rpc.out.log",
            error_file: "/var/log/pm2/postgres-rpc.err.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z"
        }
    ],
};
