// backend/src/services/flagRuleService.js
const FlagRule = require('../models/FlagRule');
const db = require('../config/database');
const { logger } = require('../utils/logger');

class FlagRuleService {
  // Get all rules for a specific flag
  async getRulesByFlagId(flagId) {
    try {
      const rules = await FlagRule.findByFlagId(flagId);
      if (!rules || rules.length === 0) {
        return [];
      }  
      return rules.map(rule => rule.toJSON());
    } catch (error) {
      logger.error('Error getting rules by flag ID: ' + (error?.message || String(error)), {
        flagId: String(flagId)
      });
      throw error;
    }
  }

  async getRulesByRuleId(ruleId) {
    try {
      const rule = await FlagRule.findById(ruleId);
  
      if (!rule) {
        return [];
      }
  
      return [rule.toJSON()];
    } catch (error) {
      logger.error('Error getting rules by ID: ' + (error?.message || String(error)), {
        ruleId: String(ruleId)
      });
      throw error;
    }
  }

  // Create a new flag rule
  async createRule(ruleData) {
    try {
      // Validate rule data
      const validationErrors = FlagRule.validateRuleData(ruleData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const newRule = await FlagRule.create(ruleData);
      return newRule.toJSON();
    } catch (error) {
      logger.error('Error creating flag rule: ' + (error?.message || String(error)), {
        ruleData: JSON.stringify(ruleData)
      });
      throw error;
    }
  }

  // Update a flag rule
  async updateRule(ruleId, updateData) {
    try {
      // Validate update data if provided
      if (updateData.type || updateData.target_percentage !== undefined || updateData.conditions !== undefined) {
        const validationErrors = FlagRule.validateRuleData(updateData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }
      }

      const updatedRule = await FlagRule.update(ruleId, updateData);
      return updatedRule.toJSON();
    } catch (error) {
      logger.error('Error updating flag rule: ' + (error?.message || String(error)), {
        ruleId: String(ruleId),
        updateData: JSON.stringify(updateData)
      });
      throw error;
    }
  }

  // Delete a flag rule
  async deleteRule(ruleId) {
    try {
      const result = await FlagRule.delete(ruleId);
      return result;
    } catch (error) {
      logger.error('Error deleting flag rule: ' + (error?.message || String(error)), {
        ruleId: String(ruleId)
      });
      throw error;
    }
  }

  // Verify that a flag exists and belongs to the specified app
  async verifyFlagOwnership(flagId, appId) {
    try {
    const query = `
      SELECT id, app_id, key, name, enabled 
      FROM flags 
      WHERE id = $1
    `;
    
    const result = await db.query(query, [flagId]);

    if (result.rows.length === 0) {
      const error = new Error('Flag not found');
      error.statusCode = 404;
      throw error;
    }

    const flag = result.rows[0];
    if (flag.app_id !== parseInt(appId)) {
      const error = new Error('Flag does not belong to this application');
      error.statusCode = 403;
      throw error;
    }

    return flag;
  } catch (error) {
    logger.error('Error verifying flag ownership: ' + (error?.message || String(error)), {
      flagId: String(flagId),
      appId: String(appId)
    });
    throw error;
  }
}

// Verify that a flag exists and belongs to the specified app
async verifyFlagOwnership(flagId, appId) {
  try {
    const query = `
      SELECT id, app_id, key, name, enabled 
      FROM flags 
      WHERE id = $1
    `;
    
    const result = await db.query(query, [flagId]);

    if (result.rows.length === 0) {
      const error = new Error('Flag not found');
      error.statusCode = 404;
      throw error;
    }

    const flag = result.rows[0];
    if (flag.app_id !== parseInt(appId)) {
      const error = new Error('Flag does not belong to this application');
      error.statusCode = 403;
      throw error;
    }

    return flag;
  } catch (error) {
    logger.error('Error verifying flag ownership: ' + (error?.message || String(error)), {
      flagId: String(flagId),
      appId: String(appId)
    });
    throw error;
  }
}

// Verify that a rule exists and belongs to the specified flag
async verifyRuleOwnership(ruleId, flagId) {
  try {
    const rule = await FlagRule.findById(ruleId);
    
    if (!rule) {
      const error = new Error('Rule not found');
      error.statusCode = 404;
      throw error;
    }

    if (rule.flag_id !== parseInt(flagId)) {
      const error = new Error('Rule does not belong to this flag');
      error.statusCode = 403;
      throw error;
    }

    return rule;
  } catch (error) {
    console.error('Error verifying rule ownership:', {
      message: error?.message || String(error) || 'Unknown error',
      ruleId: String(ruleId),
      flagId: String(flagId)
    });
    throw error;
  }
}

  // Get enabled rules for evaluation (used by evaluation service)
  async getEnabledRulesForFlag(flagId) {
    try {
      const rules = await FlagRule.findEnabledByFlagId(flagId);
      return rules.map(rule => rule.toJSON());
    } catch (error) {
      logger.error('Error getting enabled rules for flag: ' + (error?.message || String(error)), {
        flagId: String(flagId)
      });
      throw error;
    }
  }

  // Delete all rules for a flag (used when deleting a flag)
  async deleteAllRulesForFlag(flagId) {
    try {
      const deletedCount = await FlagRule.deleteByFlagId(flagId);
      logger.info(`Deleted ${deletedCount} rules for flag ${flagId}`);
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting all rules for flag: ' + (error?.message || String(error)), {
        flagId: String(flagId)
      });
      throw error;
    }
  }

  // Get rule statistics for a flag
  async getRuleStats(flagId) {
    try {
      const query = `
        SELECT 
          type,
          enabled,
          COUNT(*) as count
        FROM flag_rules 
        WHERE flag_id = $1
        GROUP BY type, enabled
        ORDER BY type, enabled
      `;
      
      const result = await db.query(query, [flagId]);
      
      const stats = {
        total: 0,
        enabled: 0,
        disabled: 0,
        byType: {}
      };

      result.rows.forEach(row => {
        stats.total += parseInt(row.count);
        
        if (row.enabled) {
          stats.enabled += parseInt(row.count);
        } else {
          stats.disabled += parseInt(row.count);
        }

        if (!stats.byType[row.type]) {
          stats.byType[row.type] = { total: 0, enabled: 0, disabled: 0 };
        }

        stats.byType[row.type].total += parseInt(row.count);
        
        if (row.enabled) {
          stats.byType[row.type].enabled += parseInt(row.count);
        } else {
          stats.byType[row.type].disabled += parseInt(row.count);
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting rule stats: ' + (error?.message || String(error)), {
        flagId: String(flagId)
      });
      throw error;
    }
  }
}

module.exports = new FlagRuleService();