# Smart Supply Chain Backend

Node.js + Express backend with hybrid PostgreSQL/MongoDB architecture and Google Gemini AI integration.

## Features

- RESTful API with Express.js
- PostgreSQL for structured data (products, orders, suppliers)
- MongoDB for unstructured data (logs, AI insights, chat)
- Google Gemini AI for natural language processing
- Automated database triggers
- Activity logging
- AI quota management

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- PostgreSQL connection details
- MongoDB URI
- Gemini API key (optional)

### 3. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:4000`

## API Endpoints

### Traditional Endpoints
- `GET/POST/PUT/DELETE /api/products` - Product management
- `GET/POST/PUT/DELETE /api/suppliers` - Supplier management
- `GET/POST/PUT/DELETE /api/orders` - Order management
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/alerts` - Low stock alerts
- `GET /api/reports/movements` - Inventory movements
- `GET /api/reports/ai-stock` - AI stock analysis

### Unified Endpoints (Hybrid)
- `GET /api/unified/dashboard` - Blended PostgreSQL + MongoDB data
- `GET /api/unified/product/:id` - Product with AI insights
- `POST /api/unified/chat` - Natural language queries
- `GET /api/unified/chat/history/:session_id` - Chat history
- `GET /api/unified/analytics` - Historical analytics
- `GET /api/unified/activity` - Activity logs

## Project Structure

```
src/
├── server.js              # Main server
├── db.js                  # PostgreSQL connection
├── mongodb.js             # MongoDB connection
├── aiClient.js            # Gemini AI client
├── aiQuotaMonitor.js      # AI quota management
├── nlpProcessor.js        # Natural language processing
├── dal/                   # Data Access Layer
│   ├── activityLogger.js
│   ├── aiInsights.js
│   ├── chatQueries.js
│   └── analyticsSnapshots.js
└── routes/                # API routes
    ├── products.js
    ├── suppliers.js
    ├── orders.js
    ├── reports.js
    └── unified.js
```

## Database Triggers

PostgreSQL triggers automatically:
- Update inventory on order completion
- Create low stock alerts
- Log inventory movements
- Update timestamps

## AI Features

- Natural language query understanding
- Stock forecasting and recommendations
- Intelligent insights generation
- Quota management (10 req/min)
- Response caching (5 min)

## Testing

```bash
# Test PostgreSQL connection
curl http://localhost:4000/api/products

# Test MongoDB connection
curl http://localhost:4000/api/unified/activity

# Test AI chat
curl -X POST http://localhost:4000/api/unified/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Which products need restocking?", "session_id": "test"}'
```
