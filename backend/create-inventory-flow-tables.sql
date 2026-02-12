-- 🔄 INVENTORY LIFECYCLE & FLOW SYSTEM
-- Transform static inventory into flowing, state-aware system

-- Inventory States and Movements
CREATE TABLE IF NOT EXISTS inventory_states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- Insert standard inventory states
INSERT INTO inventory_states (name, description, is_available, sort_order) VALUES
('incoming', 'Inventory ordered but not yet received', false, 1),
('received', 'Inventory received and being processed', false, 2),
('quality_check', 'Undergoing quality inspection', false, 3),
('available', 'Ready for sale/distribution', true, 4),
('reserved', 'Reserved for specific orders', false, 5),
('picked', 'Picked for order fulfillment', false, 6),
('shipped', 'Shipped to customer', false, 7),
('damaged', 'Damaged inventory requiring action', false, 8),
('expired', 'Expired inventory requiring disposal', false, 9),
('returned', 'Returned by customer', false, 10)
ON CONFLICT (name) DO NOTHING;

-- Enhanced inventory movements with states and flow
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    movement_type VARCHAR(50) NOT NULL, -- 'inbound', 'outbound', 'transfer', 'adjustment'
    quantity INTEGER NOT NULL,
    from_state VARCHAR(50) REFERENCES inventory_states(name),
    to_state VARCHAR(50) REFERENCES inventory_states(name),
    reference_type VARCHAR(50), -- 'purchase_order', 'sales_order', 'transfer', 'adjustment'
    reference_id INTEGER,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    location VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Inventory batches for traceability
CREATE TABLE IF NOT EXISTS inventory_batches (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    received_date DATE,
    expiry_date DATE,
    quantity_received INTEGER NOT NULL,
    quantity_available INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    quality_status VARCHAR(50) DEFAULT 'pending',
    location VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, batch_number)
);

-- Current inventory state tracking
CREATE TABLE IF NOT EXISTS inventory_current_state (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES inventory_batches(id),
    state VARCHAR(50) REFERENCES inventory_states(name),
    quantity INTEGER NOT NULL,
    location VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON inventory_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_current_state_product_id ON inventory_current_state(product_id);

-- Add state tracking to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_state VARCHAR(50) REFERENCES inventory_states(name) DEFAULT 'available';
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;