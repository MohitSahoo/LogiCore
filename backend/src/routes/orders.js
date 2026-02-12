import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all orders with totals
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('📦 Fetching orders');
    
    let query = `
      SELECT 
        o.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(oi.unit_price AS NUMERIC)), 0) as total_amount,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id`;
    
    let params = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      query += ` WHERE o.user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      query += ` WHERE o.user_id = $1`;
      params.push(req.user.userId);
    }
    
    query += `
      GROUP BY o.id, u.first_name, u.last_name, u.email
      ORDER BY o.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    // Ensure total_amount is a valid number
    const orders = result.rows.map(order => ({
      ...order,
      total_amount: order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00',
      item_count: parseInt(order.item_count) || 0
    }));
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    console.log(`📦 Fetching order ${id} for user ${userId}`);
    
    // Build query with user access control
    let orderQuery = 'SELECT * FROM orders WHERE id = $1';
    let orderParams = [id];
    
    // Non-admin users can only see their own orders
    if (!isAdmin) {
      orderQuery += ' AND user_id = $2';
      orderParams.push(userId);
    }
    
    const orderResult = await pool.query(orderQuery, orderParams);
    
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
    
    // Calculate total_amount from order items
    const total = itemsResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
    }, 0);
    
    order.total_amount = total.toFixed(2);
    order.item_count = itemsResult.rows.length;
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create order
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { customer_name, status, items } = req.body;
    const userId = req.user.userId;
    
    console.log('🧾 Creating order with payload:', { 
      customer_name, 
      status, 
      itemsCount: items?.length,
      userId 
    });
    
    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create order with user_id
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_name, status, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orderNumber, customer_name, (status || 'pending').toUpperCase(), userId]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items (with user validation)
    if (items && items.length > 0) {
      const isAdmin = req.user.role === 'admin';
      
      for (const item of items) {
        // Admin can create orders for any product, regular users only their own
        let productQuery = 'SELECT id, unit_price FROM products WHERE id = $1';
        let productParams = [item.product_id];
        
        if (!isAdmin) {
          productQuery += ' AND user_id = $2';
          productParams.push(userId);
        }
        
        const productCheck = await client.query(productQuery, productParams);
        
        if (productCheck.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found or access denied`);
        }
        
        // Use the product's current unit_price if not provided
        const unitPrice = item.unit_price || productCheck.rows[0].unit_price;
        
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, unitPrice]
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
router.put('/:id', authenticateToken, async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`\n🔵 [REQUEST ${requestId}] PUT /api/orders/${req.params.id} - START`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log(`  [REQUEST ${requestId}] Transaction started`);
    
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    console.log(`  [REQUEST ${requestId}] User: ${userId}, Status: ${status}`);
    
    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
    
    // Get current order status and items
    let orderQuery = 'SELECT o.*, o.status as current_status FROM orders o WHERE o.id = $1';
    let orderParams = [id];
    
    if (!isAdmin) {
      orderQuery += ' AND o.user_id = $2';
      orderParams.push(userId);
    }
    
    const orderResult = await client.query(orderQuery, orderParams);
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found or access denied' });
    }
    
    const currentOrder = orderResult.rows[0];
    const oldStatus = currentOrder.current_status;
    const newStatus = status.toUpperCase();
    
    console.log(`  [REQUEST ${requestId}] Status change: ${oldStatus} → ${newStatus}`);
    console.log(`  [REQUEST ${requestId}] ℹ️  Inventory will be managed by database trigger 'handle_order_completion()'`);
    
    // Update order status
    let updateQuery = `UPDATE orders 
                       SET status = $1, updated_at = NOW()
                       WHERE id = $2`;
    let updateParams = [newStatus, id];
    
    if (!isAdmin) {
      updateQuery += ' AND user_id = $3';
      updateParams.push(userId);
    }
    
    updateQuery += ' RETURNING *';
    
    const result = await client.query(updateQuery, updateParams);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found or access denied' });
    }
    
    const updated = result.rows[0];
    
    await client.query('COMMIT');
    console.log(`  [REQUEST ${requestId}] Transaction committed`);
    
    console.log(`🟢 [REQUEST ${requestId}] PUT /api/orders/${id} - SUCCESS`);
    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`🔴 [REQUEST ${requestId}] Error updating order:`, err);
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  } finally {
    client.release();
    console.log(`  [REQUEST ${requestId}] Client released\n`);
  }
});

// DELETE order
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    console.log(`🗑️  Deleting order ${id} by user ${userId}`);
    
    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
    
    // Build query with user access control
    let deleteQuery = 'DELETE FROM orders WHERE id = $1';
    let deleteParams = [id];
    
    // Non-admin users can only delete their own orders
    if (!isAdmin) {
      deleteQuery += ' AND user_id = $2';
      deleteParams.push(userId);
    }
    
    deleteQuery += ' RETURNING *';
    
    const result = await client.query(deleteQuery, deleteParams);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found or access denied' });
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Order deleted:', result.rows[0]);
    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  } finally {
    client.release();
  }
});

export default router;
