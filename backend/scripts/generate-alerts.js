import dotenv from 'dotenv';
import { pool } from '../src/db.js';

dotenv.config();

async function generateAlerts() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for low stock products...');

    // Find products where stock_quantity <= reorder_level
    const lowStockProducts = await client.query(`
      SELECT id, name, sku, stock_quantity, reorder_level, user_id
      FROM products
      WHERE stock_quantity <= reorder_level
    `);

    console.log(`📦 Found ${lowStockProducts.rows.length} low stock products`);

    if (lowStockProducts.rows.length === 0) {
      console.log('✅ No low stock products found. All inventory levels are healthy!');
      return;
    }

    // Create alerts for each low stock product
    for (const product of lowStockProducts.rows) {
      // Check if alert already exists
      const existingAlert = await client.query(
        `SELECT id FROM low_stock_alerts 
         WHERE product_id = $1 AND resolved = false`,
        [product.id]
      );

      if (existingAlert.rows.length > 0) {
        console.log(`⚠️  Alert already exists for ${product.name} (${product.sku})`);
        continue;
      }

      // Create new alert
      await client.query(
        `INSERT INTO low_stock_alerts (product_id, user_id, resolved)
         VALUES ($1, $2, false)`,
        [product.id, product.user_id]
      );

      console.log(`🚨 Created alert for ${product.name} (${product.sku}) - Stock: ${product.stock_quantity}/${product.reorder_level}`);
    }

    console.log('✅ Alert generation completed!');

  } catch (err) {
    console.error('❌ Error generating alerts:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    console.log('🔌 Pool closed');
  }
}

generateAlerts();
