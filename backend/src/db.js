import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

// Log connection events
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL client connected to pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err);
});

pool.on('remove', () => {
  console.log('🔌 PostgreSQL client removed from pool');
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection test failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now);
    console.log(`📊 Database: ${process.env.PGDATABASE} | Host: ${process.env.PGHOST}:${process.env.PGPORT}`);
  }
});

// helper to run queries with logging
export const query = (text, params) => {
  const start = Date.now();
  console.log('\n🔍 Executing query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
  if (params && params.length > 0) {
    console.log('📝 Parameters:', params);
  }
  
  return pool.query(text, params).then(result => {
    const duration = Date.now() - start;
    console.log(`✅ Query completed in ${duration}ms | Rows: ${result.rowCount}`);
    return result;
  }).catch(err => {
    const duration = Date.now() - start;
    console.error(`❌ Query failed after ${duration}ms:`, err.message);
    throw err;
  });
};