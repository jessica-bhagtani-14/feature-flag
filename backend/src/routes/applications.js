// backend/src/routes/applications.js
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const authController = require('../controllers/authController');
const { authenticateAdmin } = require('../middleware/auth');
const { managementLimiter } = require('../middleware/rateLimiter');
const { validateApplication } = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticateAdmin);
router.use(managementLimiter);


router.get('/', appController.getAllApplicationsByUser);
router.post('/', validateApplication, appController.createApplication);
router.get('/stats',appController.getApplicationStatsByUser);
router.get('/all', appController.getAllApplications);
router.get('/:id', appController.getApplicationById);
router.put('/:id', validateApplication, appController.updateApplication);
router.delete('/:id', appController.deleteApplication);
router.post('/:id/regenerate-key', appController.regenerateApiKey);
router.get('/:id/stats', appController.getApplicationStats);


module.exports = router;