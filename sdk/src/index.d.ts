declare module '@jessica_bhagtani/feature-flag' {
  export interface CacheConfig {
    ttl?: number;
    maxSize?: number;
    enableLogging?: boolean;
  }

  export interface CacheStats {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    maxSize: number;
    ttl: number;
    accessOrderLength: number;
  }

  export class CacheManager {
    constructor(config?: CacheConfig);
    generateCacheKey(context: Record<string, any>): string;
    isValidEntry(entry: any): boolean;
    updateAccessOrder(key: string): void;
    evictIfNecessary(): void;
    get(context: Record<string, any>): any | null;
    set(context: Record<string, any>, flags: any): void;
    has(context: Record<string, any>): boolean;
    invalidate(context?: Record<string, any> | null): void;
    getStats(): CacheStats;
    cleanup(): number;
    updateTTL(newTtl: number): void;
    log(message: string, data?: Record<string, any>): void;
  }

  export interface FeatureFlagConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    cacheTTL?: number;
    cacheMaxSize?: number;
    enableCacheLogging?: boolean;
    enableCache?: boolean;
    enableBackgroundRefresh?: boolean;
    backgroundRefreshInterval?: number;
  }

  export interface FlagDetails {
    enabled: boolean;
    flagKey: string;
    flagName: string;
    reason: string;
    ruleType: string;
    ruleId: string;
    flagId: string;
  }

  export interface GetAllFlagsOptions {
    forceRefresh?: boolean;
  }

  export class FeatureFlagClient {
    constructor(config: FeatureFlagConfig);
    fetchFlagsFromAPI(context: Record<string, any>): Promise<Record<string, any>>;
    getAllFlags(context?: Record<string, any>, options?: GetAllFlagsOptions): Promise<Record<string, any>>;
    startBackgroundRefresh(context?: Record<string, any>): void;
    stopBackgroundRefresh(): void;
    isEnabled(flagKey: string, flags: Record<string, any>): boolean;
    getFlag(flagKey: string, flags: Record<string, any>): FlagDetails | null;
    getEnabledFlags(flags: Record<string, any>): string[];
    checkMultiple(flagKeys: string[], flags: Record<string, any>): Record<string, boolean>;
    invalidateCache(context?: Record<string, any> | null): void;
    getCacheStats(): CacheStats | null;
    cleanupCache(): number | null;
    updateCacheTTL(newTtl: number): void;
    healthCheck(): Promise<boolean>;
    destroy(): void;
  }

  export default FeatureFlagClient;
}