import express from 'express';
import { pool } from '../db.js';
import { logActivity } from '../dal/activityLogger.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products - list products with supplier info
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    console.log('📦 GET /api/products');
    console.log('   User:', req.user ? `${req.user.email} (${req.user.role})` : 'Not authenticated');
    console.log('   Query params:', req.query);
    
    let query = `SELECT p.*, s.name as supplier_name
                 FROM products p
                 LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    let params = [];

    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      console.log('   Filtering: user_only=true, showing only user', req.user.userId);
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      console.log('   Filtering: non-admin user, showing only user', req.user.userId);
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    } else if (req.user && req.user.role === 'admin') {
      console.log('   No filtering: admin user, showing ALL products');
    } else {
      console.log('   No filtering: unauthenticated request');
    }

    query += ` ORDER BY p.id`;

    const result = await pool.query(query, params);
    console.log(`   ✅ Returning ${result.rows.length} products\n`);
    res.json(result.rows);
  } catch (err) {
    console.error('   ❌ Error:', err.message);
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    let query = `SELECT p.*, s.name as supplier_name
                 FROM products p
                 LEFT JOIN suppliers s ON p.supplier_id = s.id
                 WHERE p.id = $1`;
    let params = [req.params.id];

    // If user is not admin, ensure they can only access their own products
    if (req.user && req.user.role !== 'admin') {
      query += ` AND p.user_id = $2`;
      params.push(req.user.userId);
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level } = req.body;
    const userId = req.user.userId;
    
    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
    
    // Always assign the product to the authenticated user
    const result = await client.query(
      `INSERT INTO products (name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [name, sku, description, supplier_id || null, unit_price, stock_quantity || 0, reorder_level || 10, userId]
    );
    
    const product = result.rows[0];
    
    await client.query('COMMIT');
    
    // Log activity to MongoDB (async, non-blocking)
    logActivity({
      action: 'CREATE',
      entity_type: 'product',
      entity_id: product.id,
      user_name: req.body.user_name || 'System',
      details: { product: { name, sku, stock_quantity, unit_price } },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    }).catch((err) => console.error('Failed to log activity:', err));
    
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level } = req.body;
    const userId = req.user.userId;
    
    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
    
    // Get old values for logging and ownership check
    let oldQuery = 'SELECT * FROM products WHERE id=$1';
    let oldParams = [req.params.id];
    
    // If user is not admin, ensure they can only edit their own products
    if (req.user.role !== 'admin') {
      oldQuery += ' AND user_id = $2';
      oldParams.push(userId);
    }
    
    const oldResult = await client.query(oldQuery, oldParams);
    
    if (oldResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    
    const oldProduct = oldResult.rows[0];
    
    const result = await client.query(
      `UPDATE products
       SET name=$1, sku=$2, description=$3, supplier_id=$4,
           unit_price=$5, stock_quantity=$6, reorder_level=$7, updated_at = NOW()
       WHERE id=$8 AND user_id=$9
       RETURNING *`,
      [name, sku, description, supplier_id || null, unit_price, stock_quantity, reorder_level, req.params.id, oldProduct.user_id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const newProduct = result.rows[0];
    
    await client.query('COMMIT');
    
    // Log activity to MongoDB
    logActivity({
      action: 'UPDATE',
      entity_type: 'product',
      entity_id: newProduct.id,
      user_name: req.body.user_name || 'System',
      details: {
        before: oldProduct,
        after: newProduct,
        changes: Object.keys(req.body).filter((key) => oldProduct[key] !== req.body[key]),
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    }).catch((err) => console.error('Failed to log activity:', err));
    
    res.json(newProduct);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const productId = req.params.id;
    const userId = req.user.userId;
    
    console.log(`🗑️  Attempting to delete product with ID: ${productId}`);

    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);

    // First, check if product exists and user has access
    let productQuery = 'SELECT id, name, sku, user_id FROM products WHERE id=$1';
    let productParams = [productId];
    
    // If user is not admin, ensure they can only delete their own products
    if (req.user.role !== 'admin') {
      productQuery += ' AND user_id = $2';
      productParams.push(userId);
    }
    
    const productCheck = await client.query(productQuery, productParams);
    
    if (productCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    const product = productCheck.rows[0];

    // Check if product is referenced by order_items
    const orderItemsCheck = await client.query(
      `SELECT oi.order_id, o.order_number, o.customer_name, o.status, COUNT(*) as item_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = $1
       GROUP BY oi.order_id, o.order_number, o.customer_name, o.status`,
      [productId]
    );

    if (orderItemsCheck.rows.length > 0) {
      const orders = orderItemsCheck.rows;
      const orderNumbers = orders.map(o => o.order_number).join(', ');
      const orderCount = orders.length;
      
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot delete product "${product.name}" (SKU: ${product.sku}) because it is used in ${orderCount} order(s).`,
        details: `This product is referenced in the following order(s): ${orderNumbers}. To delete this product, you must first remove it from all orders or delete the orders that contain it.`,
        orderCount,
        orderNumbers: orders.map(o => o.order_number),
        orders: orders.map(o => ({
          orderNumber: o.order_number,
          customerName: o.customer_name,
          status: o.status,
          itemCount: o.item_count
        }))
      });
    }

    // Check if product has inventory movements (informational only, we can still delete)
    const movementsCheck = await client.query(
      'SELECT COUNT(*) as count FROM inventory_movements WHERE product_id = $1',
      [productId]
    );
    const movementCount = parseInt(movementsCheck.rows[0].count);

    // Check if product has low stock alerts (we'll delete these with the product)
    const alertsCheck = await client.query(
      'SELECT COUNT(*) as count FROM low_stock_alerts WHERE product_id = $1',
      [productId]
    );
    const alertCount = parseInt(alertsCheck.rows[0].count);

    // Delete related records first (low_stock_alerts)
    if (alertCount > 0) {
      await client.query('DELETE FROM low_stock_alerts WHERE product_id = $1', [productId]);
      console.log(`  🗑️  Deleted ${alertCount} low stock alert(s) for product ${productId}`);
    }

    // Delete inventory movements (optional - you might want to keep history)
    // For now, we'll delete them to allow product deletion
    if (movementCount > 0) {
      await client.query('DELETE FROM inventory_movements WHERE product_id = $1', [productId]);
      console.log(`  🗑️  Deleted ${movementCount} inventory movement(s) for product ${productId}`);
    }

    // Now delete the product
    const result = await client.query('DELETE FROM products WHERE id=$1 RETURNING id', [productId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    await client.query('COMMIT');

    console.log(`✅ Product ${productId} (${product.name}) deleted successfully`);
    res.json({ 
      success: true,
      message: `Product "${product.name}" has been deleted successfully.`,
      deletedAlerts: alertCount,
      deletedMovements: movementCount
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed to delete product ${req.params.id}:`, err.message);
    
    // Check if it's a foreign key constraint error
    if (err.code === '23503' || err.message.includes('foreign key constraint')) {
      return res.status(400).json({
        error: 'Cannot delete this product because it is still referenced by other records.',
        details: 'This product is being used in orders or other system records. Please remove all references before deleting.'
      });
    }
    
    next(err);
  } finally {
    client.release();
  }
});

export default router;