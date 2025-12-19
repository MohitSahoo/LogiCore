import { getDB } from '../mongodb.js';

export async function saveAIInsight(insightData) {
  try {
    const db = getDB();
    const collection = db.collection('ai_insights');
    
    const insight = {
      product_id: insightData.product_id,
      product_sku: insightData.product_sku,
      insight_type: insightData.insight_type, // forecast, recommendation, risk_analysis
      generated_at: new Date(),
      period: insightData.period || 'daily',
      data: insightData.data,
      model_version: insightData.model_version || 'gemini-2.5-flash',
      metadata: {
        processing_time_ms: insightData.processing_time_ms || 0,
        data_points_used: insightData.data_points_used || 0,
      },
    };
    
    const result = await collection.insertOne(insight);
    console.log(`🤖 AI Insight saved: ${insightData.insight_type} for product #${insightData.product_id}`);
    
    return result.insertedId;
  } catch (err) {
    console.error('❌ Failed to save AI insight:', err.message);
    throw err;
  }
}

export async function getLatestInsight(product_id, insight_type = null) {
  try {
    const db = getDB();
    const collection = db.collection('ai_insights');
    
    const query = { product_id };
    if (insight_type) query.insight_type = insight_type;
    
    const insight = await collection
      .findOne(query, { sort: { generated_at: -1 } });
    
    return insight;
  } catch (err) {
    console.error('❌ Failed to fetch AI insight:', err.message);
    throw err;
  }
}

export async function getInsightHistory(product_id, limit = 10) {
  try {
    const db = getDB();
    const collection = db.collection('ai_insights');
    
    const insights = await collection
      .find({ product_id })
      .sort({ generated_at: -1 })
      .limit(limit)
      .toArray();
    
    return insights;
  } catch (err) {
    console.error('❌ Failed to fetch insight history:', err.message);
    throw err;
  }
}

export async function getAllLatestInsights(insight_type = 'forecast') {
  try {
    const db = getDB();
    const collection = db.collection('ai_insights');
    
    // Get the latest insight for each product
    const insights = await collection.aggregate([
      {
        $match: { insight_type },
      },
      {
        $sort: { generated_at: -1 },
      },
      {
        $group: {
          _id: '$product_id',
          latest: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: { newRoot: '$latest' },
      },
    ]).toArray();
    
    return insights;
  } catch (err) {
    console.error('❌ Failed to fetch all latest insights:', err.message);
    throw err;
  }
}

export default {
  saveAIInsight,
  getLatestInsight,
  getInsightHistory,
  getAllLatestInsights,
};
