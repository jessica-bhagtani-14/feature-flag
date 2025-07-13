class FeatureFlagClient {
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
      
      // Remove trailing slash from baseUrl
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
      
      console.log('FeatureFlagClient initialized with baseUrl:', this.baseUrl);
    }
  
    /**
     * Fetch all flags from the API for given context
     * @param {Object} context - User context (user_id, region, role, etc.)
     * @returns {Promise<Object>} - Object containing all flags
     */
    async getAllFlags(context = {}) {
      try {
        console.log('Fetching flags with context:', context);
        
        const url = `${this.baseUrl}/evaluate/flags`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify(context),
          // Add timeout handling
          signal: AbortSignal.timeout(this.timeout)
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const result = await response.json();
        
        if (!result.success) {
          throw new Error('API returned unsuccessful response');
        }
  
        console.log('Successfully fetched flags:', Object.keys(result.data || {}));
        return result.data || {};
        
      } catch (error) {
        console.error('Error fetching flags:', error.message);
        
        // Return empty object on error (graceful degradation)
        return {};
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
     * Health check method to verify API connectivity
     * @returns {Promise<boolean>} - True if API is reachable, false otherwise
     */
    async healthCheck() {
      try {
        const url = `${this.baseUrl}/evaluate/health`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-Key': this.apiKey
          },
          signal: AbortSignal.timeout(this.timeout)
        });
  
        return response.ok;
        
      } catch (error) {
        console.error('Health check failed:', error.message);
        return false;
      }
    }
  }
  
  module.exports = FeatureFlagClient;