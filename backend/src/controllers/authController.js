// backend/src/controllers/authController.js
const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      const authResult = await authService.authenticateUser(username, password);
      const token = await authService.generateToken(authResult.user);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: authResult.user.id,
            username: authResult.user.username,
            email: authResult.user.email,
            organization: authResult.user.organization,
            role: 'admin'
          }
        },
        message: 'Login successful'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async register(req, res) {
    try {
      const { username, email, password, organization } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
      }

      const user = await authService.registerUser({
        username,
        email,
        password,
        organization
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organization: user.organization
          }
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async validateToken(req, res) {
    try {
      // If middleware passed, token is valid
      const user = await authService.getUserById(req.admin.userId);
      
      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organization: user.organization,
            role: 'admin'
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

  async logout(req, res) {
    try {
      // For JWT, logout is handled client-side by removing the token
      // In production, you might want to implement token blacklisting
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.admin.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully. Please log in again.'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.admin.userId;
      const user = await authService.getUserById(userId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organization: user.organization,
            created_at: user.created_at,
            updated_at: user.updated_at
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

  async updateProfile(req, res) {
    try {
      const userId = req.admin.userId;
      const { username, email, organization } = req.body;

      if (!username && !email && !organization) {
        return res.status(400).json({
          success: false,
          error: 'At least one field (username, email, or organization) is required'
        });
      }

      const user = await authService.updateUser(userId, {
        username,
        email,
        organization
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organization: user.organization,
            updated_at: user.updated_at
          }
        },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();