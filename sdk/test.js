const { FeatureFlagClient, CacheManager } = require('./src/index');

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (condition) {
    log(`✓ ${message}`, 'green');
  } else {
    log(`✗ ${message}`, 'red');
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Test Suite
async function runTests() {
  log('\n=== Feature Flag SDK Test Suite ===\n', 'blue');

  try {
    // Test 1: CacheManager Basic Operations
    log('Test 1: CacheManager Basic Operations', 'yellow');
    const cache = new CacheManager({ ttl: 1000, maxSize: 3 });
    
    const context1 = { user_id: '123' };
    const flags1 = { feature1: { enabled: true } };
    
    cache.set(context1, flags1);
    const retrieved = cache.get(context1);
    assert(retrieved !== null, 'Cache should return stored value');
    assert(retrieved.feature1.enabled === true, 'Cached value should match');
    assert(cache.has(context1), 'Cache should contain the context');
    
    // Test 2: Cache Expiration
    log('\nTest 2: Cache Expiration', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 1100));
    const expired = cache.get(context1);
    assert(expired === null, 'Cache should expire after TTL');
    
    // Test 3: Cache LRU Eviction
    log('\nTest 3: Cache LRU Eviction', 'yellow');
    const cache2 = new CacheManager({ ttl: 60000, maxSize: 2 });
    cache2.set({ user_id: '1' }, { flag1: { enabled: true } });
    cache2.set({ user_id: '2' }, { flag2: { enabled: true } });
    cache2.set({ user_id: '3' }, { flag3: { enabled: true } });
    
    const stats = cache2.getStats();
    assert(stats.totalEntries <= 2, 'Cache should not exceed maxSize');
    assert(!cache2.has({ user_id: '1' }), 'LRU item should be evicted');
    
    // Test 4: Cache Key Generation
    log('\nTest 4: Cache Key Generation', 'yellow');
    const cache3 = new CacheManager();
    const key1 = cache3.generateCacheKey({ user_id: '123', region: 'US' });
    const key2 = cache3.generateCacheKey({ region: 'US', user_id: '123' });
    assert(key1 === key2, 'Cache keys should be consistent regardless of property order');
    
    // Test 5: Cache Invalidation
    log('\nTest 5: Cache Invalidation', 'yellow');
    cache3.set({ user_id: '100' }, { flag: { enabled: true } });
    cache3.set({ user_id: '200' }, { flag: { enabled: false } });
    cache3.invalidate({ user_id: '100' });
    assert(!cache3.has({ user_id: '100' }), 'Specific context should be invalidated');
    assert(cache3.has({ user_id: '200' }), 'Other contexts should remain');
    
    cache3.invalidate();
    assert(cache3.getStats().totalEntries === 0, 'All cache should be cleared');
    
    // Test 6: Cache Cleanup
    log('\nTest 6: Cache Cleanup', 'yellow');
    const cache4 = new CacheManager({ ttl: 100 });
    cache4.set({ user_id: '1' }, { flag: { enabled: true } });
    cache4.set({ user_id: '2' }, { flag: { enabled: true } });
    await new Promise(resolve => setTimeout(resolve, 150));
    const cleaned = cache4.cleanup();
    assert(cleaned === 2, 'Cleanup should remove all expired entries');
    
    // Test 7: FeatureFlagClient Initialization
    log('\nTest 7: FeatureFlagClient Initialization', 'yellow');
    try {
      new FeatureFlagClient();
      assert(false, 'Should throw error without config');
    } catch (error) {
      assert(error.message === 'Configuration is required', 'Should require configuration');
    }
    
    try {
      new FeatureFlagClient({});
      assert(false, 'Should throw error without API key');
    } catch (error) {
      assert(error.message === 'API key is required', 'Should require API key');
    }
    
    const client = new FeatureFlagClient({
      apiKey: 'test-key',
      baseUrl: 'http://localhost:3001/api',
      enableCache: true,
      cacheTTL: 300000
    });
    assert(client !== null, 'Client should initialize with valid config');
    
    // Test 8: Flag Check Methods
    log('\nTest 8: Flag Check Methods', 'yellow');
    const mockFlags = {
      'feature-a': { enabled: true, flag_key: 'feature-a', flag_name: 'Feature A' },
      'feature-b': { enabled: false, flag_key: 'feature-b', flag_name: 'Feature B' },
      'feature-c': { enabled: true, flag_key: 'feature-c', flag_name: 'Feature C' }
    };
    
    assert(client.isEnabled('feature-a', mockFlags) === true, 'Should detect enabled flag');
    assert(client.isEnabled('feature-b', mockFlags) === false, 'Should detect disabled flag');
    assert(client.isEnabled('nonexistent', mockFlags) === false, 'Should return false for missing flag');
    
    // Test 9: Get Flag Details
    log('\nTest 9: Get Flag Details', 'yellow');
    const flagDetails = client.getFlag('feature-a', mockFlags);
    assert(flagDetails !== null, 'Should return flag details');
    assert(flagDetails.enabled === true, 'Flag details should have correct enabled status');
    assert(flagDetails.flagKey === 'feature-a', 'Flag details should have correct key');
    
    // Test 10: Get Enabled Flags
    log('\nTest 10: Get Enabled Flags', 'yellow');
    const enabledFlags = client.getEnabledFlags(mockFlags);
    assert(Array.isArray(enabledFlags), 'Should return an array');
    assert(enabledFlags.length === 2, 'Should return only enabled flags');
    assert(enabledFlags.includes('feature-a'), 'Should include feature-a');
    assert(enabledFlags.includes('feature-c'), 'Should include feature-c');
    assert(!enabledFlags.includes('feature-b'), 'Should not include disabled feature-b');
    
    // Test 11: Check Multiple Flags
    log('\nTest 11: Check Multiple Flags', 'yellow');
    const results = client.checkMultiple(['feature-a', 'feature-b', 'feature-c'], mockFlags);
    assert(results['feature-a'] === true, 'Should correctly check feature-a');
    assert(results['feature-b'] === false, 'Should correctly check feature-b');
    assert(results['feature-c'] === true, 'Should correctly check feature-c');
    
    // Test 12: Invalid Input Handling
    log('\nTest 12: Invalid Input Handling', 'yellow');
    assert(client.isEnabled('', mockFlags) === false, 'Should handle empty flag key');
    assert(client.isEnabled('test', null) === false, 'Should handle null flags');
    assert(client.getFlag('', mockFlags) === null, 'Should return null for empty key');
    assert(client.getEnabledFlags(null).length === 0, 'Should return empty array for null flags');
    assert(Object.keys(client.checkMultiple('not-array', mockFlags)).length === 0, 'Should handle invalid input');
    
    // Test 13: Cache Integration with Client
    log('\nTest 13: Cache Integration with Client', 'yellow');
    const clientWithCache = new FeatureFlagClient({
      apiKey: 'test-key',
      enableCache: true,
      cacheTTL: 5000
    });
    
    const cacheStats = clientWithCache.getCacheStats();
    assert(cacheStats !== null, 'Should return cache stats when cache is enabled');
    assert(typeof cacheStats.totalEntries === 'number', 'Stats should include total entries');
    
    // Test 14: Update Cache TTL
    log('\nTest 14: Update Cache TTL', 'yellow');
    try {
      clientWithCache.updateCacheTTL(10000);
      assert(true, 'Should update cache TTL successfully');
    } catch (error) {
      assert(false, 'Should not throw error on valid TTL update');
    }
    
    try {
      clientWithCache.updateCacheTTL(-1000);
      assert(false, 'Should throw error for negative TTL');
    } catch (error) {
      assert(error.message === 'TTL must be a positive number', 'Should validate TTL value');
    }
    
    // Test 15: Background Refresh Setup
    log('\nTest 15: Background Refresh Setup', 'yellow');
    const clientWithBgRefresh = new FeatureFlagClient({
      apiKey: 'test-key',
      enableCache: true,
      enableBackgroundRefresh: true,
      backgroundRefreshInterval: 1000
    });
    
    clientWithBgRefresh.startBackgroundRefresh({ user_id: '123' });
    assert(clientWithBgRefresh.backgroundRefreshTimer !== null, 'Background refresh timer should be set');
    
    clientWithBgRefresh.stopBackgroundRefresh();
    assert(clientWithBgRefresh.backgroundRefreshTimer === null, 'Background refresh timer should be cleared');
    
    // Test 16: Client Cleanup
    log('\nTest 16: Client Cleanup', 'yellow');
    const clientToDestroy = new FeatureFlagClient({
      apiKey: 'test-key',
      enableCache: true,
      enableBackgroundRefresh: true
    });
    
    clientToDestroy.startBackgroundRefresh({ user_id: '123' });
    clientToDestroy.destroy();
    assert(clientToDestroy.backgroundRefreshTimer === null, 'Destroy should stop background refresh');
    assert(clientToDestroy.currentContext === null, 'Destroy should clear context');
    
    // Test 17: Cache Disabled Scenarios
    log('\nTest 17: Cache Disabled Scenarios', 'yellow');
    const clientNoCache = new FeatureFlagClient({
      apiKey: 'test-key',
      enableCache: false
    });
    
    assert(clientNoCache.getCacheStats() === null, 'Should return null when cache disabled');
    assert(clientNoCache.cleanupCache() === null, 'Cleanup should return null when cache disabled');
    
    log('\n=== All Tests Passed! ===\n', 'green');
    
  } catch (error) {
    log(`\n=== Test Failed ===`, 'red');
    log(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();