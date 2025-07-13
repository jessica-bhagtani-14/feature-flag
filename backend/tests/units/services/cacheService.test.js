// tests/unit/services/cacheService.test.js
const assert = require('assert');

class MockCacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    if (ttlSeconds > 0) {
      const expiry = Date.now() + (ttlSeconds * 1000);
      this.ttl.set(key, expiry);
    }
    return true;
  }

  async get(key) {
    // Check if expired
    const expiry = this.ttl.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key) || null;
  }

  async del(key) {
    this.ttl.delete(key);
    return this.cache.delete(key);
  }

  async exists(key) {
    return this.cache.has(key);
  }

  async flushAll() {
    this.cache.clear();
    this.ttl.clear();
    return true;
  }

  async setHash(key, field, value) {
    let hash = this.cache.get(key);
    if (!hash || typeof hash !== 'object') {
      hash = {};
    }
    hash[field] = value;
    this.cache.set(key, hash);
    return true;
  }

  async getHash(key, field) {
    const hash = this.cache.get(key);
    if (!hash || typeof hash !== 'object') return null;
    return hash[field] || null;
  }
}

async function runCacheServiceTests() {
  console.log('💾 Testing Cache Service...');
  const cacheService = new MockCacheService();
  
  try {
    // Test basic set/get
    await cacheService.set('test-key', 'test-value');
    let value = await cacheService.get('test-key');
    assert(value === 'test-value', 'Cache should store and retrieve values');
    console.log('  ✅ Basic cache set/get test passed');
    
    // Test object storage
    const testObj = { flag: 'test', enabled: true };
    await cacheService.set('test-obj', testObj);
    const retrievedObj = await cacheService.get('test-obj');
    assert(retrievedObj.flag === 'test', 'Cache should store objects');
    console.log('  ✅ Object storage test passed');
    
    // Test exists
    let exists = await cacheService.exists('test-key');
    assert(exists === true, 'Exists should return true for stored key');
    
    exists = await cacheService.exists('non-existent');
    assert(exists === false, 'Exists should return false for missing key');
    console.log('  ✅ Exists check test passed');
    
    // Test delete
    await cacheService.del('test-key');
    value = await cacheService.get('test-key');
    assert(value === null, 'Deleted key should return null');
    console.log('  ✅ Delete test passed');
    
    // Test hash operations
    await cacheService.setHash('app:1', 'feature-a', true);
    await cacheService.setHash('app:1', 'feature-b', false);
    
    let hashValue = await cacheService.getHash('app:1', 'feature-a');
    assert(hashValue === true, 'Hash field should return correct value');
    console.log('  ✅ Hash operations test passed');
    
    // Test flush all
    await cacheService.set('temp-key', 'temp-value');
    await cacheService.flushAll();
    
    value = await cacheService.get('temp-key');
    hashValue = await cacheService.getHash('app:1', 'feature-a');
    assert(value === null && hashValue === null, 'Flush should clear all data');
    console.log('  ✅ Flush all test passed');
    
    console.log('✅ Cache Service tests completed\n');
    
  } catch (error) {
    console.error('❌ Cache Service test failed:', error.message);
    throw error;
  }
}

module.exports = { runCacheServiceTests };

