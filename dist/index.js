"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const logger_1 = require("hono/logger");
const cors_1 = require("hono/cors");
const postgress_manager_1 = require("./helpers/postgress_manager");
const requests_1 = require("./models/requests");
const app = new hono_1.Hono();
const postgresManager = postgress_manager_1.PostgresManager.getInstance();
app.use('*', (0, logger_1.logger)());
app.use('*', (0, cors_1.cors)());
app.get('/', (c) => c.text('Hello, Hono with TypeScript and PM2!'));
app.get('/api', (c) => c.json({ message: 'Scalable Hono API' }));
app.get('/health', (c) => c.json({ status: 'ok' }));
app.post('/get-data', async (c) => {
    const data = await c.req.json().then((val) => {
        return requests_1.GetDataDbRequest.fromMap(val);
    });
    const resp = await postgresManager.getData(data);
    return c.json({ "data": resp }, 200);
});
// Get single record
app.post('/get-single-record', async (c) => {
    const data = await c.req.json().then((val) => {
        return requests_1.GetSingleRecordRequest.fromMap(val);
    });
    const resp = await postgresManager.getData(data);
    return c.json({ "data": resp }, 200);
});
// Add single record
app.post('/add-single-record', async (c) => {
    const data = await c.req.json().then((val) => {
        return requests_1.AddSingleDbRequest.fromMap(val);
    });
    const resp = await postgresManager.editData(data);
    return c.json({ "data": resp }, 200);
});
// Update single record
app.post('/update-single-record', async (c) => {
    const data = await c.req.json().then((val) => {
        return requests_1.UpdateSingleDbRequest.fromMap(val);
    });
    console.log(data.toMap());
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
// const sqlBuilder = Knex({ client: 'pg' });
// const query = sqlBuilder('users')
//     .where({ id: 123 })
//     .update({ balance: 50 })
//     .toString();
//
// // Using trx as a transaction object:
// const knex = Knex({
//     client: 'pg', // or 'mysql', 'sqlite3', etc.
//     connection: {
//         host: '127.0.0.1',
//         user: 'your_user',
//         password: 'your_password',
//         database: 'your_database'
//     }
// });
//
// async function performTransaction() {
//     try {
//         await knex.transaction(async (trx) => {
//             // Insert a new user
//             const user = await trx('users').insert({
//                 username: 'john_doe',
//                 email: 'john.doe@example.com'
//             }).returning('*'); // Returns the inserted row(s)
//
//             // Assuming 'user' is an array and we want the first element
//             const userId = user[0].id;
//
//             // Insert an associated profile for the new user
//             await trx('profiles').insert({
//                 user_id: userId,
//                 bio: 'A new user profile.'
//             });
//
//
//             console.log('Transaction committed successfully.');
//         });
//     } catch (error) {
//         console.error('Transaction failed, rolling back:', error);
//     } finally {
//         // Close the Knex connection pool when done
//         await knex.destroy();
//     }
// }
//
// performTransaction();
