import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'smart_supply_chain';

let client = null;
let db = null;

export async function connectMongoDB() {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      console.log('✅ MongoDB already connected');
      return db;
    }

    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    db = client.db(DB_NAME);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${DB_NAME} | URI: ${MONGODB_URI}`);
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
}

async function createIndexes() {
  try {
    // Activity logs indexes
    await db.collection('activity_logs').createIndex({ timestamp: -1 });
    await db.collection('activity_logs').createIndex({ user_id: 1 });
    await db.collection('activity_logs').createIndex({ entity_type: 1, entity_id: 1 });
    
    // AI insights indexes
    await db.collection('ai_insights').createIndex({ product_id: 1 });
    await db.collection('ai_insights').createIndex({ generated_at: -1 });
    await db.collection('ai_insights').createIndex({ insight_type: 1 });
    
    // Chat queries indexes
    await db.collection('chat_queries').createIndex({ timestamp: -1 });
    await db.collection('chat_queries').createIndex({ user_id: 1 });
    await db.collection('chat_queries').createIndex({ session_id: 1 });
    
    // Analytics snapshots indexes
    await db.collection('analytics_snapshots').createIndex({ snapshot_date: -1 });
    await db.collection('analytics_snapshots').createIndex({ period: 1 });
    
    // System events indexes
    await db.collection('system_events').createIndex({ timestamp: -1 });
    await db.collection('system_events').createIndex({ event_type: 1 });
    await db.collection('system_events').createIndex({ resolved: 1 });
    
    // TTL index for old logs (auto-delete after 90 days)
    await db.collection('activity_logs').createIndex(
      { timestamp: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60 }
    );
    
    console.log('✅ MongoDB indexes created');
  } catch (err) {
    console.error('⚠️  Index creation warning:', err.message);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return db;
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeMongoDB();
  process.exit(0);
});

export default { connectMongoDB, getDB, closeMongoDB };
