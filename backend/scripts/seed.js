import dotenv from 'dotenv';
import { pool } from '../src/db.js';

dotenv.config();

const suppliers = [
  { name: 'TechParts Inc', contact_email: 'contact@techparts.com', phone: '+1-555-0101' },
  { name: 'Global Electronics', contact_email: 'hello@globalelec.com', phone: '+1-555-0102' },
  { name: 'Component Masters', contact_email: 'sales@compmasters.com', phone: '+1-555-0103' },
  { name: 'Digital Solutions Ltd', contact_email: 'orders@digitalsolutions.com', phone: '+1-555-0104' },
  { name: 'Hardware Express', contact_email: 'support@hardwareexpress.com', phone: '+1-555-0105' },
  { name: 'Premium Tech Supply', contact_email: 'sales@premiumtech.com', phone: '+1-555-0106' },
  { name: 'Innovative Components', contact_email: 'info@innovativecomp.com', phone: '+1-555-0107' },
  { name: 'Reliable Electronics Co', contact_email: 'contact@reliableelec.com', phone: '+1-555-0108' },
  { name: 'Advanced Systems Inc', contact_email: 'procurement@advancedsys.com', phone: '+1-555-0109' },
  { name: 'Quality Parts Direct', contact_email: 'orders@qualityparts.com', phone: '+1-555-0110' },
  { name: 'Smart Tech Distributors', contact_email: 'sales@smarttechdist.com', phone: '+1-555-0111' },
  { name: 'Professional Equipment Co', contact_email: 'business@proequipment.com', phone: '+1-555-0112' }
];

const products = [
  { name: 'Business Laptop Pro', sku: 'LAPTOP-001', description: 'High-performance laptop', supplier_index: 0, unit_price: 1299.99, stock_quantity: 25, reorder_level: 5 },
  { name: 'Wireless Mouse', sku: 'MOUSE-001', description: 'Ergonomic wireless mouse', supplier_index: 1, unit_price: 29.99, stock_quantity: 120, reorder_level: 30 },
  { name: 'Mechanical Keyboard', sku: 'KEYBOARD-001', description: 'RGB mechanical keyboard', supplier_index: 1, unit_price: 89.99, stock_quantity: 60, reorder_level: 15 },
  { name: '27\" 4K Monitor', sku: 'MONITOR-001', description: 'Professional 4K display', supplier_index: 0, unit_price: 499.99, stock_quantity: 35, reorder_level: 10 },
  { name: 'USB-C Cable 2m', sku: 'CABLE-USB-001', description: 'High-speed USB-C cable', supplier_index: 2, unit_price: 19.99, stock_quantity: 400, reorder_level: 100 },
  { name: 'Wireless Headphones', sku: 'HEADPHONES-001', description: 'Noise-cancelling wireless headphones', supplier_index: 3, unit_price: 199.99, stock_quantity: 45, reorder_level: 12 },
  { name: 'Tablet 10\" Pro', sku: 'TABLET-001', description: 'Professional tablet with stylus', supplier_index: 4, unit_price: 649.99, stock_quantity: 18, reorder_level: 8 },
  { name: 'Webcam HD Pro', sku: 'WEBCAM-001', description: '1080p HD webcam with auto-focus', supplier_index: 5, unit_price: 79.99, stock_quantity: 85, reorder_level: 20 },
  { name: 'External SSD 1TB', sku: 'SSD-001', description: 'Portable external SSD drive', supplier_index: 6, unit_price: 129.99, stock_quantity: 55, reorder_level: 15 },
  { name: 'Docking Station', sku: 'DOCK-001', description: 'Universal USB-C docking station', supplier_index: 7, unit_price: 159.99, stock_quantity: 32, reorder_level: 10 },
  { name: 'Wireless Charger', sku: 'CHARGER-001', description: 'Fast wireless charging pad', supplier_index: 8, unit_price: 39.99, stock_quantity: 95, reorder_level: 25 },
  { name: 'Bluetooth Speaker', sku: 'SPEAKER-001', description: 'Portable Bluetooth speaker', supplier_index: 9, unit_price: 69.99, stock_quantity: 72, reorder_level: 18 },
  { name: 'Network Switch 8-Port', sku: 'SWITCH-001', description: 'Gigabit Ethernet switch', supplier_index: 10, unit_price: 89.99, stock_quantity: 28, reorder_level: 8 },
  { name: 'Security Camera', sku: 'CAMERA-001', description: 'IP security camera with night vision', supplier_index: 11, unit_price: 149.99, stock_quantity: 42, reorder_level: 12 },
  { name: 'Power Bank 20000mAh', sku: 'POWERBANK-001', description: 'High-capacity portable power bank', supplier_index: 4, unit_price: 49.99, stock_quantity: 3, reorder_level: 15 },
  { name: 'Smart Watch', sku: 'WATCH-001', description: 'Fitness tracking smart watch', supplier_index: 8, unit_price: 249.99, stock_quantity: 2, reorder_level: 10 }
];

const orders = [
  { order_number: 'PO-2025-001', customer_name: 'Acme Corp', status: 'PENDING' },
  { order_number: 'PO-2025-002', customer_name: 'Globex', status: 'COMPLETED' },
];

const orderItems = [
  // Order 1
  { order_index: 0, product_sku: 'LAPTOP-001', quantity: 4, unit_price: 1199.99 },
  { order_index: 0, product_sku: 'MOUSE-001', quantity: 40, unit_price: 24.99 },
  // Order 2
  { order_index: 1, product_sku: 'MONITOR-001', quantity: 6, unit_price: 449.99 },
  { order_index: 1, product_sku: 'CABLE-USB-001', quantity: 120, unit_price: 14.99 },
];

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting seed...');
    await client.query('BEGIN');

    // Get the test user ID
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['test@logicore.com']);
    if (userResult.rows.length === 0) {
      throw new Error('Test user not found. Please run create-test-user.js first.');
    }
    const userId = userResult.rows[0].id;
    console.log(`👤 Using user ID: ${userId}`);

    // Set the current user context for audit triggers
    await client.query(`SET app.current_user_id = '${userId}'`);

    console.log('🧹 Clearing existing data...');
    await client.query('TRUNCATE order_items, orders, products, suppliers, inventory_movements, low_stock_alerts RESTART IDENTITY CASCADE');

    console.log('➕ Seeding suppliers...');
    const supplierIds = [];
    for (const supplier of suppliers) {
      const res = await client.query(
        `INSERT INTO suppliers (name, contact_email, phone, user_id) VALUES ($1,$2,$3,$4) RETURNING id`,
        [supplier.name, supplier.contact_email, supplier.phone, userId]
      );
      supplierIds.push(res.rows[0].id);
    }

    console.log('➕ Seeding products...');
    const productIdsBySku = {};
    for (const product of products) {
      const res = await client.query(
        `INSERT INTO products (name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, sku`,
        [
          product.name,
          product.sku,
          product.description,
          supplierIds[product.supplier_index] || null,
          product.unit_price,
          product.stock_quantity,
          product.reorder_level,
          userId
        ]
      );
      const row = res.rows[0];
      productIdsBySku[row.sku] = row.id;
    }

    console.log('➕ Seeding orders...');
    const orderIds = [];
    for (const order of orders) {
      const res = await client.query(
        `INSERT INTO orders (order_number, customer_name, status, user_id) VALUES ($1,$2,$3,$4) RETURNING id`,
        [order.order_number, order.customer_name, order.status, userId]
      );
      orderIds.push(res.rows[0].id);
    }

    console.log('➕ Seeding order items...');
    for (const item of orderItems) {
      const orderId = orderIds[item.order_index];
      const productId = productIdsBySku[item.product_sku];
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [orderId, productId, item.quantity, item.unit_price]
      );
    }

    console.log('✅ Seed completed successfully!');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    console.log('🔌 Pool closed');
  }
}

seed();

