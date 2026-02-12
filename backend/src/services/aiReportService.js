import enhancedAI from '../aiClient.js';
import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { quotaMonitor } from '../aiQuotaMonitor.js';

class AIReportService {
  constructor() {
    this.aiClient = enhancedAI;
    
    // Cache for recent data to avoid duplicate database queries
    this.dataCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    
    // Rate limiting for API calls
    this.lastApiCall = 0;
    this.minApiInterval = 10000; // 10 seconds between API calls
  }

  // Get comprehensive data for report generation with caching
  async getReportData(startDate, endDate, userId = null) {
    try {
      // Create cache key based on date range AND userId for proper isolation
      const cacheKey = `${startDate}_${endDate}_${userId || 'all'}`;
      const cached = this.dataCache.get(cacheKey);
      
      // Return cached data if still valid
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('📦 Using cached report data');
        return cached.data;
      }

      console.log(`🔄 Fetching fresh report data from database${userId ? ` for user ${userId}` : ' for ALL USERS (admin view)'}`);

      // Build WHERE clause for user isolation
      const userFilter = userId ? 'WHERE p.user_id = $userIdParam' : '';
      const userFilterOrders = userId ? 'AND o.user_id = $userIdParam' : '';
      const userFilterSuppliers = userId ? 'WHERE s.user_id = $userIdParam' : '';
      
      console.log(`📋 Query filters: ${userId ? 'FILTERED by user ' + userId : 'NO FILTER - showing all data'}`);
      
      const queries = {
        // Current inventory snapshot - filtered by user
        currentInventory: `
          SELECT p.*, s.name as supplier_name,
                 (p.stock_quantity * p.unit_price) as total_value,
                 CASE 
                   WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
                   WHEN p.stock_quantity <= p.reorder_level THEN 'LOW_STOCK'
                   WHEN p.stock_quantity > p.reorder_level * 3 THEN 'OVERSTOCK'
                   ELSE 'NORMAL'
                 END as stock_status
          FROM products p 
          LEFT JOIN suppliers s ON p.supplier_id = s.id 
          ${userFilter}
          ORDER BY total_value DESC
        `,
        
        // Inventory summary - filtered by user
        inventorySummary: `
          SELECT 
            COUNT(*) as total_products,
            SUM(stock_quantity * unit_price) as total_inventory_value,
            AVG(unit_price) as average_price,
            SUM(stock_quantity) as total_units,
            COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count,
            COUNT(CASE WHEN stock_quantity <= reorder_level THEN 1 END) as low_stock_count,
            COUNT(CASE WHEN stock_quantity > reorder_level * 3 THEN 1 END) as overstock_count
          FROM products p
          ${userFilter}
        `,
        
        // Orders in period - filtered by user
        ordersInPeriod: `
          SELECT o.*, 
                 COUNT(oi.id) as item_count,
                 SUM(oi.quantity * oi.unit_price) as total_amount,
                 DATE(o.created_at) as order_date
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.created_at >= $1 AND o.created_at <= $2 ${userFilterOrders}
          GROUP BY o.id, o.order_number, o.customer_name, o.status, o.created_at
          ORDER BY o.created_at DESC
        `,
        
        // Top selling products (based on orders) - filtered by user
        topSellingProducts: `
          SELECT p.name, p.sku, 
                 SUM(oi.quantity) as total_sold,
                 SUM(oi.quantity * oi.unit_price) as total_revenue,
                 COUNT(DISTINCT o.id) as order_count
          FROM products p
          JOIN order_items oi ON p.id = oi.product_id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= $1 AND o.created_at <= $2 ${userFilterOrders}
          GROUP BY p.id, p.name, p.sku
          ORDER BY total_sold DESC
          LIMIT 10
        `,
        
        // Supplier performance - filtered by user
        supplierPerformance: `
          SELECT s.name, s.contact_email,
                 COUNT(p.id) as product_count,
                 SUM(p.stock_quantity * p.unit_price) as total_value,
                 COUNT(CASE WHEN p.stock_quantity <= p.reorder_level THEN 1 END) as low_stock_products,
                 AVG(p.unit_price) as avg_product_price
          FROM suppliers s
          LEFT JOIN products p ON s.id = p.supplier_id ${userId ? 'AND p.user_id = $userIdParam' : ''}
          ${userFilterSuppliers}
          GROUP BY s.id, s.name, s.contact_email
          ORDER BY total_value DESC
        `,
        
        // Stock alerts - filtered by user
        stockAlerts: `
          SELECT p.name, p.sku, p.stock_quantity, p.reorder_level,
                 s.name as supplier_name, s.contact_email,
                 (p.reorder_level - p.stock_quantity) as units_needed,
                 (p.reorder_level - p.stock_quantity) * p.unit_price as reorder_cost
          FROM products p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE p.stock_quantity <= p.reorder_level ${userId ? 'AND p.user_id = $userIdParam' : ''}
          ORDER BY units_needed DESC
        `
      };

      const results = {};
      
      // Execute queries with user isolation
      for (const [key, query] of Object.entries(queries)) {
        // Replace placeholder with actual parameter number
        let finalQuery = query;
        let params = [];
        
        if (key === 'ordersInPeriod' || key === 'topSellingProducts') {
          params = [startDate, endDate];
          if (userId) {
            finalQuery = finalQuery.replace(/\$userIdParam/g, '$3');
            params.push(userId);
          }
        } else {
          if (userId) {
            finalQuery = finalQuery.replace(/\$userIdParam/g, '$1');
            params = [userId];
          }
        }
        
        const result = await pool.query(finalQuery, params);
        results[key] = result.rows;
      }

      // Cache the results
      this.dataCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
      
      // Log summary of fetched data
      console.log(`✅ Report data fetched: ${results.currentInventory?.length || 0} products, ${results.ordersInPeriod?.length || 0} orders, ${results.stockAlerts?.length || 0} alerts`);

      // Clean old cache entries
      this.cleanCache();

      return results;
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  }

  // Clean expired cache entries
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.dataCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.dataCache.delete(key);
      }
    }
  }

  // Generate AI-powered report with enhanced data analysis
  async generateReport(reportType, startDate, endDate, userId = 'system') {
    try {
      // Enhanced quota checking with better error messages
      if (!quotaMonitor.canMakeRequest()) {
        const stats = quotaMonitor.getStats();
        throw new Error(`AI service rate limit reached. ${stats.remainingQuota} requests remaining. Please wait ${stats.quotaResetIn} seconds before trying again.`);
      }

      // Rate limiting: ensure minimum interval between API calls
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      if (timeSinceLastCall < this.minApiInterval) {
        const waitTime = this.minApiInterval - timeSinceLastCall;
        console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const data = await this.getReportData(startDate, endDate, userId);
      const reportPeriod = reportType === 'weekly' ? 'Weekly' : 'Monthly';
      
      // Enhanced data analysis
      const analysis = this.performDataAnalysis(data, reportType);
      
      // Enhanced prompt with natural conversation style
      const prompt = `You are an expert inventory analyst. Generate a comprehensive ${reportPeriod} inventory report for ${startDate} to ${endDate}.

Here's the current situation:

INVENTORY OVERVIEW:
We have ${analysis.summary.totalProducts} products worth $${analysis.summary.totalValue.toLocaleString()} total (${analysis.summary.totalUnits} units, avg $${analysis.summary.avgPrice} per unit).

STOCK STATUS BREAKDOWN:
- ${analysis.stockStatus.overstock} products (${analysis.stockStatus.overstockPercent}%) are overstocked
- ${analysis.stockStatus.lowStock} products (${analysis.stockStatus.lowStockPercent}%) are running low
- ${analysis.stockStatus.outOfStock} products are completely out of stock
- Only ${analysis.stockStatus.normal} products (${analysis.stockStatus.normalPercent}%) have optimal stock levels

TOP VALUE PRODUCTS:
${analysis.topProducts.slice(0, 3).map(p => `• ${p.name}: ${p.stock_quantity} units @ $${parseFloat(p.unit_price).toFixed(2)} each (Total: $${parseFloat(p.total_value).toLocaleString()}) - ${p.stock_status}`).join('\n')}

URGENT ALERTS:
${analysis.criticalAlerts.length > 0 ? analysis.criticalAlerts.map(a => `• ${a.name} critically low: only ${a.stock_quantity} left (need ${a.units_needed} more, costs $${parseFloat(a.reorder_cost).toFixed(2)})`).join('\n') : 'No critical stock alerts'}

BUSINESS ACTIVITY:
${analysis.periodActivity.totalOrders} orders this period worth $${analysis.periodActivity.totalOrderValue.toLocaleString()}. ${analysis.periodActivity.topSelling !== 'None' ? `Top seller: ${analysis.periodActivity.topSelling}` : 'No sales recorded'}

FINANCIAL IMPACT:
$${analysis.financial.capitalTiedUp.toLocaleString()} tied up in excess inventory (${analysis.financial.turnoverRisk.toLowerCase()} turnover risk). Need $${analysis.financial.reorderInvestment.toLocaleString()} for urgent reorders.

Write a professional but conversational business report that:
1. Summarizes the overall inventory health and key concerns
2. Highlights the most important issues that need immediate attention
3. Explains what the stock distribution means for the business
4. Provides specific, actionable recommendations with clear priorities
5. Discusses financial implications and cash flow impact

Keep it under 500 words, focus on insights that help make business decisions, and write in a clear, professional tone that a business manager would appreciate.`;

      // Record the request
      quotaMonitor.recordRequest();
      this.lastApiCall = Date.now();
      
      // Reduced delay for better user experience
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate response with enhanced AI client and fallback support
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // Use the enhanced AI client with automatic fallback
        const result = await this.aiClient.generateContent(prompt, {
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 0.9,
            maxOutputTokens: 2000,
          }
        });
        
        clearTimeout(timeoutId);
        
        const reportContent = result.response.text();
        const aiStatus = this.aiClient.getStatus();

        console.log(`✅ Enhanced AI Report generated (${reportContent.length} chars, using ${aiStatus.currentKey} key)`);

        // Create enhanced report metadata
        const reportMetadata = {
          id: `${reportType}_ai_${Date.now()}`,
          type: reportType,
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          userId: userId, // Track which user generated this report
          aiStatus: {
            keyUsed: aiStatus.currentKey,
            usingFallback: aiStatus.usingFallback,
            primaryFailures: aiStatus.primaryFailures
          },
          dataSnapshot: {
            totalProducts: analysis.summary.totalProducts,
            totalValue: analysis.summary.totalValue,
            totalUnits: analysis.summary.totalUnits,
            ordersInPeriod: analysis.periodActivity.totalOrders,
            criticalAlerts: analysis.criticalAlerts.length,
            stockHealth: {
              normal: analysis.stockStatus.normal,
              lowStock: analysis.stockStatus.lowStock,
              outOfStock: analysis.stockStatus.outOfStock,
              overstock: analysis.stockStatus.overstock
            }
          },
          analysis: {
            stockDistribution: analysis.stockStatus,
            financialMetrics: analysis.financial,
            topPerformers: analysis.topProducts.slice(0, 3),
            criticalItems: analysis.criticalAlerts.length
          },
          optimizations: {
            promptTokensUsed: prompt.length,
            analysisDepth: Object.keys(analysis).length,
            cacheUsed: this.dataCache.has(`${startDate}_${endDate}`),
            generationTime: Date.now() - this.lastApiCall
          }
        };

        return {
          success: true,
          report: {
            metadata: reportMetadata,
            content: reportContent,
            rawData: data,
            analysis: analysis
          }
        };

      } catch (aiError) {
        clearTimeout(timeoutId);
        
        // Get AI client status for better error reporting
        const aiStatus = this.aiClient.getStatus();
        
        // Handle specific API errors with better messages
        if (aiError.message && aiError.message.includes('quota')) {
          console.error('AI quota exceeded:', aiError.message);
          throw new Error(`AI service quota exceeded (${aiStatus.currentKey} key). Please try again later or check your API billing.`);
        } else if (aiError.message && aiError.message.includes('429')) {
          console.error('AI rate limit exceeded:', aiError.message);
          throw new Error(`AI service rate limit exceeded (${aiStatus.currentKey} key). Please wait a moment and try again.`);
        } else if (aiError.message && aiError.message.includes('404')) {
          console.error('AI model not found:', aiError.message);
          throw new Error('AI model not available. Please contact support.');
        } else {
          console.error('AI generation failed:', aiError.message);
          console.error('AI Status:', aiStatus);
          throw new Error(`AI generation failed with ${aiStatus.currentKey} key: ${aiError.message}`);
        }
      }

    } catch (error) {
      console.error('AI Report Generation Error:', error);
      
      // Re-throw with more specific error message
      if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('model not available')) {
        throw error; // Already has a user-friendly message
      } else {
        throw new Error('Failed to generate AI report. Please check your internet connection and try again.');
      }
    }
  }

  // Perform comprehensive data analysis
  performDataAnalysis(data, reportType) {
    const summary = data.inventorySummary[0] || {};
    const products = data.currentInventory || [];
    const alerts = data.stockAlerts || [];
    const orders = data.ordersInPeriod || [];
    const topSelling = data.topSellingProducts || [];
    const suppliers = data.supplierPerformance || [];

    // Basic metrics
    const totalProducts = parseInt(summary.total_products) || 0;
    const totalValue = parseFloat(summary.total_inventory_value) || 0;
    const totalUnits = parseInt(summary.total_units) || 0;
    const avgPrice = totalProducts > 0 ? totalValue / totalUnits : 0;

    // Stock status analysis
    const stockStatus = {
      normal: products.filter(p => p.stock_status === 'NORMAL').length,
      lowStock: products.filter(p => p.stock_status === 'LOW_STOCK').length,
      outOfStock: products.filter(p => p.stock_status === 'OUT_OF_STOCK').length,
      overstock: products.filter(p => p.stock_status === 'OVERSTOCK').length
    };

    // Calculate percentages
    stockStatus.normalPercent = totalProducts > 0 ? Math.round((stockStatus.normal / totalProducts) * 100) : 0;
    stockStatus.lowStockPercent = totalProducts > 0 ? Math.round((stockStatus.lowStock / totalProducts) * 100) : 0;
    stockStatus.outOfStockPercent = totalProducts > 0 ? Math.round((stockStatus.outOfStock / totalProducts) * 100) : 0;
    stockStatus.overstockPercent = totalProducts > 0 ? Math.round((stockStatus.overstock / totalProducts) * 100) : 0;

    // Top products by value
    const topProducts = products
      .sort((a, b) => parseFloat(b.total_value) - parseFloat(a.total_value))
      .slice(0, 5);

    // Critical alerts (sorted by urgency)
    const criticalAlerts = alerts
      .sort((a, b) => parseInt(b.units_needed) - parseInt(a.units_needed))
      .slice(0, 5);

    // Top suppliers by portfolio value
    const topSuppliers = suppliers
      .sort((a, b) => parseFloat(b.total_value || 0) - parseFloat(a.total_value || 0))
      .slice(0, 5);

    // Period activity analysis
    const totalOrderValue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const topSellingProduct = topSelling.length > 0 ? topSelling[0].name : 'None';

    // Financial analysis
    const overstockValue = products
      .filter(p => p.stock_status === 'OVERSTOCK')
      .reduce((sum, p) => sum + parseFloat(p.total_value), 0);
    
    const reorderInvestment = alerts
      .reduce((sum, alert) => sum + parseFloat(alert.reorder_cost || 0), 0);

    const turnoverRisk = stockStatus.overstockPercent > 50 ? 'High' : 
                        stockStatus.overstockPercent > 25 ? 'Medium' : 'Low';

    return {
      summary: {
        totalProducts,
        totalValue,
        totalUnits,
        avgPrice: Math.round(avgPrice * 100) / 100
      },
      stockStatus,
      topProducts,
      criticalAlerts,
      topSuppliers,
      periodActivity: {
        totalOrders: orders.length,
        totalOrderValue,
        topSelling: topSellingProduct
      },
      financial: {
        turnoverRisk,
        capitalTiedUp: overstockValue,
        reorderInvestment
      }
    };
  }

  // Save report to file system
  async saveReport(report) {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `${report.metadata.id}.json`;
      const filepath = path.join(reportsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      
      return {
        success: true,
        filepath,
        filename
      };
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  // Get list of generated reports
  async getReportsList() {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        return [];
      }

      const files = fs.readdirSync(reportsDir);
      const reports = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filepath = path.join(reportsDir, file);
            const reportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            reports.push({
              filename: file,
              metadata: reportData.metadata,
              size: fs.statSync(filepath).size
            });
          } catch (error) {
            console.error(`Error reading report file ${file}:`, error);
          }
        }
      }

      return reports.sort((a, b) => new Date(b.metadata.generatedAt) - new Date(a.metadata.generatedAt));
    } catch (error) {
      console.error('Error getting reports list:', error);
      throw error;
    }
  }

  // Load specific report
  async loadReport(reportId) {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      const filepath = path.join(reportsDir, `${reportId}.json`);
      
      if (!fs.existsSync(filepath)) {
        throw new Error('Report not found');
      }

      const reportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return reportData;
    } catch (error) {
      console.error('Error loading report:', error);
      throw error;
    }
  }

  // Generate scheduled reports with batch optimization
  async generateScheduledReports() {
    try {
      const now = new Date();
      const reports = [];

      console.log('🔄 Starting batch report generation...');

      // Check if we have enough quota for both reports
      const quotaStats = quotaMonitor.getStats();
      if (quotaStats.remainingQuota < 2) {
        throw new Error(`Insufficient quota for batch generation. Only ${quotaStats.remainingQuota} requests remaining.`);
      }

      // Generate weekly report (last 7 days)
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      console.log('📅 Generating weekly report...');
      
      try {
        const weeklyReport = await this.generateReport('weekly', weekStart.toISOString().split('T')[0], now.toISOString().split('T')[0]);
        
        if (weeklyReport.success) {
          await this.saveReport(weeklyReport.report);
          reports.push(weeklyReport.report.metadata);
          console.log('✅ Weekly report generated and saved');
        }
      } catch (error) {
        console.error('❌ Weekly report failed:', error.message);
        // Continue with monthly report even if weekly fails
      }

      // Add delay between reports to respect rate limits
      console.log('⏳ Waiting before generating monthly report...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Generate monthly report (last 30 days)
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      console.log('📅 Generating monthly report...');
      
      try {
        const monthlyReport = await this.generateReport('monthly', monthStart.toISOString().split('T')[0], now.toISOString().split('T')[0]);
        
        if (monthlyReport.success) {
          await this.saveReport(monthlyReport.report);
          reports.push(monthlyReport.report.metadata);
          console.log('✅ Monthly report generated and saved');
        }
      } catch (error) {
        console.error('❌ Monthly report failed:', error.message);
      }

      console.log(`🎉 Batch generation completed. Generated ${reports.length}/2 reports.`);

      return {
        success: true,
        generatedReports: reports,
        summary: {
          totalRequested: 2,
          totalGenerated: reports.length,
          weeklySuccess: reports.some(r => r.type === 'weekly'),
          monthlySuccess: reports.some(r => r.type === 'monthly')
        }
      };
    } catch (error) {
      console.error('Error generating scheduled reports:', error);
      throw error;
    }
  }
}

export default new AIReportService();