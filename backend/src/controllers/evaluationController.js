// backend/src/controllers/evaluationController.js

const evaluationService = require('../services/evaluationService');
const { validationResult } = require('express-validator');

class EvaluationController {
  async evaluateFlag(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          data: {
            enabled: false,
            flag_key: req.params.flagKey,
            reason: 'VALIDATION_ERROR'
          }
        });
      }

      const { flagKey } = req.params;
      const appId = req.application.id;
      const context = req.body || {};

      const result = await evaluationService.evaluateFlag(appId, flagKey, context);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Flag evaluation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        data: {
          enabled: false,
          flag_key: req.params.flagKey,
          reason: 'EVALUATION_ERROR'
        }
      });
    }
  }

  async evaluateMultipleFlags(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }

      const { flagKeys } = req.body;
      const appId = req.application.id;
      const context = req.body.context || {};

      if (!Array.isArray(flagKeys)) {
        return res.status(400).json({
          success: false,
          error: 'flagKeys must be an array'
        });
      }

      if (flagKeys.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'flagKeys array cannot be empty'
        });
      }

      const results = await evaluationService.evaluateMultipleFlags(appId, flagKeys, context);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Multiple flags evaluation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllFlags(req, res) {
    try {
      console.log("=== getAllFlags Controller Start ===");
      console.log('Request method:', req.method);
      console.log('Application object:', req.application);
      console.log('Application ID:', req.application.id, 'Type:', typeof req.application.id);
      
      const appId = req.application.id;
      
      // Validate appId
      if (!appId) {
        return res.status(400).json({
          success: false,
          error: 'Application ID not found',
          data: []
        });
      }
      
      // For GET requests, context should come from query params or be empty
      const context = req.body;
      console.log('Context:', context);
  
      const flags = await evaluationService.getAllFlags(appId, context);
      console.log('Service returned flags:', flags);
      
      // Calculate count from the returned object
      const flagCount = Object.keys(flags).length;
      
      res.json({
        success: true,
        data: flags,
        count: flagCount,
        application: {
          id: req.application.id,
          name: req.application.name
        }
      });
      
      console.log("=== getAllFlags Controller Success ===");
    } catch (error) {
      console.error('=== getAllFlags Controller Error ===');
      console.error('Get all flags error:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        error: error.message,
        data: {},
        debug: {
          appId: req.application?.id,
          errorType: error.constructor.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Health check endpoint for SDK
  async healthCheck(req, res) {
    try {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        application: {
          id: req.application.id,
          name: req.application.name
        }
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

}

module.exports = new EvaluationController();