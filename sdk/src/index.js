// SDK entry point
const FeatureFlagClient = require('./FeatureFlagClient');

module.exports = {
  FeatureFlagClient,
  // Export as default for convenience
  default: FeatureFlagClient
};

// Also allow direct import
module.exports.FeatureFlagClient = FeatureFlagClient;