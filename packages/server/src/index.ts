import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import {logger} from 'hono/logger';
import {cors} from 'hono/cors';
import {
    AddSingleDbRequest,
    GetDataDbRequest,
    GetSingleRecordRequest,
    PostgresManager,
    UpdateSingleDbRequest
} from '@cladbe/postgres_manager';
import {CreateTableDbRequest} from "@cladbe/postgres_manager/dist/models/requests";

const app = new Hono();
const postgresManager = PostgresManager.getInstance();
app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.text('Hello, Hono with TypeScript and PM2!'));
app.get('/api', (c) => c.json({message: 'Scalable Hono API'}));
app.get('/health', (c) => c.json({status: 'ok'}));
app.post('/get-data', async (c) => {
    const data: GetDataDbRequest = await c.req.json().then((val) => {
        return GetDataDbRequest.fromMap(val);
    });

    const resp = await postgresManager.getData(data);
    return c.json({"data": resp}, 200);
});
// Get single record
app.post('/get-single-record', async (c) => {
    const data: GetSingleRecordRequest = await c.req.json().then((val) => {
        return GetSingleRecordRequest.fromMap(val);
    });

    const resp = await postgresManager.getData(data);
    return c.json({"data": resp}, 200);
});

// Add single record
app.post('/add-single-record', async (c) => {
    const data: AddSingleDbRequest = await c.req.json().then((val) => {
        return AddSingleDbRequest.fromMap(val);
    });

    const resp = await postgresManager.editData(data);
    return c.json({"data": resp}, 200);
});

// Update single record
app.post('/update-single-record', async (c) => {
    const data: UpdateSingleDbRequest = await c.req.json().then((val) => {
        return UpdateSingleDbRequest.fromMap(val);
    });
    console.log(data.toMap());
    const resp = await postgresManager.editData(data);
    return c.json({"data": resp}, 200);
});

app.post('/create-table', async (c) => {
    const data: CreateTableDbRequest = await c.req.json().then((val) => {
        return new CreateTableDbRequest(val);
    });
    const resp = await postgresManager.editData(data);
    return c.json({"data": resp}, 200);
})

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