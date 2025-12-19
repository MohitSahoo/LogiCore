import { getDB } from '../mongodb.js';

export async function saveChatQuery(queryData) {
  try {
    const db = getDB();
    const collection = db.collection('chat_queries');
    
    const chat = {
      session_id: queryData.session_id,
      user_id: queryData.user_id || null,
      timestamp: new Date(),
      query: queryData.query,
      intent: queryData.intent || 'general',
      response: {
        text: queryData.response_text,
        data: queryData.response_data || null,
        sources: queryData.sources || [],
      },
      context: queryData.context || {},
      processing_time_ms: queryData.processing_time_ms || 0,
    };
    
    const result = await collection.insertOne(chat);
    console.log(`💬 Chat query saved: "${queryData.query.substring(0, 50)}..."`);
    
    return result.insertedId;
  } catch (err) {
    console.error('❌ Failed to save chat query:', err.message);
    throw err;
  }
}

export async function getChatHistory(session_id, limit = 20) {
  try {
    const db = getDB();
    const collection = db.collection('chat_queries');
    
    const history = await collection
      .find({ session_id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return history.reverse(); // Return in chronological order
  } catch (err) {
    console.error('❌ Failed to fetch chat history:', err.message);
    throw err;
  }
}

export async function updateChatFeedback(chat_id, feedback) {
  try {
    const db = getDB();
    const collection = db.collection('chat_queries');
    const { ObjectId } = await import('mongodb');
    
    const result = await collection.updateOne(
      { _id: new ObjectId(chat_id) },
      {
        $set: {
          feedback: {
            helpful: feedback.helpful,
            rating: feedback.rating || null,
            comment: feedback.comment || null,
            timestamp: new Date(),
          },
        },
      }
    );
    
    console.log(`👍 Chat feedback updated for ${chat_id}`);
    return result.modifiedCount > 0;
  } catch (err) {
    console.error('❌ Failed to update chat feedback:', err.message);
    throw err;
  }
}

export async function getPopularQueries(limit = 10) {
  try {
    const db = getDB();
    const collection = db.collection('chat_queries');
    
    const popular = await collection.aggregate([
      {
        $group: {
          _id: '$intent',
          count: { $sum: 1 },
          sample_query: { $first: '$query' },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ]).toArray();
    
    return popular;
  } catch (err) {
    console.error('❌ Failed to fetch popular queries:', err.message);
    throw err;
  }
}

export default {
  saveChatQuery,
  getChatHistory,
  updateChatFeedback,
  getPopularQueries,
};
