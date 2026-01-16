// SDK entry point
const FeatureFlagClient = require('./FeatureFlagClient');
const CacheManager = require('./CacheManager');

module.exports = {
  FeatureFlagClient,
  CacheManager,
  // Export as default for convenience
  default: FeatureFlagClient
};

// Also allow direct import
module.exports.FeatureFlagClient = FeatureFlagClient;
module.exports.CacheManager = CacheManager;