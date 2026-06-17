import { Pool } from 'pg';
import config from './config';

const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  console.error('PostgreSQL pool error:', err.message);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('PostgreSQL connected');
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('PostgreSQL connection failed:', msg);
    return false;
  }
}

export default pool;
