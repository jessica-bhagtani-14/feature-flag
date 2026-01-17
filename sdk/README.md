Feature Flag SDK
A powerful and flexible feature flag SDK client with built-in caching, background refresh, and graceful degradation capabilities.

Features
🚀 Simple API - Easy-to-use methods for flag evaluation
💾 Smart Caching - Built-in LRU cache with configurable TTL
🔄 Background Refresh - Automatic cache updates in the background
🛡️ Graceful Degradation - Returns cached data when API is unavailable
📊 Cache Statistics - Monitor cache performance
🔌 Health Checks - Verify API connectivity
📝 TypeScript Support - Full TypeScript definitions included
Installation
bash
npm install @yourcompany/feature-flag-sdk
Quick Start
javascript
const { FeatureFlagClient } = require('@yourcompany/feature-flag-sdk');

// Initialize the client
const client = new FeatureFlagClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-api-url.com/api',
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
});

// Fetch all flags for a user
const context = {
  user_id: '12345',
  region: 'US',
  role: 'premium'
};

const flags = await client.getAllFlags(context);

// Check if a specific flag is enabled
if (client.isEnabled('new-dashboard', flags)) {
  console.log('Show new dashboard!');
}
Configuration Options
Option	Type	Default	Description
apiKey	string	required	Your API authentication key
baseUrl	string	http://localhost:3001/api	Base URL of your feature flag API
timeout	number	5000	Request timeout in milliseconds
enableCache	boolean	true	Enable/disable caching
cacheTTL	number	300000	Cache time-to-live in milliseconds (5 min)
cacheMaxSize	number	1000	Maximum number of cache entries
enableCacheLogging	boolean	false	Enable cache operation logging
enableBackgroundRefresh	boolean	false	Enable automatic background cache refresh
backgroundRefreshInterval	number	240000	Background refresh interval in ms (4 min)
Usage Examples
Basic Flag Evaluation
javascript
const flags = await client.getAllFlags({
  user_id: '12345',
  region: 'US'
});

// Check if a flag is enabled
if (client.isEnabled('dark-mode', flags)) {
  // Enable dark mode
}

// Get detailed flag information
const flagDetails = client.getFlag('beta-features', flags);
console.log(flagDetails);
// {
//   enabled: true,
//   flagKey: 'beta-features',
//   flagName: 'Beta Features',
//   reason: 'rule_match',
//   ruleType: 'user_segment',
//   ruleId: 'rule_123',
//   flagId: 'flag_456'
// }
Check Multiple Flags
javascript
const flags = await client.getAllFlags(context);

const results = client.checkMultiple(
  ['feature-a', 'feature-b', 'feature-c'],
  flags
);

console.log(results);
// { 'feature-a': true, 'feature-b': false, 'feature-c': true }
Get All Enabled Flags
javascript
const flags = await client.getAllFlags(context);
const enabledFlags = client.getEnabledFlags(flags);

console.log(enabledFlags);
// ['dark-mode', 'beta-features', 'new-dashboard']
Force Refresh (Bypass Cache)
javascript
const flags = await client.getAllFlags(context, { 
  forceRefresh: true 
});
Background Refresh
javascript
const client = new FeatureFlagClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-api-url.com/api',
  enableBackgroundRefresh: true,
  backgroundRefreshInterval: 240000, // 4 minutes
});

// Start background refresh for a specific context
client.startBackgroundRefresh({
  user_id: '12345',
  region: 'US'
});

// Your cache will now be automatically updated every 4 minutes

// Stop background refresh when done
client.stopBackgroundRefresh();
Cache Management
javascript
// Get cache statistics
const stats = client.getCacheStats();
console.log(stats);
// {
//   totalEntries: 45,
//   validEntries: 42,
//   expiredEntries: 3,
//   maxSize: 1000,
//   ttl: 300000,
//   accessOrderLength: 45
// }

// Clean up expired cache entries
const cleaned = client.cleanupCache();
console.log(`Cleaned ${cleaned} expired entries`);

// Invalidate specific context cache
client.invalidateCache({ user_id: '12345' });

// Clear all cache
client.invalidateCache();

// Update cache TTL dynamically
client.updateCacheTTL(600000); // 10 minutes
Health Check
javascript
const isHealthy = await client.healthCheck();
if (isHealthy) {
  console.log('API is reachable');
} else {
  console.log('API is down');
}
Cleanup
javascript
// Clean up resources before shutting down
client.destroy();
Error Handling
The SDK implements graceful degradation. When the API is unavailable:

Returns cached data (even if expired) as fallback
Returns empty object {} if no cache is available
Logs errors to console for debugging
javascript
try {
  const flags = await client.getAllFlags(context);
  // Will return cached data or {} if API fails
} catch (error) {
  // Handle any unexpected errors
  console.error('Unexpected error:', error);
}
TypeScript Support
The SDK includes full TypeScript definitions:

typescript
import { FeatureFlagClient, FeatureFlagConfig, FlagDetails } from '@yourcompany/feature-flag-sdk';

const config: FeatureFlagConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://your-api-url.com/api',
  enableCache: true,
};

const client = new FeatureFlagClient(config);

const flags = await client.getAllFlags({ user_id: '12345' });
const flagDetails: FlagDetails | null = client.getFlag('my-flag', flags);
Best Practices
Use Caching: Keep caching enabled in production to reduce API calls and improve performance
Background Refresh: Enable background refresh for frequently accessed contexts
Context Consistency: Use the same context structure throughout your application
Health Checks: Periodically check API health in production
Cleanup: Call destroy() before shutting down your application
Monitor Cache: Use getCacheStats() to monitor cache performance
API Reference
FeatureFlagClient
Constructor
javascript
new FeatureFlagClient(config)
Methods
getAllFlags(context, options) - Fetch all flags for a context
isEnabled(flagKey, flags) - Check if a specific flag is enabled
getFlag(flagKey, flags) - Get detailed flag information
getEnabledFlags(flags) - Get array of all enabled flag keys
checkMultiple(flagKeys, flags) - Check multiple flags at once
startBackgroundRefresh(context) - Start automatic cache refresh
stopBackgroundRefresh() - Stop automatic cache refresh
invalidateCache(context) - Invalidate cache for context (or all)
getCacheStats() - Get cache statistics
cleanupCache() - Remove expired cache entries
updateCacheTTL(newTtl) - Update cache TTL
healthCheck() - Check API connectivity
destroy() - Cleanup resources
CacheManager
The CacheManager class is also exported if you need direct cache management:

javascript
const { CacheManager } = require('@yourcompany/feature-flag-sdk');

const cache = new CacheManager({
  ttl: 300000,
  maxSize: 1000,
  enableLogging: true
});
License
MIT

Support
For issues and questions, please visit: GitHub Issues

