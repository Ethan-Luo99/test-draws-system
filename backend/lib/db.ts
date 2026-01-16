// backend/lib/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables if not in production
// Charger les variables d'environnement si ce n'est pas en production
if (process.env.NODE_ENV !== 'production') {
  // Try to load from root .env or local .env
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config(); // Also try default .env
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

export const query = async (text: string, params: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('query error', { text, err });
    throw err;
  }
};

export default pool;