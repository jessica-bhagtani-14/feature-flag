// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Evaluation endpoint rate limiting (more generous for SDK usage)
const evaluationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute per IP
  message: {
    success: false,
    error: 'Too many flag evaluation requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key instead of IP for SDK requests
    return req.header('X-API-Key') || req.ip;
  }
});

// Management API rate limiting
const managementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many management API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics-specific rate limiter
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many analytics requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use API key for rate limiting instead of IP for authenticated requests
    return req.apiKey || req.ip;
  },
  handler: (req, res) => {
    console.log('Analytics rate limit exceeded:', {
      ip: req.ip,
      apiKey: req.apiKey,
      route: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many analytics requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// High-frequency analytics endpoints limiter (for real-time dashboards)
const realtimeAnalyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: {
    success: false,
    error: 'Too many real-time analytics requests, please try again later.',
    retryAfter: 60 // seconds
  },
  keyGenerator: (req) => {
    return req.apiKey || req.ip;
  },
  handler: (req, res) => {
    console.log('Real-time analytics rate limit exceeded:', {
      ip: req.ip,
      apiKey: req.apiKey,
      route: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many real-time requests. Please reduce polling frequency.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Export analytics limiter (more restrictive)
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 exports per hour
  message: {
    success: false,
    error: 'Too many export requests, please try again later.',
    retryAfter: 60 * 60 // seconds
  },
  keyGenerator: (req) => {
    return req.apiKey || req.ip;
  },
  handler: (req, res) => {
    console.log('Export rate limit exceeded:', {
      ip: req.ip,
      apiKey: req.apiKey,
      route: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      error: 'Export rate limit exceeded',
      message: 'Too many export requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});


module.exports = {
  apiLimiter,
  authLimiter,
  evaluationLimiter,
  managementLimiter,
  analyticsLimiter,
  realtimeAnalyticsLimiter,
  exportLimiter
};