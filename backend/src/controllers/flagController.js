// backend/src/controllers/flagController.js
const flagService = require('../services/flagService');
const { validationResult } = require('express-validator');

class FlagController {
  async createFlag(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const flagData = {
        ...req.body,
        app_id: parseInt(req.body.app_id)
      };

      const flag = await flagService.createFlag(flagData);
      
      res.status(201).json({
        success: true,
        data: flag,
        message: 'Flag created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllFlags(req, res) {
    try {
      const appId = parseInt(req.params.appId);
      const filters = {
        enabled: req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined,
        search: req.query.search
      };

      const flags = await flagService.getAllFlags(appId, filters);
      
      res.json({
        success: true,
        data: flags,
        count: flags.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getFlagById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const appId = parseInt(req.params.appId);

      const flag = await flagService.getFlagById(id, appId);
      
      res.json({
        success: true,
        data: flag
      });
    } catch (error) {
      const status = error.message === 'Flag not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateFlag(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const id = parseInt(req.params.id);
      const appId = parseInt(req.params.appId);

      const flag = await flagService.updateFlag(id, appId, req.body);
      
      res.json({
        success: true,
        data: flag,
        message: 'Flag updated successfully'
      });
    } catch (error) {
      const status = error.message === 'Flag not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async toggleFlag(req, res) {
    try {
      const id = parseInt(req.params.id);
      const appId = parseInt(req.params.appId);

      const flag = await flagService.toggleFlag(id, appId);
      
      res.json({
        success: true,
        data: flag,
        message: `Flag ${flag.enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      const status = error.message === 'Flag not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteFlag(req, res) {
    try {
      const id = parseInt(req.params.id);
      const appId = parseInt(req.params.appId);

      const result = await flagService.deleteFlag(id, appId);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const status = error.message === 'Flag not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async bulkUpdateFlags(req, res) {
    try {
      const appId = parseInt(req.params.appId);
      const { flags } = req.body;

      if (!Array.isArray(flags)) {
        return res.status(400).json({
          success: false,
          error: 'Flags must be an array'
        });
      }

      const result = await flagService.bulkUpdateFlags(appId, flags);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getFlagStats(req, res) {
    try {
      const appId = parseInt(req.params.appId);
      const stats = await flagService.getFlagStats(appId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new FlagController();