// backend/src/controllers/appController.js
const Application = require('../models/Application'); // Direct import, not destructured
const crypto = require('crypto');
const { validationResult } = require('express-validator');

class AppController {
  async createApplication(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const userId = req.admin.userId;
      console.log(userId);
      const application = await Application.create({
        name,
        description,
        userId
      });

      res.status(201).json({
        success: true,
        data: application,
        message: 'Application created successfully'
      });
    } catch (error) {
      // Handle unique constraint error for PostgreSQL
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(400).json({
          success: false,
          error: 'Application name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllApplications(req, res) {
    try {
      const applications = await Application.findAll();
      console.log(applications);
      res.status(200).json({
        success: true,
        data: applications,
        count: applications.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllApplicationsByUser(req, res) {
    const userID=req.admin.userId;
    console.log(userID);
    try {
      const applications = await Application.findByUserId(userID);
      console.log(applications);
      res.status(200).json({
        success: true,
        data: applications,
        count: applications.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getApplicationById(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      const application = await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateApplication(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const id = parseInt(req.params.id);
      const { name, description } = req.body;

      // Check if application exists first
      const existingApp = await Application.findById(id);
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      const application = await Application.update(id, { name, description });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: application,
        message: 'Application updated successfully'
      });
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(400).json({
          success: false,
          error: 'Application name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteApplication(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // Check if application exists first
      const existingApp = await Application.findById(id);
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      await Application.delete(id);

      res.json({
        success: true,
        message: 'Application deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async regenerateApiKey(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      const application = await Application.findById(id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      const newApiKey = Application.generateApiKey();
      const updatedApp = await Application.updateApiKey(id, newApiKey);

      res.json({
        success: true,
        data: {
          id: updatedApp.id,
          name: updatedApp.name,
          api_key: updatedApp.api_key
        },
        message: 'API key regenerated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getApplicationStats(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log(id);
      const application = await Application.getStats(id);
      console.log(application);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: {
          application: {
            id: application.id,
            name: application.name
          },
          stats : {
            total_flags: application.total_flags,
            enabled_flags: application.enabled_flags,
            disabled_flags: application.disabled_flags
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getApplicationStatsByUser(req, res) {
    try {
      const userId = req.admin.userId;
      console.log(userId);
      const application = await Application.getStatsByUser(userId);
      console.log(application);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            user_id: userId,
          },
          stats : {
            total_flags: application.total_flags,
            enabled_flags: application.enabled_flags,
            disabled_flags: application.disabled_flags
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  generateApiKey() {
    const prefix = 'ff_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }
}

module.exports = new AppController();