import express from 'express';
import { pool, query } from '../db.js';

const router = express.Router();

// GET /api/orders - list orders with aggregates
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT o.*,
              COALESCE(SUM(oi.quantity * oi.unit_price),0) AS total_amount,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id with items
router.get('/:id', async (req, res, next) => {
  try {
    const orderResult = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const itemsResult = await query(
      `SELECT oi.*, p.name AS product_name, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [req.params.id]
    );
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders - create order with items
router.post('/', async (req, res, next) => {
  const { customer_name, status = 'PENDING', items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order items are required' });
  }

  const client = await pool.connect();
  try {
    console.log('🔄 Starting transaction for new order');
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_name, status)
       VALUES (
         'ORD-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || FLOOR(RANDOM()*1000),
         $1,
         $2
       )
       RETURNING *`,
      [customer_name, status]
    );
    const order = orderResult.rows[0];
    console.log('✅ Order created:', order.order_number, '| ID:', order.id);

    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [order.id, product_id, quantity, unit_price]
      );
      console.log(`  ➕ Added item: Product ${product_id} | Qty: ${quantity} | Price: $${unit_price}`);
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');

    // Re-fetch with items
    const itemsResult = await query(
      `SELECT oi.*, p.name AS product_name, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    res.status(201).json({ ...order, items: itemsResult.rows });
  } catch (err) {
    console.error('❌ Transaction failed, rolling back:', err.message);
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
    console.log('🔌 Database client released');
  }
});

// PUT /api/orders/:id - update status (triggers handle inventory changes)
router.put('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    console.log(`🔄 Updating order ${req.params.id} status to: ${status}`);
    console.log('⚠️  Note: This may trigger database triggers for inventory updates');
    
    const result = await query(
      `UPDATE orders
       SET status=$1, updated_at = NOW()
       WHERE id=$2
       RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log(`✅ Order ${result.rows[0].order_number} status updated to ${status}`);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res, next) => {
  try {
    console.log(`🗑️  Deleting order with ID: ${req.params.id}`);
    const result = await query('DELETE FROM orders WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log(`✅ Order ${req.params.id} deleted successfully`);
    res.json({ success: true });
  } catch (err) {
    console.error(`❌ Failed to delete order ${req.params.id}:`, err.message);
    next(err);
  }
});

export default router;