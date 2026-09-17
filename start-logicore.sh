#!/bin/bash

echo "🚀 Starting LogiCore Application"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}1️⃣ Checking PostgreSQL...${NC}"
if psql -U mohitsahoo -d smart_supply_chain -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}   ❌ PostgreSQL is not accessible${NC}"
    echo -e "${YELLOW}   Please start PostgreSQL first${NC}"
    exit 1
fi

# Check if MongoDB is running
echo -e "${BLUE}2️⃣ Checking MongoDB...${NC}"
if mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ MongoDB is running${NC}"
else
    echo -e "${YELLOW}   ⚠️  MongoDB is not running (optional)${NC}"
fi

echo ""
echo -e "${BLUE}3️⃣ Starting Backend Server...${NC}"
cd backend
node src/server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:4001/ > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Backend is running on http://localhost:4001${NC}"
else
    echo -e "${RED}   ❌ Backend failed to start${NC}"
    echo "   Check backend/logs for errors"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${BLUE}4️⃣ Starting Frontend Server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "   Waiting for frontend to start..."
sleep 5

echo ""
echo -e "${GREEN}✅ LogiCore is starting!${NC}"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4001"
echo ""
echo "🔑 Use the administrator credentials configured in the backend environment."
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop
wait
