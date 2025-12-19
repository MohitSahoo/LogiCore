import express from 'express';
import { pool } from '../db.js';
import { logActivity } from '../dal/activityLogger.js';

const router = express.Router();

// GET /api/products - list products with supplier info
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, s.name as supplier_name
       FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       ORDER BY p.id`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, s.name as supplier_name
       FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const { name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, sku, description, supplier_id || null, unit_price, stock_quantity || 0, reorder_level || 10]
    );
    
    const product = result.rows[0];
    
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
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level } = req.body;
    
    // Get old values for logging
    const oldResult = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    const oldProduct = oldResult.rows[0];
    
    const result = await pool.query(
      `UPDATE products
       SET name=$1, sku=$2, description=$3, supplier_id=$4,
           unit_price=$5, stock_quantity=$6, reorder_level=$7, updated_at = NOW()
       WHERE id=$8
       RETURNING *`,
      [name, sku, description, supplier_id || null, unit_price, stock_quantity, reorder_level, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const newProduct = result.rows[0];
    
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
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const productId = req.params.id;
    console.log(`🗑️  Attempting to delete product with ID: ${productId}`);

    // First, check if product exists
    const productCheck = await pool.query('SELECT id, name, sku FROM products WHERE id=$1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productCheck.rows[0];

    // Check if product is referenced by order_items
    const orderItemsCheck = await pool.query(
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
    const movementsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_movements WHERE product_id = $1',
      [productId]
    );
    const movementCount = parseInt(movementsCheck.rows[0].count);

    // Check if product has low stock alerts (we'll delete these with the product)
    const alertsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM low_stock_alerts WHERE product_id = $1',
      [productId]
    );
    const alertCount = parseInt(alertsCheck.rows[0].count);

    // Delete related records first (low_stock_alerts)
    if (alertCount > 0) {
      await pool.query('DELETE FROM low_stock_alerts WHERE product_id = $1', [productId]);
      console.log(`  🗑️  Deleted ${alertCount} low stock alert(s) for product ${productId}`);
    }

    // Delete inventory movements (optional - you might want to keep history)
    // For now, we'll delete them to allow product deletion
    if (movementCount > 0) {
      await pool.query('DELETE FROM inventory_movements WHERE product_id = $1', [productId]);
      console.log(`  🗑️  Deleted ${movementCount} inventory movement(s) for product ${productId}`);
    }

    // Now delete the product
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [productId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`✅ Product ${productId} (${product.name}) deleted successfully`);
    res.json({ 
      success: true,
      message: `Product "${product.name}" has been deleted successfully.`,
      deletedAlerts: alertCount,
      deletedMovements: movementCount
    });
  } catch (err) {
    console.error(`❌ Failed to delete product ${req.params.id}:`, err.message);
    
    // Check if it's a foreign key constraint error
    if (err.code === '23503' || err.message.includes('foreign key constraint')) {
      return res.status(400).json({
        error: 'Cannot delete this product because it is still referenced by other records.',
        details: 'This product is being used in orders or other system records. Please remove all references before deleting.'
      });
    }
    
    next(err);
  }
});

export default router;