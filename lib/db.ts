import { Pool, Client } from 'pg';
const connectionString = process.env.DATABASE_URL;

const dbClient = new Client({connectionString});

export default dbClient;
