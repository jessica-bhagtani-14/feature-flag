export default class CacheManager {
  constructor(config = {}) {
    this.ttl = config.ttl || 300000; // 5 minutes default
    this.maxSize = config.maxSize || 1000; // Max cache entries
    this.enableLogging = config.enableLogging || false;

    this.cache = new Map();
    this.accessOrder = [];

    this.log('CacheManager initialized', {
      ttl: this.ttl,
      maxSize: this.maxSize
    });
  }

  generateCacheKey(context) {
    const sortedContext = Object.keys(context || {})
      .sort()
      .reduce((result, key) => {
        result[key] = context[key];
        return result;
      }, {});

    return JSON.stringify(sortedContext);
  }

  isValidEntry(entry) {
    if (!entry) return false;

    const now = Date.now();
    const isExpired = now - entry.timestamp > this.ttl;

    if (isExpired) {
      this.log('Cache entry expired', {
        age: now - entry.timestamp,
        ttl: this.ttl
      });
    }

    return !isExpired;
  }

  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) this.accessOrder.splice(index, 1);
    this.accessOrder.push(key);
  }

  evictIfNecessary() {
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
      this.log('Evicted LRU cache entry', { key: lruKey });
    }
  }

  get(context) {
    const key = this.generateCacheKey(context);
    const entry = this.cache.get(key);

    if (!this.isValidEntry(entry)) {
      if (entry) {
        this.cache.delete(key);
        const i = this.accessOrder.indexOf(key);
        if (i > -1) this.accessOrder.splice(i, 1);
      }
      this.log('Cache miss', {
        key,
        reason: entry ? 'expired' : 'not_found'
      });
      return null;
    }

    entry.accessTime = Date.now();
    this.updateAccessOrder(key);

    this.log('Cache hit', {
      key,
      age: Date.now() - entry.timestamp
    });

    return entry.data;
  }

  set(context, flags) {
    const key = this.generateCacheKey(context);
    const now = Date.now();

    this.evictIfNecessary();

    this.cache.set(key, {
      data: flags,
      timestamp: now,
      accessTime: now
    });

    this.updateAccessOrder(key);
    this.log('Cache set', {
      key,
      flagCount: Object.keys(flags || {}).length
    });
  }

  has(context) {
    const key = this.generateCacheKey(context);
    return this.isValidEntry(this.cache.get(key));
  }

  invalidate(context = null) {
    if (context === null) {
      const size = this.cache.size;
      this.cache.clear();
      this.accessOrder = [];
      this.log('Cache cleared completely', { clearedEntries: size });
    } else {
      const key = this.generateCacheKey(context);
      const deleted = this.cache.delete(key);
      if (deleted) {
        const i = this.accessOrder.indexOf(key);
        if (i > -1) this.accessOrder.splice(i, 1);
        this.log('Cache invalidated', { key });
      }
    }
  }

  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      this.isValidEntry(entry) ? validEntries++ : expiredEntries++;
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

  cleanup() {
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(key);
        const i = this.accessOrder.indexOf(key);
        if (i > -1) this.accessOrder.splice(i, 1);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.log('Cache cleanup completed', { cleanedEntries: cleaned });
    }
    return cleaned;
  }

  updateTTL(newTtl) {
    this.ttl = newTtl;
    this.log('TTL updated', { newTtl });
  }

  log(message, data = {}) {
    if (this.enableLogging) {
      console.log(`[CacheManager] ${message}`, data);
    }
  }
}
