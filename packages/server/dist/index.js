"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const logger_1 = require("hono/logger");
const cors_1 = require("hono/cors");
const postgres_manager_1 = require("@cladbe/postgres_manager");
const requests_1 = require("@cladbe/postgres_manager/dist/models/requests");
const app = new hono_1.Hono();
const postgresManager = postgres_manager_1.PostgresManager.getInstance();
app.use('*', (0, logger_1.logger)());
app.use('*', (0, cors_1.cors)());
app.get('/', (c) => c.text('Hello, Hono with TypeScript and PM2!'));
app.get('/api', (c) => c.json({ message: 'Scalable Hono API' }));
app.get('/health', (c) => c.json({ status: 'ok' }));
app.post('/get-data', async (c) => {
    const data = await c.req.json().then((val) => {
        return postgres_manager_1.GetDataDbRequest.fromMap(val);
    });
    const resp = await postgresManager.getData(data);
    return c.json({ "data": resp }, 200);
});
// Get single record
app.post('/get-single-record', async (c) => {
    const data = await c.req.json().then((val) => {
        return postgres_manager_1.GetSingleRecordRequest.fromMap(val);
    });
    const resp = await postgresManager.getData(data);
    return c.json({ "data": resp }, 200);
});
// Add single record
app.post('/add-single-record', async (c) => {
    const data = await c.req.json().then((val) => {
        return postgres_manager_1.AddSingleDbRequest.fromMap(val);
    });
    const resp = await postgresManager.editData(data);
    return c.json({ "data": resp }, 200);
});
// Update single record
app.post('/update-single-record', async (c) => {
    const data = await c.req.json().then((val) => {
        return postgres_manager_1.UpdateSingleDbRequest.fromMap(val);
    });
    console.log(data.toMap());
    const resp = await postgresManager.editData(data);
    return c.json({ "data": resp }, 200);
});
app.post('/create-table', async (c) => {
    const data = await c.req.json().then((val) => {
        return new requests_1.CreateTableDbRequest(val);
    });
    const resp = await postgresManager.editData(data);
    return c.json({ "data": resp }, 200);
});
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
