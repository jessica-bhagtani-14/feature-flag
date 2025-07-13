const Flag = require('../models/Flag');
const cacheService = require('./cacheService');

class FlagService {
  async createFlag(flagData) {
    try {
      const flag = await Flag.create(flagData);
      
      // Clear cache for this application
      await cacheService.clearApplicationFlags(flagData.app_id);
      
      return flag;
    } catch (error) {
      throw new Error(`Failed to create flag: ${error.message}`);
    }
  }

  async getAllFlags(appId, filters = {}) {
    try {
      console.log(appId);
      
      // Start with base query
      let query = `
        SELECT f.id, f.app_id, f.key, f.name, f.description, f.enabled, f.created_at, f.updated_at,
               a.name as application_name
        FROM flags f
        LEFT JOIN applications a ON f.app_id = a.id
        WHERE f.app_id = $1
      `;
      
      const queryParams = [appId];
      let paramIndex = 2;
      
      // Add enabled filter
      if (filters.enabled !== undefined) {
        query += ` AND f.enabled = $${paramIndex}`;
        queryParams.push(filters.enabled);
        paramIndex++;
      }
      
      // Add search filter
      if (filters.search) {
        query += ` AND (f.name ILIKE $${paramIndex} OR f.key ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      query += ` ORDER BY f.created_at DESC`;
      
      const db = require('../config/database');
      const result = await db.query(query, queryParams);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get flags: ${error.message}`);
    }
  }

  async getFlagById(id, appId) {
    try {
      const query = `
        SELECT f.id, f.app_id, f.key, f.name, f.description, f.enabled, f.created_at, f.updated_at,
               a.name as application_name
        FROM flags f
        LEFT JOIN applications a ON f.app_id = a.id
        WHERE f.id = $1 AND f.app_id = $2
      `;
      
      const db = require('../config/database');
      const result = await db.query(query, [id, appId]);

      if (result.rows.length === 0) {
        throw new Error('Flag not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get flag: ${error.message}`);
    }
  }

  async getFlagByKey(key, appId) {
    try {
      // Try cache first
      const cachedFlag = await cacheService.getFlag(appId, key);
      if (cachedFlag) {
        return cachedFlag;
      }

      const flag = await Flag.findByKey(appId, key);

      if (flag) {
        // Cache the flag
        await cacheService.setFlag(appId, key, flag);
      }

      return flag;
    } catch (error) {
      throw new Error(`Failed to get flag by key: ${error.message}`);
    }
  }

  async updateFlag(id, appId, updateData) {
    try {
      const existingFlag = await Flag.findById(id);

      if (!existingFlag || existingFlag.app_id !== appId) {
        throw new Error('Flag not found');
      }

      // Create update data with existing values for unchanged fields
      const flagUpdateData = {
        key: updateData.key || existingFlag.key,
        name: updateData.name || existingFlag.name,
        description: updateData.description !== undefined ? updateData.description : existingFlag.description,
        enabled: updateData.enabled !== undefined ? updateData.enabled : existingFlag.enabled
      };

      const flag = await Flag.update(id, flagUpdateData);
      
      // Clear cache
      await cacheService.clearApplicationFlags(appId);
      
      return flag;
    } catch (error) {
      throw new Error(`Failed to update flag: ${error.message}`);
    }
  }

  async toggleFlag(id, appId) {
    try {
      const existingFlag = await Flag.findById(id);

      if (!existingFlag || existingFlag.app_id !== appId) {
        throw new Error('Flag not found');
      }

      const flag = await Flag.toggleEnabled(id);
      
      // Clear cache
      await cacheService.clearApplicationFlags(appId);
      
      return flag;
    } catch (error) {
      throw new Error(`Failed to toggle flag: ${error.message}`);
    }
  }

  async deleteFlag(id, appId) {
    try {
      const existingFlag = await Flag.findById(id);

      if (!existingFlag || existingFlag.app_id !== appId) {
        throw new Error('Flag not found');
      }

      await Flag.delete(id);
      
      // Clear cache
      await cacheService.clearApplicationFlags(appId);
      
      return { message: 'Flag deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete flag: ${error.message}`);
    }
  }

  async bulkUpdateFlags(appId, flagUpdates) {
    try {
      const db = require('../config/database');
      
      const promises = flagUpdates.map(update => {
        return db.query(
          'UPDATE flags SET enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND app_id = $3',
          [update.enabled, update.id, appId]
        );
      });

      await Promise.all(promises);
      
      // Clear cache
      await cacheService.clearApplicationFlags(appId);
      
      return { message: 'Flags updated successfully' };
    } catch (error) {
      throw new Error(`Failed to bulk update flags: ${error.message}`);
    }
  }

  async getFlagStats(appId) {
    try {
      const db = require('../config/database');
      const result = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN enabled = true THEN 1 END) as enabled,
          COUNT(CASE WHEN enabled = false THEN 1 END) as disabled
        FROM flags 
        WHERE app_id = $1
      `, [appId]);

      return result.rows[0] || { total: '0', enabled: '0', disabled: '0' };
    } catch (error) {
      throw new Error(`Failed to get flag stats: ${error.message}`);
    }
  }
}

module.exports = new FlagService();