// backend/src/controllers/analyticsController.js

const analyticsService = require('../services/analyticsService');
const { validationResult } = require('express-validator');

class AnalyticsController {
  /**
   * Get comprehensive dashboard data for authenticated user
   * GET /api/analytics/dashboard
   */
  async getDashboardData(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { timeRange = '30d' } = req.query;
      const userId = req.admin.userId; // Assuming user is authenticated
      console.log(userId);
      const dashboard = await analyticsService.getComprehensiveDashboard(userId, timeRange);
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get dashboard overview - High-level metrics
   * GET /api/analytics/dashboard/overview
   */
  async getDashboardOverview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { timeRange = '30d' } = req.query;
      const userId = req.admin.userId;

      const overview = await analyticsService.getDashboardOverview(userId, timeRange);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Get dashboard overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get app-level analytics for authenticated user
   * GET /api/analytics/apps
   */
  async getAppLevelAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { timeRange = '30d' } = req.query;
      const userId = req.admin.userId;

      const analytics = await analyticsService.getAppLevelAnalytics(userId, timeRange);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get app-level analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get flag performance for a specific app
   * GET /api/analytics/apps/:appId/flags
   */
  async getFlagPerformanceByApp(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { appId } = req.params;
      const { timeRange = '30d' } = req.query;
      const userId = req.admin.userId;

      const performance = await analyticsService.getFlagPerformanceByApp(
        userId, 
        parseInt(appId), 
        timeRange
      );
      
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Get flag performance by app error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get evaluation time series data for charts
   * GET /api/analytics/timeseries
   */
  async getEvaluationTimeSeries(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { 
        timeRange = '7d', 
        granularity = 'day',
        appId,
        flagId
      } = req.query;
      const userId = req.admin.userId;

      const options = {
        timeRange,
        granularity,
        ...(appId && { appId: parseInt(appId) }),
        ...(flagId && { flagId: parseInt(flagId) })
      };

      const timeSeries = await analyticsService.getEvaluationTimeSeries(userId, options);
      
      res.json({
        success: true,
        data: timeSeries
      });
    } catch (error) {
      console.error('Get evaluation time series error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get performance metrics
   * GET /api/analytics/performance
   */
  async getPerformanceMetrics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { timeRange = '30d', appId } = req.query;
      const userId = req.admin.userId;

      const metrics = await analyticsService.getPerformanceMetrics(
        userId, 
        appId ? parseInt(appId) : null, 
        timeRange
      );
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Get performance metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get flag usage ranking
   * GET /api/analytics/flags/ranking
   */
  async getFlagUsageRanking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { 
        timeRange = '30d', 
        sortBy = 'evaluations',
        order = 'desc'
      } = req.query;
      const userId = req.admin.userId;

      const options = {
        timeRange,
        sortBy,
        order
      };

      const ranking = await analyticsService.getFlagUsageRanking(userId, options);
      
      res.json({
        success: true,
        data: ranking
      });
    } catch (error) {
      console.error('Get flag usage ranking error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get recent activity
   * GET /api/analytics/activity
   */
  async getRecentActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { limit = 50, appId } = req.query;
      const userId = req.admin.userId;

      const options = {
        limit: parseInt(limit),
        ...(appId && { appId: parseInt(appId) })
      };

      const activity = await analyticsService.getRecentActivity(userId, options);
      
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Record evaluation (internal endpoint)
   * POST /api/analytics/evaluations
   */
  async recordEvaluation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const evaluationData = req.body;
      const appId = req.application?.id; // Optional - might come from API key middleware

      // Ensure the evaluation belongs to the current application if available
      if (appId) {
        evaluationData.app_id = appId;
      }

      const evaluation = await analyticsService.recordEvaluation(evaluationData);
      
      res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      console.error('Record evaluation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Export analytics data
   * GET /api/analytics/export
   */
  async exportAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { timeRange = '30d', format = 'json', appId } = req.query;
      const userId = req.admin.userId;

      // Get comprehensive dashboard data for export
      const exportData = await analyticsService.getComprehensiveDashboard(userId, timeRange);
      
      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${userId}-${timeRange}.csv"`);
        return res.send(csv);
      }

      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${userId}-${timeRange}.json"`);
      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Clean up old evaluations (admin only)
   * DELETE /api/analytics/cleanup
   */
  async cleanupOldEvaluations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      // Check if user has admin privileges
      if (!req.admin.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { daysToKeep = 30 } = req.body;

      const result = await analyticsService.cleanupOldEvaluations(parseInt(daysToKeep));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Cleanup old evaluations error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Analytics health check
   * GET /api/analytics/health
   */
  async healthCheck(req, res) {
    try {
      const health = await analyticsService.getHealthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health
      });
    } catch (error) {
      console.error('Analytics health check error:', error);
      res.status(503).json({
        success: false,
        error: error.message,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Legacy methods (keeping for backward compatibility)
  /**
   * Get analytics for a specific flag (legacy)
   * GET /api/analytics/flags/:flagId
   */
  async getFlagAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const flagId= req.params.id;
      const { timeRange = '7d' } = req.query;

      const analytics = await analyticsService.getFlagAnalytics(parseInt(flagId), timeRange);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get flag analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get flag statistics (legacy)
   * GET /api/analytics/flags/:flagId/stats
   */
  async getFlagStats(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const flagId = req.params.id;
      const { timeRange = '7d' } = req.query;

      const stats = await analyticsService.getFlagStats(parseInt(flagId), timeRange);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get flag stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get flag trends (legacy - deprecated)
   * GET /api/analytics/flags/:flagId/trends
   */
  async getFlagTrends(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const flagId = req.params.id;
      const { timeRange = '7d' } = req.query;

      // This method is deprecated in the service
      const trends = await analyticsService.getFlagTrends(parseInt(flagId), timeRange);
      
      res.json({
        success: true,
        data: trends,
        deprecated: true,
        message: 'This endpoint is deprecated. Use /api/analytics/timeseries instead.'
      });
    } catch (error) {
      console.error('Get flag trends error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Convert analytics data to CSV format
   * @param {Object} data - Analytics data to convert
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    const rows = [];
    
    // Header
    rows.push('App Name,Total Evaluations,Unique Users,Avg Response Time,Total Flags');
    
    // Data rows from app analytics
    if (data.appAnalytics && Array.isArray(data.appAnalytics)) {
      data.appAnalytics.forEach(app => {
        rows.push([
          app.app_name || 'Unknown',
          app.total_evaluations || 0,
          app.unique_users || 0,
          app.avg_response_time || 0,
          app.total_flags || 0
        ].join(','));
      });
    }
    
    return rows.join('\n');
  }
}

module.exports = new AnalyticsController();