import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all orders with totals
router.get('/', async (req, res) => {
  try {
    console.log('📦 Fetching orders');
    const result = await pool.query(`
      SELECT 
        o.*,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_amount,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Fetching order ${id}`);
    
    // Get order
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    const itemsResult = await pool.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    const order = orderResult.rows[0];
    order.items = itemsResult.rows;
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create order
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { customer_name, status, items } = req.body;
    console.log('🧾 Creating order with payload:', { customer_name, status, itemsCount: items?.length });
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_name, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [orderNumber, customer_name, status || 'PENDING']
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.unit_price]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Fetch complete order with items
    const completeOrder = await pool.query(`
      SELECT 
        o.*,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_amount
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [order.id]);
    
    const created = completeOrder.rows[0];
    console.log('✅ Order created:', { id: created.id, order_number: created.order_number, total_amount: created.total_amount });
    res.status(201).json(created);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// PUT update order status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`✏️  Updating order ${id} to status ${status}`);
    
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updated = result.rows[0];
    console.log('✅ Order updated:', { id: updated.id, status: updated.status });
    res.json(updated);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Deleting order ${id}`);
    
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('✅ Order deleted:', result.rows[0]);
    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
