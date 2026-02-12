-- 📋 COMPREHENSIVE AUDIT TRAIL & EVENT LOGGING
-- Complete traceability, accountability, and compliance

-- Audit log for all system changes
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- array of field names that changed
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    business_context VARCHAR(100), -- 'inventory_adjustment', 'order_fulfillment', etc.
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supply chain events (business-level events)
CREATE TABLE IF NOT EXISTS supply_chain_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'product_received', 'order_shipped', 'quality_check_failed'
    event_category VARCHAR(50), -- 'inventory', 'order', 'supplier', 'quality', 'compliance'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    product_id INTEGER REFERENCES products(id),
    order_id INTEGER REFERENCES orders(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    node_id INTEGER REFERENCES supply_chain_nodes(id),
    batch_number VARCHAR(100),
    quantity_affected INTEGER,
    financial_impact DECIMAL(12,2),
    compliance_impact BOOLEAN DEFAULT false,
    resolution_required BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document attachments for traceability
CREATE TABLE IF NOT EXISTS document_attachments (
    id SERIAL PRIMARY KEY,
    reference_type VARCHAR(50) NOT NULL, -- 'product', 'order', 'supplier', 'event'
    reference_id INTEGER NOT NULL,
    document_type VARCHAR(50), -- 'invoice', 'certificate', 'photo', 'report'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance tracking
CREATE TABLE IF NOT EXISTS compliance_records (
    id SERIAL PRIMARY KEY,
    compliance_type VARCHAR(100) NOT NULL, -- 'food_safety', 'quality_cert', 'environmental'
    reference_type VARCHAR(50) NOT NULL, -- 'product', 'supplier', 'batch'
    reference_id INTEGER NOT NULL,
    certificate_number VARCHAR(255),
    issued_by VARCHAR(255),
    issued_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'expired', 'revoked', 'pending'
    document_id INTEGER REFERENCES document_attachments(id),
    notes TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quality control records
CREATE TABLE IF NOT EXISTS quality_control_records (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES inventory_batches(id),
    inspection_type VARCHAR(50), -- 'incoming', 'in_process', 'final', 'random'
    inspection_date DATE DEFAULT CURRENT_DATE,
    inspector_name VARCHAR(255),
    test_results JSONB, -- flexible structure for different test types
    pass_fail VARCHAR(10) CHECK (pass_fail IN ('pass', 'fail', 'conditional')),
    defect_count INTEGER DEFAULT 0,
    sample_size INTEGER,
    notes TEXT,
    corrective_action TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traceability links (lot tracking)
CREATE TABLE IF NOT EXISTS traceability_links (
    id SERIAL PRIMARY KEY,
    parent_type VARCHAR(50) NOT NULL, -- 'raw_material', 'component', 'finished_product'
    parent_id INTEGER NOT NULL,
    parent_batch VARCHAR(100),
    child_type VARCHAR(50) NOT NULL,
    child_id INTEGER NOT NULL,
    child_batch VARCHAR(100),
    quantity_used DECIMAL(10,3),
    transformation_date DATE DEFAULT CURRENT_DATE,
    process_step VARCHAR(100),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            table_name, record_id, operation, old_values, 
            user_id, created_at
        ) VALUES (
            TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD),
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0),
            CURRENT_TIMESTAMP
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            table_name, record_id, operation, old_values, new_values,
            user_id, created_at
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW),
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name, record_id, operation, new_values,
            user_id, created_at
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW),
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS audit_products ON products;
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_orders ON orders;
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_suppliers ON suppliers;
CREATE TRIGGER audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_inventory_movements ON inventory_movements;
CREATE TRIGGER audit_inventory_movements AFTER INSERT OR UPDATE OR DELETE ON inventory_movements
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_supply_chain_events_type ON supply_chain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_supply_chain_events_category ON supply_chain_events(event_category);
CREATE INDEX IF NOT EXISTS idx_supply_chain_events_created_at ON supply_chain_events(created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_records_reference ON compliance_records(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_quality_control_product ON quality_control_records(product_id);
CREATE INDEX IF NOT EXISTS idx_traceability_parent ON traceability_links(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_traceability_child ON traceability_links(child_type, child_id);