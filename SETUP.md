# 🚀 Complete Setup Guide

This guide will walk you through setting up the Smart Supply Chain system from scratch.

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ PostgreSQL 12+ installed
- ✅ MongoDB 7.0+ installed
- ✅ Git installed
- ✅ A code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-supply-chain.git
cd smart-supply-chain
```

### 2. Install PostgreSQL (if not installed)

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 3. Install MongoDB (if not installed)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download from https://www.mongodb.com/try/download/community

### 4. Set Up PostgreSQL Database

```bash
# Create database
createdb smart_supply_chain

# If you need to create a user first:
# psql postgres
# CREATE USER your_username WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE smart_supply_chain TO your_username;
# \q

# Run schema
psql -d smart_supply_chain -f db/schema.sql

# Run seed data
psql -d smart_supply_chain -f db/seed.sql

# Verify
psql -d smart_supply_chain -c "SELECT COUNT(*) FROM products;"
```

You should see: `count: 9` (or similar)

### 5. Verify MongoDB is Running

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# You should see: { ok: 1 }
```

### 6. Get Google Gemini API Key (Optional)

AI features require a Gemini API key:

1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the generated key

**Note:** AI features are optional. The system works without them, but you won't have:
- Natural language chat
- AI-powered stock forecasts
- Intelligent recommendations

### 7. Configure Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Update `.env` with your credentials:

```env
# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGDATABASE=smart_supply_chain
PGUSER=your_username
PGPASSWORD=your_password

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=smart_supply_chain

# Google Gemini AI (optional)
GEMINI_API_KEY=your_api_key_here

# Server
PORT=4000
```

### 8. Start Backend Server

```bash
# Still in backend directory
npm run dev
```

You should see:
```
API server listening on port 4000
✅ PostgreSQL connected successfully
✅ MongoDB connected successfully
✅ MongoDB indexes created
```

**Troubleshooting:**
- ❌ PostgreSQL connection failed → Check credentials in .env
- ❌ MongoDB connection failed → Ensure MongoDB is running
- ⚠️ GEMINI_API_KEY not configured → AI features disabled (optional)

### 9. Configure Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install
```

### 10. Start Frontend Server

```bash
# Still in frontend directory
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 11. Open the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the Smart Supply Chain dashboard!

## Verify Everything Works

### Test 1: Dashboard
- ✅ Dashboard loads with metrics
- ✅ Financial data displays
- ✅ Stock health shows

### Test 2: Products
- ✅ Click "Products" tab
- ✅ See list of products
- ✅ Try creating a new product
- ✅ Try editing a product

### Test 3: Orders
- ✅ Click "Orders" tab
- ✅ Create a new order
- ✅ Complete an order
- ✅ Verify inventory decreased

### Test 4: Chat (if AI enabled)
- ✅ Click "Chat" tab
- ✅ Ask: "Which products need restocking?"
- ✅ Get a response with data

### Test 5: API Endpoints

Open a new terminal:

```bash
# Test products endpoint
curl http://localhost:4000/api/products | jq

# Test dashboard endpoint
curl http://localhost:4000/api/reports/dashboard | jq

# Test unified endpoint
curl http://localhost:4000/api/unified/dashboard | jq

# Test chat (if AI enabled)
curl -X POST http://localhost:4000/api/unified/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me low stock items", "session_id": "test"}' | jq
```

## Common Issues

### Issue: Port 4000 already in use

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=4001
```

### Issue: Port 5173 already in use

**Solution:**
```bash
# Kill process
lsof -i :5173
kill -9 <PID>

# Or Vite will auto-increment to 5174
```

### Issue: PostgreSQL connection refused

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Check credentials
psql -U your_username -d smart_supply_chain
```

### Issue: MongoDB connection refused

**Solution:**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB
brew services start mongodb-community@7.0  # macOS
sudo systemctl start mongod                # Linux

# Check port
lsof -i :27017
```

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Database schema errors

**Solution:**
```bash
# Drop and recreate database
dropdb smart_supply_chain
createdb smart_supply_chain

# Rerun schema and seed
psql -d smart_supply_chain -f db/schema.sql
psql -d smart_supply_chain -f db/seed.sql
```

## Next Steps

### Development
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Check [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for detailed docs
- Review [ER_DIAGRAM.md](ER_DIAGRAM.md) for database schema

### Production Deployment
- Set up MongoDB Atlas (cloud)
- Configure PostgreSQL backups
- Enable SSL/TLS
- Set up monitoring
- Configure CI/CD

### Customization
- Modify frontend styles in `frontend/src/styles.css`
- Add new API endpoints in `backend/src/routes/`
- Extend database schema in `db/schema.sql`
- Add new components in `frontend/src/components/`

## Support

If you encounter issues:
1. Check this guide
2. Review error messages in terminal
3. Check browser console (F12)
4. Review backend logs
5. Open an issue on GitHub

## Success! 🎉

You now have a fully functional Smart Supply Chain system running locally!

**What you can do:**
- ✅ Manage products and inventory
- ✅ Track suppliers
- ✅ Process orders
- ✅ View real-time dashboard
- ✅ Get low stock alerts
- ✅ Chat with AI (if enabled)
- ✅ View activity logs
- ✅ Analyze trends

Happy supply chain managing! 🚀
