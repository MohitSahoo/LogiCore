-- Trigger to automatically create low stock alerts when products go below reorder level

-- Function to check and create low stock alert
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- If stock quantity is at or below reorder level
    IF NEW.stock_quantity <= NEW.reorder_level THEN
        -- Check if an unresolved alert already exists
        IF NOT EXISTS (
            SELECT 1 FROM low_stock_alerts 
            WHERE product_id = NEW.id 
            AND resolved = false
        ) THEN
            -- Create new alert
            INSERT INTO low_stock_alerts (product_id, user_id, resolved)
            VALUES (NEW.id, NEW.user_id, false);
            
            RAISE NOTICE 'Low stock alert created for product ID %', NEW.id;
        END IF;
    ELSE
        -- If stock is now above reorder level, resolve any existing alerts
        UPDATE low_stock_alerts
        SET resolved = true, resolved_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.id 
        AND resolved = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_check_low_stock ON products;

-- Create trigger on products table
CREATE TRIGGER trigger_check_low_stock
    AFTER INSERT OR UPDATE OF stock_quantity, reorder_level
    ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock_alert();

COMMENT ON FUNCTION check_low_stock_alert() IS 'Automatically creates low stock alerts when products fall below reorder level';
COMMENT ON TRIGGER trigger_check_low_stock ON products IS 'Monitors stock levels and creates/resolves alerts automatically';
