import express from 'express';
import { pool } from '../db.js';
import { getLatestInsight, getAllLatestInsights } from '../dal/aiInsights.js';
import { getActivityLogs } from '../dal/activityLogger.js';
import { saveChatQuery, getChatHistory } from '../dal/chatQueries.js';
import { getLatestSnapshot, getTrends } from '../dal/analyticsSnapshots.js';
import ai from '../aiClient.js';
import { processNaturalLanguage, generateNaturalResponse } from '../nlpProcessor.js';

const router = express.Router();

// GET /api/unified/dashboard - Blended PostgreSQL + MongoDB dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // Parallel queries to both databases
    const [pgDashboard, mongoSnapshot, recentActivity] = await Promise.all([
      // PostgreSQL: Real-time metrics
      query(`
        SELECT p.*, s.name as supplier_name,
               CASE WHEN p.stock_quantity <= p.reorder_level THEN true ELSE false END AS is_low_stock,
               CASE WHEN p.stock_quantity > (p.reorder_level * 3) THEN true ELSE false END AS is_overstock
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
      `).then((result) => result.rows),
      
      // MongoDB: Latest analytics snapshot
      getLatestSnapshot('daily').catch(() => null),
      
      // MongoDB: Recent activity
      getActivityLogs({}, 10).catch(() => []),
    ]);
    
    // Calculate real-time metrics from PostgreSQL
    const products = pgDashboard;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + Number(p.stock_quantity) * Number(p.unit_price),
      0
    );
    const potentialSalesValue = totalInventoryValue * 1.4;
    
    const lowStockCount = products.filter((p) => p.is_low_stock).length;
    const overstockCount = products.filter((p) => p.is_overstock).length;
    const healthyStockCount = products.length - lowStockCount - overstockCount;
    
    const response = {
      realtime: {
        financial: {
          totalInventoryValue: totalInventoryValue.toFixed(2),
          potentialSalesValue: potentialSalesValue.toFixed(2),
          profitMargin: ((potentialSalesValue - totalInventoryValue) / totalInventoryValue * 100).toFixed(2),
        },
        stockHealth: {
          lowStockCount,
          overstockCount,
          healthyStockCount,
          totalProducts: products.length,
        },
      },
      historical: mongoSnapshot ? {
        snapshot_date: mongoSnapshot.snapshot_date,
        period: mongoSnapshot.period,
        metrics: mongoSnapshot.metrics,
      } : null,
      recentActivity: recentActivity.map((log) => ({
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        user_name: log.user_name,
        timestamp: log.timestamp,
      })),
      metadata: {
        query_time_ms: Date.now() - startTime,
        data_sources: ['PostgreSQL', 'MongoDB'],
      },
    };
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/unified/product/:id - Product with AI insights
router.get('/product/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    const startTime = Date.now();
    
    // Parallel queries
    const [productResult, aiInsight, activityStats] = await Promise.all([
      // PostgreSQL: Product details
      query(
        `SELECT p.*, s.name as supplier_name,
                CASE WHEN p.stock_quantity <= p.reorder_level THEN true ELSE false END AS is_low_stock
         FROM products p
         LEFT JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.id = $1`,
        [productId]
      ),
      
      // MongoDB: Latest AI insight
      getLatestInsight(productId, 'forecast').catch(() => null),
      
      // MongoDB: Activity stats
      getActivityLogs({ entity_type: 'product', entity_id: productId }, 5).catch(() => []),
    ]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productResult.rows[0];
    
    const response = {
      product: {
        ...product,
        stock_quantity: Number(product.stock_quantity),
        unit_price: Number(product.unit_price),
        reorder_level: Number(product.reorder_level),
      },
      ai_insight: aiInsight ? {
        generated_at: aiInsight.generated_at,
        forecast: aiInsight.data,
        confidence: aiInsight.data.confidence_score,
      } : null,
      recent_activity: activityStats,
      metadata: {
        query_time_ms: Date.now() - startTime,
      },
    };
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/unified/chat - Natural language query with AI-powered NLP
router.post('/chat', async (req, res, next) => {
  try {
    const { query: userQuery, session_id } = req.body;
    const startTime = Date.now();
    
    if (!userQuery) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Use AI-powered NLP to extract intent and parameters
    console.log(`\n💬 Processing query: "${userQuery}"`);
    const nlpResult = await processNaturalLanguage(userQuery);
    
    const intent = nlpResult.intent;
    const parameters = nlpResult.parameters;
    const confidence = nlpResult.confidence;
    
    console.log(`🎯 Intent: ${intent} (${nlpResult.method}, confidence: ${confidence})`);
    if (Object.keys(parameters).some(k => parameters[k])) {
      console.log(`📋 Parameters:`, parameters);
    }
    
    let responseText = '';
    let responseData = null;
    
    // Handle different intents
    if (intent === 'inventory_check') {
      // Query PostgreSQL for low stock products
      let sqlQuery = `
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= p.reorder_level
      `;
      
      // Add filters based on extracted parameters
      let params = [];
      if (parameters.product_name) {
        params.push(`%${parameters.product_name}%`);
        sqlQuery += ` AND p.name ILIKE $${params.length}`;
      }
      if (parameters.sku) {
        params.push(parameters.sku);
        sqlQuery += ` AND p.sku = $${params.length}`;
      }
      
      sqlQuery += ` ORDER BY p.stock_quantity ASC`;
      
      const result = await pool.query(sqlQuery, params.length > 0 ? params : undefined);
      const lowStockProducts = result.rows;
      responseData = lowStockProducts;
      
      // Try to generate AI response
      const aiResponse = await generateNaturalResponse(intent, lowStockProducts, userQuery);
      
      if (aiResponse) {
        responseText = aiResponse;
      } else if (lowStockProducts.length === 0) {
        responseText = 'Great news! All products are currently well-stocked. No items need restocking at this time.';
      } else {
        responseText = `I found ${lowStockProducts.length} product(s) that need restocking:\n\n`;
        lowStockProducts.slice(0, 5).forEach((p) => {
          responseText += `• ${p.name} (${p.sku}): ${p.stock_quantity} units (reorder at ${p.reorder_level})\n`;
        });
        if (lowStockProducts.length > 5) {
          responseText += `\n...and ${lowStockProducts.length - 5} more products.`;
        }
      }
    } else if (intent === 'order_status') {
      
      const result = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        GROUP BY status
      `);
      
      responseData = result.rows;
      responseText = 'Here\'s the current order status summary:\n\n';
      result.rows.forEach((row) => {
        responseText += `• ${row.status}: ${row.count} order(s)\n`;
      });
    } else if (userQuery.toLowerCase().includes('forecast') || userQuery.toLowerCase().includes('predict')) {
      intent = 'forecast';
      
      // Get AI insights from MongoDB
      const insights = await getAllLatestInsights('forecast');
      responseData = insights;
      
      if (insights.length === 0) {
        responseText = 'No AI forecasts are currently available. Forecasts are generated periodically based on historical data.';
      } else {
        responseText = `I have AI-powered forecasts for ${insights.length} products. Here are the top recommendations:\n\n`;
        insights.slice(0, 3).forEach((insight) => {
          responseText += `• Product #${insight.product_id} (${insight.product_sku}):\n`;
          responseText += `  Predicted demand: ${insight.data.predicted_demand || 'N/A'}\n`;
          responseText += `  Recommendation: ${insight.data.reasoning || 'N/A'}\n\n`;
        });
      }
    } else {
      // General query - use AI to generate response
      if (!ai) {
        responseText = '⚠️ AI features are currently disabled.\n\nI can help you with:\n• Checking low stock items (ask "which products need restocking?")\n• Order status (ask "what is the order status?")\n• Inventory forecasts\n\nPlease configure GEMINI_API_KEY to enable full AI capabilities.';
      } else {
        // Use lighter model with shorter prompt
        const shortPrompt = `Supply chain assistant. Answer briefly: ${userQuery.substring(0, 100)}`;
        
        try {
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: shortPrompt,
          });
          responseText = aiResponse.text || 'I\'m not sure how to answer that. Please try asking about inventory, orders, or forecasts.';
        } catch (aiErr) {
          console.error('AI error:', aiErr.message);
          responseText = 'I can help you with:\n• Checking low stock items\n• Order status\n• AI forecasts\n\nPlease ask me about these topics!';
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save to MongoDB
    const chatId = await saveChatQuery({
      session_id: session_id || 'default',
      user_id: req.body.user_id || null,
      query: userQuery,
      intent,
      response_text: responseText,
      response_data: responseData,
      sources: ['PostgreSQL', 'MongoDB', 'AI'],
      processing_time_ms: processingTime,
    });
    
    res.json({
      chat_id: chatId,
      query: userQuery,
      intent,
      response: responseText,
      data: responseData,
      processing_time_ms: processingTime,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/unified/chat/history/:session_id - Get chat history
router.get('/chat/history/:session_id', async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const history = await getChatHistory(session_id, limit);
    
    res.json({
      session_id,
      count: history.length,
      history: history.map((chat) => ({
        id: chat._id,
        query: chat.query,
        response: chat.response.text,
        timestamp: chat.timestamp,
        intent: chat.intent,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/unified/analytics - Historical analytics with trends
router.get('/analytics', async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const days = parseInt(req.query.days) || 30;
    
    const [latestSnapshot, inventoryTrend, ordersTrend] = await Promise.all([
      getLatestSnapshot(period),
      getTrends('financial.totalInventoryValue', period, days),
      getTrends('orders.total', period, days),
    ]);
    
    res.json({
      latest: latestSnapshot,
      trends: {
        inventory_value: inventoryTrend,
        orders: ordersTrend,
      },
      period,
      days,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/unified/activity - Recent activity logs
router.get('/activity', async (req, res, next) => {
  try {
    const filters = {
      entity_type: req.query.entity_type,
      entity_id: req.query.entity_id ? parseInt(req.query.entity_id) : undefined,
      action: req.query.action,
    };
    
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await getActivityLogs(filters, limit);
    
    res.json({
      count: logs.length,
      logs: logs.map((log) => ({
        id: log._id,
        timestamp: log.timestamp,
        user_name: log.user_name,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: log.details,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
