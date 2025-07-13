// backend/src/services/analyticsService.js
const Evaluation = require('../models/Evaluation');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Record a flag evaluation for analytics
   * @param {Object} evaluationData - The evaluation data to record
   * @param {number} evaluationData.flag_id - The flag ID
   * @param {number} evaluationData.app_id - The application ID
   * @param {boolean} evaluationData.result - The evaluation result
   * @param {Object} evaluationData.user_context - User context data
   * @param {number} evaluationData.evaluation_time_ms - Evaluation time in milliseconds
   */
  async recordEvaluation(evaluationData) {
    try {
      const startTime = Date.now();
      
      // Validate required fields
      if (!evaluationData.flag_id || !evaluationData.app_id) {
        throw new Error('flag_id and app_id are required');
      }

      // Sanitize user context to remove sensitive data
      const sanitizedContext = this.sanitizeUserContext(evaluationData.user_context || {});

      const data = {
        flag_id: evaluationData.flag_id,
        app_id: evaluationData.app_id,
        result: Boolean(evaluationData.result),
        user_context: sanitizedContext,
        evaluation_time_ms: evaluationData.evaluation_time_ms || null
      };

      const evaluation = await Evaluation.create(data);
      
      const recordTime = Date.now() - startTime;
      logger.info('Evaluation recorded', {
        evaluationId: evaluation.id,
        flagId: data.flag_id,
        appId: data.app_id,
        result: data.result,
        recordTime: `${recordTime}ms`
      });

      return evaluation;
    } catch (error) {
      logger.error('Failed to record evaluation', {
        error: error.message,
        flagId: evaluationData.flag_id,
        appId: evaluationData.app_id,
        stack: error.stack
      });
      
      // Don't throw error to prevent breaking flag evaluation
      // Analytics should be non-blocking
      return null;
    }
  }

  /**
   * Get dashboard overview - High-level metrics for user's dashboard
   * @param {number} userId - The authenticated user ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getDashboardOverview(userId, timeRange = '30d') {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 7d, 30d, 90d, all');
      }

      const overview = await Evaluation.getDashboardOverview(userId, timeRange);
      
      logger.info('Dashboard overview retrieved', {
        userId,
        timeRange,
        totalApps: overview.total_apps,
        totalEvaluations: overview.total_evaluations
      });

      return overview;
    } catch (error) {
      logger.error('Failed to get dashboard overview', {
        error: error.message,
        userId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get dashboard overview: ${error.message}`);
    }
  }

  /**
   * Get app-level analytics - Performance metrics for each application
   * @param {number} userId - The authenticated user ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getAppLevelAnalytics(userId, timeRange = '30d') {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 7d, 30d, 90d, all');
      }

      const analytics = await Evaluation.getAppLevelAnalytics(userId, timeRange);
      
      logger.info('App-level analytics retrieved', {
        userId,
        timeRange,
        appsCount: analytics.length
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to get app-level analytics', {
        error: error.message,
        userId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get app-level analytics: ${error.message}`);
    }
  }

  /**
   * Get flag performance by app - Detailed flag metrics for a specific app
   * @param {number} userId - The authenticated user ID
   * @param {number} appId - The application ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getFlagPerformanceByApp(userId, appId, timeRange = '30d') {
    try {
      if (!userId || !appId) {
        throw new Error('userId and appId are required');
      }

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 7d, 30d, 90d, all');
      }

      const performance = await Evaluation.getFlagPerformanceByApp(userId, appId, timeRange);
      
      logger.info('Flag performance retrieved', {
        userId,
        appId,
        timeRange,
        flagsCount: performance.length
      });

      return performance;
    } catch (error) {
      logger.error('Failed to get flag performance by app', {
        error: error.message,
        userId,
        appId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get flag performance by app: ${error.message}`);
    }
  }

  /**
   * Get evaluation time series - Trend data for charts
   * @param {number} userId - The authenticated user ID
   * @param {Object} options - Options for time series query
   * @param {number} options.appId - Optional app ID filter
   * @param {number} options.flagId - Optional flag ID filter
   * @param {string} options.timeRange - Time range (24h, 7d, 30d)
   * @param {string} options.granularity - Time granularity (hour, day, week)
   */
  async getEvaluationTimeSeries(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const { timeRange = '7d', granularity = 'day' } = options;

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 24h, 7d, 30d, 90d');
      }

      if (!['hour', 'day', 'week'].includes(granularity)) {
        throw new Error('Invalid granularity. Must be one of: hour, day, week');
      }

      const timeSeries = await Evaluation.getEvaluationTimeSeries(userId, options);
      
      logger.info('Evaluation time series retrieved', {
        userId,
        options,
        dataPoints: timeSeries.length
      });

      return timeSeries;
    } catch (error) {
      logger.error('Failed to get evaluation time series', {
        error: error.message,
        userId,
        options,
        stack: error.stack
      });
      throw new Error(`Failed to get evaluation time series: ${error.message}`);
    }
  }

  /**
   * Get performance metrics - Response time analytics
   * @param {number} userId - The authenticated user ID
   * @param {number} appId - Optional app ID filter
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getPerformanceMetrics(userId, appId = null, timeRange = '30d') {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 7d, 30d, 90d, all');
      }

      const metrics = await Evaluation.getPerformanceMetrics(userId, appId, timeRange);
      
      logger.info('Performance metrics retrieved', {
        userId,
        appId,
        timeRange,
        avgResponseTime: metrics.overall_stats.avg_response_time
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get performance metrics', {
        error: error.message,
        userId,
        appId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  /**
   * Get flag usage ranking - Most/least used flags across user's apps
   * @param {number} userId - The authenticated user ID
   * @param {Object} options - Ranking options
   * @param {string} options.timeRange - Time range (7d, 30d, 90d, all)
   * @param {string} options.sortBy - Sort criteria (evaluations, response_time, true_rate)
   * @param {string} options.order - Sort order (asc, desc)
   */
  async getFlagUsageRanking(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const { timeRange = '30d', sortBy = 'evaluations', order = 'desc' } = options;

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 7d, 30d, 90d, all');
      }

      if (!['evaluations', 'response_time', 'true_rate'].includes(sortBy)) {
        throw new Error('Invalid sortBy. Must be one of: evaluations, response_time, true_rate');
      }

      if (!['asc', 'desc'].includes(order)) {
        throw new Error('Invalid order. Must be one of: asc, desc');
      }

      const ranking = await Evaluation.getFlagUsageRanking(userId, options);
      
      logger.info('Flag usage ranking retrieved', {
        userId,
        options,
        flagsCount: ranking.length
      });

      return ranking;
    } catch (error) {
      logger.error('Failed to get flag usage ranking', {
        error: error.message,
        userId,
        options,
        stack: error.stack
      });
      throw new Error(`Failed to get flag usage ranking: ${error.message}`);
    }
  }

  /**
   * Get recent activity - Recent evaluations for monitoring
   * @param {number} userId - The authenticated user ID
   * @param {Object} options - Activity options
   * @param {number} options.limit - Number of recent evaluations to return
   * @param {number} options.appId - Optional app ID filter
   */
  async getRecentActivity(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const { limit = 50 } = options;

      if (limit <= 0 || limit > 1000) {
        throw new Error('limit must be between 1 and 1000');
      }

      const activity = await Evaluation.getRecentActivity(userId, options);
      
      logger.info('Recent activity retrieved', {
        userId,
        options,
        activitiesCount: activity.length
      });

      return activity;
    } catch (error) {
      logger.error('Failed to get recent activity', {
        error: error.message,
        userId,
        options,
        stack: error.stack
      });
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
  }

  /**
   * Get comprehensive dashboard data for user
   * @param {number} userId - The authenticated user ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getComprehensiveDashboard(userId, timeRange = '30d') {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      if (!this.isValidTimeRange(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 7d, 30d, 90d, all');
      }

      const [overview, appAnalytics, performanceMetrics] = await Promise.all([
        this.getDashboardOverview(userId, timeRange),
        this.getAppLevelAnalytics(userId, timeRange),
        this.getPerformanceMetrics(userId, null, timeRange)
      ]);

      const dashboard = {
        userId,
        timeRange,
        overview,
        appAnalytics,
        performanceMetrics,
        generatedAt: new Date().toISOString()
      };

      logger.info('Comprehensive dashboard retrieved', {
        userId,
        timeRange,
        totalApps: overview.total_apps,
        totalEvaluations: overview.total_evaluations
      });

      return dashboard;
    } catch (error) {
      logger.error('Failed to get comprehensive dashboard', {
        error: error.message,
        userId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get comprehensive dashboard: ${error.message}`);
    }
  }

  // Legacy methods (keeping for backward compatibility)
  /**
   * Get comprehensive analytics for a specific flag
   * @param {number} flagId - The flag ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getFlagAnalytics(flagId, timeRange = '7d') {
    try {
      if (!flagId) {
        throw new Error('flagId is required');
      }

      const [stats, trends] = await Promise.all([
        this.getFlagStats(flagId, timeRange),
        this.getFlagTrends(flagId, timeRange)
      ]);

      return {
        flagId,
        timeRange,
        stats,
        trends,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get flag analytics', {
        error: error.message,
        flagId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get flag analytics: ${error.message}`);
    }
  }

  /**
   * Get basic statistics for a flag (legacy method)
   * @param {number} flagId - The flag ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getFlagStats(flagId, timeRange = '7d') {
    try {
      if (!flagId) {
        throw new Error('flagId is required');
      }

      const stats = await Evaluation.getFlagStats(flagId, timeRange);
      
      logger.info('Flag stats retrieved', {
        flagId,
        timeRange,
        totalEvaluations: stats.totalEvaluations
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get flag stats', {
        error: error.message,
        flagId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get flag stats: ${error.message}`);
    }
  }

  /**
   * Get trend data for a flag (legacy method - will be deprecated)
   * @param {number} flagId - The flag ID
   * @param {string} timeRange - Time range (7d, 30d, 90d, all)
   */
  async getFlagTrends(flagId, timeRange = '7d') {
    try {
      // This is a legacy method - redirect to new time series method
      // Note: This requires userId which we don't have in legacy call
      logger.warn('getFlagTrends is deprecated. Use getEvaluationTimeSeries instead.', {
        flagId,
        timeRange
      });

      // For backward compatibility, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get flag trends', {
        error: error.message,
        flagId,
        timeRange,
        stack: error.stack
      });
      throw new Error(`Failed to get flag trends: ${error.message}`);
    }
  }

  /**
   * Clean up old evaluation records
   * @param {number} daysToKeep - Number of days to keep
   */
  async cleanupOldEvaluations(daysToKeep = 30) {
    try {
      if (daysToKeep <= 0) {
        throw new Error('daysToKeep must be greater than 0');
      }

      const deletedCount = await Evaluation.deleteOldEvaluations(daysToKeep);
      
      logger.info('Old evaluations cleaned up', {
        daysToKeep,
        deletedCount
      });

      return {
        deletedCount,
        daysToKeep,
        cleanedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to cleanup old evaluations', {
        error: error.message,
        daysToKeep,
        stack: error.stack
      });
      throw new Error(`Failed to cleanup old evaluations: ${error.message}`);
    }
  }

  /**
   * Sanitize user context to remove sensitive information
   * @param {Object} userContext - Raw user context
   * @returns {Object} Sanitized user context
   */
  sanitizeUserContext(userContext) {
    if (!userContext || typeof userContext !== 'object') {
      return {};
    }

    // List of fields to keep (whitelist approach)
    const allowedFields = [
      'userId', 'user_id', 'sessionId', 'session_id',
      'userTier', 'user_tier', 'country', 'region',
      'platform', 'version', 'environment', 'device_type',
      'browser', 'os', 'app_version', 'feature_group'
    ];

    const sanitized = {};
    allowedFields.forEach(field => {
      if (userContext[field] !== undefined) {
        sanitized[field] = userContext[field];
      }
    });

    return sanitized;
  }

  /**
   * Validate time range parameter
   * @param {string} timeRange - Time range to validate
   * @returns {boolean} Whether the time range is valid
   */
  isValidTimeRange(timeRange) {
    return ['24h', '7d', '30d', '90d', 'all'].includes(timeRange);
  }

  /**
   * Get analytics health check
   * @returns {Object} Health check information
   */
  async getHealthCheck() {
    try {
      // Perform a simple database query to check connectivity
      const testResult = await Evaluation.getFlagStats(1, '24h');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '2.0.0'
      };
    } catch (error) {
      logger.error('Analytics health check failed', {
        error: error.message,
        stack: error.stack
      });
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
        version: '2.0.0'
      };
    }
  }
}

module.exports = new AnalyticsService();