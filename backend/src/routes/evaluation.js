// backend/src/routes/evaluation.js
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticateApiKey, authenticateAdmin } = require('../middleware/auth');
const { evaluationLimiter, managementLimiter } = require('../middleware/rateLimiter');
const { validateFlagKey, validateMultipleFlagEvaluation } = require('../middleware/validation');

router.use((req, res, next) => {
    console.log('📍 ROUTE: Evaluation route hit:', req.method, req.url);
    next();
  });
// Public evaluation endpoints (require API key)
router.use('/', authenticateApiKey);
router.use('/', evaluationLimiter);

router.get('/health', evaluationController.healthCheck);
router.post('/flags', evaluationController.getAllFlags);
router.post('/flags', validateMultipleFlagEvaluation, evaluationController.evaluateMultipleFlags);
router.post('/:flagKey', validateFlagKey, evaluationController.evaluateFlag);


module.exports = router;