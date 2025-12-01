import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET /api/suppliers
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*,
              COUNT(DISTINCT p.id) as product_count
       FROM suppliers s
       LEFT JOIN products p ON p.supplier_id = s.id
       GROUP BY s.id
       ORDER BY s.id`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM suppliers WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/suppliers
router.post('/', async (req, res, next) => {
  try {
    const { name, contact_email, phone, address } = req.body;
    const result = await query(
      `INSERT INTO suppliers (name, contact_email, phone, address)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [name, contact_email, phone, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, contact_email, phone, address } = req.body;
    const result = await query(
      `UPDATE suppliers
       SET name=$1, contact_email=$2, phone=$3, address=$4, updated_at = NOW()
       WHERE id=$5
       RETURNING *`,
      [name, contact_email, phone, address, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    console.log(`🗑️  Deleting supplier with ID: ${req.params.id}`);
    const result = await query('DELETE FROM suppliers WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    console.log(`✅ Supplier ${req.params.id} deleted successfully`);
    res.json({ success: true });
  } catch (err) {
    console.error(`❌ Failed to delete supplier ${req.params.id}:`, err.message);
    next(err);
  }
});

export default router;