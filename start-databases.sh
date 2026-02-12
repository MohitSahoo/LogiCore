#!/bin/bash

echo "🚀 Starting Database Services for LogiCore"
echo "=========================================="
echo ""

# Start PostgreSQL
echo "1️⃣ Starting PostgreSQL..."
brew services start postgresql@14

# Wait a moment for PostgreSQL to start
sleep 2

# Check PostgreSQL status
if brew services list | grep postgresql@14 | grep started > /dev/null; then
    echo "   ✅ PostgreSQL is running"
else
    echo "   ❌ PostgreSQL failed to start"
fi

echo ""

# Check MongoDB status
echo "2️⃣ Checking MongoDB..."
if brew services list | grep mongodb-community | grep started > /dev/null; then
    echo "   ✅ MongoDB is already running"
else
    echo "   🔄 Starting MongoDB..."
    brew services start mongodb-community@7.0
    sleep 2
    if brew services list | grep mongodb-community | grep started > /dev/null; then
        echo "   ✅ MongoDB is now running"
    else
        echo "   ❌ MongoDB failed to start"
    fi
fi

echo ""
echo "=========================================="
echo "📊 Database Status:"
echo ""
brew services list | grep -E "(postgresql|mongodb)"
echo ""

# Test PostgreSQL connection
echo "🧪 Testing PostgreSQL connection..."
if psql -U mohitsahoo -d smart_supply_chain -c "SELECT 'PostgreSQL is working!' as status;" 2>/dev/null; then
    echo "   ✅ PostgreSQL connection successful"
else
    echo "   ⚠️  PostgreSQL connection failed"
    echo "   Run: psql -U mohitsahoo -d postgres"
    echo "   Then: CREATE DATABASE smart_supply_chain;"
fi

echo ""

# Test MongoDB connection
echo "🧪 Testing MongoDB connection..."
if mongosh --eval "db.version()" --quiet 2>/dev/null; then
    echo "   ✅ MongoDB connection successful"
else
    echo "   ⚠️  MongoDB connection test skipped (mongosh not found)"
fi

echo ""
echo "✅ Database startup complete!"
echo ""
echo "To stop databases, run:"
echo "  brew services stop postgresql@14"
echo "  brew services stop mongodb-community@7.0"
