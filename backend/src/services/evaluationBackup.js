// backend/src/services/evaluationService.js

const Flag = require('../models/Flag');
const FlagRule = require('../models/FlagRule');
const cacheService = require('./cacheService');
const crypto = require('crypto');
const logger = require('../utils/logger');

class EvaluationService {
  async evaluateFlag(appId, flagKey, context = {}) {
    // Input validation
    if (!appId || !flagKey) {
      return {
        enabled: false,
        flag_key: flagKey,
        reason: 'INVALID_INPUT'
      };
    }

    logger.info('Evaluating flag', { appId, flagKey, context });
    
    try {
      // Try to get flag with rules from cache first
      let flagWithRules = await cacheService.getFlagWithRules(appId, flagKey);
      
      if (!flagWithRules) {
        // If not in cache, get from database
        const flag = await Flag.findByKey(appId, flagKey);

        if (!flag) {
          return {
            enabled: false,
            flag_key: flagKey,
            reason: 'FLAG_NOT_FOUND'
          };
        }

        logger.info('Flag found', { flagId: flag.id });
        
        // Get rules for this flag
        const rules = await FlagRule.findByFlagId(flag.id);
        
        flagWithRules = {
          ...flag,
          rules: rules || []
        };

        // Cache the flag with rules for future requests
        await cacheService.setFlagWithRules(appId, flagKey, flagWithRules);
      }

      logger.info('Flag with rules loaded', { flagId: flagWithRules.id, rulesCount: flagWithRules.rules?.length || 0 });

      // Check if flag is disabled at the flag level
      if (!flagWithRules.enabled) {
        return {
          enabled: false,
          flag_key: flagKey,
          reason: 'FLAG_DISABLED',
          flag_id: flagWithRules.id
        };
      }

      // Evaluate rules in order of priority
      const result = await this.evaluateRules(flagWithRules, context);
      
      // Log evaluation for analytics
      await this.logEvaluation(flagWithRules.id, appId, result.enabled, context, result.reason);

      return {
        ...result,
        flag_key: flagKey,
        flag_id: flagWithRules.id
      };

    } catch (error) {
      logger.error('Flag evaluation error', { error: error.message, appId, flagKey, stack: error.stack });
      // On error, return safe default
      return {
        enabled: false,
        flag_key: flagKey,
        reason: 'EVALUATION_ERROR',
        error: error.message
      };
    }
  }

  async evaluateRules(flagWithRules, context) {
    const { rules } = flagWithRules;
    logger.info('Evaluating rules', { flagId: flagWithRules.id, rulesCount: rules?.length || 0 });
    
    // If no rules, return flag's default state
    if (!rules || rules.length === 0) {
      return {
        enabled: flagWithRules.enabled,
        reason: 'NO_RULES_DEFAULT'
      };
    }

    // Sort rules by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Evaluate each rule
    for (const rule of sortedRules) {
      logger.info('Evaluating rule', { ruleId: rule.id, ruleType: rule.type, priority: rule.priority,enabled: rule.enabled });
      
      // Skip disabled rules (uncommented and fixed)
      if (!rule.enabled) {
        logger.info('Skipping disabled rule', { ruleId: rule.id });
        continue;
      }

      const ruleResult = await this.evaluateRule(rule, context, flagWithRules.key);
      
      if (ruleResult.matches) {
        return {
          enabled: ruleResult.enabled,
          reason: ruleResult.reason,
          rule_id: rule.id,
          rule_type: rule.type
        };
      }
    }

    // No rules matched, return flag's default state
    return {
      enabled: flagWithRules.enabled,
      reason: 'NO_RULE_MATCH_DEFAULT'
    };
  }

  async evaluateRule(rule, context, flagKey) {
    logger.info("Evaluating individual rule", { ruleId: rule?.id, ruleType: rule?.type, flagKey });
    
    // Validate rule structure
    if (!rule || !rule.type) {
      logger.error('Invalid rule structure', { rule });
      return { matches: false, enabled: false, reason: 'INVALID_RULE' };
    }
    
    try {
      switch (rule.type) {
        case 'toggle':
          return this.evaluateToggleRule(rule, context);
        
        case 'percentage':
          return this.evaluatePercentageRule(rule, context, flagKey);
        
        case 'conditional':
          return this.evaluateConditionalRule(rule, context);
        
        default:
          logger.warn('Unknown rule type', { ruleType: rule.type, ruleId: rule.id });
          return { matches: false, enabled: false, reason: 'UNKNOWN_RULE_TYPE' };
      }
    } catch (error) {
      logger.error('Rule evaluation error', { error: error.message, ruleId: rule?.id, stack: error.stack });
      return { matches: false, enabled: false, reason: 'RULE_EVALUATION_ERROR' };
    }
  }

  evaluateToggleRule(rule, context) {
    // Simple toggle rule - always matches if enabled
    return {
      matches: true,
      enabled: rule.enabled || false,
      reason: rule.enabled ? 'TOGGLE_ENABLED' : 'TOGGLE_DISABLED'
    };
  }

  evaluatePercentageRule(rule, context, flagKey) {
    // First check if conditions match (if any)
    if (rule.conditions && !this.evaluateConditions(rule.conditions, context)) {
      return { matches: false, enabled: false, reason: 'CONDITIONS_NOT_MET' };
    }

    // Get the hash key from context
    const hashKey = rule.hash_key || 'user_id';
    const hashValue = context[hashKey];

    if (!hashValue) {
      // If no hash value provided, rule doesn't match
      return { matches: false, enabled: false, reason: 'MISSING_HASH_VALUE' };
    }

    // Validate target_percentage
    const targetPercentage = typeof rule.target_percentage === 'number' ? rule.target_percentage : 0;
    if (targetPercentage < 0 || targetPercentage > 100) {
      logger.warn('Invalid target_percentage', { targetPercentage, ruleId: rule.id });
      return { matches: false, enabled: false, reason: 'INVALID_PERCENTAGE' };
    }

    // Calculate percentage bucket
    const bucket = this.calculatePercentageBucket(hashValue, flagKey);
    const isInPercentage = bucket < targetPercentage;

    return {
      matches: true,
      enabled: isInPercentage,
      reason: isInPercentage ? 'PERCENTAGE_INCLUDED' : 'PERCENTAGE_EXCLUDED',
      bucket: bucket,
      target_percentage: targetPercentage
    };
  }

  evaluateConditionalRule(rule, context) {
    // Validate rule has conditions
    if (!rule.conditions) {
      logger.warn('Conditional rule missing conditions', { ruleId: rule.id });
      return { matches: false, enabled: false, reason: 'MISSING_CONDITIONS' };
    }

    // Check if conditions match
    const conditionsMatch = this.evaluateConditions(rule.conditions, context);
    
    if (!conditionsMatch) {
      return { matches: false, enabled: false, reason: 'CONDITIONS_NOT_MET' };
    }

    // If conditions match, check if there's also a percentage component
    if (rule.target_percentage !== null && 
        rule.target_percentage !== undefined && 
        rule.target_percentage < 100) {
      
      const hashKey = rule.hash_key || 'user_id';
      const hashValue = context[hashKey];

      if (!hashValue) {
        return { matches: false, enabled: false, reason: 'MISSING_HASH_VALUE' };
      }

      // Validate target_percentage
      const targetPercentage = typeof rule.target_percentage === 'number' ? rule.target_percentage : 0;
      if (targetPercentage < 0 || targetPercentage > 100) {
        logger.warn('Invalid target_percentage in conditional rule', { targetPercentage, ruleId: rule.id });
        return { matches: false, enabled: false, reason: 'INVALID_PERCENTAGE' };
      }

      // Use flagKey from the rule or passed parameter
      const keyForHash = rule.flag_key || rule.key || 'default';
      const bucket = this.calculatePercentageBucket(hashValue, keyForHash);
      const isInPercentage = bucket < targetPercentage;

      return {
        matches: true,
        enabled: isInPercentage,
        reason: isInPercentage ? 'CONDITIONAL_PERCENTAGE_INCLUDED' : 'CONDITIONAL_PERCENTAGE_EXCLUDED',
        bucket: bucket,
        target_percentage: targetPercentage
      };
    }

    // Conditions match and no percentage restriction
    return {
      matches: true,
      enabled: rule.enabled || false,
      reason: 'CONDITIONS_MET'
    };
  }

  evaluateConditions(conditions, context) {
    logger.info("Evaluating conditions", { conditions, contextKeys: Object.keys(context) });
    
    if (!conditions || typeof conditions !== 'object') {
      return true; // No conditions means always match
    }

    // Handle case where conditions might be a JSON string
    let parsedConditions = conditions;
    if (typeof conditions === 'string') {
      try {
        parsedConditions = JSON.parse(conditions);
      } catch (error) {
        logger.error('Failed to parse conditions JSON', { error: error.message, conditions });
        return false;
      }
    }

    // Conditions is an object like: {"user_tier": "premium", "country": ["US", "CA"]}
    for (const [key, expectedValue] of Object.entries(parsedConditions)) {
      const contextValue = context[key];
      logger.info('Checking condition', { key, contextValue, expectedValue });
      
      if (Array.isArray(expectedValue)) {
        // Array means "any of these values"
        if (!expectedValue.includes(contextValue)) {
          logger.info('Condition failed - array check', { contextValue, expectedValues: expectedValue });
          return false;
        }
      } else {
        // Single value means exact match
        if (contextValue !== expectedValue) {
          logger.info('Condition failed - exact match', { contextValue, expectedValue });
          return false;
        }
      }
    }

    logger.info("All conditions matched");
    return true;
  }

  calculatePercentageBucket(hashValue, flagKey) {
    // Input validation
    if (!hashValue || !flagKey) {
      logger.warn('Missing hashValue or flagKey for percentage calculation', { hashValue: !!hashValue, flagKey: !!flagKey });
      return 0;
    }

    // Create a consistent hash from the hash value and flag key
    const input = `${hashValue}:${flagKey}`;
    const hash = crypto.createHash('md5').update(input).digest('hex');
    
    // Take first 8 characters and convert to number
    const hexSubstring = hash.substring(0, 8);
    const number = parseInt(hexSubstring, 16);
    
    // Convert to 0-99 range
    return number % 100;
  }

  async logEvaluation(flagId, appId, enabled, context, reason) {
    try {
      // Sanitize context for logging (remove sensitive data)
      const sanitizedContext = {
        user_id: context.user_id,
        session_id: context.session_id,
        // Add other safe context fields as needed
      };

      const logEntry = {
        flagId,
        appId,
        enabled,
        reason,
        context: sanitizedContext,
        timestamp: new Date().toISOString()
      };

      logger.info('Flag evaluation logged', logEntry);
      
      // TODO: Implement actual logging to database
      // await EvaluationLog.create({
      //   flag_id: flagId,
      //   app_id: appId,
      //   enabled: enabled,
      //   reason: reason,
      //   context: JSON.stringify(sanitizedContext),
      //   timestamp: new Date()
      // });
    } catch (error) {
      // Don't throw error for logging failures
      logger.error('Failed to log evaluation', { error: error.message, flagId, appId });
    }
  }

  async evaluateMultipleFlags(appId, flagKeys, context = {}) {
    // Input validation
    if (!appId || !Array.isArray(flagKeys)) {
      throw new Error('Invalid input: appId and flagKeys array required');
    }

    try {
      const evaluations = await Promise.all(
        flagKeys.map(flagKey => this.evaluateFlag(appId, flagKey, context))
      );

      // Convert to object format for easier consumption
      const result = {};
      evaluations.forEach(evaluation => {
        if (evaluation && evaluation.flag_key) {
          result[evaluation.flag_key] = evaluation;
        }
      });

      return result;
    } catch (error) {
      logger.error('Multiple flag evaluation error', { error: error.message, appId, flagKeysCount: flagKeys?.length });
      throw new Error(`Failed to evaluate multiple flags: ${error.message}`);
    }
  }

  async getAllFlags(appId, context = {}) {
    // Input validation
    if (!appId) {
      throw new Error('appId is required');
    }

    logger.info('getAllFlags called', { appId, contextKeys: Object.keys(context) });
    
    try {
      let flags = [];
      
      // Try cache first
      try {
        const cachedFlags = await cacheService.getApplicationFlags(appId);
        logger.info('Cache lookup result', { hasCachedFlags: !!cachedFlags, isArray: Array.isArray(cachedFlags), count: cachedFlags?.length || 0 });
        
        if (cachedFlags && Array.isArray(cachedFlags) && cachedFlags.length > 0) {
          flags = cachedFlags;
          logger.info('Using cached flags', { count: flags.length });
        }
      } catch (cacheError) {
        logger.error('Cache error, proceeding to database', { error: cacheError.message, appId });
      }
      
      // If no cached flags, get from database
      if (!flags || flags.length === 0) {
        logger.info('Cache miss or empty, fetching from database', { appId });
        
        // Ensure appId is a number for the database query
        const numericAppId = parseInt(appId);
        if (isNaN(numericAppId)) {
          throw new Error(`Invalid appId: ${appId}`);
        }
        
        // Get flags from database
        const dbFlags = await Flag.findByAppId(numericAppId);
        logger.info('Database query result', { flagsCount: dbFlags?.length || 0 });

        if (dbFlags && Array.isArray(dbFlags) && dbFlags.length > 0) {
          flags = dbFlags;
          
          // Cache the flags
          try {
            await cacheService.setApplicationFlags(appId, flags);
            logger.info('Successfully cached flags', { count: flags.length });
          } catch (cacheError) {
            logger.error('Failed to cache flags', { error: cacheError.message, appId });
          }
        } else {
          logger.info('No flags found in database', { appId });
          return {}; // Return empty object instead of continuing with empty array
        }
      }

      // Ensure flags is an array
      if (!Array.isArray(flags)) {
        logger.error('Flags is not an array', { flagsType: typeof flags, appId });
        return {};
      }

      logger.info('Processing flags for evaluation', { flagsCount: flags.length });

      // Evaluate each flag with the provided context
      const result = {};
      for (const flag of flags) {
        logger.info('Processing individual flag', { flagKey: flag?.key, flagId: flag?.id });
        
        if (!flag || !flag.key) {
          logger.error('Flag missing key', { flag });
          continue;
        }
        
        try {
          // Evaluate the flag with context
          const evaluation = await this.evaluateFlag(appId, flag.key, context);
          
          result[flag.key] = {
            enabled: evaluation.enabled,
            flag_key: flag.key,
            flag_name: flag.name || flag.key,
            reason: evaluation.reason,
            rule_id: evaluation.rule_id,
            rule_type: evaluation.rule_type,
            flag_id: evaluation.flag_id
          };
        } catch (flagError) {
          logger.error('Error evaluating individual flag', { error: flagError.message, flagKey: flag.key, appId });
          // Include failed flags in result with error state
          result[flag.key] = {
            enabled: false,
            flag_key: flag.key,
            flag_name: flag.name || flag.key,
            reason: 'EVALUATION_ERROR',
            error: flagError.message
          };
        }
      }

      logger.info('getAllFlags completed', { appId, resultCount: Object.keys(result).length });
      return result;
    } catch (error) {
      logger.error('getAllFlags error', { error: error.message, appId, stack: error.stack });
      throw new Error(`Failed to get all flags: ${error.message}`);
    }
  }

  // Get evaluation statistics
  async getEvaluationStats(appId, flagId = null, timeRange = '24h') {
    // Input validation
    if (!appId) {
      throw new Error('appId is required');
    }

    // Validate timeRange
    const validTimeRanges = ['1h', '24h', '7d', '30d'];
    if (!validTimeRanges.includes(timeRange)) {
      throw new Error(`Invalid timeRange. Must be one of: ${validTimeRanges.join(', ')}`);
    }

    try {
      // This would query evaluation logs from database
      // For now, return mock data structure
      return {
        app_id: appId,
        flag_id: flagId,
        total_evaluations: 0,
        true_evaluations: 0,
        false_evaluations: 0,
        error_evaluations: 0,
        time_range: timeRange,
        start_time: new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString(),
        end_time: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting evaluation stats:', error);
      throw new Error(`Failed to get evaluation stats: ${error.message}`);
    }
  }

  // Helper method to convert time range to milliseconds
  getTimeRangeMs(timeRange) {
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return timeRanges[timeRange] || timeRanges['24h'];
  }

  // Method to clear cache for a specific flag
  async clearFlagCache(appId, flagKey) {
    try {
      await cacheService.deleteFlagWithRules(appId, flagKey);
      logger.info('Cache cleared for flag', { appId, flagKey });
    } catch (error) {
      logger.error('Failed to clear flag cache', { error: error.message, appId, flagKey });
      throw new Error(`Failed to clear cache: ${error.message}`);
    }
  }

  // Method to clear all flags cache for an app
  async clearAppCache(appId) {
    try {
      await cacheService.deleteApplicationFlags(appId);
      logger.info('Cache cleared for app', { appId });
    } catch (error) {
      logger.error('Failed to clear app cache', { error: error.message, appId });
      throw new Error(`Failed to clear cache: ${error.message}`);
    }
  }
}

module.exports = new EvaluationService();