// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'cladbe_postgres_server',
      cwd: "./packages/server",
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 7500,
      },
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 3000,
      max_memory_restart: '300M',
    },
    {
      name: "cladbe-ws-gateway",
      cwd: "./packages/cladbe-ws-gateway",
      script: "dist/main.js",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      time: true,
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        WS_PORT: process.env.WS_PORT || "7000",
        KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
        KAFKA_GROUP: process.env.KAFKA_GROUP || "cladbe-ws-gateway",
        KAFKA_TOPICS: process.env.KAFKA_TOPICS || "server.cdc.filtered"
      },
      merge_logs: true,
      out_file: "/var/log/pm2/cladbe-ws-gateway.out.log",
      error_file: "/var/log/pm2/cladbe-ws-gateway.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "postgres-rpc",
      cwd: "./packages/postgres_rpc",
      script: "dist/index.js",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: "350M",
      time: true,
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
        SQL_RPC_REQUEST_TOPIC: process.env.SQL_RPC_REQUEST_TOPIC || "sql.rpc.requests",
        SQL_RPC_RESPONSE_TOPIC: process.env.SQL_RPC_RESPONSE_TOPIC || "sql.rpc.responses",
        SQL_RPC_GROUP_ID: process.env.SQL_RPC_GROUP_ID || "cladbe-postgres-rpc"
      },
      merge_logs: true,
      out_file: "/var/log/pm2/postgres-rpc.out.log",
      error_file: "/var/log/pm2/postgres-rpc.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ],
};