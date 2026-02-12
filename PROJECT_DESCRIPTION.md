# 🚀 LogiCore - Smart Supply Chain Management System

A comprehensive full-stack supply chain management platform with hybrid database architecture, combining **PostgreSQL** for structured operational data and **MongoDB** for unstructured analytics, powered by AI-driven insights using Google Gemini.

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Database Design](#-database-design)
4. [Features](#-features)
5. [Technology Stack](#-technology-stack)
6. [Installation](#-installation)
7. [Configuration](#-configuration)
8. [API Documentation](#-api-documentation)
9. [Frontend Routes](#-frontend-routes)
10. [User Roles & Permissions](#-user-roles--permissions)
11. [AI Features](#-ai-features)
12. [Security](#-security)
13. [Testing](#-testing)
14. [Deployment](#-deployment)
15. [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

LogiCore is an enterprise-grade supply chain management system designed for businesses to efficiently manage inventory, suppliers, orders, and gain AI-powered insights. The system features:

- **Hybrid Database Architecture**: PostgreSQL for transactional data + MongoDB for analytics
- **Multi-tenant Support**: Complete data isolation between users with admin oversight
- **Real-time Updates**: Automatic inventory adjustments via database triggers
- **AI-Powered Analytics**: Google Gemini integration for intelligent business insights
- **Role-Based Access Control**: User and admin roles with granular permissions
- **Modern UI/UX**: React 19 with TypeScript, Tailwind CSS, and dark mode support
- **Comprehensive Audit Trail**: Complete tracking of all system activities

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Products │  │ Orders   │  │AI Reports│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    ↓ HTTP/REST API ↓                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ API Routes   │  │ AI Service   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
           ↓                                    ↓
┌──────────────────────┐            ┌──────────────────────┐
│   PostgreSQL DB      │            │    MongoDB           │
│  (Operational Data)  │            │  (Analytics & Logs)  │
└──────────────────────┘            └──────────────────────┘
```

### Data Flow

1. **User Request** → Frontend sends authenticated request
2. **Authentication** → JWT token validated by middleware
3. **Authorization** → Role-based access control applied
4. **Data Retrieval** → PostgreSQL for operational data, MongoDB for analytics
5. **Business Logic** → Backend processes and transforms data
6. **Response** → JSON data returned to frontend
7. **Audit** → Activity logged to MongoDB

---

## 🗄️ Database Design

### PostgreSQL - Operational Data (Structured)

PostgreSQL handles all **transactional and relational data** that requires ACID compliance, complex queries, and referential integrity.

#### What PostgreSQL Controls:

**1. User Management & Authentication**
- `users` table: User accounts, credentials, roles
- `user_sessions` table: Active user sessions
- JWT token generation and validation
- Password hashing with bcrypt
- Role-based access control (user/admin)

**2. Core Business Entities**
- `products` table: Product catalog with inventory levels
  - Fields: id, name, sku, description, unit_price, stock_quantity, reorder_level, supplier_id, user_id
  - Tracks: Current stock, pricing, supplier relationships
  - User-scoped: Each user sees only their products (admin sees all)

- `suppliers` table: Vendor/supplier information
  - Fields: id, name, contact_email, phone, user_id
  - Manages: Supplier relationships and contact details
  - User-scoped: Each user manages their own suppliers

- `orders` table: Order headers
  - Fields: id, order_number, customer_name, status, user_id, created_at
  - Status values: PENDING, COMPLETED, CANCELLED
  - User-scoped: Users see only their orders (admin sees all)

- `order_items` table: Order line items
  - Fields: id, order_id, product_id, quantity, unit_price
  - Links: Orders to products with quantities and prices
  - Calculates: Order totals dynamically

**3. Inventory Management**
- `inventory_movements` table: Complete audit trail of stock changes
  - Fields: id, product_id, change_qty, reason, created_at
  - Tracks: Every stock increase/decrease with reason
  - Triggered by: Order completion, manual adjustments, restocking

- `low_stock_alerts` table: Automated stock alerts
  - Fields: id, product_id, alert_level, created_at, resolved_at
  - Triggers: Automatically when stock ≤ reorder_level
  - Managed by: Database triggers

**4. Audit & Compliance**
- `audit_log` table: Complete system audit trail
  - Fields: id, table_name, operation, old_data, new_data, user_id, timestamp
  - Captures: All INSERT, UPDATE, DELETE operations
  - Triggered by: Database triggers on all tables

#### PostgreSQL Database Triggers

**1. Order Completion Trigger**
```sql
CREATE TRIGGER order_completion_trigger_update
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_completion();
```
- **Purpose**: Automatically reduce inventory when order status changes to COMPLETED
- **Action**: Loops through order items, reduces product stock, creates inventory movements
- **Prevents**: Manual inventory management errors

**2. Low Stock Alert Trigger**
```sql
CREATE TRIGGER check_low_stock_trigger
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();
```
- **Purpose**: Automatically create alerts when stock falls below reorder level
- **Action**: Inserts record into low_stock_alerts table
- **Helps**: Proactive inventory management

**3. Audit Triggers**
```sql
CREATE TRIGGER audit_[table_name]
AFTER INSERT OR UPDATE OR DELETE ON [table_name]
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();
```
- **Purpose**: Track all data changes for compliance
- **Action**: Logs operation type, old/new values, user, timestamp
- **Applied to**: All major tables (users, products, orders, suppliers)

#### PostgreSQL Constraints & Relationships

**Foreign Key Relationships:**
- products.supplier_id → suppliers.id (ON DELETE SET NULL)
- products.user_id → users.id
- orders.user_id → users.id
- order_items.order_id → orders.id (CASCADE DELETE)
- order_items.product_id → products.id
- inventory_movements.product_id → products.id
- low_stock_alerts.product_id → products.id

**Unique Constraints:**
- users.email (UNIQUE)
- products.sku (UNIQUE per user)
- suppliers.name (UNIQUE per user)

**Check Constraints:**
- products.stock_quantity ≥ 0
- products.unit_price > 0
- order_items.quantity > 0

---

### MongoDB - Analytics & Logs (Unstructured)

MongoDB handles all **unstructured, schema-flexible data** that requires high write throughput, flexible schemas, and document-based storage.

#### What MongoDB Controls:

**1. Activity Logging**
- `activity_logs` collection: User actions and system events
  - Documents: { userId, action, resource, details, timestamp, ipAddress, userAgent }
  - Tracks: Login/logout, CRUD operations, API calls, errors
  - Purpose: Security monitoring, user behavior analysis
  - Retention: Configurable (default: 90 days)

**2. AI-Generated Insights**
- `ai_insights` collection: AI-powered forecasts and recommendations
  - Documents: { type, data, confidence, generatedAt, expiresAt }
  - Contains: Demand forecasts, reorder suggestions, trend analysis
  - Generated by: Google Gemini AI
  - Updated: On-demand or scheduled

**3. Chat & Natural Language Queries**
- `chat_queries` collection: User questions and AI responses
  - Documents: { userId, query, response, context, timestamp, tokens }
  - Stores: Natural language inventory questions
  - Enables: Conversational interface for data queries
  - Tracks: Query patterns and user intent

**4. Analytics Snapshots**
- `analytics_snapshots` collection: Historical metrics and KPIs
  - Documents: { date, metrics: { revenue, inventory_value, orders }, aggregations }
  - Captures: Daily/weekly/monthly business metrics
  - Purpose: Trend analysis, historical comparisons
  - Aggregated from: PostgreSQL operational data

**5. System Events & Errors**
- `system_events` collection: Error tracking and system health
  - Documents: { level, message, stack, context, timestamp }
  - Logs: Errors, warnings, performance issues
  - Monitored by: System administrators
  - Alerts: Critical errors trigger notifications

**6. AI Report Storage**
- `ai_reports` collection: Generated AI reports metadata
  - Documents: { reportId, type, period, content, metadata, generatedAt }
  - Stores: Weekly/monthly AI-generated business reports
  - Includes: Report content, data snapshot, AI status
  - Accessible via: AI Reports page

#### MongoDB Indexes

```javascript
// Performance optimization indexes
activity_logs: { userId: 1, timestamp: -1 }
ai_insights: { type: 1, generatedAt: -1 }
chat_queries: { userId: 1, timestamp: -1 }
analytics_snapshots: { date: -1 }
system_events: { level: 1, timestamp: -1 }
```

---

## ✨ Features

### Core Features

#### 1. Dashboard & Analytics
- **Real-time Metrics**: Total products, low stock alerts, pending orders, inventory value, total revenue
- **Financial Tracking**: Inventory value calculation (stock × price), order revenue tracking
- **Stock Health Indicators**: Visual indicators for stock levels (normal, low, out of stock)
- **Recent Activity**: Latest orders, inventory movements, alerts
- **Role-based Views**: Regular users see their data, admins see system-wide data
- **Auto-refresh**: Dashboard updates every 10 seconds to detect role changes

#### 2. Product Management
- **CRUD Operations**: Create, read, update, delete products
- **Inventory Tracking**: Real-time stock quantity monitoring
- **Supplier Linking**: Associate products with suppliers
- **Reorder Levels**: Set minimum stock thresholds for alerts
- **SKU Management**: Unique product identifiers
- **Pricing**: Unit price tracking and calculations
- **Search & Filter**: Find products by name, SKU, or supplier
- **User Isolation**: Users manage only their products (admin sees all)

#### 3. Supplier Management
- **Vendor Database**: Maintain supplier contact information
- **Relationship Tracking**: Link suppliers to products
- **Contact Management**: Email and phone number storage
- **Deletion Protection**: Cannot delete suppliers with associated products
- **Search Functionality**: Quick supplier lookup
- **User-scoped**: Each user manages their own supplier network

#### 4. Order Processing
- **Order Creation**: Create orders with multiple line items
- **Status Management**: PENDING → COMPLETED → CANCELLED workflow
- **Automatic Inventory Updates**: Stock reduces when order completed (via database trigger)
- **Order Totals**: Automatic calculation from line items
- **Order History**: Complete order tracking with timestamps
- **Order Details**: View full order with items, quantities, prices
- **Status Indicators**: Color-coded status badges (green, orange, red)
- **Inventory Restoration**: Stock restored if order cancelled/reopened

#### 5. Inventory Movements
- **Complete Audit Trail**: Every stock change recorded
- **Reason Tracking**: Why stock changed (order completed, manual adjustment, etc.)
- **Quantity Changes**: Positive (increase) or negative (decrease)
- **Timestamp Tracking**: When each movement occurred
- **Product Linking**: Which product was affected
- **Automatic Creation**: Triggered by order completion

#### 6. Alerts & Notifications
- **Low Stock Alerts**: Automatic alerts when stock ≤ reorder level
- **Database-triggered**: Created automatically by PostgreSQL trigger
- **Alert Resolution**: Mark alerts as resolved when restocked
- **Dashboard Display**: Alerts shown prominently on dashboard
- **Email Notifications**: (Optional) Send email alerts for critical stock levels

#### 7. User Authentication & Authorization
- **Secure Registration**: Email validation, password hashing (bcrypt)
- **JWT Authentication**: Token-based authentication with expiration
- **Role-Based Access**: User vs Admin roles
- **Profile Management**: Update name, email, password
- **Session Management**: Secure session handling
- **Password Security**: Minimum 6 characters, hashed with salt

#### 8. Multi-User Support & Data Isolation
- **User-Scoped Data**: Each user sees only their own data
- **Admin Oversight**: Admins can view all users' data
- **Dynamic Role Updates**: Role changes detected within 10 seconds
- **Secure Filtering**: Backend enforces data isolation
- **Fresh Role Fetching**: Every request fetches current role from database

#### 9. AI-Powered Reports
- **Intelligent Analysis**: AI analyzes inventory data and generates insights
- **Report Types**: Weekly, monthly, or custom date range
- **Business Insights**: Stock health, financial impact, recommendations
- **Automatic Generation**: Scheduled report generation
- **Fallback System**: Dual API key support for high availability
- **Report History**: View and download past reports
- **Data Snapshots**: Each report includes data summary

#### 10. Admin Dashboard
- **System Statistics**: Total users, products, orders across all users
- **User Management**: View all users, change roles, deactivate accounts
- **Activity Monitoring**: System-wide activity logs
- **Global Analytics**: Aggregate metrics across all users
- **Role Assignment**: Promote users to admin or demote to regular user

---

## 🛠️ Technology Stack

### Backend

**Runtime & Framework:**
- **Node.js** (v18+): JavaScript runtime
- **Express.js** (v4.18+): Web application framework
- **ES Modules**: Modern JavaScript module system

**Databases:**
- **PostgreSQL** (v12+): Primary relational database
  - `pg` library for database connection
  - Connection pooling for performance
  - Parameterized queries for security
  
- **MongoDB** (v7.0+): Secondary document database
  - `mongodb` driver for Node.js
  - Flexible schema for analytics
  - High write throughput for logs

**Authentication & Security:**
- **jsonwebtoken** (JWT): Token-based authentication
- **bcrypt**: Password hashing with salt
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers (optional)

**AI Integration:**
- **@google/generative-ai**: Google Gemini API client
- **Gemini 2.5 Flash**: AI model for insights
- Dual API key support with automatic fallback
- Quota monitoring and rate limiting

**Utilities:**
- **dotenv**: Environment variable management
- **nodemon**: Development auto-restart
- **morgan**: HTTP request logging (optional)

### Frontend

**Framework & Language:**
- **React** (v19): UI library
- **TypeScript** (v5): Type-safe JavaScript
- **Vite** (v6): Build tool and dev server

**UI Components:**
- **Tailwind CSS** (v3): Utility-first CSS framework
- **Radix UI**: Accessible component primitives
  - Dialog, Card, Button, Input, Select, etc.
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

**Routing & State:**
- **Wouter**: Lightweight routing library
- **React Context**: Global state management (auth, theme)
- **React Hooks**: useState, useEffect, useContext

**HTTP Client:**
- **Axios**: Promise-based HTTP client
- Interceptors for auth tokens
- Automatic error handling

**Styling:**
- **CSS Variables**: Theme customization
- **Dark Mode**: System-wide theme toggle
- **Responsive Design**: Mobile-first approach
- **Custom Orange Theme**: Brand colors preserved in both modes

---

## 📥 Installation

### Prerequisites

Before installing LogiCore, ensure you have the following installed:

- **Node.js** (v18 or higher): [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher): [Download](https://www.postgresql.org/download/)
- **MongoDB** (v7.0 or higher - Optional): [Download](https://www.mongodb.com/try/download/community)
- **pnpm** (recommended) or npm: `npm install -g pnpm`
- **Git**: For cloning the repository

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd logicore
```

### Step 2: PostgreSQL Setup

#### Create Database

```bash
# Using psql command line
createdb smart_supply_chain

# Or using psql interactive
psql -U postgres
CREATE DATABASE smart_supply_chain;
\q
```

#### Apply Schema

```bash
# Navigate to db directory
cd db

# Apply authentication schema
psql -U postgres -d smart_supply_chain -f auth_schema.sql

# Apply main schema (if separate)
psql -U postgres -d smart_supply_chain -f schema.sql
```

#### Verify Tables Created

```bash
psql -U postgres -d smart_supply_chain -c "\dt"
```

You should see tables: users, products, suppliers, orders, order_items, inventory_movements, low_stock_alerts, audit_log

### Step 3: MongoDB Setup (Optional)

#### macOS (Homebrew)

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

#### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.runCommand('ping')"
```

#### Windows

1. Download MongoDB installer from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run installer and follow setup wizard
3. MongoDB will start automatically as a Windows service

### Step 4: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

#### Configure Backend Environment

Edit `backend/.env`:

```env
# PostgreSQL Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=smart_supply_chain
PGUSER=your_postgres_username
PGPASSWORD=your_postgres_password

# Server Configuration
PORT=4001
HOST=127.0.0.1

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# MongoDB Configuration (optional)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=smart_supply_chain

# Google Gemini AI (optional - for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_FALLBACK_API_KEY=your_fallback_api_key_here
```

#### Create Test User

```bash
# Still in backend directory
node scripts/create-test-user.js
```

This creates a test user:
- Email: `test@logicore.com`
- Password: `test123`
- Role: `user`

#### Seed Sample Data (Optional)

```bash
node scripts/seed.js
```

This creates sample:
- Products (10-15 items)
- Suppliers (5-10 vendors)
- Orders (5-10 orders)

#### Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ Primary Gemini AI client initialized
✅ Fallback Gemini AI client initialized
🔄 Connecting to MongoDB...
API server listening on http://127.0.0.1:4001
✅ MongoDB connected successfully
📊 Database: smart_supply_chain | URI: mongodb://localhost:27017
✅ PostgreSQL connected successfully
✅ MongoDB indexes created
✅ PostgreSQL connected at: [timestamp]
```

### Step 5: Frontend Setup

```bash
# Open new terminal, navigate to frontend directory
cd frontend

# Install dependencies (using pnpm - recommended)
pnpm install

# Or using npm
npm install

# Create environment file
cp .env.example .env

# Edit .env
nano .env
```

#### Configure Frontend Environment

Edit `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:4001/api
```

#### Start Frontend Development Server

```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 6: Access Application

1. Open browser and navigate to: **http://localhost:3000**
2. Click "Sign In"
3. Use test credentials:
   - Email: `test@logicore.com`
   - Password: `test123`
4. You should see the dashboard with sample data

### Step 7: Create Admin User (Optional)

```bash
# In backend directory
node scripts/create-admin-user.js
```

Or manually via psql:

```sql
-- Update existing user to admin
UPDATE users SET role = 'admin' WHERE email = 'test@logicore.com';

-- Or create new admin user
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@logicore.com', '$2b$10$...', 'Admin', 'User', 'admin');
```

---

## ⚙️ Configuration

### Backend Configuration (`backend/.env`)

```env
# ============================================
# PostgreSQL Configuration
# ============================================
PGHOST=localhost                    # PostgreSQL server host
PGPORT=5432                         # PostgreSQL server port
PGDATABASE=smart_supply_chain       # Database name
PGUSER=your_username                # PostgreSQL username
PGPASSWORD=your_password            # PostgreSQL password (leave empty if no password)

# ============================================
# Server Configuration
# ============================================
PORT=4001                           # Backend server port
HOST=127.0.0.1                      # Backend server host

# ============================================
# JWT Authentication
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
# IMPORTANT: Change this to a strong random string in production
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ============================================
# MongoDB Configuration (Optional)
# ============================================
MONGODB_URI=mongodb://localhost:27017    # MongoDB connection string
MONGODB_DB_NAME=smart_supply_chain       # MongoDB database name

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# ============================================
# Google Gemini AI Configuration (Optional)
# ============================================
GEMINI_API_KEY=your_primary_api_key_here
# Get your API key from: https://makersuite.google.com/app/apikey

GEMINI_FALLBACK_API_KEY=your_fallback_api_key_here
# Optional: Second API key for automatic fallback if primary fails

# ============================================
# Email Configuration (Future Feature)
# ============================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
```

### Frontend Configuration (`frontend/.env`)

```env
# ============================================
# API Configuration
# ============================================
VITE_API_URL=http://localhost:4001/api

# For production:
# VITE_API_URL=https://api.yourdomain.com/api
```

### Database Connection Pooling

The backend uses connection pooling for optimal performance:

**PostgreSQL Pool Configuration** (`backend/src/db.js`):
```javascript
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if no connection available
});
```

**MongoDB Connection** (`backend/src/db.js`):
```javascript
const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 10,            // Maximum connections
  minPoolSize: 2,             // Minimum connections
  serverSelectionTimeoutMS: 5000,
});
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:4001/api
```

### Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Authentication Endpoints

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith"
}

Response: 200 OK
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpass123",
  "new_password": "newpass456"
}

Response: 200 OK
{
  "message": "Password updated successfully"
}
```

---

### Product Endpoints

#### Get All Products
```http
GET /api/products
Authorization: Bearer <token>

# Regular users: Returns only their products
# Admin users: Returns all products from all users

Response: 200 OK
[
  {
    "id": 1,
    "name": "Laptop",
    "sku": "LAP-001",
    "description": "High-performance laptop",
    "unit_price": "999.99",
    "stock_quantity": 50,
    "reorder_level": 10,
    "supplier_id": 1,
    "supplier_name": "Tech Supplier Inc",
    "user_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Single Product
```http
GET /api/products/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "name": "Laptop",
  "sku": "LAP-001",
  ...
}
```

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "sku": "LAP-001",
  "description": "High-performance laptop",
  "unit_price": 999.99,
  "stock_quantity": 50,
  "reorder_level": 10,
  "supplier_id": 1
}

Response: 201 Created
{
  "id": 1,
  "name": "Laptop",
  ...
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Laptop",
  "unit_price": 899.99,
  "stock_quantity": 45
}

Response: 200 OK
{
  "id": 1,
  "name": "Updated Laptop",
  ...
}
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Product deleted successfully"
}
```

---

### Supplier Endpoints

#### Get All Suppliers
```http
GET /api/suppliers
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "name": "Tech Supplier Inc",
    "contact_email": "contact@techsupplier.com",
    "phone": "+1-555-0123",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Supplier
```http
POST /api/suppliers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Supplier",
  "contact_email": "contact@newsupplier.com",
  "phone": "+1-555-9999"
}

Response: 201 Created
{
  "id": 2,
  "name": "New Supplier",
  ...
}
```

#### Update Supplier
```http
PUT /api/suppliers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Supplier Name",
  "phone": "+1-555-8888"
}

Response: 200 OK
```

#### Delete Supplier
```http
DELETE /api/suppliers/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Supplier deleted successfully"
}

# Error if supplier has products:
Response: 400 Bad Request
{
  "error": "Cannot delete supplier. 5 product(s) are associated with this supplier."
}
```

---

### Order Endpoints

#### Get All Orders
```http
GET /api/orders
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "order_number": "ORD-1234567890",
    "customer_name": "John Doe",
    "status": "PENDING",
    "total_amount": "1999.98",
    "item_count": 2,
    "user_name": "Jane Smith",
    "user_email": "jane@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "order_number": "ORD-1234567890",
  "customer_name": "John Doe",
  "status": "PENDING",
  "total_amount": "1999.98",
  "item_count": 2,
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Laptop",
      "product_sku": "LAP-001",
      "quantity": 2,
      "unit_price": "999.99"
    }
  ],
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "John Doe",
  "status": "PENDING",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 999.99
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 499.99
    }
  ]
}

Response: 201 Created
{
  "id": 1,
  "order_number": "ORD-1234567890",
  "total_amount": "2499.97",
  ...
}
```

#### Update Order Status
```http
PUT /api/orders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED"
}

# When status changes to COMPLETED:
# - Inventory automatically reduced (via database trigger)
# - Inventory movements created
# - Stock quantities updated

Response: 200 OK
{
  "id": 1,
  "status": "COMPLETED",
  ...
}
```

#### Delete Order
```http
DELETE /api/orders/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Order deleted successfully"
}
```

---

### Report Endpoints

#### Dashboard Metrics
```http
GET /api/reports/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "total_products": 50,
  "low_stock_count": 5,
  "pending_orders": 10,
  "inventory_value": "49999.50",
  "total_revenue": "125000.00",
  "recent_orders": [...],
  "low_stock_products": [...],
  "recent_movements": [...]
}
```

#### Inventory Report
```http
GET /api/reports/inventory
Authorization: Bearer <token>

Response: 200 OK
{
  "total_products": 50,
  "total_value": "49999.50",
  "low_stock": 5,
  "out_of_stock": 2,
  "products": [...]
}
```

#### Stock Alerts
```http
GET /api/reports/alerts
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "product_id": 5,
    "product_name": "Mouse",
    "current_stock": 3,
    "reorder_level": 10,
    "alert_level": "LOW",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Inventory Movements
```http
GET /api/reports/movements
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Laptop",
    "change_qty": -2,
    "reason": "Order ORD-123 completed",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### AI Report Endpoints

#### Generate AI Report
```http
POST /api/ai-reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "weekly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07"
}

Response: 200 OK
{
  "success": true,
  "report": {
    "metadata": {
      "id": "weekly_ai_1234567890",
      "type": "weekly",
      "period": "2024-01-01 to 2024-01-07",
      "generatedAt": "2024-01-07T12:00:00.000Z",
      "userId": 1,
      "dataSnapshot": {
        "totalProducts": 50,
        "totalValue": 49999.50,
        "ordersInPeriod": 10,
        "criticalAlerts": 3
      }
    },
    "content": "AI-generated report content...",
    "analysis": {...}
  }
}
```

#### List AI Reports
```http
GET /api/ai-reports/list
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "reports": [
    {
      "filename": "weekly_ai_1234567890.json",
      "metadata": {...},
      "size": 15234
    }
  ]
}
```

#### Get AI System Status
```http
GET /api/ai-reports/status/ai-system
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "aiSystem": {
    "primaryKey": "AIza****",
    "fallbackKey": "AIza****",
    "currentKey": "primary",
    "usingFallback": false,
    "primaryFailures": 0,
    "quota": {
      "totalRequests": 150,
      "failedRequests": 2,
      "remainingQuota": 848
    },
    "cacheSize": 5
  }
}
```

---

### Admin Endpoints (Admin Role Required)

#### Get System Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total_users": 25,
  "total_products": 500,
  "total_orders": 1250,
  "total_revenue": "250000.00",
  "active_users": 20,
  "pending_orders": 45
}
```

#### List All Users
```http
GET /api/admin/users
Authorization: Bearer <admin_token>

Response: 200 OK
[
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Update User Role
```http
PATCH /api/admin/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}

Response: 200 OK
{
  "message": "User role updated successfully",
  "user": {...}
}
```

---

## 🗺️ Frontend Routes

### Public Routes (No Authentication Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page with features and login/register links |
| `/login` | Login | User authentication page |
| `/register` | Register | New user registration page |

### Protected Routes (Authentication Required)

| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/dashboard` | Dashboard | Main dashboard with metrics and analytics | All users |
| `/admin` | AdminDashboard | System administration panel | Admin only |
| `/products` | Products | Product catalog and management | All users |
| `/products/:id` | ProductDetail | Single product view and edit | All users |
| `/suppliers` | Suppliers | Supplier management | All users |
| `/orders` | Orders | Order list and management | All users |
| `/orders/:id` | OrderDetail | Single order view with items | All users |
| `/reports` | Reports | Analytics and business reports | All users |
| `/ai-reports` | AIReports | AI-powered inventory insights | All users |
| `/profile` | Profile | User profile and settings | All users |

### Route Protection

Routes are protected using the `ProtectedRoute` component:

```typescript
<Route path="/dashboard">
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
</Route>
```

**Protection Logic:**
1. Check if user is authenticated (token exists)
2. Verify token is valid
3. Fetch user profile from backend
4. If valid: Render component
5. If invalid: Redirect to `/login`

### Admin-Only Routes

Admin routes check user role:

```typescript
<Route path="/admin">
  <ProtectedRoute>
    {user?.role === 'admin' ? (
      <AdminDashboard />
    ) : (
      <Navigate to="/dashboard" />
    )}
  </ProtectedRoute>
</Route>
```

---

## 👥 User Roles & Permissions

### Role Types

#### 1. Regular User (`role: 'user'`)

**Permissions:**
- ✅ View own products, suppliers, orders
- ✅ Create, update, delete own data
- ✅ Generate AI reports for own data
- ✅ View own dashboard metrics
- ✅ Update own profile
- ❌ Cannot view other users' data
- ❌ Cannot access admin panel
- ❌ Cannot change user roles

**Data Isolation:**
- All queries filtered by `user_id`
- Backend enforces: `WHERE user_id = $1`
- Cannot access data from other users
- Dashboard shows only their metrics

#### 2. Admin User (`role: 'admin'`)

**Permissions:**
- ✅ View ALL data from ALL users
- ✅ Access admin dashboard
- ✅ Manage user accounts
- ✅ Change user roles
- ✅ View system-wide statistics
- ✅ Generate reports for all users
- ✅ Delete any data (with constraints)
- ✅ All regular user permissions

**Data Access:**
- No `user_id` filter applied
- Sees aggregate data across all users
- Can switch between user view and admin view
- Dashboard shows system-wide metrics

### Role Assignment

**Default Role:**
- New users: `user`
- First user: Can be promoted to `admin` manually

**Changing Roles:**

```sql
-- Via SQL
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Via Admin Panel (UI)
Admin Dashboard → Users → Edit User → Change Role
```

### Permission Enforcement

**Backend (Middleware):**
```javascript
// Fetch fresh role from database on every request
const result = await pool.query(
  'SELECT id, email, role FROM users WHERE id = $1',
  [user.userId]
);
req.user.role = result.rows[0].role;
```

**Frontend (Context):**
```typescript
// Check role every 10 seconds
useEffect(() => {
  const interval = setInterval(checkRole, 10000);
  return () => clearInterval(interval);
}, []);
```

**Data Filtering:**
```javascript
// Regular user
if (req.user.role !== 'admin') {
  query += ' WHERE user_id = $1';
  params.push(req.user.userId);
}

// Admin user - no filter, sees all data
```

---

## 🤖 AI Features

### Google Gemini Integration

LogiCore uses **Google Gemini 2.5 Flash** for AI-powered inventory analysis and insights.

#### AI Capabilities

**1. Intelligent Report Generation**
- Analyzes inventory data (products, orders, suppliers, stock levels)
- Generates natural language business reports
- Provides actionable recommendations
- Identifies trends and patterns
- Calculates financial impact

**2. Report Types**
- **Weekly Reports**: 7-day analysis with immediate action items
- **Monthly Reports**: 30-day strategic analysis with long-term recommendations
- **Custom Reports**: Any date range analysis

**3. Analysis Components**
- **Stock Health**: Normal, low stock, out of stock, overstock analysis
- **Financial Metrics**: Inventory value, capital tied up, reorder investment
- **Top Products**: Best performers by value and quantity
- **Critical Alerts**: Urgent reorder needs with cost calculations
- **Supplier Performance**: Supplier portfolio analysis
- **Business Activity**: Order trends and sales patterns

#### Dual API Key System

**Primary + Fallback Architecture:**
```javascript
// Primary API key
GEMINI_API_KEY=your_primary_key

// Fallback API key (automatic failover)
GEMINI_FALLBACK_API_KEY=your_fallback_key
```

**Automatic Failover:**
1. Request sent to primary API key
2. If primary fails (quota, rate limit, error):
   - Automatically switches to fallback key
   - Logs the failure
   - Continues operation seamlessly
3. If both fail: Returns error to user

**Benefits:**
- High availability (99.9%+ uptime)
- No service interruption
- Automatic recovery
- Quota distribution across keys

#### Quota Management

**Request Tracking:**
- Total requests made
- Failed requests
- Remaining quota
- Reset time

**Rate Limiting:**
- Minimum 10 seconds between requests
- Prevents quota exhaustion
- Automatic request queuing

**Quota Monitoring:**
```javascript
GET /api/ai-reports/status/ai-system

Response:
{
  "quota": {
    "totalRequests": 150,
    "failedRequests": 2,
    "remainingQuota": 848,
    "quotaResetIn": 3600
  }
}
```

#### Report Generation Process

**1. Data Collection:**
- Fetch products, orders, suppliers from PostgreSQL
- Filter by user (regular user) or all data (admin)
- Calculate metrics (inventory value, stock status, etc.)

**2. Data Analysis:**
- Aggregate statistics
- Identify patterns and trends
- Calculate financial impact
- Detect anomalies

**3. AI Processing:**
- Send structured data to Gemini AI
- Natural language prompt with business context
- AI generates comprehensive report
- Response includes insights and recommendations

**4. Report Storage:**
- Save report to filesystem (`backend/reports/`)
- Store metadata in MongoDB
- Include data snapshot for reference

**5. Report Access:**
- List all reports
- View specific report
- Download as text file
- Filter by user (data isolation)

#### AI Report Structure

```json
{
  "metadata": {
    "id": "weekly_ai_1234567890",
    "type": "weekly",
    "period": "2024-01-01 to 2024-01-07",
    "generatedAt": "2024-01-07T12:00:00.000Z",
    "userId": 1,
    "aiStatus": {
      "keyUsed": "primary",
      "usingFallback": false,
      "primaryFailures": 0
    },
    "dataSnapshot": {
      "totalProducts": 50,
      "totalValue": 49999.50,
      "totalUnits": 500,
      "ordersInPeriod": 10,
      "criticalAlerts": 3,
      "stockHealth": {
        "normal": 40,
        "lowStock": 7,
        "outOfStock": 2,
        "overstock": 1
      }
    }
  },
  "content": "AI-generated report text...",
  "analysis": {
    "stockDistribution": {...},
    "financialMetrics": {...},
    "topPerformers": [...],
    "criticalItems": [...]
  }
}
```

#### Getting Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

#### AI Configuration

**Model Settings:**
```javascript
{
  temperature: 0.2,      // Low temperature for consistent, factual output
  topK: 1,               // Most likely token selection
  topP: 0.9,             // Nucleus sampling
  maxOutputTokens: 2000  // Maximum response length
}
```

**Timeout:**
- 30 seconds per request
- Automatic abort if exceeded

**Caching:**
- 5-minute cache for report data
- Reduces database queries
- Improves performance

---

## 🔒 Security

### Authentication & Authorization

**1. Password Security**
- Hashing: bcrypt with 10 salt rounds
- Minimum length: 6 characters
- Stored as hash, never plain text
- Password validation on registration

**2. JWT Tokens**
- Algorithm: HS256
- Expiration: 24 hours (configurable)
- Payload: userId, email, role
- Secret: Strong random string (JWT_SECRET)
- Validation on every protected request

**3. Role-Based Access Control (RBAC)**
- Two roles: `user` and `admin`
- Role stored in database
- Fresh role fetched on every request
- Frontend checks role for UI rendering
- Backend enforces role for data access

### Data Security

**1. SQL Injection Prevention**
- Parameterized queries only
- No string concatenation in SQL
- Input validation and sanitization
- PostgreSQL prepared statements

```javascript
// SAFE - Parameterized query
pool.query('SELECT * FROM products WHERE id = $1', [productId]);

// UNSAFE - Never do this
pool.query(`SELECT * FROM products WHERE id = ${productId}`);
```

**2. Data Isolation**
- User-scoped data filtering
- Backend enforces `WHERE user_id = $1`
- Cannot access other users' data
- Admin can see all data (by design)

**3. Input Validation**
- Email format validation
- Required field checks
- Type validation (string, number, etc.)
- Length limits
- Sanitization of user input

### Network Security

**1. CORS Configuration**
```javascript
app.use(cors({
  origin: 'http://localhost:3000',  // Frontend URL
  credentials: true
}));
```

**2. HTTPS (Production)**
- Use SSL/TLS certificates
- Redirect HTTP to HTTPS
- Secure cookie flags
- HSTS headers

**3. Rate Limiting (Recommended)**
```javascript
// Add to backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Environment Security

**1. Environment Variables**
- Sensitive data in `.env` files
- Never commit `.env` to git
- Use `.env.example` for templates
- Different configs for dev/prod

**2. Secret Management**
- Strong JWT_SECRET (32+ characters)
- Rotate secrets regularly
- Use environment-specific secrets
- Never hardcode secrets in code

**3. Database Security**
- Use strong database passwords
- Limit database user permissions
- Enable SSL for database connections
- Regular backups

### Audit & Monitoring

**1. Audit Logging**
- All data changes logged to `audit_log` table
- Captures: operation, old/new values, user, timestamp
- Triggered automatically by database triggers
- Immutable audit trail

**2. Activity Logging**
- User actions logged to MongoDB
- API requests tracked
- Error logging
- Performance monitoring

**3. Error Handling**
- Sensitive data not exposed in errors
- Generic error messages to users
- Detailed logs for developers
- Stack traces in development only

---

## 🧪 Testing

### Manual Testing

#### 1. Backend API Testing

**Test Health Endpoint:**
```bash
curl http://localhost:4001/
# Expected: "Smart Supply Chain API is running"
```

**Test Authentication:**
```bash
# Login
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@logicore.com","password":"test123"}'

# Expected: {"token":"eyJ...","user":{...}}
# Copy the token for next requests
```

**Test Protected Endpoint:**
```bash
# Replace YOUR_TOKEN with actual token from login
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/products

# Expected: Array of products
```

**Test Product Creation:**
```bash
curl -X POST http://localhost:4001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "unit_price": 99.99,
    "stock_quantity": 100,
    "reorder_level": 10
  }'

# Expected: Created product object
```

#### 2. Frontend Testing

**Browser Console Testing:**
1. Open http://localhost:3000
2. Open Developer Tools (F12)
3. Go to Console tab
4. Check for errors (should be none)

**Authentication Flow:**
1. Click "Sign In"
2. Enter: `test@logicore.com` / `test123`
3. Should redirect to dashboard
4. Check localStorage for token:
   ```javascript
   localStorage.getItem('token')
   ```

**Data Loading:**
1. Navigate to Products page
2. Products should load within 1 second
3. Check Network tab for API calls
4. Verify 200 OK responses

**CRUD Operations:**
1. Create a new product
2. Edit the product
3. Delete the product
4. Verify changes persist after page refresh

#### 3. Database Testing

**PostgreSQL:**
```bash
# Connect to database
psql -U your_username -d smart_supply_chain

# Check tables
\dt

# Count records
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

# Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

# Exit
\q
```

**MongoDB:**
```bash
# Connect to MongoDB
mongosh smart_supply_chain

# List collections
show collections

# Count documents
db.activity_logs.countDocuments()
db.ai_insights.countDocuments()

# View recent activity
db.activity_logs.find().sort({timestamp: -1}).limit(5)

# Exit
exit
```

### Integration Testing

#### Test Order Completion Flow

**1. Check Initial Stock:**
```sql
SELECT id, name, stock_quantity FROM products WHERE id = 1;
-- Note the stock_quantity
```

**2. Create Order:**
```bash
curl -X POST http://localhost:4001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "status": "PENDING",
    "items": [
      {
        "product_id": 1,
        "quantity": 5,
        "unit_price": 99.99
      }
    ]
  }'
```

**3. Complete Order:**
```bash
# Use order ID from previous response
curl -X PUT http://localhost:4001/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

**4. Verify Stock Reduced:**
```sql
SELECT id, name, stock_quantity FROM products WHERE id = 1;
-- stock_quantity should be reduced by 5
```

**5. Check Inventory Movement:**
```sql
SELECT * FROM inventory_movements 
WHERE product_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
-- Should show -5 change with reason "Order ... completed"
```

#### Test Data Isolation

**1. Create Two Users:**
```bash
# User 1
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "test123",
    "first_name": "User",
    "last_name": "One"
  }'

# User 2
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user2@test.com",
    "password": "test123",
    "first_name": "User",
    "last_name": "Two"
  }'
```

**2. Login as User 1:**
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"test123"}'
# Save token as TOKEN1
```

**3. Create Product as User 1:**
```bash
curl -X POST http://localhost:4001/api/products \
  -H "Authorization: Bearer TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User 1 Product",
    "sku": "U1-001",
    "unit_price": 50,
    "stock_quantity": 100,
    "reorder_level": 10
  }'
```

**4. Login as User 2:**
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@test.com","password":"test123"}'
# Save token as TOKEN2
```

**5. Try to Access User 1's Products:**
```bash
curl -H "Authorization: Bearer TOKEN2" \
  http://localhost:4001/api/products
# Should NOT include "User 1 Product"
```

**Expected Result:** User 2 cannot see User 1's products ✅

#### Test Admin Access

**1. Promote User to Admin:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'user1@test.com';
```

**2. Login as Admin:**
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"test123"}'
# Save token as ADMIN_TOKEN
```

**3. Access All Products:**
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:4001/api/products
# Should include products from ALL users
```

**Expected Result:** Admin sees all products from all users ✅

### Performance Testing

#### Response Time Testing

```bash
# Test product list endpoint
time curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/products

# Expected: < 200ms
```

#### Load Testing (Optional)

Using Apache Bench:
```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/products
```

### Troubleshooting Tests

**If tests fail:**

1. **Check Backend is Running:**
   ```bash
   curl http://localhost:4001/
   ```

2. **Check Database Connection:**
   ```bash
   psql -d smart_supply_chain -c "SELECT 1;"
   ```

3. **Check Token is Valid:**
   ```bash
   # Decode JWT token
   echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d | jq
   ```

4. **Check Backend Logs:**
   - Look at terminal where backend is running
   - Check for error messages

5. **Check Frontend Console:**
   - Open browser Developer Tools
   - Look for JavaScript errors
   - Check Network tab for failed requests

---

## 🚀 Deployment

### Production Checklist

Before deploying to production, complete these steps:

#### Security
- [ ] Change JWT_SECRET to strong random string (32+ characters)
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for databases
- [ ] Configure MongoDB authentication
- [ ] Set up HTTPS with SSL certificates
- [ ] Enable CORS only for production domain
- [ ] Add rate limiting middleware
- [ ] Remove debug/test code
- [ ] Disable verbose logging

#### Configuration
- [ ] Set production environment variables
- [ ] Configure production database URLs
- [ ] Set up database backups
- [ ] Configure email service (if using)
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Set up error tracking (Sentry, etc.)

#### Build & Deploy
- [ ] Build frontend for production
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure reverse proxy (nginx)
- [ ] Set up process manager (PM2)
- [ ] Configure auto-restart on failure
- [ ] Set up CI/CD pipeline

### Production Build

#### Frontend Build

```bash
cd frontend

# Install dependencies
pnpm install

# Build for production
pnpm build

# Output will be in frontend/dist/
# Serve with nginx or any static file server
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Backend Deployment

**Using PM2 (Process Manager):**

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start src/server.js --name logicore-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs logicore-api

# Restart
pm2 restart logicore-api

# Stop
pm2 stop logicore-api
```

**PM2 Ecosystem File** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'logicore-api',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start with: `pm2 start ecosystem.config.js`

### Database Setup (Production)

#### PostgreSQL

**1. Create Production Database:**
```bash
createdb smart_supply_chain_prod
```

**2. Apply Schema:**
```bash
psql -d smart_supply_chain_prod -f db/auth_schema.sql
psql -d smart_supply_chain_prod -f db/schema.sql
```

**3. Enable SSL:**
```sql
-- In postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

**4. Create Limited User:**
```sql
CREATE USER logicore_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE smart_supply_chain_prod TO logicore_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO logicore_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO logicore_app;
```

**5. Set up Backups:**
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U logicore_app smart_supply_chain_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab: `0 2 * * * /path/to/backup.sh`

#### MongoDB

**1. Enable Authentication:**
```javascript
// Connect to MongoDB
mongosh

// Switch to admin database
use admin

// Create admin user
db.createUser({
  user: "admin",
  pwd: "strong_admin_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

// Create app user
use smart_supply_chain
db.createUser({
  user: "logicore_app",
  pwd: "strong_app_password",
  roles: ["readWrite"]
})
```

**2. Enable Auth in Config:**
```yaml
# /etc/mongod.conf
security:
  authorization: enabled
```

**3. Restart MongoDB:**
```bash
sudo systemctl restart mongod
```

**4. Update Connection String:**
```env
MONGODB_URI=mongodb://logicore_app:strong_app_password@localhost:27017/smart_supply_chain?authSource=smart_supply_chain
```

### Environment Variables (Production)

**Backend `.env`:**
```env
# PostgreSQL
PGHOST=your-db-host.com
PGPORT=5432
PGDATABASE=smart_supply_chain_prod
PGUSER=logicore_app
PGPASSWORD=strong_password
PGSSLMODE=require

# Server
PORT=4001
HOST=0.0.0.0
NODE_ENV=production

# JWT
JWT_SECRET=your-super-strong-random-secret-32-chars-minimum

# MongoDB
MONGODB_URI=mongodb://logicore_app:password@your-mongo-host:27017/smart_supply_chain?authSource=smart_supply_chain

# AI
GEMINI_API_KEY=your_production_api_key
GEMINI_FALLBACK_API_KEY=your_fallback_api_key

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Frontend `.env`:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Monitoring & Logging

#### Application Monitoring

**PM2 Monitoring:**
```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 install pm2-server-monit
```

**Log Aggregation:**
```bash
# Install Winston for structured logging
npm install winston

# Configure in backend
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### Database Monitoring

**PostgreSQL:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('smart_supply_chain_prod'));
```

**MongoDB:**
```javascript
// Check database stats
db.stats()

// Check collection sizes
db.activity_logs.stats()

// Check slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ts: -1}).limit(5)
```

### Scaling

#### Horizontal Scaling

**Load Balancer (nginx):**
```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
    server 127.0.0.1:4003;
}

server {
    listen 80;
    location /api {
        proxy_pass http://backend;
    }
}
```

**Multiple Backend Instances:**
```bash
# Start multiple instances with PM2
pm2 start ecosystem.config.js -i 4  # 4 instances
```

#### Database Scaling

**PostgreSQL:**
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Partitioning large tables

**MongoDB:**
- Replica sets for high availability
- Sharding for horizontal scaling
- Indexes for query performance

### Backup & Recovery

**Automated Backups:**
```bash
#!/bin/bash
# backup.sh

# PostgreSQL
pg_dump -U logicore_app smart_supply_chain_prod | gzip > /backups/pg_$(date +%Y%m%d).sql.gz

# MongoDB
mongodump --uri="mongodb://user:pass@localhost/smart_supply_chain" --out=/backups/mongo_$(date +%Y%m%d)

# Upload to S3 (optional)
aws s3 cp /backups/ s3://your-bucket/backups/ --recursive
```

**Recovery:**
```bash
# PostgreSQL
gunzip < backup.sql.gz | psql -U logicore_app smart_supply_chain_prod

# MongoDB
mongorestore --uri="mongodb://user:pass@localhost/smart_supply_chain" /backups/mongo_20240101
```

---

## 🔧 Troubleshooting

### Common Issues

#### Backend Won't Start

**Issue:** Backend fails to start or crashes immediately

**Solutions:**

1. **Check PostgreSQL Connection:**
   ```bash
   psql -U your_username -d smart_supply_chain -c "SELECT 1;"
   ```
   - If fails: Check PGUSER, PGPASSWORD, PGDATABASE in `.env`
   - Verify PostgreSQL is running: `pg_isready`

2. **Check Port Availability:**
   ```bash
   lsof -i :4001
   ```
   - If port in use: Kill process or change PORT in `.env`

3. **Check Environment Variables:**
   ```bash
   cd backend
   cat .env
   ```
   - Verify all required variables are set
   - Check for typos in variable names

4. **Check Node Version:**
   ```bash
   node --version
   ```
   - Must be v18 or higher
   - Update if needed: `nvm install 18`

5. **Check Dependencies:**
   ```bash
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

6. **Check Logs:**
   ```bash
   cd backend
   npm start
   ```
   - Read error messages carefully
   - Common errors:
     - "ECONNREFUSED": Database not running
     - "EADDRINUSE": Port already in use
     - "MODULE_NOT_FOUND": Missing dependency

#### Frontend Won't Load Data

**Issue:** Frontend loads but shows no data or "Failed to load" errors

**Solutions:**

1. **Check Backend is Running:**
   ```bash
   curl http://localhost:4001/
   ```
   - Should return: "Smart Supply Chain API is running"
   - If not: Start backend

2. **Check API URL:**
   ```bash
   cd frontend
   cat .env
   ```
   - Should be: `VITE_API_URL=http://localhost:4001/api`
   - Restart frontend after changing

3. **Check Authentication:**
   - Open browser Developer Tools (F12)
   - Go to Console tab
   - Look for 401 Unauthorized errors
   - If found: Logout and login again

4. **Check Network Requests:**
   - Open Developer Tools > Network tab
   - Reload page
   - Look for failed requests (red)
   - Click on failed request to see error details

5. **Check CORS:**
   - If seeing CORS errors in console
   - Verify backend CORS configuration allows frontend origin
   - Check `backend/src/server.js` cors settings

6. **Clear Browser Cache:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

#### Database Connection Issues

**PostgreSQL:**

**Issue:** "ECONNREFUSED" or "Connection refused"

**Solutions:**

1. **Check PostgreSQL is Running:**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   
   # Start if not running
   brew services start postgresql  # macOS
   sudo systemctl start postgresql  # Linux
   ```

2. **Check Connection Settings:**
   ```bash
   psql -U your_username -d smart_supply_chain
   ```
   - If fails: Check username, password, database name
   - Try connecting as postgres user first

3. **Check pg_hba.conf:**
   ```bash
   # Find config file
   psql -U postgres -c "SHOW hba_file;"
   
   # Edit file (as root)
   sudo nano /path/to/pg_hba.conf
   
   # Add line:
   host    all    all    127.0.0.1/32    md5
   
   # Reload PostgreSQL
   sudo systemctl reload postgresql
   ```

**MongoDB:**

**Issue:** "MongoServerError: Authentication failed"

**Solutions:**

1. **Check MongoDB is Running:**
   ```bash
   mongosh --eval "db.runCommand('ping')"
   ```

2. **Check Authentication:**
   ```bash
   # If auth enabled, use credentials
   mongosh -u username -p password --authenticationDatabase admin
   ```

3. **Disable Auth for Testing:**
   ```bash
   # Edit /etc/mongod.conf
   # Comment out:
   # security:
   #   authorization: enabled
   
   # Restart
   sudo systemctl restart mongod
   ```

#### Authentication Problems

**Issue:** Cannot login or "Invalid credentials" error

**Solutions:**

1. **Verify User Exists:**
   ```sql
   SELECT email, role FROM users WHERE email = 'test@logicore.com';
   ```

2. **Reset Password:**
   ```bash
   cd backend
   node scripts/reset-password.js test@logicore.com newpassword123
   ```

3. **Create New Test User:**
   ```bash
   cd backend
   node scripts/create-test-user.js
   ```

4. **Check JWT Secret:**
   ```bash
   cd backend
   grep JWT_SECRET .env
   ```
   - Must be set and consistent
   - If changed, all users must re-login

5. **Clear Old Tokens:**
   ```javascript
   // In browser console
   localStorage.removeItem('token');
   location.reload();
   ```

#### Order Completion Issues

**Issue:** Inventory not reducing when order completed

**Solutions:**

1. **Check Database Trigger:**
   ```sql
   SELECT trigger_name, event_object_table, action_statement
   FROM information_schema.triggers
   WHERE trigger_name = 'order_completion_trigger_update';
   ```
   - Should exist on `orders` table
   - If missing: Re-apply schema

2. **Check Backend Logs:**
   - Look for trigger execution messages
   - Should see: "Inventory will be managed by database trigger"

3. **Manual Test:**
   ```sql
   -- Check current stock
   SELECT stock_quantity FROM products WHERE id = 1;
   
   -- Complete an order
   UPDATE orders SET status = 'COMPLETED' WHERE id = 1;
   
   -- Check stock again (should be reduced)
   SELECT stock_quantity FROM products WHERE id = 1;
   
   -- Check inventory movements
   SELECT * FROM inventory_movements WHERE product_id = 1 ORDER BY created_at DESC LIMIT 1;
   ```

#### AI Report Generation Fails

**Issue:** "Failed to generate AI report" error

**Solutions:**

1. **Check API Key:**
   ```bash
   cd backend
   grep GEMINI_API_KEY .env
   ```
   - Must be valid Gemini API key
   - Get from: https://makersuite.google.com/app/apikey

2. **Check Quota:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4001/api/ai-reports/status/ai-system
   ```
   - Check `remainingQuota`
   - If 0: Wait for reset or use fallback key

3. **Check Internet Connection:**
   ```bash
   ping google.com
   ```

4. **Check Backend Logs:**
   - Look for AI-related errors
   - Common issues:
     - "quota exceeded": Wait or add fallback key
     - "rate limit": Wait 10 seconds between requests
     - "invalid API key": Check key is correct

5. **Test API Key:**
   ```bash
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY \
     -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

#### Performance Issues

**Issue:** Slow page loads or API responses

**Solutions:**

1. **Check Database Indexes:**
   ```sql
   -- PostgreSQL
   SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
   
   -- Add missing indexes
   CREATE INDEX idx_products_user_id ON products(user_id);
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   CREATE INDEX idx_orders_status ON orders(status);
   ```

2. **Check Connection Pool:**
   ```javascript
   // In backend/src/db.js
   // Increase pool size if needed
   max: 20  // Increase to 50 for high traffic
   ```

3. **Enable Query Logging:**
   ```javascript
   // In backend
   pool.on('query', (query) => {
     console.log('QUERY:', query.text);
   });
   ```

4. **Check MongoDB Indexes:**
   ```javascript
   // In mongosh
   db.activity_logs.getIndexes()
   
   // Add missing indexes
   db.activity_logs.createIndex({ userId: 1, timestamp: -1 })
   ```

5. **Monitor Resource Usage:**
   ```bash
   # CPU and Memory
   top
   
   # Database connections
   psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```

### Debug Mode

**Enable Verbose Logging:**

**Backend:**
```javascript
// In backend/src/server.js
// Add morgan for HTTP logging
const morgan = require('morgan');
app.use(morgan('dev'));

// Add query logging
pool.on('query', (query) => {
  console.log('QUERY:', query.text, query.values);
});
```

**Frontend:**
```typescript
// In frontend/client/src/lib/api.ts
// Add request/response logging
apiClient.interceptors.request.use(request => {
  console.log('REQUEST:', request);
  return request;
});

apiClient.interceptors.response.use(response => {
  console.log('RESPONSE:', response);
  return response;
});
```

### Getting Help

If you're still stuck:

1. **Check Backend Logs:**
   - Terminal where backend is running
   - Look for error messages and stack traces

2. **Check Frontend Console:**
   - Browser Developer Tools > Console
   - Look for JavaScript errors

3. **Check Database Logs:**
   ```bash
   # PostgreSQL
   tail -f /var/log/postgresql/postgresql-*.log
   
   # MongoDB
   tail -f /var/log/mongodb/mongod.log
   ```

4. **Test Individual Components:**
   - Test database connection separately
   - Test API endpoints with curl
   - Test frontend in isolation

5. **Review Documentation:**
   - Re-read relevant sections of this README
   - Check API documentation
   - Review database schema

---

## 📚 Additional Resources

### Documentation

- **PostgreSQL**: https://www.postgresql.org/docs/
- **MongoDB**: https://docs.mongodb.com/
- **Node.js**: https://nodejs.org/docs/
- **React**: https://react.dev/
- **Express**: https://expressjs.com/
- **Google Gemini**: https://ai.google.dev/docs

### Tools

- **Database GUI**: 
  - PostgreSQL: pgAdmin, DBeaver, TablePlus
  - MongoDB: MongoDB Compass, Studio 3T

- **API Testing**: 
  - Postman, Insomnia, Thunder Client (VS Code)

- **Monitoring**:
  - PM2 for process management
  - New Relic, Datadog for APM
  - Sentry for error tracking

### Community

- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Contributing**: See CONTRIBUTING.md

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **PostgreSQL** - Robust relational database
- **MongoDB** - Flexible document database
- **Google Gemini** - AI-powered insights
- **React Team** - Modern UI framework
- **Express Team** - Web application framework
- **Open Source Community** - All the amazing libraries and tools

---

## 📞 Support

For questions, issues, or feature requests:

1. Check this comprehensive README
2. Review troubleshooting section
3. Check existing issues on GitHub
4. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Relevant logs

---

## 🎉 Quick Start Summary

```bash
# 1. Clone and setup
git clone <repo-url>
cd logicore

# 2. Database setup
createdb smart_supply_chain
psql -d smart_supply_chain -f db/auth_schema.sql

# 3. Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm start

# 4. Frontend (new terminal)
cd frontend
pnpm install
cp .env.example .env
pnpm dev

# 5. Access
# Open http://localhost:3000
# Login: test@logicore.com / test123
```

---

**Version:** 2.0.0  
**Last Updated:** February 2026  
**Status:** Production Ready ✅

🎉 **Happy Supply Chain Managing with LogiCore!**
