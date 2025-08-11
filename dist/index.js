"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const logger_1 = require("hono/logger");
const cors_1 = require("hono/cors");
const app = new hono_1.Hono();
app.use('*', (0, logger_1.logger)());
app.use('*', (0, cors_1.cors)());
app.get('/', (c) => c.text('Hello, Hono with TypeScript and PM2!'));
app.get('/api', (c) => c.json({ message: 'Scalable Hono API' }));
app.get('/health', (c) => c.json({ status: 'ok' }));
const port = parseInt(process.env.PORT || '3000', 10);
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
}, () => {
    console.log(`Hono server running on port ${port}`);
    if (process.send)
        process.send('ready');
});
process.on('SIGINT', () => {
    console.log('Shutting down Hono server...');
    process.exit(0);
});
