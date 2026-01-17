class CacheManager {
  constructor(config = {}) {
    this.ttl = config.ttl || 300000; // 5 minutes default
    this.maxSize = config.maxSize || 1000; // Max cache entries
    this.enableLogging = config.enableLogging || false;
    
    // Cache structure: { contextKey: { data, timestamp, accessTime } }
    this.cache = new Map();
    
    // Track access order for LRU eviction
    this.accessOrder = [];
    
    this.log('CacheManager initialized', { ttl: this.ttl, maxSize: this.maxSize });
  }

  /**
   * Generate a unique key for the context
   * @param {Object} context - User context object
   * @returns {string} - Unique cache key
   */
  generateCacheKey(context) {
    // Sort keys to ensure consistent cache keys for same context
    const sortedContext = Object.keys(context || {})
      .sort()
      .reduce((result, key) => {
        result[key] = context[key];
        return result;
      }, {});
    
    return JSON.stringify(sortedContext);
  }

  /**
   * Check if cache entry is valid (not expired)
   * @param {Object} entry - Cache entry
   * @returns {boolean} - True if valid, false if expired
   */
  isValidEntry(entry) {
    if (!entry) return false;
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > this.ttl;
    
    if (isExpired) {
      this.log('Cache entry expired', { age: now - entry.timestamp, ttl: this.ttl });
    }
    
    return !isExpired;
  }

  /**
   * Update access order for LRU tracking
   * @param {string} key - Cache key
   */
  updateAccessOrder(key) {
    // Remove key from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Evict least recently used entries if cache is full
   */
  evictIfNecessary() {
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
      this.log('Evicted LRU cache entry', { key: lruKey });
    }
  }

  /**
   * Get flags from cache
   * @param {Object} context - User context
   * @returns {Object|null} - Cached flags or null if not found/expired
   */
  get(context) {
    const key = this.generateCacheKey(context);
    const entry = this.cache.get(key);
    
    if (!this.isValidEntry(entry)) {
      if (entry) {
        // Remove expired entry
        this.cache.delete(key);
        const accessIndex = this.accessOrder.indexOf(key);
        if (accessIndex > -1) {
          this.accessOrder.splice(accessIndex, 1);
        }
      }
      this.log('Cache miss', { key, reason: entry ? 'expired' : 'not_found' });
      return null;
    }
    
    // Update access time and order
    entry.accessTime = Date.now();
    this.updateAccessOrder(key);
    
    this.log('Cache hit', { key, age: Date.now() - entry.timestamp });
    return entry.data;
  }

  /**
   * Store flags in cache
   * @param {Object} context - User context
   * @param {Object} flags - Flags data to cache
   */
  set(context, flags) {
    const key = this.generateCacheKey(context);
    const now = Date.now();
    
    // Evict old entries if necessary
    this.evictIfNecessary();
    
    const entry = {
      data: flags,
      timestamp: now,
      accessTime: now
    };
    
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    
    this.log('Cache set', { key, flagCount: Object.keys(flags || {}).length });
  }

  /**
   * Check if flags are cached for given context
   * @param {Object} context - User context
   * @returns {boolean} - True if valid cache exists
   */
  has(context) {
    const key = this.generateCacheKey(context);
    const entry = this.cache.get(key);
    return this.isValidEntry(entry);
  }

  /**
   * Invalidate cache for specific context
   * @param {Object} context - User context (optional, clears all if not provided)
   */
  invalidate(context = null) {
    if (context === null) {
      // Clear all cache
      const size = this.cache.size;
      this.cache.clear();
      this.accessOrder = [];
      this.log('Cache cleared completely', { clearedEntries: size });
    } else {
      // Clear specific context
      const key = this.generateCacheKey(context);
      const deleted = this.cache.delete(key);
      
      if (deleted) {
        const accessIndex = this.accessOrder.indexOf(key);
        if (accessIndex > -1) {
          this.accessOrder.splice(accessIndex, 1);
        }
        this.log('Cache invalidated', { key });
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [, entry] of this.cache.entries()) {
      if (this.isValidEntry(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize,
      ttl: this.ttl,
      accessOrderLength: this.accessOrder.length
    };
  }

  /**
   * Clean up expired entries
   * @returns {number} - Number of entries cleaned
   */
  cleanup() {
    let cleanedCount = 0;
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      const accessIndex = this.accessOrder.indexOf(key);
      if (accessIndex > -1) {
        this.accessOrder.splice(accessIndex, 1);
      }
      cleanedCount++;
    });
    
    if (cleanedCount > 0) {
      this.log('Cache cleanup completed', { cleanedEntries: cleanedCount });
    }
    
    return cleanedCount;
  }

  /**
   * Update TTL for cache
   * @param {number} newTtl - New TTL in milliseconds
   */
  updateTTL(newTtl) {
    this.ttl = newTtl;
    this.log('TTL updated', { newTtl });
  }

  /**
   * Log cache operations (if logging enabled)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(message, data = {}) {
    if (this.enableLogging) {
      console.log(`[CacheManager] ${message}`, data);
    }
  }
}

module.exports = CacheManager;