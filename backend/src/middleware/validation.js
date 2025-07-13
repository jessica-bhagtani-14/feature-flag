// backend/src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// Application validation rules
const validateApplication = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// Flag validation rules
const validateFlag = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('key')
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .isLength({ min: 1, max: 50 })
    .withMessage('Key must be alphanumeric with underscores/hyphens, 1-50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  body('app_id')
    .isInt({ min: 1 })
    .withMessage('App ID must be a positive integer')
];

// Flag update validation (key is immutable)
const validateFlagUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean')
];

// Parameter validation
const validateAppId = [
  param('appId')
    .isInt({ min: 1 })
    .withMessage('App ID must be a positive integer')
];

const validateFlagId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Flag ID must be a positive integer')
];

const validateFlagKey = [
  param('flagKey')
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .isLength({ min: 1, max: 50 })
    .withMessage('Flag key must be alphanumeric with underscores/hyphens, 1-50 characters')
];

// Auth validation
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

const validatePasswordChange = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Bulk operations validation
const validateBulkFlagUpdate = [
  body('flags')
    .isArray({ min: 1 })
    .withMessage('Flags must be a non-empty array'),
  body('flags.*.id')
    .isInt({ min: 1 })
    .withMessage('Each flag must have a valid ID'),
  body('flags.*.enabled')
    .isBoolean()
    .withMessage('Each flag must have an enabled boolean value')
];

// Multiple flag evaluation validation
const validateMultipleFlagEvaluation = [
  body('flagKeys')
    .isArray({ min: 1 })
    .withMessage('Flag keys must be a non-empty array'),
  body('flagKeys.*')
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .isLength({ min: 1, max: 50 })
    .withMessage('Each flag key must be alphanumeric with underscores/hyphens, 1-50 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

// Query parameter validation
const validateFlagFilters = [
  query('enabled')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Enabled filter must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
];

// Validate rule ID parameter
const validateRuleId = (req, res, next) => {
  console.log("Inside validation");
  const { ruleId } = req.params;
  
  if (!ruleId || isNaN(parseInt(ruleId))) {
    return res.status(400).json({
      success: false,
      error: 'Valid rule ID is required'
    });
  }
  
  req.params.ruleId = parseInt(ruleId);
  next();
};

// Validate flag rule creation data
const validateFlagRule = (req, res, next) => {
  const { type, enabled, priority, conditions, target_percentage, hash_key, description } = req.body;
  const errors = [];

  // Validate required fields
  if (!type) {
    errors.push('type is required');
  } else {
    // Validate type enum
    const validTypes = ['toggle', 'percentage', 'conditional'];
    if (!validTypes.includes(type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate enabled field
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    errors.push('enabled must be a boolean');
  }

  // Validate priority
  if (priority !== undefined && (!Number.isInteger(priority) || priority < 0)) {
    errors.push('priority must be a non-negative integer');
  }

  // Validate target_percentage
  if (target_percentage !== undefined && target_percentage !== null) {
    if (!Number.isInteger(target_percentage) || target_percentage < 0 || target_percentage > 100) {
      errors.push('target_percentage must be an integer between 0 and 100');
    }
  }

  // Type-specific validation
  if (type === 'percentage') {
    if (target_percentage === undefined || target_percentage === null) {
      errors.push('target_percentage is required for percentage rules');
    }
  }

  if (type === 'conditional') {
    if (!conditions || typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
      errors.push('conditions object is required for conditional rules');
    }
  }

  // Validate hash_key
  if (hash_key !== undefined && typeof hash_key !== 'string') {
    errors.push('hash_key must be a string');
  }

  // Validate description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push('description must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate flag rule update data
const validateFlagRuleUpdate = (req, res, next) => {
  const { type, enabled, priority, conditions, target_percentage, hash_key, description } = req.body;
  const errors = [];

  // Check if at least one field is provided for update
  const hasUpdates = [type, enabled, priority, conditions, target_percentage, hash_key, description]
    .some(field => field !== undefined);

  if (!hasUpdates) {
    errors.push('At least one field must be provided for update');
  }

  // Validate type if provided
  if (type !== undefined) {
    const validTypes = ['toggle', 'percentage', 'conditional'];
    if (!validTypes.includes(type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate enabled field if provided
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    errors.push('enabled must be a boolean');
  }

  // Validate priority if provided
  if (priority !== undefined && (!Number.isInteger(priority) || priority < 0)) {
    errors.push('priority must be a non-negative integer');
  }

  // Validate target_percentage if provided
  if (target_percentage !== undefined && target_percentage !== null) {
    if (!Number.isInteger(target_percentage) || target_percentage < 0 || target_percentage > 100) {
      errors.push('target_percentage must be an integer between 0 and 100');
    }
  }

  // Validate conditions if provided
  if (conditions !== undefined && conditions !== null) {
    if (typeof conditions !== 'object') {
      errors.push('conditions must be a valid object');
    }
  }

  // Validate hash_key if provided
  if (hash_key !== undefined && typeof hash_key !== 'string') {
    errors.push('hash_key must be a string');
  }

  // Validate description if provided
  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push('description must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// User ID validation
const validateUserId = [
  param('userId')
    .isLength({ min: 1, max: 100 })
    .withMessage('User ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('User ID can only contain letters, numbers, hyphens, and underscores'),
];

// Time range validation
const validateTimeRange = [
  query('timeRange')
    .optional()
    .isIn(['24h', '7d'])
    .withMessage('Time range must be either "24h" or "7d"'),
];

// Enhanced time range validation (for new analytics endpoints)
const validateTimeRangeExtended = [
  query('timeRange')
    .optional()
    .isIn(['24h', '7d', '30d', '90d', 'all'])
    .withMessage('Time range must be one of: 24h, 7d, 30d, 90d, all'),
];

// Chart parameters validation
const validateChartParams = [
  query('period')
    .optional()
    .isIn(['hour', 'day'])
    .withMessage('Period must be either "hour" or "day"'),
  query('timeRange')
    .optional()
    .isIn(['24h', '7d'])
    .withMessage('Time range must be either "24h" or "7d"'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
    .toInt(),
];

// Analytics export validation
const validateAnalyticsExport = [
  query('timeRange')
    .optional()
    .isIn(['24h', '7d'])
    .withMessage('Time range must be either "24h" or "7d"'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be either "json" or "csv"'),
];

// Enhanced export validation for analytics
const validateAnalyticsExportExtended = [
  query('timeRange')
    .optional()
    .isIn(['7d', '30d', '90d', 'all'])
    .withMessage('Time range must be one of: 7d, 30d, 90d, all'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('appId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('App ID must be a positive integer'),
];

// Flags overview validation
const validateFlagsOverview = [
  body('flagIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('flagIds must be an array with 1-50 elements'),
  body('flagIds.*')
    .isInt({ min: 1 })
    .withMessage('Each flag ID must be a positive integer')
    .toInt(),
  query('timeRange')
    .optional()
    .isIn(['24h', '7d'])
    .withMessage('Time range must be either "24h" or "7d"'),
];

// Evaluation record validation
const validateEvaluationRecord = [
  body('flag_id')
    .isInt({ min: 1 })
    .withMessage('flag_id must be a positive integer')
    .toInt(),
  body('result')
    .isBoolean()
    .withMessage('result must be a boolean'),
  body('user_context')
    .optional()
    .isObject()
    .withMessage('user_context must be an object'),
  body('evaluation_time_ms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('evaluation_time_ms must be a non-negative integer')
    .toInt(),
];

// Enhanced evaluation record validation
const validateEvaluationRecordExtended = [
  body('flag_id')
    .isInt({ min: 1 })
    .withMessage('Flag ID is required and must be a positive integer'),
  body('app_id')
    .isInt({ min: 1 })
    .withMessage('App ID is required and must be a positive integer'),
  body('result')
    .isBoolean()
    .withMessage('Result must be a boolean'),
  body('user_context')
    .optional()
    .isObject()
    .withMessage('User context must be an object'),
  body('evaluation_time_ms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Evaluation time must be a non-negative integer'),
];

// Cleanup parameters validation
const validateCleanupParams = [
  body('daysToKeep')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('daysToKeep must be between 1 and 365')
    .toInt(),
];

// NEW ANALYTICS VALIDATION FUNCTIONS

// Time series parameters validation
const validateTimeSeriesParams = [
  query('timeRange')
    .optional()
    .isIn(['24h', '7d', '30d', '90d'])
    .withMessage('Time range must be one of: 24h, 7d, 30d, 90d'),
  query('granularity')
    .optional()
    .isIn(['hour', 'day', 'week'])
    .withMessage('Granularity must be one of: hour, day, week'),
  query('appId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('App ID must be a positive integer'),
  query('flagId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Flag ID must be a positive integer'),
];

// Performance metrics parameters validation
const validatePerformanceParams = [
  query('timeRange')
    .optional()
    .isIn(['7d', '30d', '90d', 'all'])
    .withMessage('Time range must be one of: 7d, 30d, 90d, all'),
  query('appId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('App ID must be a positive integer'),
];

// Ranking parameters validation
const validateRankingParams = [
  query('timeRange')
    .optional()
    .isIn(['7d', '30d', '90d', 'all'])
    .withMessage('Time range must be one of: 7d, 30d, 90d, all'),
  query('sortBy')
    .optional()
    .isIn(['evaluations', 'response_time', 'true_rate'])
    .withMessage('Sort by must be one of: evaluations, response_time, true_rate'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

// Activity parameters validation
const validateActivityParams = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('appId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('App ID must be a positive integer'),
];

// Dashboard parameters validation
const validateDashboardParams = [
  query('timeRange')
    .optional()
    .isIn(['7d', '30d', '90d', 'all'])
    .withMessage('Time range must be one of: 7d, 30d, 90d, all'),
];

// Generic validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Alternative validation handler for error middleware
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.type = 'validation';
    error.details = errors.array();
    return next(error);
  }
  next();
};

module.exports = {
  // Basic validation
  validateApplication,
  validateFlag,
  validateFlagUpdate,
  validateAppId,
  validateFlagId,
  validateFlagKey,
  validateLogin,
  validatePasswordChange,
  validateBulkFlagUpdate,
  validateMultipleFlagEvaluation,
  validateFlagFilters,
  validateRuleId,
  validateFlagRule,
  validateFlagRuleUpdate,
  validateUserId,
  
  // Time range validation
  validateTimeRange,
  validateTimeRangeExtended,
  
  // Chart and analytics validation
  validateChartParams,
  validateAnalyticsExport,
  validateAnalyticsExportExtended,
  validateFlagsOverview,
  validateEvaluationRecord,
  validateEvaluationRecordExtended,
  validateCleanupParams,
  
  // New analytics validation functions
  validateTimeSeriesParams,
  validatePerformanceParams,
  validateRankingParams,
  validateActivityParams,
  validateDashboardParams,
  
  // Error handlers
  handleValidationErrors,
  checkValidation
};