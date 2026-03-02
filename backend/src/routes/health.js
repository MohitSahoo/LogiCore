import express from 'express';
import { pool } from '../db.js';
import { getDB } from '../mongodb.js';

const router = express.Router();

// Health check endpoint for monitoring
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      postgresql: false,
      mongodb: false
    }
  };

  try {
    // Check PostgreSQL
    await pool.query('SELECT 1');
    health.services.postgresql = true;
  } catch (error) {
    console.error('PostgreSQL health check failed:', error.message);
    health.status = 'degraded';
  }

  try {
    // Check MongoDB
    const db = getDB();
    await db.admin().ping();
    health.services.mongodb = true;
  } catch (error) {
    console.error('MongoDB health check failed:', error.message);
    health.status = 'degraded';
  }

  // Return 503 if any service is down
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
