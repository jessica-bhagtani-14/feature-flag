// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateLogin, validatePasswordChange } = require('../middleware/validation');

// Public routes
router.post('/login', authLimiter, validateLogin, authController.login);

// Protected routes
// Add these to your routes
router.post('/register', authController.register);
router.get('/profile', authenticateAdmin, authController.getProfile);
router.put('/profile', authenticateAdmin, authController.updateProfile);
router.get('/validate', authenticateAdmin, authController.validateToken);
router.post('/logout', authenticateAdmin, authController.logout);
router.post('/change-password', authenticateAdmin, validatePasswordChange, authController.changePassword);

module.exports = router;