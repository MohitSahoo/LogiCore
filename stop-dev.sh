#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping LogiCore Development Servers...${NC}"
echo ""

# Kill backend (port 4001)
BACKEND_PID=$(lsof -ti:4001)
if [ ! -z "$BACKEND_PID" ]; then
    kill -9 $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped (was PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend was not running${NC}"
fi

# Kill frontend (port 3000)
FRONTEND_PID=$(lsof -ti:3000)
if [ ! -z "$FRONTEND_PID" ]; then
    kill -9 $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Frontend stopped (was PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend was not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"
