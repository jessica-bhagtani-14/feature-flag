// backend/src/routes/flags.js
const express = require('express');
const router = express.Router();
const flagController = require('../controllers/flagController');
const { authenticateAdmin } = require('../middleware/auth');
const { managementLimiter } = require('../middleware/rateLimiter');
const { 
  validateFlag, 
  validateFlagUpdate, 
  validateAppId, 
  validateFlagId,
  validateBulkFlagUpdate,
  validateFlagFilters
} = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticateAdmin);
router.use(managementLimiter);

// Flag management routes
router.get('/:appId/flags', validateAppId, validateFlagFilters, flagController.getAllFlags);
router.post('/:appId/flags', validateAppId, validateFlag, flagController.createFlag);
router.get('/:appId/flags/stats', validateAppId, flagController.getFlagStats);
router.post('/:appId/flags/bulk-update', validateAppId, validateBulkFlagUpdate, flagController.bulkUpdateFlags);
router.get('/:appId/flags/:id', validateAppId, validateFlagId, flagController.getFlagById);
router.put('/:appId/flags/:id', validateAppId, validateFlagId, validateFlagUpdate, flagController.updateFlag);
router.post('/:appId/flags/:id/toggle', validateAppId, validateFlagId, flagController.toggleFlag);
router.delete('/:appId/flags/:id', validateAppId, validateFlagId, flagController.deleteFlag);

module.exports = router;