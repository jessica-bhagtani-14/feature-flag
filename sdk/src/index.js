// sdk/src/index.js
import * as FeatureFlagClientNS from './FeatureFlagClient.js';
import * as CacheManagerNS from './CacheManager.js';

const FeatureFlagClient =
  FeatureFlagClientNS.default ?? FeatureFlagClientNS;

const CacheManager =
  CacheManagerNS.default ?? CacheManagerNS;

export { FeatureFlagClient, CacheManager };
export default FeatureFlagClient;