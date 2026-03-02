import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'smart_supply_chain',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Test query on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection test failed:', err.message);
  } else {
    console.log(`✅ PostgreSQL connected at: ${res.rows[0].now}`);
  }
});

export default pool;
