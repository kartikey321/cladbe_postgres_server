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
// ---- shared error utility ----
function sendError(c, status, userMsg, err) {
    const e = err;
    return c.json({
        error: userMsg,
        message: e?.message ?? 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
    }, status);
}
// ---- global last-resort error handler (in case something escapes a route try/catch) ----
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return sendError(c, 500, 'Internal Server Error', err);
});
app.get('/', (c) => c.text('Hello, Hono with TypeScript and PM2!'));
app.get('/api', (c) => c.json({ message: 'Scalable Hono API' }));
app.get('/health', (c) => c.json({ status: 'ok' }));
// ---- get-data ----
app.post('/get-data', async (c) => {
    try {
        const data = await c.req.json().then(postgres_manager_1.GetDataDbRequest.fromMap);
        const resp = await postgresManager.getData(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /get-data:', error);
        return sendError(c, 500, 'Failed to retrieve data', error);
    }
});
// ---- get-single-record ----
app.post('/get-single-record', async (c) => {
    try {
        const data = await c.req.json().then(postgres_manager_1.GetSingleRecordRequest.fromMap);
        const resp = await postgresManager.getData(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /get-single-record:', error);
        return sendError(c, 500, 'Failed to retrieve single record', error);
    }
});
// ---- add-single-record ----
app.post('/add-single-record', async (c) => {
    try {
        const data = await c.req.json().then(postgres_manager_1.AddSingleDbRequest.fromMap);
        const resp = await postgresManager.editData(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /add-single-record:', error);
        return sendError(c, 500, 'Failed to add record', error);
    }
});
// ---- update-single-record ----
app.post('/update-single-record', async (c) => {
    try {
        const data = await c.req.json().then(postgres_manager_1.UpdateSingleDbRequest.fromMap);
        const resp = await postgresManager.editData(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /update-single-record:', error);
        return sendError(c, 500, 'Failed to update record', error);
    }
});
// ---- table-exists ----
// If you later switch this to GET with query params, the same sendError applies.
app.post('/table-exists', async (c) => {
    try {
        const data = await c.req.json().then(requests_1.TableExistsRequest.fromMap);
        const resp = await postgresManager.tableExists(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /table-exists:', error);
        return sendError(c, 500, 'Failed to check table-exists', error);
    }
});
// ---- create-table ----
app.post('/create-table', async (c) => {
    try {
        const data = await c.req.json().then((val) => new requests_1.CreateTableDbRequest(val));
        const resp = await postgresManager.createTable(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /create-table:', error);
        return sendError(c, 500, 'Failed to create table', error);
    }
});
// ---- run-aggregation ----
app.post('/run-aggregation', async (c) => {
    try {
        const data = await c.req.json().then(requests_1.AggregationRequest.fromMap);
        const resp = await postgresManager.runAggregationQuery(data);
        return c.json({ data: resp }, 200);
    }
    catch (error) {
        console.error('Error in /run-aggregation:', error);
        return sendError(c, 500, 'Failed to run aggregation', error);
    }
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
