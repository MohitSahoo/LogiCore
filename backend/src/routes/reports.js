import express from 'express';
import { pool } from '../db.js';
import ai from '../aiClient.js';
import { quotaMonitor } from '../aiQuotaMonitor.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

// Simple cache for AI reports (5 minute TTL)
const reportCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const router = express.Router();

// GET /api/reports/inventory - get all products with stock info
router.get('/inventory', optionalAuth, async (req, res, next) => {
  try {
    let query = `SELECT p.*, s.name as supplier_name,
                        CASE WHEN p.stock_quantity <= p.reorder_level THEN true ELSE false END AS is_low_stock
                 FROM products p
                 LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    let params = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    
    query += ` ORDER BY p.id`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/alerts - get low stock alerts
router.get('/alerts', optionalAuth, async (req, res, next) => {
  try {
    let query = `SELECT lsa.*, p.name as product_name, p.sku, p.stock_quantity, p.reorder_level
                 FROM low_stock_alerts lsa
                 JOIN products p ON lsa.product_id = p.id`;
    let params = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    
    query += ` ORDER BY lsa.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/movements - get inventory movements history
router.get('/movements', optionalAuth, async (req, res, next) => {
  try {
    let query = `SELECT im.*, p.name as product_name, p.sku, p.stock_quantity
                 FROM inventory_movements im
                 JOIN products p ON im.product_id = p.id`;
    let params = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    
    query += ` ORDER BY im.created_at DESC LIMIT 100`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/dashboard - comprehensive dashboard metrics
router.get('/dashboard', optionalAuth, async (req, res, next) => {
  try {
    // Build query with user filtering
    let productsQuery = `SELECT p.*, s.name as supplier_name,
                                CASE WHEN p.stock_quantity <= p.reorder_level THEN true ELSE false END AS is_low_stock,
                                CASE WHEN p.stock_quantity > (p.reorder_level * 3) THEN true ELSE false END AS is_overstock
                         FROM products p
                         LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    let productsParams = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      productsQuery += ` WHERE p.user_id = $1`;
      productsParams.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      productsQuery += ` WHERE p.user_id = $1`;
      productsParams.push(req.user.userId);
    }
    
    // Get all products with stock info
    const productsResult = await pool.query(productsQuery, productsParams);
    const products = productsResult.rows;

    // Calculate financial metrics
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (Number(p.stock_quantity) * Number(p.unit_price)),
      0
    );

    // Assuming retail markup of 40% for potential sales value
    const potentialSalesValue = totalInventoryValue * 1.4;

    // Stock health metrics
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.is_low_stock).length;
    const overstockCount = products.filter(p => p.is_overstock).length;
    const healthyStockCount = totalProducts - lowStockCount - overstockCount;

    const stockoutRiskPercent = totalProducts > 0 ? (lowStockCount / totalProducts) * 100 : 0;
    const overstockPercent = totalProducts > 0 ? (overstockCount / totalProducts) * 100 : 0;
    const healthyPercent = totalProducts > 0 ? (healthyStockCount / totalProducts) * 100 : 0;

    // Get inventory movements for turnover calculation (last 90 days) with user filtering
    let movementsQuery = `SELECT SUM(ABS(change_qty)) as total_movement
                          FROM inventory_movements im
                          JOIN products p ON im.product_id = p.id
                          WHERE im.created_at >= NOW() - INTERVAL '90 days'
                          AND im.change_qty < 0`;
    let movementsParams = [];
    
    if (req.user && req.query.user_only === 'true') {
      movementsQuery += ` AND p.user_id = $1`;
      movementsParams.push(req.user.userId);
    } else if (req.user && req.user.role !== 'admin') {
      movementsQuery += ` AND p.user_id = $1`;
      movementsParams.push(req.user.userId);
    }
    
    const movementsResult = await pool.query(movementsQuery, movementsParams);
    const totalMovement = Number(movementsResult.rows[0]?.total_movement || 0);
    const avgInventory = products.reduce((sum, p) => sum + Number(p.stock_quantity), 0) / (totalProducts || 1);
    const inventoryTurnover = avgInventory > 0 ? (totalMovement / avgInventory).toFixed(2) : 0;

    // Get recent orders with user filtering
    let ordersQuery = `SELECT COUNT(*) as total_orders,
                              SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_orders,
                              SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_orders
                       FROM orders`;
    let ordersParams = [];
    
    if (req.user && req.query.user_only === 'true') {
      ordersQuery += ` WHERE user_id = $1`;
      ordersParams.push(req.user.userId);
    } else if (req.user && req.user.role !== 'admin') {
      ordersQuery += ` WHERE user_id = $1`;
      ordersParams.push(req.user.userId);
    }
    
    const ordersResult = await pool.query(ordersQuery, ordersParams);
    const orderStats = ordersResult.rows[0];

    // Get low stock alerts count with user filtering
    let alertsQuery = `SELECT COUNT(*) as alert_count
                       FROM low_stock_alerts lsa
                       JOIN products p ON lsa.product_id = p.id
                       WHERE lsa.created_at >= NOW() - INTERVAL '7 days'`;
    let alertsParams = [];
    
    if (req.user && req.query.user_only === 'true') {
      alertsQuery += ` AND p.user_id = $1`;
      alertsParams.push(req.user.userId);
    } else if (req.user && req.user.role !== 'admin') {
      alertsQuery += ` AND p.user_id = $1`;
      alertsParams.push(req.user.userId);
    }
    
    const alertsResult = await pool.query(alertsQuery, alertsParams);
    const recentAlerts = Number(alertsResult.rows[0]?.alert_count || 0);

    // Calculate stock health status
    let stockHealthStatus = 'good';
    if (stockoutRiskPercent > 30 || overstockPercent > 40) {
      stockHealthStatus = 'critical';
    } else if (stockoutRiskPercent > 15 || overstockPercent > 25) {
      stockHealthStatus = 'warning';
    }

    res.json({
      financial: {
        totalInventoryValue: totalInventoryValue.toFixed(2),
        potentialSalesValue: potentialSalesValue.toFixed(2),
        profitMargin: ((potentialSalesValue - totalInventoryValue) / totalInventoryValue * 100).toFixed(2),
      },
      stockHealth: {
        status: stockHealthStatus,
        healthyPercent: healthyPercent.toFixed(1),
        stockoutRiskPercent: stockoutRiskPercent.toFixed(1),
        overstockPercent: overstockPercent.toFixed(1),
        lowStockCount,
        overstockCount,
        healthyStockCount,
        totalProducts,
      },
      performance: {
        inventoryTurnover,
        totalMovement,
        avgInventory: avgInventory.toFixed(0),
      },
      orders: {
        total: Number(orderStats.total_orders || 0),
        completed: Number(orderStats.completed_orders || 0),
        pending: Number(orderStats.pending_orders || 0),
      },
      alerts: {
        recentCount: recentAlerts,
      },
    });
  } catch (err) {
    next(err);
  }
});


// GET /api/reports/ai-stock?period=daily|weekly|monthly
router.get('/ai-stock', optionalAuth, async (req, res, next) => {
  const period = (req.query.period || 'daily').toLowerCase();

  const allowed = ['daily', 'weekly', 'monthly'];
  const finalPeriod = allowed.includes(period) ? period : 'daily';

  // Create user-specific cache key for data isolation
  const userKey = req.user ? (req.user.role === 'admin' ? 'admin' : req.user.userId) : 'public';
  const cacheKey = `ai-stock-${finalPeriod}-${userKey}`;
  const cached = reportCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`📦 Returning cached AI report for ${finalPeriod} (user: ${userKey})`);
    return res.json(cached.data);
  }

  try {
    // Build query with user filtering for data isolation
    let query = `SELECT p.id, p.name, p.sku, p.unit_price, p.stock_quantity,
                        p.reorder_level,
                        s.name AS supplier_name,
                        CASE WHEN p.stock_quantity <= p.reorder_level THEN true ELSE false END AS is_low_stock
                 FROM products p
                 LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    let params = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      query += ` WHERE p.user_id = $1`;
      params.push(req.user.userId);
    }
    
    query += ` ORDER BY p.stock_quantity ASC`;
    
    const result = await pool.query(query, params);

    const items = result.rows || [];

    // basic metrics to show in UI + give Gemini context
    const totalSkus = items.length;
    const lowStockCount = items.filter((x) => x.is_low_stock).length;
    const totalUnits = items.reduce((sum, x) => sum + Number(x.stock_quantity || 0), 0);
    const totalValue = items.reduce(
      (sum, x) => sum + Number(x.stock_quantity || 0) * Number(x.unit_price || 0),
      0
    );

    const payload = {
      period: finalPeriod,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalSkus,
        lowStockCount,
        totalUnits,
        totalValue,
      },
      items,
    };

    let reportText = '';

    // Check if AI is available
    if (!ai) {
      reportText = `AI Stock Report (${finalPeriod})\n\n` +
        `⚠️ AI features are currently disabled. Please configure GEMINI_API_KEY.\n\n` +
        `Current Metrics:\n` +
        `• Total SKUs: ${totalSkus}\n` +
        `• Low Stock Items: ${lowStockCount}\n` +
        `• Total Units: ${totalUnits}\n` +
        `• Total Value: $${totalValue.toFixed(2)}\n\n` +
        `To enable AI-powered insights:\n` +
        `1. Get a new API key from: https://aistudio.google.com/app/apikey\n` +
        `2. Update GEMINI_API_KEY in backend/.env\n` +
        `3. Restart the server`;
    } else {
      const prompt = `
You are a senior supply-chain analyst.

Using the following JSON inventory snapshot, write a concise ${finalPeriod} stock report for management.

- Start with a short 2–3 line overview.
- Then add bullet points:
  - Inventory health (overstock / balanced / understock)
  - Top 5 low-stock items with SKU and supplier
  - Restocking recommendations (which SKUs to prioritize and why)
  - Any risk flags (e.g. many items near reorder level)

Be concrete and professional. Use simple language, no fluff.

JSON:
${JSON.stringify(payload, null, 2)}
`.trim();

      try {
        // Check quota before making AI request
        if (!quotaMonitor.canMakeRequest()) {
          const stats = quotaMonitor.getStats();
          reportText = `AI Stock Report (${finalPeriod})\n\n` +
            `⚠️ AI quota limit reached. Please wait ${stats.quotaResetIn} seconds.\n\n` +
            `Current Metrics:\n` +
            `• Total SKUs: ${totalSkus}\n` +
            `• Low Stock Items: ${lowStockCount}\n` +
            `• Total Value: $${totalValue.toFixed(2)}`;
        } else {
          // Use lighter model and send only essential data
          const essentialData = {
            period: finalPeriod,
            totalSkus,
            lowStockCount,
            totalValue: totalValue.toFixed(2),
            lowStockItems: items.filter(x => x.is_low_stock).slice(0, 5).map(p => ({
              name: p.name,
              sku: p.sku,
              stock: p.stock_quantity,
              reorder: p.reorder_level,
              supplier: p.supplier_name
            }))
          };

          const shortPrompt = `Supply chain analyst: Write a brief ${finalPeriod} stock report.
Data: ${JSON.stringify(essentialData)}
Format: 2-3 line overview, then bullet points for: health status, top 3 low-stock items, priority restocking.`;

          quotaMonitor.recordRequest();
          const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: shortPrompt,
          });

          reportText = response.text || '';
          console.log(`✅ AI report generated. Quota: ${quotaMonitor.getStats().remainingQuota} remaining`);
        }
      } catch (aiErr) {
        console.error('AI generation failed:', aiErr.message);
        reportText = `AI Stock Report (${finalPeriod})\n\n` +
          `⚠️ AI service temporarily unavailable: ${aiErr.message}\n\n` +
          `Current Metrics:\n` +
          `• Total SKUs: ${totalSkus}\n` +
          `• Low Stock Items: ${lowStockCount}\n` +
          `• Total Units: ${totalUnits}\n` +
          `• Total Value: $${totalValue.toFixed(2)}`;
      }
    }

    const response = {
      period: finalPeriod,
      generatedAt: payload.generatedAt,
      metrics: payload.metrics,
      items,
      report: reportText,
    };

    // Cache the response
    reportCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
