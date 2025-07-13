// backend/src/routes/flagRules.js
const express = require('express');
const router = express.Router();
const flagRuleController = require('../controllers/flagRuleController');
const { authenticateAdmin } = require('../middleware/auth');
const { managementLimiter } = require('../middleware/rateLimiter');
const { 
  validateAppId, 
  validateFlagId,
  validateRuleId,
  validateFlagRule,
  validateFlagRuleUpdate
} = require('../middleware/validation');

router.use((req, res, next) => {
    console.log('📍 ROUTE: Flag Rules route hit:', req.method, req.url);
    next();
  });

// All routes require admin authentication
router.use(authenticateAdmin);
router.use(managementLimiter);


// Flag rule management routes
router.get('/:appId/flags/:flagId/rules', validateAppId, validateFlagId, flagRuleController.getFlagRules);
router.get('/:appId/flags/:flagId/rules/:ruleId', validateAppId, validateFlagId, flagRuleController.getFlagRuleById);
router.post('/:appId/flags/:flagId/rules', validateAppId, validateFlagId, validateFlagRule, flagRuleController.createFlagRule);
router.put('/:appId/flags/:flagId/rules/:ruleId', validateAppId, validateFlagId, validateRuleId, validateFlagRuleUpdate, flagRuleController.updateFlagRule);
router.delete('/:appId/flags/:flagId/rules/:ruleId', validateAppId, validateFlagId, validateRuleId, flagRuleController.deleteFlagRule);

module.exports = router;