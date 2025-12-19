import { getDB } from '../mongodb.js';

export async function logActivity(activityData) {
  try {
    const db = getDB();
    const collection = db.collection('activity_logs');
    
    const log = {
      timestamp: new Date(),
      user_id: activityData.user_id || null,
      user_name: activityData.user_name || 'System',
      action: activityData.action, // CREATE, UPDATE, DELETE, VIEW
      entity_type: activityData.entity_type, // product, order, supplier
      entity_id: activityData.entity_id,
      details: activityData.details || {},
      ip_address: activityData.ip_address || null,
      user_agent: activityData.user_agent || null,
      session_id: activityData.session_id || null,
    };
    
    const result = await collection.insertOne(log);
    console.log(`📝 Activity logged: ${activityData.action} ${activityData.entity_type} #${activityData.entity_id}`);
    
    return result.insertedId;
  } catch (err) {
    console.error('❌ Failed to log activity:', err.message);
    // Don't throw - logging failures shouldn't break the main operation
    return null;
  }
}

export async function getActivityLogs(filters = {}, limit = 100) {
  try {
    const db = getDB();
    const collection = db.collection('activity_logs');
    
    const query = {};
    if (filters.user_id) query.user_id = filters.user_id;
    if (filters.entity_type) query.entity_type = filters.entity_type;
    if (filters.entity_id) query.entity_id = filters.entity_id;
    if (filters.action) query.action = filters.action;
    
    // Date range filter
    if (filters.start_date || filters.end_date) {
      query.timestamp = {};
      if (filters.start_date) query.timestamp.$gte = new Date(filters.start_date);
      if (filters.end_date) query.timestamp.$lte = new Date(filters.end_date);
    }
    
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return logs;
  } catch (err) {
    console.error('❌ Failed to fetch activity logs:', err.message);
    throw err;
  }
}

export async function getActivityStats(entity_type, entity_id) {
  try {
    const db = getDB();
    const collection = db.collection('activity_logs');
    
    const stats = await collection.aggregate([
      {
        $match: {
          entity_type,
          entity_id,
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          last_activity: { $max: '$timestamp' },
        },
      },
    ]).toArray();
    
    return stats;
  } catch (err) {
    console.error('❌ Failed to fetch activity stats:', err.message);
    throw err;
  }
}

export default { logActivity, getActivityLogs, getActivityStats };
