import CacheManager from './CacheManager.js';

export default class FeatureFlagClient {
  constructor(config) {
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'http://localhost:3001/api';
    this.timeout = config.timeout || 5000; // 5 seconds default
    
    // Cache configuration
    const cacheConfig = {
      ttl: config.cacheTTL || 300000, // 5 minutes default
      maxSize: config.cacheMaxSize || 1000,
      enableLogging: config.enableCacheLogging || false
    };
    
    this.cacheEnabled = config.enableCache !== false; // Default to true
    this.cache = new CacheManager(cacheConfig);
    
    // Background refresh configuration
    this.backgroundRefreshEnabled = config.enableBackgroundRefresh || false;
    this.backgroundRefreshInterval = config.backgroundRefreshInterval || 240000; // 4 minutes default
    this.backgroundRefreshTimer = null;
    this.currentContext = null; // Store context for background refresh
    
    // Remove trailing slash from baseUrl
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
    
    console.log('FeatureFlagClient initialized', { 
      baseUrl: this.baseUrl,
      cacheEnabled: this.cacheEnabled,
      backgroundRefresh: this.backgroundRefreshEnabled
    });
  }

  /**
   * Fetch flags from API with proper error handling
   * @param {Object} context - User context
   * @returns {Promise<Object>} - Flags data
   */
  async fetchFlagsFromAPI(context) {
    const url = `${this.baseUrl}/evaluate/flags`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(context),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned unsuccessful response');
      }

      return result.data || {};
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch all flags from the API for given context with caching
   * @param {Object} context - User context (user_id, region, role, etc.)
   * @param {Object} options - Additional options
   * @param {boolean} options.forceRefresh - Skip cache and fetch from API
   * @returns {Promise<Object>} - Object containing all flags
   */
  async getAllFlags(context = {}, options = {}) {
    try {
      console.log('Fetching flags with context:', context);
      
      // Store context for background refresh
      this.currentContext = context;
      
      // Check cache first (unless force refresh is requested)
      if (this.cacheEnabled && !options.forceRefresh) {
        const cachedFlags = this.cache.get(context);
        if (cachedFlags !== null) {
          console.log('Returning cached flags');
          return cachedFlags;
        }
      }
      
      // Fetch from API
      console.log('Fetching flags from API');
      const flags = await this.fetchFlagsFromAPI(context);
      
      // Store in cache
      if (this.cacheEnabled) {
        this.cache.set(context, flags);
      }
      
      console.log('Successfully fetched flags:', Object.keys(flags));
      return flags;
      
    } catch (error) {
      console.error('Error fetching flags:', error.message);
      
      // Try to return cached data as fallback (even expired cache)
      if (this.cacheEnabled) {
        const key = this.cache.generateCacheKey(context);
        const entry = this.cache.cache.get(key);
        if (entry && entry.data) {
          console.log('Returning stale cached flags as fallback');
          return entry.data;
        }
      }
      
      // Return empty object on error (graceful degradation)
      return {};
    }
  }

  /**
   * Start background refresh for a specific context
   * @param {Object} context - User context to refresh
   */
  startBackgroundRefresh(context = {}) {
    if (!this.backgroundRefreshEnabled || !this.cacheEnabled) {
      console.warn('Background refresh requires both backgroundRefreshEnabled and cacheEnabled');
      return;
    }
    
    // Store context
    this.currentContext = context;
    
    // Clear existing timer
    this.stopBackgroundRefresh();
    
    this.backgroundRefreshTimer = setInterval(async () => {
      try {
        console.log('Background refresh triggered');
        await this.getAllFlags(this.currentContext, { forceRefresh: true });
      } catch (error) {
        console.error('Background refresh failed:', error.message);
      }
    }, this.backgroundRefreshInterval);
    
    console.log('Background refresh started', { interval: this.backgroundRefreshInterval });
  }

  /**
   * Stop background refresh
   */
  stopBackgroundRefresh() {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
      console.log('Background refresh stopped');
    }
  }

  /**
   * Check if a specific flag is enabled
   * @param {string} flagKey - The flag key to check
   * @param {Object} flags - The flags object returned from getAllFlags()
   * @returns {boolean} - True if flag is enabled, false otherwise
   */
  isEnabled(flagKey, flags) {
    if (!flagKey) {
      console.warn('Flag key is required');
      return false;
    }

    if (!flags || typeof flags !== 'object') {
      console.warn('Flags object is required');
      return false;
    }

    const flag = flags[flagKey];
    
    if (!flag) {
      console.warn(`Flag '${flagKey}' not found`);
      return false;
    }

    return flag.enabled === true;
  }

  /**
   * Get detailed information about a flag
   * @param {string} flagKey - The flag key to get details for
   * @param {Object} flags - The flags object returned from getAllFlags()
   * @returns {Object|null} - Flag details object or null if not found
   */
  getFlag(flagKey, flags) {
    if (!flagKey) {
      console.warn('Flag key is required');
      return null;
    }

    if (!flags || typeof flags !== 'object') {
      console.warn('Flags object is required');
      return null;
    }

    const flag = flags[flagKey];
    
    if (!flag) {
      console.warn(`Flag '${flagKey}' not found`);
      return null;
    }

    return {
      enabled: flag.enabled,
      flagKey: flag.flag_key,
      flagName: flag.flag_name,
      reason: flag.reason,
      ruleType: flag.rule_type,
      ruleId: flag.rule_id,
      flagId: flag.flag_id
    };
  }

  /**
   * Get all enabled flags
   * @param {Object} flags - The flags object returned from getAllFlags()
   * @returns {Array} - Array of enabled flag keys
   */
  getEnabledFlags(flags) {
    if (!flags || typeof flags !== 'object') {
      console.warn('Flags object is required');
      return [];
    }

    return Object.keys(flags).filter(flagKey => flags[flagKey].enabled === true);
  }

  /**
   * Check multiple flags at once
   * @param {Array} flagKeys - Array of flag keys to check
   * @param {Object} flags - The flags object returned from getAllFlags()
   * @returns {Object} - Object with flag keys as keys and enabled status as values
   */
  checkMultiple(flagKeys, flags) {
    if (!Array.isArray(flagKeys)) {
      console.warn('Flag keys must be an array');
      return {};
    }

    if (!flags || typeof flags !== 'object') {
      console.warn('Flags object is required');
      return {};
    }

    const results = {};
    
    flagKeys.forEach(flagKey => {
      results[flagKey] = this.isEnabled(flagKey, flags);
    });

    return results;
  }

  /**
   * Invalidate cache for specific context or all contexts
   * @param {Object} context - User context (optional)
   */
  invalidateCache(context = null) {
    if (!this.cacheEnabled) {
      console.warn('Cache is not enabled');
      return;
    }
    
    this.cache.invalidate(context);
    console.log('Cache invalidated', { context });
  }

  /**
   * Get cache statistics
   * @returns {Object|null} - Cache stats or null if cache disabled
   */
  getCacheStats() {
    if (!this.cacheEnabled) {
      return null;
    }
    
    return this.cache.getStats();
  }

  /**
   * Clean up expired cache entries
   * @returns {number|null} - Number of cleaned entries or null if cache disabled
   */
  cleanupCache() {
    if (!this.cacheEnabled) {
      return null;
    }
    
    return this.cache.cleanup();
  }

  /**
   * Update cache TTL
   * @param {number} newTtl - New TTL in milliseconds
   */
  updateCacheTTL(newTtl) {
    if (!this.cacheEnabled) {
      console.warn('Cache is not enabled');
      return;
    }
    
    if (typeof newTtl !== 'number' || newTtl <= 0) {
      throw new Error('TTL must be a positive number');
    }
    
    this.cache.updateTTL(newTtl);
  }

  /**
   * Health check method to verify API connectivity
   * @returns {Promise<boolean>} - True if API is reachable, false otherwise
   */
  async healthCheck() {
    try {
      const url = `${this.baseUrl}/evaluate/health`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
      
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Cleanup method to clear timers and resources
   */
  destroy() {
    this.stopBackgroundRefresh();
    if (this.cacheEnabled) {
      this.cache.invalidate();
    }
    this.currentContext = null;
    console.log('FeatureFlagClient destroyed');
  }
}