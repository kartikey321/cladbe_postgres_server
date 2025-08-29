import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import {
    AddSingleDbRequest,
    GetDataDbRequest,
    GetSingleRecordRequest,
    PostgresManager,
    UpdateSingleDbRequest
} from '@cladbe/postgres_manager';
import {
    CreateTableDbRequest,
    AggregationRequest,
    TableExistsRequest
} from '@cladbe/postgres_manager/dist/models/requests';

const app = new Hono();
const postgresManager = PostgresManager.getInstance();
app.use('*', logger());
app.use('*', cors());

// ---- shared error utility ----
function sendError(c: any, status: number, userMsg: string, err: unknown) {
    const e = err as any;
    return c.json(
        {
            error: userMsg,
            message: e?.message ?? 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
        },
        status
    );
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
        const data: GetDataDbRequest = await c.req.json().then(GetDataDbRequest.fromMap);
        const resp = await postgresManager.getData(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /get-data:', error);
        return sendError(c, 500, 'Failed to retrieve data', error);
    }
});

// ---- get-single-record ----
app.post('/get-single-record', async (c) => {
    try {
        const data: GetSingleRecordRequest = await c.req.json().then(GetSingleRecordRequest.fromMap);
        const resp = await postgresManager.getData(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /get-single-record:', error);
        return sendError(c, 500, 'Failed to retrieve single record', error);
    }
});

// ---- add-single-record ----
app.post('/add-single-record', async (c) => {
    try {
        const data: AddSingleDbRequest = await c.req.json().then(AddSingleDbRequest.fromMap);
        const resp = await postgresManager.editData(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /add-single-record:', error);
        return sendError(c, 500, 'Failed to add record', error);
    }
});

// ---- update-single-record ----
app.post('/update-single-record', async (c) => {
    try {
        const data: UpdateSingleDbRequest = await c.req.json().then(UpdateSingleDbRequest.fromMap);
        const resp = await postgresManager.editData(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /update-single-record:', error);
        return sendError(c, 500, 'Failed to update record', error);
    }
});

// ---- table-exists ----
// If you later switch this to GET with query params, the same sendError applies.
app.post('/table-exists', async (c) => {
    try {
        const data: TableExistsRequest = await c.req.json().then(TableExistsRequest.fromMap);
        const resp = await postgresManager.tableExists(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /table-exists:', error);
        return sendError(c, 500, 'Failed to check table-exists', error);
    }
});

// ---- create-table ----
app.post('/create-table', async (c) => {
    try {
        const data: CreateTableDbRequest = await c.req.json().then((val) => new CreateTableDbRequest(val));
        const resp = await postgresManager.createTable(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /create-table:', error);
        return sendError(c, 500, 'Failed to create table', error);
    }
});

// ---- run-aggregation ----
app.post('/run-aggregation', async (c) => {
    try {
        const data: AggregationRequest = await c.req.json().then(AggregationRequest.fromMap);
        const resp = await postgresManager.runAggregationQuery(data);
        return c.json({ data: resp }, 200);
    } catch (error) {
        console.error('Error in /run-aggregation:', error);
        return sendError(c, 500, 'Failed to run aggregation', error);
    }
});

const port = parseInt(process.env.PORT || '3000', 10);
serve(
    {
        fetch: app.fetch,
        port,
    },
    () => {
        console.log(`Hono server running on port ${port}`);
        if (process.send) process.send('ready');
    }
);

process.on('SIGINT', () => {
    console.log('Shutting down Hono server...');
    process.exit(0);
});
