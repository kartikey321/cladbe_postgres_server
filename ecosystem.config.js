module.exports = {
    apps: [
        {
            name: 'hono-ts-backend',
            script: './dist/index.js',
            instances: 1, // Start with 1 instance to minimize resource use
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 3000,
            max_memory_restart: '300M', // Restart instance if memory exceeds 300MB
        },
    ],
};