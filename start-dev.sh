#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     LogiCore Development Startup      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd frontend && pnpm install && cd ..
fi

# Kill any existing processes on ports 3000 and 4001
echo -e "${YELLOW}🔍 Checking for existing processes...${NC}"
lsof -ti:4001 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Killed process on port 4001${NC}" || echo -e "${GREEN}✓ Port 4001 is free${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Killed process on port 3000${NC}" || echo -e "${GREEN}✓ Port 3000 is free${NC}"
echo ""

# Start backend
echo -e "${BLUE}🚀 Starting Backend Server (Port 4001)...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "   Logs: tail -f backend.log"
echo ""

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}🚀 Starting Frontend Server (Port 3000)...${NC}"
cd frontend
pnpm dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "   Logs: tail -f frontend.log"
echo ""

# Wait for servers to be ready
echo -e "${YELLOW}⏳ Waiting for servers to be ready...${NC}"
sleep 3

# Check if servers are running
BACKEND_RUNNING=$(lsof -ti:4001)
FRONTEND_RUNNING=$(lsof -ti:3000)

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Server Status                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

if [ ! -z "$BACKEND_RUNNING" ]; then
    echo -e "${GREEN}✅ Backend:  http://localhost:4001${NC}"
else
    echo -e "${RED}❌ Backend:  Failed to start${NC}"
    echo -e "   Check backend.log for errors"
fi

if [ ! -z "$FRONTEND_RUNNING" ]; then
    echo -e "${GREEN}✅ Frontend: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend: Failed to start${NC}"
    echo -e "   Check frontend.log for errors"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Useful Commands               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo -e "  View backend logs:  ${YELLOW}tail -f backend.log${NC}"
echo -e "  View frontend logs: ${YELLOW}tail -f frontend.log${NC}"
echo -e "  Stop all servers:   ${YELLOW}./stop-dev.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${GREEN}   Open http://localhost:3000 in your browser${NC}"
echo ""
