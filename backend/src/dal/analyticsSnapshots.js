import { getDB } from '../mongodb.js';

export async function saveAnalyticsSnapshot(snapshotData) {
  try {
    const db = getDB();
    const collection = db.collection('analytics_snapshots');
    
    const snapshot = {
      snapshot_date: new Date(),
      period: snapshotData.period, // daily, weekly, monthly
      metrics: snapshotData.metrics,
      top_products: snapshotData.top_products || [],
      alerts_summary: snapshotData.alerts_summary || {},
      trends: snapshotData.trends || {},
    };
    
    const result = await collection.insertOne(snapshot);
    console.log(`📸 Analytics snapshot saved: ${snapshotData.period}`);
    
    return result.insertedId;
  } catch (err) {
    console.error('❌ Failed to save analytics snapshot:', err.message);
    throw err;
  }
}

export async function getLatestSnapshot(period = 'daily') {
  try {
    const db = getDB();
    const collection = db.collection('analytics_snapshots');
    
    const snapshot = await collection
      .findOne({ period }, { sort: { snapshot_date: -1 } });
    
    return snapshot;
  } catch (err) {
    console.error('❌ Failed to fetch latest snapshot:', err.message);
    throw err;
  }
}

export async function getSnapshotHistory(period, days = 30) {
  try {
    const db = getDB();
    const collection = db.collection('analytics_snapshots');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshots = await collection
      .find({
        period,
        snapshot_date: { $gte: startDate },
      })
      .sort({ snapshot_date: -1 })
      .toArray();
    
    return snapshots;
  } catch (err) {
    console.error('❌ Failed to fetch snapshot history:', err.message);
    throw err;
  }
}

export async function getTrends(metric_path, period = 'daily', days = 30) {
  try {
    const db = getDB();
    const collection = db.collection('analytics_snapshots');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshots = await collection
      .find({
        period,
        snapshot_date: { $gte: startDate },
      })
      .sort({ snapshot_date: 1 })
      .toArray();
    
    // Extract the specific metric from each snapshot
    const trends = snapshots.map((snapshot) => {
      const value = metric_path.split('.').reduce((obj, key) => obj?.[key], snapshot.metrics);
      return {
        date: snapshot.snapshot_date,
        value,
      };
    });
    
    return trends;
  } catch (err) {
    console.error('❌ Failed to fetch trends:', err.message);
    throw err;
  }
}

export default {
  saveAnalyticsSnapshot,
  getLatestSnapshot,
  getSnapshotHistory,
  getTrends,
};
