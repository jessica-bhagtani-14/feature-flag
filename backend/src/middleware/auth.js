// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const Application = require('../models/Application');

// Middleware for admin authentication (dashboard)
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log(token);
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Middleware for API key authentication (client SDK)
const authenticateApiKey = async (req, res, next) => {
  console.log('🔐 AUTH: Starting API key authentication');
  console.log("Hey");
  try {
    const apiKey = req.header('X-API-Key') || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required.' });
    }

    // Use the raw SQL method from your Application model
    const application = await Application.findByApiKey(apiKey);
    
    if (!application) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    req.application = application;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed.' });
  }
};

// Generate admin token (for login)
const generateAdminToken = () => {
  return jwt.sign(
    { role: 'admin', timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateAdmin,
  authenticateApiKey,
  generateAdminToken
};