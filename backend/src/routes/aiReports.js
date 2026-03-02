import express from 'express';
import aiReportService from '../services/aiReportService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Generate a new report
router.post('/generate', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    // Admin users should see ALL data (pass null), regular users see only their own data
    const userId = req.user?.role === 'admin' ? null : req.user?.userId;
    
    console.log(`📊 Generating ${type} report for ${req.user?.role === 'admin' ? 'ALL USERS (admin view)' : `user ${userId}`}`);

    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, startDate, endDate'
      });
    }

    if (!['weekly', 'monthly'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be "weekly" or "monthly"'
      });
    }

    const result = await aiReportService.generateReport(type, startDate, endDate, userId);
    
    if (result.success) {
      // Save the report
      await aiReportService.saveReport(result.report);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report'
    });
  }
});

// Generate scheduled reports (both weekly and monthly)
router.post('/generate-scheduled', async (req, res) => {
  try {
    const result = await aiReportService.generateScheduledReports();
    res.json(result);
  } catch (error) {
    console.error('Error generating scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate scheduled reports'
    });
  }
});

// Get list of all reports (filtered by user)
router.get('/list', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const allReports = await aiReportService.getReportsList();
    
    // Filter reports to only show user's own reports (unless admin)
    const reports = req.user?.role === 'admin' 
      ? allReports 
      : allReports.filter(r => r.metadata.userId === userId);
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Error getting reports list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports list'
    });
  }
});

// Get specific report (with user access control)
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.userId;
    const report = await aiReportService.loadReport(reportId);
    
    // Check if user has access to this report (own report or admin)
    if (req.user?.role !== 'admin' && report.metadata.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own reports'
      });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error loading report:', error);
    res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }
});

// Download report as text file (with user access control)
router.get('/:reportId/download', async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.userId;
    const report = await aiReportService.loadReport(reportId);
    
    // Check if user has access to this report (own report or admin)
    if (req.user?.role !== 'admin' && report.metadata.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only download your own reports'
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${reportId}.txt"`);
    
    // Send the report content
    res.send(report.content);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }
});

// Get report statistics (filtered by user)
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const allReports = await aiReportService.getReportsList();
    
    // Filter reports by user (unless admin)
    const reports = req.user?.role === 'admin' 
      ? allReports 
      : allReports.filter(r => r.metadata.userId === userId);
    
    const stats = {
      totalReports: reports.length,
      weeklyReports: reports.filter(r => r.metadata.type === 'weekly').length,
      monthlyReports: reports.filter(r => r.metadata.type === 'monthly').length,
      lastGenerated: reports.length > 0 ? reports[0].metadata.generatedAt : null
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report statistics'
    });
  }
});

// Get AI system status (including fallback information)
router.get('/status/ai-system', async (req, res) => {
  try {
    // Import the enhanced AI client
    const enhancedAI = (await import('../aiClient.js')).default;
    
    const aiStatus = enhancedAI.getStatus();
    const quotaMonitor = (await import('../aiQuotaMonitor.js')).quotaMonitor;
    const quotaStats = quotaMonitor.getStats();
    
    res.json({
      success: true,
      aiSystem: {
        ...aiStatus,
        quota: quotaStats,
        lastApiCall: aiReportService.lastApiCall,
        cacheSize: aiReportService.dataCache.size
      }
    });
  } catch (error) {
    console.error('Error getting AI system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI system status'
    });
  }
});

export default router;