// backend/src/services/cacheService.js
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.keyPrefixes = {
      flag: 'flag:',
      flagWithRules: 'flag_rules:',
      appFlags: 'app_flags:',
      evaluation: 'eval:',
      app: 'app:'
    };
    this.ttlConfig = {
      flags: 300,        // 5 minutes - flags change moderately
      flagsWithRules: 300, // 5 minutes - same as flags
      applications: 3600, // 1 hour - rarely changes
      evaluations: 60,   // 1 minute - context-specific
      appFlags: 1800     // 30 minutes - balance between freshness and performance
    };
    this.initialize();
  }

  async initialize() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  // Flag-specific cache methods (original functionality)
  async getFlag(appId, flagKey) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = `${this.keyPrefixes.flag}${appId}:${flagKey}`;
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Cache get flag error:', error);
      return null;
    }
  }

  async setFlag(appId, flagKey, flag, ttl = null) {
    if (!this.isConnected) return;
    
    try {
      const cacheKey = `${this.keyPrefixes.flag}${appId}:${flagKey}`;
      const cacheTTL = ttl || this.ttlConfig.flags;
      await this.client.setEx(cacheKey, cacheTTL, JSON.stringify(flag));
    } catch (error) {
      console.error('Cache set flag error:', error);
    }
  }

  // Enhanced flag with rules cache methods
  async getFlagWithRules(appId, flagKey) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = `${this.keyPrefixes.flagWithRules}${appId}:${flagKey}`;
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Cache get flag with rules error:', error);
      return null;
    }
  }

  async setFlagWithRules(appId, flagKey, flagWithRules, ttl = null) {
    if (!this.isConnected) return;
    
    try {
      const cacheKey = `${this.keyPrefixes.flagWithRules}${appId}:${flagKey}`;
      const cacheTTL = ttl || this.ttlConfig.flagsWithRules;
      await this.client.setEx(cacheKey, cacheTTL, JSON.stringify(flagWithRules));
      
      // Also cache the basic flag for backward compatibility
      await this.setFlag(appId, flagKey, flagWithRules, cacheTTL);
    } catch (error) {
      console.error('Cache set flag with rules error:', error);
    }
  }

  // Evaluation result cache methods
  async getEvaluationResult(flagKey, contextHash) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = `${this.keyPrefixes.evaluation}${flagKey}:${contextHash}`;
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Cache get evaluation result error:', error);
      return null;
    }
  }

  async cacheEvaluationResult(flagKey, contextHash, result, ttl = null) {
    if (!this.isConnected) return;
    
    try {
      const cacheKey = `${this.keyPrefixes.evaluation}${flagKey}:${contextHash}`;
      const cacheTTL = ttl || this.ttlConfig.evaluations;
      await this.client.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    } catch (error) {
      console.error('Cache set evaluation result error:', error);
    }
  }

  // Context hashing utility
  hashContext(context) {
    // Create consistent hash from context
    const crypto = require('crypto');
    
    // Sort keys to ensure consistent hashing
    const sortedContext = Object.keys(context)
      .sort()
      .reduce((acc, key) => {
        // Only include relevant context keys for hashing
        if (['user_id', 'session_id', 'user_tier', 'country', 'plan_type'].includes(key)) {
          acc[key] = context[key];
        }
        return acc;
      }, {});
        
    return crypto
      .createHash('md5')
      .update(JSON.stringify(sortedContext))
      .digest('hex');
  }

  // Application flags cache methods (existing functionality)
  async getApplicationFlags(appId) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = `${this.keyPrefixes.appFlags}${appId}`;
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Cache get application flags error:', error);
      return null;
    }
  }

  async setApplicationFlags(appId, flags, ttl = null) {
    if (!this.isConnected) return;
    
    try {
      const cacheKey = `${this.keyPrefixes.appFlags}${appId}`;
      const cacheTTL = ttl || this.ttlConfig.appFlags;
      await this.client.setEx(cacheKey, cacheTTL, JSON.stringify(flags));
      
      // Also cache individual flags for direct access
      for (const flag of flags) {
        await this.setFlag(appId, flag.key, flag, cacheTTL);
      }
    } catch (error) {
      console.error('Cache set application flags error:', error);
    }
  }

  // Bulk operations for performance
  async getBulkFlags(appId, flagKeys) {
    if (!this.isConnected) return {};
    
    try {
      const pipeline = this.client.multi();
      
      flagKeys.forEach(flagKey => {
        const cacheKey = `${this.keyPrefixes.flagWithRules}${appId}:${flagKey}`;
        pipeline.get(cacheKey);
      });
      
      const results = await pipeline.exec();
      
      const flagsMap = {};
      results.forEach(([err, result], index) => {
        if (!err && result) {
          const flagKey = flagKeys[index];
          flagsMap[flagKey] = JSON.parse(result);
        }
      });
      
      return flagsMap;
    } catch (error) {
      console.error('Cache bulk get flags error:', error);
      return {};
    }
  }

  async setBulkFlags(appId, flagsMap, ttl = null) {
    if (!this.isConnected) return;
    
    try {
      const pipeline = this.client.multi();
      const cacheTTL = ttl || this.ttlConfig.flagsWithRules;
      
      Object.entries(flagsMap).forEach(([flagKey, flagData]) => {
        const cacheKey = `${this.keyPrefixes.flagWithRules}${appId}:${flagKey}`;
        pipeline.setEx(cacheKey, cacheTTL, JSON.stringify(flagData));
      });
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache bulk set flags error:', error);
    }
  }

  // Cache invalidation methods
  async invalidateFlagCache(appId, flagKey) {
    if (!this.isConnected) return;
    
    try {
      // Clear both flag and flag-with-rules caches
      const flagCacheKey = `${this.keyPrefixes.flag}${appId}:${flagKey}`;
      const flagRulesCacheKey = `${this.keyPrefixes.flagWithRules}${appId}:${flagKey}`;
      
      await this.client.del([flagCacheKey, flagRulesCacheKey]);
      
      // Clear related evaluation caches
      const evalPattern = `${this.keyPrefixes.evaluation}${flagKey}:*`;
      const evalKeys = await this.client.keys(evalPattern);
      
      if (evalKeys.length > 0) {
        await this.client.del(evalKeys);
      }
      
      // Clear application flags cache to force refresh
      const appFlagsCacheKey = `${this.keyPrefixes.appFlags}${appId}`;
      await this.client.del(appFlagsCacheKey);
      
    } catch (error) {
      console.error('Cache invalidate flag error:', error);
    }
  }

  async clearApplicationFlags(appId) {
    if (!this.isConnected) return;
    
    try {
      // Clear the application flags cache
      const appCacheKey = `${this.keyPrefixes.appFlags}${appId}`;
      await this.client.del(appCacheKey);
      
      // Clear individual flag caches
      const flagPattern = `${this.keyPrefixes.flag}${appId}:*`;
      const flagRulesPattern = `${this.keyPrefixes.flagWithRules}${appId}:*`;
      
      const [flagKeys, flagRulesKeys] = await Promise.all([
        this.client.keys(flagPattern),
        this.client.keys(flagRulesPattern)
      ]);
      
      const allKeys = [...flagKeys, ...flagRulesKeys];
      if (allKeys.length > 0) {
        await this.client.del(allKeys);
      }
    } catch (error) {
      console.error('Cache clear application flags error:', error);
    }
  }

  async clearFlag(appId, flagKey) {
    if (!this.isConnected) return;
    
    try {
      await this.invalidateFlagCache(appId, flagKey);
    } catch (error) {
      console.error('Cache clear flag error:', error);
    }
  }

  // Pub/Sub for real-time cache invalidation
  async setupCacheInvalidationListener() {
    if (!this.isConnected) return;
    
    try {
      // Create a separate client for subscriptions
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe('flag_updates', (message) => {
        try {
          const { applicationId, flagKey, action } = JSON.parse(message);
          
          switch (action) {
            case 'update':
            case 'delete':
              this.invalidateFlagCache(applicationId, flagKey);
              break;
            case 'bulk_update':
              this.clearApplicationFlags(applicationId);
              break;
          }
        } catch (error) {
          console.error('Error processing cache invalidation message:', error);
        }
      });
      
      console.log('Cache invalidation listener setup complete');
    } catch (error) {
      console.error('Failed to setup cache invalidation listener:', error);
    }
  }

  async publishFlagUpdate(applicationId, flagKey, action = 'update') {
    if (!this.isConnected) return;
    
    try {
      await this.client.publish('flag_updates', JSON.stringify({
        applicationId,
        flagKey,
        action,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to publish flag update:', error);
    }
  }

  // General cache methods (existing functionality)
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected) return;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    if (!this.isConnected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear() {
    if (!this.isConnected) return;
    
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }

  // Health check and monitoring
  async isHealthy() {
    if (!this.isConnected) return false;
    
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCacheStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory_info: info,
        keyspace_info: keyspace,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
        console.log('Redis disconnected gracefully');
      } catch (error) {
        console.error('Error disconnecting Redis:', error);
      }
    }
  }
}

module.exports = new CacheService();