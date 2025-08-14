module.exports = {
    apps: [
        {
            name: 'cladbe_postgres_server',
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
    ],
};
