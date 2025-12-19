# Entity-Relationship Diagram
## Smart Supply Chain & Inventory Management System

---

## Visual ER Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SMART SUPPLY CHAIN ER DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────────┘


                    ┌──────────────────────┐
                    │     SUPPLIERS        │
                    ├──────────────────────┤
                    │ PK  id               │
                    │     name             │
                    │     contact_email    │
                    │     phone            │
                    │     address          │
                    │     created_at       │
                    │     updated_at       │
                    └──────────┬───────────┘
                               │
                               │ 1
                               │
                               │ supplies
                               │
                               │ M
                    ┌──────────▼───────────┐
                    │     PRODUCTS         │◄──────────────┐
                    ├──────────────────────┤               │
                    │ PK  id               │               │
                    │     name             │               │
                    │ UK  sku              │               │
                    │     description      │               │
                    │ FK  supplier_id      │               │
                    │     unit_price       │               │
                    │     stock_quantity   │               │
                    │     reorder_level    │               │
                    │     created_at       │               │
                    │     updated_at       │               │
                    └──┬────────┬──────┬───┘               │
                       │        │      │                   │
                       │ 1      │ 1    │ 1                 │
                       │        │      │                   │
         ┌─────────────┘        │      └──────────┐        │
         │                      │                 │        │
         │ M                    │ M               │ M      │
         │                      │                 │        │
┌────────▼──────────┐  ┌────────▼────────┐  ┌────▼────────▼─────┐
│  ORDER_ITEMS      │  │ INVENTORY_      │  │ LOW_STOCK_         │
│                   │  │ MOVEMENTS       │  │ ALERTS             │
├───────────────────┤  ├─────────────────┤  ├────────────────────┤
│ PK  id            │  │ PK  id          │  │ PK  id             │
│ FK  order_id      │  │ FK  product_id  │  │ FK  product_id     │
│ FK  product_id    │  │     change_qty  │  │     alert_message  │
│     quantity      │  │     reason      │  │     created_at     │
│     unit_price    │  │     created_at  │  └────────────────────┘
└─────────┬─────────┘  └─────────────────┘
          │
          │ M
          │
          │ belongs to
          │
          │ 1
┌─────────▼─────────┐
│     ORDERS        │
├───────────────────┤
│ PK  id            │
│ UK  order_number  │
│     customer_name │
│     status        │
│     created_at    │
│     updated_at    │
└───────────────────┘


LEGEND:
───────
PK  = Primary Key
FK  = Foreign Key
UK  = Unique Key
1   = One (Cardinality)
M   = Many (Cardinality)
│   = Relationship Line
▼   = Direction of Relationship
```

---

## Relationship Details

### 1. SUPPLIERS → PRODUCTS (1:M)
**Relationship Name:** "supplies"
- **Cardinality:** One-to-Many
- **Description:** One supplier can supply multiple products
- **Foreign Key:** PRODUCTS.supplier_id → SUPPLIERS.id
- **Delete Rule:** ON DELETE SET NULL
- **Business Rule:** Products can exist without a supplier (supplier_id can be NULL)

---

### 2. PRODUCTS → ORDER_ITEMS (1:M)
**Relationship Name:** "ordered in"
- **Cardinality:** One-to-Many
- **Description:** One product can appear in multiple order items
- **Foreign Key:** ORDER_ITEMS.product_id → PRODUCTS.id
- **Delete Rule:** ON DELETE RESTRICT (default)
- **Business Rule:** Cannot delete a product that has been ordered

---

### 3. ORDERS → ORDER_ITEMS (1:M)
**Relationship Name:** "contains"
- **Cardinality:** One-to-Many
- **Description:** One order contains multiple order items (line items)
- **Foreign Key:** ORDER_ITEMS.order_id → ORDERS.id
- **Delete Rule:** ON DELETE CASCADE
- **Business Rule:** Deleting an order automatically deletes all its line items

---

### 4. PRODUCTS → INVENTORY_MOVEMENTS (1:M)
**Relationship Name:** "tracks changes for"
- **Cardinality:** One-to-Many
- **Description:** One product has multiple inventory movement records
- **Foreign Key:** INVENTORY_MOVEMENTS.product_id → PRODUCTS.id
- **Delete Rule:** ON DELETE RESTRICT (default)
- **Business Rule:** Maintains complete audit trail; movements are immutable

---

### 5. PRODUCTS → LOW_STOCK_ALERTS (1:M)
**Relationship Name:** "generates alerts for"
- **Cardinality:** One-to-Many
- **Description:** One product can generate multiple low stock alerts over time
- **Foreign Key:** LOW_STOCK_ALERTS.product_id → PRODUCTS.id
- **Delete Rule:** ON DELETE RESTRICT (default)
- **Business Rule:** Alerts are automatically created by database triggers

---

## Cardinality Summary

```
SUPPLIERS (1) ────< (M) PRODUCTS
                         │
                         ├────< (M) ORDER_ITEMS >────┐
                         │                           │
                         ├────< (M) INVENTORY_MOVEMENTS
                         │
                         └────< (M) LOW_STOCK_ALERTS
                                                      │
                                                      │
                         ORDERS (1) ─────────────────┘
```

---

## Entity Participation

### Mandatory Participation (Total)
- **ORDER_ITEMS** must have both an ORDER and a PRODUCT
- **INVENTORY_MOVEMENTS** must have a PRODUCT
- **LOW_STOCK_ALERTS** must have a PRODUCT

### Optional Participation (Partial)
- **PRODUCTS** may or may not have a SUPPLIER
- **SUPPLIERS** may or may not have PRODUCTS
- **ORDERS** may or may not have ORDER_ITEMS (though business logic requires at least one)
- **PRODUCTS** may or may not have ORDER_ITEMS, MOVEMENTS, or ALERTS

---

## Weak vs Strong Entities

### Strong Entities (Independent)
- **SUPPLIERS** - Can exist independently
- **PRODUCTS** - Can exist independently (even without supplier)
- **ORDERS** - Can exist independently

### Weak Entities (Dependent)
- **ORDER_ITEMS** - Cannot exist without ORDERS (cascade delete)
- **INVENTORY_MOVEMENTS** - Dependent on PRODUCTS for context
- **LOW_STOCK_ALERTS** - Dependent on PRODUCTS for context

---

## Attribute Types

### Simple Attributes
- id, name, sku, quantity, unit_price, status, etc.

### Composite Attributes
- None explicitly defined (could model address as composite)

### Derived Attributes
- **total_amount** (in orders) = Σ(quantity × unit_price) from ORDER_ITEMS
- **is_low_stock** = stock_quantity <= reorder_level
- **is_overstock** = stock_quantity > (reorder_level × 3)
- **product_count** (in suppliers) = COUNT of associated products

### Multi-valued Attributes
- None (normalized design)

---

## Constraints Summary

### Domain Constraints
- `status` ∈ {'PENDING', 'COMPLETED', 'CANCELLED'}
- `quantity` > 0
- `unit_price` >= 0
- `stock_quantity` >= 0
- `reorder_level` >= 0

### Key Constraints
- **Primary Keys:** All entities have auto-incrementing integer PKs
- **Unique Keys:** 
  - PRODUCTS.sku (must be unique)
  - ORDERS.order_number (must be unique)

### Referential Integrity Constraints
- All foreign keys enforce referential integrity
- Various delete rules (CASCADE, SET NULL, RESTRICT)

### Check Constraints
- ORDER_ITEMS.quantity > 0
- ORDER_ITEMS.unit_price >= 0
- ORDERS.status IN ('PENDING', 'COMPLETED', 'CANCELLED')

---

## Normalization Level

### Current Normalization: 3NF (Third Normal Form)

**1NF (First Normal Form):** ✓
- All attributes contain atomic values
- No repeating groups
- Each row is unique (primary key)

**2NF (Second Normal Form):** ✓
- Meets 1NF requirements
- No partial dependencies
- All non-key attributes fully depend on primary key

**3NF (Third Normal Form):** ✓
- Meets 2NF requirements
- No transitive dependencies
- All attributes depend only on primary key

**BCNF (Boyce-Codd Normal Form):** ✓
- Meets 3NF requirements
- Every determinant is a candidate key
- No anomalies present

---

## Database Triggers (Automated Relationships)

### Trigger 1: Order Completion → Inventory Update
```
WHEN: Order status changes to 'COMPLETED'
THEN: 
  FOR EACH order_item IN order:
    - UPDATE products SET stock_quantity = stock_quantity - order_item.quantity
    - INSERT INTO inventory_movements (product_id, change_qty, reason)
```

### Trigger 2: Stock Update → Alert Check
```
WHEN: Product stock_quantity is updated
THEN:
  IF stock_quantity <= reorder_level:
    - INSERT INTO low_stock_alerts (product_id, alert_message)
```

### Trigger 3: Timestamp Updates
```
WHEN: Any record in suppliers, products, or orders is updated
THEN:
  - SET updated_at = NOW()
```

---

## Data Flow Example

### Scenario: Customer Places Order

```
1. INSERT INTO orders
   ↓
2. INSERT INTO order_items (multiple)
   ↓
3. UPDATE orders SET status = 'COMPLETED'
   ↓
4. TRIGGER: handle_order_completion()
   ↓
5. FOR EACH order_item:
   ├─→ UPDATE products (decrease stock_quantity)
   │   ↓
   │   TRIGGER: check_low_stock()
   │   ↓
   │   IF stock_quantity <= reorder_level:
   │   └─→ INSERT INTO low_stock_alerts
   │
   └─→ INSERT INTO inventory_movements
```

---

## Index Recommendations

### Primary Indexes (Automatic)
- All primary keys (id columns)

### Unique Indexes (Automatic)
- PRODUCTS.sku
- ORDERS.order_number

### Recommended Additional Indexes
```sql
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX idx_alerts_product ON low_stock_alerts(product_id);
CREATE INDEX idx_alerts_created ON low_stock_alerts(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

---

## Query Patterns

### Common Queries

1. **Get Products with Low Stock**
```sql
SELECT * FROM products 
WHERE stock_quantity <= reorder_level;
```

2. **Get Order Total**
```sql
SELECT o.*, SUM(oi.quantity * oi.unit_price) as total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;
```

3. **Get Inventory Value**
```sql
SELECT SUM(stock_quantity * unit_price) as total_value
FROM products;
```

4. **Get Recent Movements**
```sql
SELECT im.*, p.name, p.sku
FROM inventory_movements im
JOIN products p ON im.product_id = p.id
ORDER BY im.created_at DESC
LIMIT 100;
```

---

**Diagram Version:** 1.0  
**Database Schema Version:** 1.0  
**Last Updated:** December 2025
