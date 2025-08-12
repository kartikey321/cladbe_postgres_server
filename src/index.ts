import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import {logger} from 'hono/logger';
import {cors} from 'hono/cors';
import {PostgresManager} from "./helpers/postgress_manager";
import {GetDataDbRequest} from "./models/requests";

const app = new Hono();
const postgresManager = PostgresManager.getInstance();
app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.text('Hello, Hono with TypeScript and PM2!'));
app.get('/api', (c) => c.json({message: 'Scalable Hono API'}));
app.get('/health', (c) => c.json({status: 'ok'}));
app.post('/get-data', async (c) => {
    const data: GetDataDbRequest = await c.req.json().then((val) => GetDataDbRequest.fromMap(val));

    const resp = await postgresManager.getData(data);
    c.json({"data": resp});
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