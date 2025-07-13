const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  async authenticateUser(username, password) {
    try {
      // First check fallback to env variables (temporary)
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      if (username === adminUsername && password === adminPassword) {
        return {
          user: {
            id: 0, // Special ID for env fallback
            username: adminUsername,
            email: 'admin@example.com',
            organization: 'System Admin'
          },
          isEnvFallback: true
        };
      }

      // Try database authentication
      const user = await User.findByUsernameOrEmail(username);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await User.verifyPassword(user, password);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Remove password_hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        isEnvFallback: false
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async registerUser(userData) {
    try {
      const { username, email, password, organization } = userData;

      // Validate required fields
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }

      // Check if user already exists
      const existingUser = await User.exists(username, email);
      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password,
        organization
      });

      return user;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async generateToken(user) {
    try {
      const payload = {
        userId: user.id,
        username: user.username,
        role: 'admin',
        timestamp: Date.now()
      };

      return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Handle env fallback case
      if (userId === 0) {
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (currentPassword !== adminPassword) {
          throw new Error('Current password is incorrect');
        }
        
        // For env fallback, we can't actually change the password
        // In production, you'd need to move to database-only auth
        throw new Error('Cannot change password for system admin. Please contact administrator.');
      }

      // Get user from database
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await User.verifyPassword(user, currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await User.updatePassword(userId, newPassword);
      
      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      // Handle env fallback case
      if (userId === 0) {
        return {
          id: 0,
          username: process.env.ADMIN_USERNAME || 'admin',
          email: 'admin@example.com',
          organization: 'System Admin'
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async updateUser(userId, updateData) {
    try {
      // Handle env fallback case
      if (userId === 0) {
        throw new Error('Cannot update system admin user');
      }

      const { username, email, organization } = updateData;

      // Check if new username/email already exists (excluding current user)
      if (username || email) {
        const db = require('../config/database');
        const result = await db.query(
          'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
          [username, email, userId]
        );
        
        if (result.rows.length > 0) {
          throw new Error('Username or email already exists');
        }
      }

      const user = await User.update(userId, {
        username,
        email,
        organization
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async getAllUsers() {
    try {
      const users = await User.findAll();
      return users;
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }
}

module.exports = new AuthService();