-- Clear existing data
TRUNCATE TABLE inventory_movements, low_stock_alerts, order_items, orders, products, suppliers RESTART IDENTITY CASCADE;

INSERT INTO suppliers (name, contact_email, phone, address) VALUES
('Acme Components', 'sales@acme.com', '+1-555-1111', '123 Industrial Park'),
('Global Parts Co', 'contact@globalparts.com', '+1-555-2222', '456 Warehouse Ave'),
('Fresh Logistics', 'hello@freshlogistics.com', '+1-555-3333', '789 Supply Chain Rd'),
('Tech Supplies Inc', 'info@techsupplies.com', '+1-555-4444', '321 Tech Boulevard'),
('Premium Materials', 'sales@premiummaterials.com', '+1-555-5555', '654 Quality Street');

-- Products linked to suppliers (using supplier IDs 1-5)
INSERT INTO products (name, sku, description, supplier_id, unit_price, stock_quantity, reorder_level) VALUES
('Widget A', 'WID-A', 'Standard widget', 1, 10.00, 45, 50),
('Widget B', 'WID-B', 'Premium widget', 1, 15.50, 12, 30),
('Gadget X', 'GAD-X', 'Advanced gadget', 2, 25.75, 8, 15),
('Spare Part Z', 'SPZ-1', 'Replacement part', 2, 5.00, 180, 40),
('Circuit Board', 'CIR-001', 'Electronic circuit board', 4, 45.00, 25, 20),
('Power Supply', 'PWR-500', '500W power supply unit', 4, 65.00, 15, 25),
('LED Display', 'LED-HD', 'High-definition LED display', 3, 120.00, 5, 10),
('Connector Kit', 'CON-KIT', 'Universal connector kit', 2, 8.50, 150, 30),
('Premium Cable', 'CAB-PRE', 'Premium quality cable', 5, 12.00, 80, 40),
('Sensor Module', 'SEN-MOD', 'Advanced sensor module', 4, 35.00, 3, 12);

-- Add some sample orders
INSERT INTO orders (order_number, customer_name, status, created_at) VALUES
('ORD-20251130-001', 'ABC Corporation', 'COMPLETED', NOW() - INTERVAL '5 days'),
('ORD-20251130-002', 'XYZ Industries', 'COMPLETED', NOW() - INTERVAL '3 days'),
('ORD-20251130-003', 'Tech Solutions Ltd', 'PENDING', NOW() - INTERVAL '1 day'),
('ORD-20251130-004', 'Global Manufacturing', 'COMPLETED', NOW() - INTERVAL '7 days');

-- Add order items for completed orders
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 10, 10.00),
(1, 3, 5, 25.75),
(2, 2, 8, 15.50),
(2, 4, 20, 5.00),
(3, 5, 3, 45.00),
(3, 6, 2, 65.00),
(4, 7, 2, 120.00),
(4, 9, 10, 12.00);