const db = require('../config/database');

class FlagRule {
  constructor(data) {
    this.id = data.id;
    this.flag_id = data.flag_id;
    this.type = data.type; // 'toggle', 'percentage', 'conditional'
    this.enabled = data.enabled;
    this.priority = data.priority || 0;
    this.conditions = data.conditions; // JSON object
    this.target_percentage = data.target_percentage;
    this.hash_key = data.hash_key || 'user_id';
    this.description = data.description;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new flag rule
  static async create(ruleData) {
    try {
      const {
        flag_id,
        type,
        enabled = true,
        priority = 0,
        conditions = null,
        target_percentage = null,
        hash_key = 'user_id',
        description = null
      } = ruleData;

      // Validate required fields
      if (!flag_id || !type) {
        throw new Error('flag_id and type are required');
      }

      // Validate rule type
      const validTypes = ['toggle', 'percentage', 'conditional'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid rule type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate percentage rules
      if (type === 'percentage' && (target_percentage === null || target_percentage === undefined)) {
        throw new Error('target_percentage is required for percentage rules');
      }

      if (target_percentage !== null && (target_percentage < 0 || target_percentage > 100)) {
        throw new Error('target_percentage must be between 0 and 100');
      }

      const query = `
        INSERT INTO flag_rules (
          flag_id, type, enabled, priority, conditions, 
          target_percentage, hash_key, description, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
        RETURNING *
      `;

      const values = [
        flag_id,
        type,
        enabled,
        priority,
        conditions ? JSON.stringify(conditions) : null,
        target_percentage,
        hash_key,
        description
      ];

      const result = await db.query(query, values);
      return new FlagRule(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create flag rule: ${error.message}`);
    }
  }

  // Find rule by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM flag_rules WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const rule = result.rows[0];
      
      // Handle conditions parsing with better error handling
      if (rule.conditions) {
        try {
          // Check if conditions is already an object (shouldn't happen but let's be safe)
          if (typeof rule.conditions === 'object' && rule.conditions !== null) {
            // It's already an object, keep as is
            console.log(`Conditions for rule ${rule.id} is already an object:`, rule.conditions);
          } else if (typeof rule.conditions === 'string') {
            // Check if it's the problematic "[object Object]" string
            if (rule.conditions === '[object Object]') {
              console.warn(`Rule ${rule.id} has invalid conditions data: "[object Object]". Setting to null.`);
              rule.conditions = null;
            } else {
              // Try to parse as JSON
              rule.conditions = JSON.parse(rule.conditions);
            }
          } else {
            // Unexpected type
            console.warn(`Rule ${rule.id} has unexpected conditions type: ${typeof rule.conditions}. Setting to null.`);
            rule.conditions = null;
          }
        } catch (parseError) {
          console.error(`Failed to parse conditions for rule ${rule.id}:`, parseError);
          console.error(`Raw conditions data:`, rule.conditions);
          console.error(`Conditions type:`, typeof rule.conditions);
          
          // Set to null if parsing fails
          rule.conditions = null;
        }
      }
      
      return new FlagRule(rule);
    } catch (error) {
      throw new Error(`Failed to find flag rule: ${error.message}`);
    }
  }

  // Find all rules for a specific flag
  static async findByFlagId(flagId) {
    // Validate input
    if (!flagId) {
      throw new Error('flagId is required');
    }
    
    try {
      const query = `
        SELECT * FROM flag_rules 
        WHERE flag_id = $1 
        ORDER BY priority DESC, created_at ASC
      `;
      
      const result = await db.query(query, [flagId]);
      
      // Handle case when no rules are found
      if (!result.rows || result.rows.length === 0) {
        return []; // Return empty array instead of undefined
      }
      
      return result.rows.map((rule) => {
        try {
          // Parse JSON conditions if they exist
          if (rule.conditions) {
            if (typeof rule.conditions === 'string') {
              rule.conditions = JSON.parse(rule.conditions);
            }
            // If it's already an object, leave it as is
          }
          return new FlagRule(rule);
        } catch (parseError) {
          console.error(`Failed to parse conditions for rule ${rule.id}:`, parseError);
          // Set conditions to null and continue
          rule.conditions = null;
          return new FlagRule(rule);
        }
      });
    } catch (error) {
      throw new Error(`Failed to find flag rules for flagId ${flagId}: ${error.message}`);
    }
  }

  // Find all enabled rules for a specific flag
  static async findEnabledByFlagId(flagId) {
    try {
      const query = `
        SELECT * FROM flag_rules 
        WHERE flag_id = $1 AND enabled = true 
        ORDER BY priority DESC, created_at ASC
      `;
      
      const result = await db.query(query, [flagId]);
      
      return result.rows.map(rule => {
        // Parse JSON conditions if they exist
        if (rule.conditions) {
          try {
            rule.conditions = JSON.parse(rule.conditions);
          } catch (parseError) {
            console.error(`Failed to parse conditions for rule ${rule.id}:`, parseError);
            rule.conditions = null;
          }
        }
        return new FlagRule(rule);
      });
    } catch (error) {
      throw new Error(`Failed to find enabled flag rules: ${error.message}`);
    }
  }

  // Update a flag rule
  static async update(id, updateData) {
    try {
      const existingRule = await FlagRule.findById(id);
      if (!existingRule) {
        throw new Error('Flag rule not found');
      }

      // Build dynamic update query
      const allowedFields = [
        'type', 'enabled', 'priority', 'conditions', 
        'target_percentage', 'hash_key', 'description'
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          if (key === 'conditions') {
            updates.push(`${key} = $${paramCount}`);
            values.push(updateData[key] ? JSON.stringify(updateData[key]) : null);
          } else {
            updates.push(`${key} = $${paramCount}`);
            values.push(updateData[key]);
          }
          paramCount++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      // Add id for WHERE clause
      values.push(id);

      const query = `
        UPDATE flag_rules 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Flag rule not found');
      }

      const rule = result.rows[0];
      // Parse JSON conditions if they exist
      if (rule.conditions) {
        try {
          rule.conditions = JSON.parse(rule.conditions);
        } catch (parseError) {
          console.error(`Failed to parse conditions for rule ${rule.id}:`, parseError);
          rule.conditions = null;
        }
      }

      return new FlagRule(rule);
    } catch (error) {
      throw new Error(`Failed to update flag rule: ${error.message}`);
    }
  }

  // Delete a flag rule
  static async delete(id) {
    try {
      const query = 'DELETE FROM flag_rules WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (!result || result.rows.length === 0) {
        throw new Error('Flag rule not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete flag rule: ${error.message}`);
    }
  }

  // Delete all rules for a flag
  static async deleteByFlagId(flagId) {
    try {
      const query = 'DELETE FROM flag_rules WHERE flag_id = $1';
      const result = await db.query(query, [flagId]);
      
      return result.rowCount;
    } catch (error) {
      throw new Error(`Failed to delete flag rules: ${error.message}`);
    }
  }

  // Count rules by flag
  static async countByFlagId(flagId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM flag_rules WHERE flag_id = $1';
      const result = await db.query(query, [flagId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to count flag rules: ${error.message}`);
    }
  }

  // Utility method to validate rule data
  static validateRuleData(ruleData) {
    const { type, target_percentage, conditions } = ruleData;
    const errors = [];

    // Validate type
    const validTypes = ['toggle', 'percentage', 'conditional'];
    if (type && !validTypes.includes(type)) {
      errors.push(`Invalid rule type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate percentage
    if (type === 'percentage') {
      if (target_percentage === null || target_percentage === undefined) {
        errors.push('target_percentage is required for percentage rules');
      } else if (target_percentage < 0 || target_percentage > 100) {
        errors.push('target_percentage must be between 0 and 100');
      }
    }

    // Validate conditions format
    if (conditions !== null && conditions !== undefined) {
      if (typeof conditions !== 'object') {
        errors.push('conditions must be a valid JSON object');
      }
    }

    return errors;
  }

  // Instance method to update this rule
  async update(updateData) {
    const updated = await FlagRule.update(this.id, updateData);
    
    // Update current instance properties
    Object.assign(this, updated);
    
    return this;
  }

  // Instance method to delete this rule
  async delete() {
    return await FlagRule.delete(this.id);
  }

  // Instance method to convert to JSON
  toJSON() {
    return {
      id: this.id,
      flag_id: this.flag_id,
      type: this.type,
      enabled: this.enabled,
      priority: this.priority,
      conditions: this.conditions,
      target_percentage: this.target_percentage,
      hash_key: this.hash_key,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = FlagRule;