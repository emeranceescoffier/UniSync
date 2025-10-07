import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

/**
 * Returns a shared PostgreSQL connection pool.
 * Reads DATABASE_URL from your .env file or docker-compose environment.
 */
export default function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    pool.on('connect', () => {
      console.log('📦 Connected to PostgreSQL');
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL connection error:', err);
    });
  }

  return pool;
}
