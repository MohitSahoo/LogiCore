// backend/src/routes/suppliers.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/suppliers  -> list suppliers
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, contact_email, phone, created_at FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/suppliers -> create supplier
router.post('/', async (req, res, next) => {
  try {
    const { name, contact_email, phone } = req.body || {};

    // Basic validation
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const insertText = `
      INSERT INTO suppliers (name, contact_email, phone, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      RETURNING id, name, contact_email, phone, created_at
    `;
    const insertValues = [String(name).trim(), contact_email || null, phone || null];

    const result = await pool.query(insertText, insertValues);
    const supplier = result.rows[0];

    res.status(201).json(supplier);
  } catch (err) {
    // if unique constraint or other db error occurs, pass to error handler
    next(err);
  }
});

export default router;
