// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const flagRoutes = require('./routes/flags');
const flagRulesRoutes = require('./routes/flagRules');
const evaluationRoutes = require('./routes/evaluation');
const analyticRoutes = require('./routes/analytics');

// Import services to initialize them
require('./services/cacheService');

const app = express();

// -------------------------------
// Security middleware
// -------------------------------
app.use(helmet());

// -------------------------------
// CORS for SDK evaluation endpoint (open to any origin)
// -------------------------------
app.use('/api/evaluate', cors({
  origin: true, // reflect request origin
  credentials: false,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Handle preflight OPTIONS for all subpaths under /api/evaluate
app.options('/api/evaluate*', cors());

// -------------------------------
// Global restrictive CORS (admin/dashboard)
// -------------------------------
app.use((req, res, next) => {
  if (req.path.startsWith('/api/evaluate')) {
    // skip global CORS for evaluation
    return next();
  }

  // Apply global restrictive CORS
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })(req, res, next);
});

// -------------------------------
// General middleware
// -------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// -------------------------------
// Health check endpoint
// -------------------------------
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------------------
// API routes
// -------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/evaluate', evaluationRoutes);
app.use('/api/analytics', analyticRoutes);
app.use('/api', flagRoutes);
app.use('/api', flagRulesRoutes);

// -------------------------------
// Root endpoint
// -------------------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Feature Flag Service API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      applications: '/api/applications',
      flags: '/api/:appId/flags',
      evaluation: '/api/evaluate',
      health: '/health'
    }
  });
});

// -------------------------------
// Error handling middleware
// -------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
