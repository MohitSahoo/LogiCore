# Smart Supply Chain & Inventory Management System
## Complete Project Documentation

---

## 📋 PROJECT SYNOPSIS

### Overview
The Smart Supply Chain & Inventory Management System is a full-stack web application designed to provide real-time visibility and AI-powered insights for modern supply chain operations. The system enables supply chain managers, procurement specialists, and business owners to efficiently manage inventory, track orders, monitor suppliers, and receive intelligent stock recommendations.

### Key Features

#### 1. **Comprehensive Dashboard**
- Real-time financial metrics (inventory value, potential sales value, profit margins)
- Stock health visualization with color-coded status indicators
- Performance metrics including inventory turnover rate
- Risk indicators for stockout and overstock situations
- Visual health meter showing overall inventory status

#### 2. **Inventory Management**
- Complete product catalog with SKU tracking
- Real-time stock quantity monitoring
- Automated reorder level alerts
- Supplier association and tracking
- Price management (unit pricing)

#### 3. **Order Processing**
- Order creation with multiple line items
- Order status tracking (PENDING, COMPLETED, CANCELLED)
- Automatic inventory deduction on order completion
- Order history and analytics
- Customer information management

#### 4. **Supplier Management**
- Supplier contact information database
- Product-supplier relationships
- Supplier performance tracking
- Multi-supplier support per product category

#### 5. **Automated Alerts System**
- Low stock alerts triggered automatically
- Reorder point notifications
- Inventory movement logging
- Alert history tracking

#### 6. **AI-Powered Stock Reports**
- Integration with Google Gemini AI
- Intelligent stock analysis and recommendations
- Period-based reporting (daily, weekly, monthly)
- Restocking priority suggestions
- Risk assessment and mitigation strategies

#### 7. **Inventory Movement Tracking**
- Complete audit trail of all stock changes
- Reason tracking for each movement
- Historical movement analysis
- Integration with order completion triggers

### Technology Stack

**Backend:**
- Node.js with Express.js framework
- PostgreSQL database with advanced triggers
- RESTful API architecture
- Environment-based configuration
- Comprehensive logging system

**Frontend:**
- React.js with hooks
- Axios for API communication
- Vite for fast development and building
- Responsive CSS design
- Real-time data updates

**Database:**
- PostgreSQL with relational schema
- Database triggers for automation
- Foreign key constraints for data integrity
- Timestamp tracking for audit trails

**AI Integration:**
- Google Gemini 2.5 Flash model
- Natural language report generation
- Context-aware recommendations

---

## 🗄️ DATABASE SCHEMA

### Entity-Relationship (ER) Diagram Description

The database consists of 5 main entities with the following relationships:

```
SUPPLIERS (1) ----< (M) PRODUCTS (1) ----< (M) INVENTORY_MOVEMENTS
                           |
                           | (1)
                           |
                           v
                          (M)
                    ORDER_ITEMS (M) >---- (1) ORDERS
                           |
                           | (1)
                           v
                          (M)
                  LOW_STOCK_ALERTS
```

### Detailed Entity Descriptions

#### 1. **SUPPLIERS Entity**
Stores information about product suppliers and vendors.

**Attributes:**
- `id` (PK): Unique identifier (SERIAL)
- `name`: Supplier company name (TEXT, NOT NULL)
- `contact_email`: Email address for communication (TEXT)
- `phone`: Contact phone number (TEXT)
- `address`: Physical address (TEXT)
- `created_at`: Record creation timestamp (TIMESTAMPTZ)
- `updated_at`: Last update timestamp (TIMESTAMPTZ)

**Relationships:**
- One-to-Many with PRODUCTS (one supplier can supply multiple products)

---

#### 2. **PRODUCTS Entity**
Central entity storing all product information and inventory levels.

**Attributes:**
- `id` (PK): Unique identifier (SERIAL)
- `name`: Product name (TEXT, NOT NULL)
- `sku`: Stock Keeping Unit - unique product code (TEXT, UNIQUE, NOT NULL)
- `description`: Product description (TEXT)
- `supplier_id` (FK): Reference to SUPPLIERS (INTEGER, ON DELETE SET NULL)
- `unit_price`: Price per unit (NUMERIC(10,2), NOT NULL, DEFAULT 0)
- `stock_quantity`: Current inventory level (INTEGER, NOT NULL, DEFAULT 0)
- `reorder_level`: Minimum stock threshold (INTEGER, NOT NULL, DEFAULT 10)
- `created_at`: Record creation timestamp (TIMESTAMPTZ)
- `updated_at`: Last update timestamp (TIMESTAMPTZ)

**Relationships:**
- Many-to-One with SUPPLIERS
- One-to-Many with ORDER_ITEMS
- One-to-Many with INVENTORY_MOVEMENTS
- One-to-Many with LOW_STOCK_ALERTS

**Business Rules:**
- SKU must be unique across all products
- Stock quantity cannot be negative
- Reorder level defines when alerts are triggered

---

#### 3. **ORDERS Entity**
Stores customer order header information.

**Attributes:**
- `id` (PK): Unique identifier (SERIAL)
- `order_number`: Human-readable order number (TEXT, UNIQUE, NOT NULL)
- `customer_name`: Name of the customer (TEXT, NOT NULL)
- `status`: Order status (TEXT, NOT NULL, DEFAULT 'PENDING')
  - Valid values: 'PENDING', 'COMPLETED', 'CANCELLED'
- `created_at`: Order creation timestamp (TIMESTAMPTZ)
- `updated_at`: Last update timestamp (TIMESTAMPTZ)

**Relationships:**
- One-to-Many with ORDER_ITEMS

**Business Rules:**
- Order number is auto-generated with format: ORD-YYYYMMDDHHMISS-XXX
- Status changes trigger inventory updates
- Only COMPLETED orders affect inventory

---

#### 4. **ORDER_ITEMS Entity**
Stores individual line items for each order (junction table with attributes).

**Attributes:**
- `id` (PK): Unique identifier (SERIAL)
- `order_id` (FK): Reference to ORDERS (INTEGER, NOT NULL, ON DELETE CASCADE)
- `product_id` (FK): Reference to PRODUCTS (INTEGER, NOT NULL)
- `quantity`: Number of units ordered (INTEGER, NOT NULL, CHECK > 0)
- `unit_price`: Price per unit at time of order (NUMERIC(10,2), NOT NULL, CHECK >= 0)

**Relationships:**
- Many-to-One with ORDERS
- Many-to-One with PRODUCTS

**Business Rules:**
- Quantity must be positive
- Unit price is captured at order time (historical pricing)
- Cascading delete when parent order is deleted

---

#### 5. **INVENTORY_MOVEMENTS Entity**
Audit trail for all inventory changes.

**Attributes:**
- `id` (PK): Unique identifier (SERIAL)
- `product_id` (FK): Reference to PRODUCTS (INTEGER, NOT NULL)
- `change_qty`: Quantity change (INTEGER, NOT NULL)
  - Positive values = stock increase
  - Negative values = stock decrease
- `reason`: Explanation for the movement (TEXT, NOT NULL)
- `created_at`: Movement timestamp (TIMESTAMPTZ)

**Relationships:**
- Many-to-One with PRODUCTS

**Business Rules:**
- Automatically created by database triggers
- Immutable records (no updates or deletes)
- Provides complete audit trail

---

#### 6. **LOW_STOCK_ALERTS Entity**
Stores alerts when products fall below reorder levels.

**Attributes:**
- `id` (PK): Unique identifier (SERIAL)
- `product_id` (FK): Reference to PRODUCTS (INTEGER, NOT NULL)
- `alert_message`: Description of the alert (TEXT, NOT NULL)
- `created_at`: Alert creation timestamp (TIMESTAMPTZ)

**Relationships:**
- Many-to-One with PRODUCTS

**Business Rules:**
- Automatically created by database triggers
- Triggered when stock_quantity <= reorder_level
- Historical record of all alerts

---

## 🔧 DATABASE TRIGGERS & AUTOMATION

### 1. **Timestamp Update Trigger**
**Function:** `set_timestamp()`
**Applied to:** suppliers, products, orders

Automatically updates the `updated_at` field whenever a record is modified.

```sql
CREATE TRIGGER set_timestamp_[table]
BEFORE UPDATE ON [table]
FOR EACH ROW EXECUTE FUNCTION set_timestamp();
```

---

### 2. **Order Completion Trigger**
**Function:** `handle_order_completion()`
**Applied to:** orders (INSERT and UPDATE)

**Behavior:**
- Triggers when order status changes to 'COMPLETED'
- For each order item:
  1. Decreases product stock_quantity by ordered quantity
  2. Creates inventory_movement record with reason
- Ensures atomic transaction (all or nothing)

**Example:**
```
Order #123 completed with:
- 10 units of Widget A
- 5 units of Gadget X

Results in:
- Widget A stock: 100 → 90
- Gadget X stock: 30 → 25
- 2 inventory_movement records created
```

---

### 3. **Low Stock Alert Trigger**
**Function:** `check_low_stock()`
**Applied to:** products (UPDATE of stock_quantity)

**Behavior:**
- Triggers after stock_quantity is updated
- Compares new stock_quantity with reorder_level
- If stock_quantity <= reorder_level:
  - Creates alert in low_stock_alerts table
  - Includes product name and current quantity

**Example:**
```
Widget B updated: stock 15 → 12, reorder level = 30
Alert created: "Product Widget B is low on stock. Qty: 12"
```

---

## 📊 RELATIONAL SCHEMA (Formal Notation)

```
SUPPLIERS(
  id: INTEGER [PK],
  name: TEXT [NOT NULL],
  contact_email: TEXT,
  phone: TEXT,
  address: TEXT,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
)

PRODUCTS(
  id: INTEGER [PK],
  name: TEXT [NOT NULL],
  sku: TEXT [UNIQUE, NOT NULL],
  description: TEXT,
  supplier_id: INTEGER [FK → SUPPLIERS.id, ON DELETE SET NULL],
  unit_price: NUMERIC(10,2) [NOT NULL, DEFAULT 0],
  stock_quantity: INTEGER [NOT NULL, DEFAULT 0],
  reorder_level: INTEGER [NOT NULL, DEFAULT 10],
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
)

ORDERS(
  id: INTEGER [PK],
  order_number: TEXT [UNIQUE, NOT NULL],
  customer_name: TEXT [NOT NULL],
  status: TEXT [NOT NULL, DEFAULT 'PENDING', CHECK IN ('PENDING','COMPLETED','CANCELLED')],
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
)

ORDER_ITEMS(
  id: INTEGER [PK],
  order_id: INTEGER [FK → ORDERS.id, NOT NULL, ON DELETE CASCADE],
  product_id: INTEGER [FK → PRODUCTS.id, NOT NULL],
  quantity: INTEGER [NOT NULL, CHECK > 0],
  unit_price: NUMERIC(10,2) [NOT NULL, CHECK >= 0]
)

INVENTORY_MOVEMENTS(
  id: INTEGER [PK],
  product_id: INTEGER [FK → PRODUCTS.id, NOT NULL],
  change_qty: INTEGER [NOT NULL],
  reason: TEXT [NOT NULL],
  created_at: TIMESTAMPTZ
)

LOW_STOCK_ALERTS(
  id: INTEGER [PK],
  product_id: INTEGER [FK → PRODUCTS.id, NOT NULL],
  alert_message: TEXT [NOT NULL],
  created_at: TIMESTAMPTZ
)
```

---

## 🔗 REFERENTIAL INTEGRITY CONSTRAINTS

### Foreign Key Relationships

1. **PRODUCTS.supplier_id → SUPPLIERS.id**
   - ON DELETE: SET NULL
   - Allows products to exist without supplier

2. **ORDER_ITEMS.order_id → ORDERS.id**
   - ON DELETE: CASCADE
   - Deleting order removes all line items

3. **ORDER_ITEMS.product_id → PRODUCTS.id**
   - ON DELETE: RESTRICT (default)
   - Cannot delete product with existing orders

4. **INVENTORY_MOVEMENTS.product_id → PRODUCTS.id**
   - ON DELETE: RESTRICT (default)
   - Preserves audit trail

5. **LOW_STOCK_ALERTS.product_id → PRODUCTS.id**
   - ON DELETE: RESTRICT (default)
   - Preserves alert history

---

## 🎯 KEY BUSINESS METRICS

### Financial Metrics
1. **Total Inventory Value**: Σ(stock_quantity × unit_price)
2. **Potential Sales Value**: Total Inventory Value × 1.4 (40% markup)
3. **Profit Margin**: (Potential Sales - Inventory Value) / Inventory Value × 100

### Stock Health Metrics
1. **Stockout Risk %**: (Low Stock Count / Total Products) × 100
2. **Overstock %**: (Overstock Count / Total Products) × 100
3. **Healthy Stock %**: 100 - Stockout Risk % - Overstock %

### Performance Metrics
1. **Inventory Turnover**: Total Movement (90 days) / Average Inventory
2. **Order Completion Rate**: Completed Orders / Total Orders × 100
3. **Alert Frequency**: Alerts Generated / Time Period

---

## 🚀 API ENDPOINTS

### Products
- `GET /api/products` - List all products with supplier info
- `GET /api/products/:id` - Get single product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Suppliers
- `GET /api/suppliers` - List all suppliers with product count
- `GET /api/suppliers/:id` - Get single supplier details
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Orders
- `GET /api/orders` - List all orders with totals
- `GET /api/orders/:id` - Get order with line items
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Reports
- `GET /api/reports/dashboard` - Comprehensive dashboard metrics
- `GET /api/reports/inventory` - Full inventory report
- `GET /api/reports/alerts` - Low stock alerts
- `GET /api/reports/movements` - Inventory movement history
- `GET /api/reports/ai-stock` - AI-powered stock analysis

---

## 💡 SYSTEM FEATURES

### Automated Workflows
1. **Order Completion → Inventory Update**
   - Automatic stock deduction
   - Movement logging
   - Alert generation if needed

2. **Stock Update → Alert Check**
   - Real-time monitoring
   - Automatic alert creation
   - Historical tracking

3. **Dashboard Refresh**
   - Auto-refresh every 30 seconds
   - Real-time metrics calculation
   - Performance optimization

### Data Integrity
- Foreign key constraints
- Check constraints on quantities and prices
- Unique constraints on SKUs and order numbers
- Timestamp tracking for audit trails
- Cascading deletes where appropriate

### Logging & Monitoring
- Database connection status
- Query execution time tracking
- HTTP request/response logging
- Transaction monitoring
- Error tracking and reporting

---

## 📈 FUTURE ENHANCEMENTS

1. **Advanced Analytics**
   - Predictive stock forecasting
   - Seasonal trend analysis
   - Supplier performance metrics

2. **Multi-warehouse Support**
   - Location-based inventory
   - Transfer orders between warehouses
   - Location-specific reorder levels

3. **Purchase Order Management**
   - Automated PO generation
   - Supplier order tracking
   - Receiving and inspection workflow

4. **Barcode/QR Integration**
   - Mobile scanning
   - Quick stock updates
   - Warehouse picking optimization

5. **Advanced Reporting**
   - Custom report builder
   - Export to Excel/PDF
   - Scheduled email reports

---

## 🔐 SECURITY CONSIDERATIONS

- Environment-based configuration
- Database connection pooling
- SQL injection prevention (parameterized queries)
- CORS configuration
- Error handling without exposing sensitive data
- Input validation on all endpoints

---

## 📝 INSTALLATION & SETUP

See README.md for detailed installation instructions.

**Quick Start:**
1. Create PostgreSQL database
2. Run schema.sql and seed.sql
3. Configure backend .env file
4. Install dependencies (npm install)
5. Start backend (npm run dev)
6. Start frontend (npm run dev)
7. Access at http://localhost:5173

---

**Project Version:** 1.0.0  
**Last Updated:** December 2025  
**Database:** PostgreSQL 12+  
**Node.js:** 18+  
**React:** 18+
