// backend/src/routes/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateAdmin } = require('../middleware/auth');
const { managementLimiter, analyticsLimiter } = require('../middleware/rateLimiter');
const { 
  validateFlagId, 
  validateTimeRange, 
  validateUserId,
  validateAnalyticsExport,
  validateFlagsOverview,
  validateEvaluationRecord,
  validateChartParams,
  validateCleanupParams,
  validateAppId,
  validateTimeSeriesParams,
  validatePerformanceParams,
  validateRankingParams,
  validateActivityParams
} = require('../middleware/validation');

// Debug logging middleware
router.use((req, res, next) => {
  console.log('📊 ANALYTICS ROUTE:', req.method, req.url);
  console.log('Query params:', req.query);
  next();
});

// Health check endpoint (no auth required)
router.get('/health', analyticsController.healthCheck);

// Public evaluation recording endpoint (requires API key from application)
router.post('/evaluations', validateEvaluationRecord, analyticsController.recordEvaluation);

// All other analytics endpoints require user authentication
router.use(authenticateAdmin);
router.use(analyticsLimiter);

// ===== NEW PRIMARY ENDPOINTS =====

// Dashboard endpoints
router.get('/dashboard', 
  validateTimeRange, 
  analyticsController.getDashboardData
);

router.get('/dashboard/overview', 
  validateTimeRange, 
  analyticsController.getDashboardOverview
);

// App-level analytics
router.get('/apps', 
  validateTimeRange, 
  analyticsController.getAppLevelAnalytics
);

router.get('/apps/:appId/flags', 
  validateAppId, 
  validateTimeRange, 
  analyticsController.getFlagPerformanceByApp
);

// Time series data for charts
router.get('/timeseries', 
  validateTimeSeriesParams, 
  analyticsController.getEvaluationTimeSeries
);

// Performance metrics
router.get('/performance', 
  validatePerformanceParams, 
  analyticsController.getPerformanceMetrics
);

// Flag usage ranking
router.get('/flags/ranking', 
  validateRankingParams, 
  analyticsController.getFlagUsageRanking
);

// Recent activity
router.get('/activity', 
  validateActivityParams, 
  analyticsController.getRecentActivity
);

// Data export endpoint
router.get('/export', 
  validateAnalyticsExport, 
  analyticsController.exportAnalytics
);

// ===== LEGACY ENDPOINTS (for backward compatibility) =====

// Legacy dashboard endpoints
router.get('/app', 
  validateTimeRange, 
  analyticsController.getAppLevelAnalytics
);

router.get('/app/flags', 
  validateTimeRange, 
  analyticsController.getAppLevelAnalytics
);

router.get('/app/performance', 
  validateTimeRange, 
  analyticsController.getPerformanceMetrics
);

// Legacy flag-specific analytics endpoints
router.get('/flags/:id', 
  validateFlagId, 
  validateTimeRange, 
  analyticsController.getFlagAnalytics
);

router.get('/flags/:id/stats', 
  validateFlagId, 
  validateTimeRange, 
  analyticsController.getFlagStats
);

router.get('/flags/:id/trends', 
  validateFlagId, 
  validateTimeRange, 
  analyticsController.getFlagTrends
);

// Legacy chart endpoint - redirect to new timeseries
router.get('/flags/:id/chart', 
  validateFlagId, 
  validateChartParams, 
  (req, res, next) => {
    // Transform old chart params to new timeseries format
    req.query.flagId = req.params.id;
    req.query.granularity = req.query.period || 'hour';
    analyticsController.getEvaluationTimeSeries(req, res);
  }
);



// ===== ADMIN-ONLY ENDPOINTS =====

// Admin cleanup endpoint
router.delete('/cleanup', 
  authenticateAdmin,
  managementLimiter,
  validateCleanupParams, 
  analyticsController.cleanupOldEvaluations
);

// Admin-only legacy cleanup endpoint
router.delete('/admin/cleanup', 
  authenticateAdmin,
  managementLimiter,
  validateCleanupParams, 
  analyticsController.cleanupOldEvaluations
);

// Error handler for analytics routes
router.use((error, req, res, next) => {
  console.error('Analytics route error:', error);
  
  if (error.type === 'validation') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.message
    });
  }
  
  if (error.type === 'database') {
    return res.status(503).json({
      success: false,
      error: 'Database error',
      details: 'Analytics service temporarily unavailable'
    });
  }

  if (error.type === 'authentication') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      details: 'Valid user authentication required for analytics endpoints'
    });
  }

  if (error.type === 'authorization') {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      details: 'Admin privileges required for this operation'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: 'An unexpected error occurred'
  });
});

module.exports = router;