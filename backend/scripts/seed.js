import dotenv from 'dotenv';
import { pool } from '../src/db.js';

dotenv.config();

const suppliers = [
  { name: 'TechParts Inc', contact_email: 'contact@techparts.com', phone: '+1-555-0101' },
  { name: 'Global Electronics', contact_email: 'hello@globalelec.com', phone: '+1-555-0102' },
  { name: 'Component Masters', contact_email: 'sales@compmasters.com', phone: '+1-555-0103' },
];

const products = [
  { name: 'Business Laptop Pro', sku: 'LAPTOP-001', description: 'High-performance laptop', supplier_index: 0, unit_price: 1299.99, stock_quantity: 25, reorder_level: 5 },
  { name: 'Wireless Mouse', sku: 'MOUSE-001', description: 'Ergonomic wireless mouse', supplier_index: 1, unit_price: 29.99, stock_quantity: 120, reorder_level: 30 },
  { name: 'Mechanical Keyboard', sku: 'KEYBOARD-001', description: 'RGB mechanical keyboard', supplier_index: 1, unit_price: 89.99, stock_quantity: 60, reorder_level: 15 },
  { name: '27\" 4K Monitor', sku: 'MONITOR-001', description: 'Professional 4K display', supplier_index: 0, unit_price: 499.99, stock_quantity: 35, reorder_level: 10 },
  { name: 'USB-C Cable 2m', sku: 'CABLE-USB-001', description: 'High-speed USB-C cable', supplier_index: 2, unit_price: 19.99, stock_quantity: 400, reorder_level: 100 },
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

    console.log('🧹 Clearing existing data...');
    await client.query('TRUNCATE order_items, orders, products, suppliers, inventory_movements, low_stock_alerts RESTART IDENTITY CASCADE');

    console.log('➕ Seeding suppliers...');
    const supplierIds = [];
    for (const supplier of suppliers) {
      const res = await client.query(
        `INSERT INTO suppliers (name, contact_email, phone) VALUES ($1,$2,$3) RETURNING id`,
        [supplier.name, supplier.contact_email, supplier.phone]
      );
      supplierIds.push(res.rows[0].id);
    }

    console.log('➕ Seeding products...');
    const productIdsBySku = {};
    for (const product of products) {
      const res = await client.query(
        `INSERT INTO products (name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, sku`,
        [
          product.name,
          product.sku,
          product.description,
          supplierIds[product.supplier_index] || null,
          product.unit_price,
          product.stock_quantity,
          product.reorder_level,
        ]
      );
      const row = res.rows[0];
      productIdsBySku[row.sku] = row.id;
    }

    console.log('➕ Seeding orders...');
    const orderIds = [];
    for (const order of orders) {
      const res = await client.query(
        `INSERT INTO orders (order_number, customer_name, status) VALUES ($1,$2,$3) RETURNING id`,
        [order.order_number, order.customer_name, order.status]
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

