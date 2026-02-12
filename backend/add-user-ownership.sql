-- Add user_id columns to tables for data ownership
-- This will allow users to only see their own data

-- Add user_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Add user_id to orders table  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Add user_id to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Update existing records to assign them to admin user (id=4)
UPDATE products SET user_id = 4 WHERE user_id IS NULL;
UPDATE orders SET user_id = 4 WHERE user_id IS NULL;  
UPDATE suppliers SET user_id = 4 WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);