# API Key Architecture & Database Interactions

## Overview
The system uses Google Gemini AI API keys with a dual-key fallback system for high availability. Reports are stored in MongoDB after being generated.

---

## 📁 Key Files

### 1. **Environment Configuration**
**File:** `backend/.env`
```env
GEMINI_API_KEY=your_primary_api_key_here
GEMINI_FALLBACK_API_KEY=your_fallback_api_key_here
```

**Purpose:**
- Stores API keys securely
- Primary key for normal operations
- Fallback key for automatic failover

---

### 2. **AI Client (Core Logic)**
**File:** `backend/src/aiClient.js`

**Key Features:**
- Loads API keys from environment variables
- Initializes Google Generative AI clients
- Implements automatic fallback system
- Tracks failures and switches keys

**Main Class: `EnhancedAIClient`**

```javascript
class EnhancedAIClient {
  constructor() {
    this.primaryAI = primaryAI;           // Primary API client
    this.fallbackAI = fallbackAI;         // Fallback API client
    this.usingFallback = false;           // Current state
    this.primaryFailures = 0;             // Failure counter
    this.maxPrimaryFailures = 3;          // Switch threshold
  }
}
```

**Key Methods:**
- `getClient()` - Returns active client (primary or fallback)
- `testApiKey()` - Validates API key functionality
- `handleApiFailure()` - Manages failures and switches keys
- `generateContent()` - Main method for AI generation with auto-retry
- `getStatus()` - Returns current system status

**Initialization Flow:**
```
1. Load GEMINI_API_KEY from .env
2. Load GEMINI_FALLBACK_API_KEY from .env
3. Validate keys (check if not empty or placeholder)
4. Initialize GoogleGenerativeAI clients
5. Log initialization status
```

**Fallback Logic:**
```
1. Request sent to primary API
2. If fails → increment primaryFailures counter
3. If primaryFailures >= 3 → test fallback key
4. If fallback works → switch to fallback
5. If fallback fails → throw error
6. On success → reset failure counter
```

---

### 3. **Quota Monitor**
**File:** `backend/src/aiQuotaMonitor.js`

**Purpose:**
- Prevents exceeding API rate limits
- Tracks request history
- Enforces limits before making requests

**Limits:**
- 8 requests per minute
- 15 requests per hour

**Key Methods:**
- `canMakeRequest()` - Checks if request is allowed
- `recordRequest()` - Logs a new request
- `getStats()` - Returns usage statistics
- `getNextAllowedTime()` - Time until next request allowed

**Usage Pattern:**
```javascript
// Before making AI request
if (!quotaMonitor.canMakeRequest()) {
  throw new Error('Rate limit reached');
}

// Make request
const result = await aiClient.generateContent(prompt);

// Record the request
quotaMonitor.recordRequest();
```

---

### 4. **AI Report Service**
**File:** `backend/src/services/aiReportService.js`

**Purpose:**
- Generates AI-powered inventory reports
- Fetches data from PostgreSQL
- Sends prompts to AI
- Saves reports to file system (currently)

**Key Methods:**

#### `getReportData(startDate, endDate, userId)`
- Fetches inventory data from PostgreSQL
- Queries: products, orders, suppliers, alerts
- Filters by user (unless admin)
- Caches results for 5 minutes

#### `generateReport(type, startDate, endDate, userId)`
- Checks quota with `quotaMonitor.canMakeRequest()`
- Analyzes data with `performDataAnalysis()`
- Creates AI prompt with business context
- Calls `aiClient.generateContent(prompt)`
- Returns report with metadata

#### `saveReport(report)`
- Currently saves to `backend/reports/` as JSON files
- **TODO:** Should save to MongoDB `ai_reports` collection

**Data Flow:**
```
PostgreSQL → getReportData() → performDataAnalysis() 
  → AI Prompt → Gemini API → Report Content 
  → saveReport() → File System (should be MongoDB)
```

---

### 5. **AI Reports API Routes**
**File:** `backend/src/routes/aiReports.js`

**Endpoints:**

#### `POST /api/ai-reports/generate`
- Generates single report (weekly or monthly)
- Requires: type, startDate, endDate
- Calls: `aiReportService.generateReport()`
- Saves: `aiReportService.saveReport()`

#### `GET /api/ai-reports/list`
- Lists all reports for user
- Admin sees all reports
- Regular users see only their own

#### `GET /api/ai-reports/:reportId`
- Fetches specific report
- Access control: own reports or admin

#### `GET /api/ai-reports/:reportId/download`
- Downloads report as text file
- Access control: own reports or admin

#### `GET /api/ai-reports/status/ai-system`
- Returns AI system status
- Shows: current key, failures, quota stats

**Authentication:**
- All routes require `authenticateToken` middleware
- User ID from JWT token
- Admin role check for full access

---

### 6. **MongoDB Migration Script**
**File:** `backend/scripts/migrate-reports-to-mongodb.js`

**Purpose:**
- Migrates JSON report files to MongoDB
- Creates `ai_reports` collection
- Removes `chat_queries` collection

**What it does:**
1. Connects to MongoDB
2. Drops `chat_queries` collection
3. Reads all JSON files from `backend/reports/`
4. Inserts each report into `ai_reports` collection
5. Creates indexes for performance
6. Verifies migration

**Indexes Created:**
```javascript
db.ai_reports.createIndex({ 'metadata.type': 1 })
db.ai_reports.createIndex({ 'metadata.generatedAt': -1 })
db.ai_reports.createIndex({ 'metadata.userId': 1 })
db.ai_reports.createIndex({ 'metadata.id': 1 }, { unique: true })
```

---

## 🗄️ Database Interactions

### PostgreSQL (Inventory Data)
**Used by:** `aiReportService.getReportData()`

**Tables Queried:**
- `products` - Current inventory
- `orders` - Order history
- `order_items` - Order details
- `suppliers` - Supplier info
- `users` - User data

**Query Pattern:**
```sql
-- Example: Get products for user
SELECT p.*, s.name as supplier_name,
       (p.stock_quantity * p.unit_price) as total_value,
       CASE 
         WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
         WHEN p.stock_quantity <= p.reorder_level THEN 'LOW_STOCK'
         WHEN p.stock_quantity > p.reorder_level * 3 THEN 'OVERSTOCK'
         ELSE 'NORMAL'
       END as stock_status
FROM products p 
LEFT JOIN suppliers s ON p.supplier_id = s.id 
WHERE p.user_id = $1
ORDER BY total_value DESC
```

**User Isolation:**
- Regular users: `WHERE user_id = $userId`
- Admin users: No filter (sees all data)

---

### MongoDB (Report Storage)
**Collection:** `ai_reports`

**Document Structure:**
```javascript
{
  _id: ObjectId("..."),
  metadata: {
    id: "monthly_ai_1770462705386",
    type: "monthly",                    // "weekly" or "monthly"
    period: "2026-01-31 to 2026-02-07",
    generatedAt: ISODate("2026-02-07T11:11:45.386Z"),
    userId: 10,                         // User who generated it
    aiStatus: {
      keyUsed: "primary",               // "primary" or "fallback"
      usingFallback: false,
      primaryFailures: 0
    },
    dataSnapshot: {
      totalProducts: 1,
      totalValue: 100000,
      totalUnits: 100,
      ordersInPeriod: 0,
      criticalAlerts: 0,
      stockHealth: {
        normal: 0,
        lowStock: 0,
        outOfStock: 0,
        overstock: 1
      }
    },
    analysis: {
      stockDistribution: { ... },
      financialMetrics: { ... },
      topPerformers: [ ... ],
      criticalItems: 0
    },
    optimizations: {
      promptTokensUsed: 1281,
      analysisDepth: 7,
      cacheUsed: false,
      generationTime: 11075
    }
  },
  content: "**Monthly Inventory Report...**",  // AI-generated text
  rawData: {
    currentInventory: [ ... ],
    inventorySummary: [ ... ],
    ordersInPeriod: [ ... ],
    topSellingProducts: [ ... ],
    supplierPerformance: [ ... ],
    stockAlerts: [ ... ]
  },
  analysis: { ... },
  migratedAt: ISODate("2026-02-10T04:52:57.947Z"),
  originalFilename: "monthly_ai_1770462705386.json",
  fileSize: 7800
}
```

**Queries:**
```javascript
// Get all reports for user
db.ai_reports.find({ 'metadata.userId': 10 })

// Get latest monthly report
db.ai_reports.find({ 'metadata.type': 'monthly' })
  .sort({ 'metadata.generatedAt': -1 })
  .limit(1)

// Count reports by type
db.ai_reports.countDocuments({ 'metadata.type': 'weekly' })
```

---

## 🔄 Complete Flow: Generate AI Report

### Step-by-Step Process:

1. **User Request**
   - Frontend: User clicks "Generate Report"
   - Request: `POST /api/ai-reports/generate`
   - Body: `{ type: "monthly", startDate: "2026-01-01", endDate: "2026-01-31" }`

2. **Authentication**
   - Middleware: `authenticateToken`
   - Extracts: userId, role from JWT
   - Determines: userId = null (admin) or userId (regular user)

3. **Quota Check**
   - Service: `quotaMonitor.canMakeRequest()`
   - Checks: Recent requests < limits
   - If exceeded: Throw error

4. **Data Fetching (PostgreSQL)**
   - Service: `aiReportService.getReportData()`
   - Queries: Products, orders, suppliers, alerts
   - Filters: By userId (if not admin)
   - Returns: Raw inventory data

5. **Data Analysis**
   - Service: `performDataAnalysis(data)`
   - Calculates: Stock status, financial metrics
   - Identifies: Top products, critical alerts
   - Returns: Analyzed data structure

6. **AI Prompt Creation**
   - Service: Creates detailed business prompt
   - Includes: Metrics, trends, alerts
   - Format: Natural language for AI

7. **AI Generation**
   - Client: `enhancedAI.generateContent(prompt)`
   - Tries: Primary API key first
   - If fails: Switches to fallback key
   - Returns: AI-generated report text

8. **Report Assembly**
   - Service: Combines metadata + content
   - Includes: AI status, data snapshot
   - Adds: Timestamps, user info

9. **Save Report**
   - Currently: `saveReport()` → File system
   - Should be: MongoDB `ai_reports` collection
   - Stores: Complete report document

10. **Response**
    - Returns: `{ success: true, report: {...} }`
    - Frontend: Displays report
    - User: Can view/download

---

## 🔧 Configuration & Setup

### Getting API Keys:
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key
5. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   GEMINI_FALLBACK_API_KEY=AIzaSy...your_fallback_key_here
   ```

### Testing API Keys:
```bash
# Test primary key
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Monitoring:
```bash
# Check AI system status
curl http://localhost:4001/api/ai-reports/status/ai-system \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🚨 Error Handling

### API Key Errors:
- **Invalid Key**: "API key not valid"
- **Quota Exceeded**: "quota exceeded"
- **Rate Limit**: "429 Too Many Requests"

### Fallback Behavior:
```
Primary fails → Increment counter → Test fallback → Switch if works
```

### User-Facing Errors:
- "AI service rate limit reached"
- "AI service quota exceeded"
- "Failed to generate report"

---

## 📊 Monitoring & Logs

### Console Logs:
```
✅ Primary Gemini AI client initialized
⚠️  GEMINI_FALLBACK_API_KEY not configured
📊 API Request recorded. Recent: 3/8 (1min), 5/15 (1hr)
🔄 Switching to fallback API key...
✅ Successfully switched to fallback API key
```

### Status Endpoint Response:
```json
{
  "success": true,
  "aiSystem": {
    "usingFallback": false,
    "primaryFailures": 0,
    "primaryAvailable": true,
    "fallbackAvailable": true,
    "currentKey": "primary",
    "quota": {
      "totalRequests": 42,
      "recentRequests": 3,
      "hourlyRequests": 8,
      "remainingQuota": 5,
      "quotaResetIn": 45,
      "hourlyResetIn": 2400
    }
  }
}
```

---

## 🔮 Future Improvements

### TODO: MongoDB Integration
Currently reports are saved to file system. Should be updated to:

1. **Update `saveReport()` in `aiReportService.js`:**
```javascript
async saveReport(report) {
  const db = getDB();
  const collection = db.collection('ai_reports');
  await collection.insertOne(report);
}
```

2. **Update `getReportsList()`:**
```javascript
async getReportsList() {
  const db = getDB();
  const collection = db.collection('ai_reports');
  return await collection.find({})
    .sort({ 'metadata.generatedAt': -1 })
    .toArray();
}
```

3. **Update `loadReport()`:**
```javascript
async loadReport(reportId) {
  const db = getDB();
  const collection = db.collection('ai_reports');
  return await collection.findOne({ 'metadata.id': reportId });
}
```

---

## 📝 Summary

**API Key Flow:**
```
.env → aiClient.js → EnhancedAIClient → Gemini API
```

**Data Flow:**
```
PostgreSQL → aiReportService → AI Prompt → Gemini API → Report → MongoDB
```

**Key Components:**
- `aiClient.js` - API key management & fallback
- `aiQuotaMonitor.js` - Rate limiting
- `aiReportService.js` - Report generation
- `aiReports.js` - API endpoints
- MongoDB `ai_reports` - Report storage
