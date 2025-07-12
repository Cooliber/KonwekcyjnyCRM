/**
 * Advanced Caching Strategy for HVAC CRM Platform
 * Implements multi-layer caching with Warsaw district optimization
 * Target: 25% server cost reduction, 99.9% uptime
 */

// Cache configuration based on Warsaw districts and data types
export const CACHE_CONFIG = {
  // District-based cache priorities (lower = higher priority = shorter TTL)
  DISTRICT_PRIORITIES: {
    Śródmieście: 1, // Highest priority - business district
    Wilanów: 2, // High affluence area
    Mokotów: 3, // High affluence area
    Żoliborz: 4, // Medium affluence
    Ursynów: 5, // Medium affluence
    Wola: 6, // Medium priority
    "Praga-Południe": 7, // Lower priority
    Targówek: 8, // Lowest priority
  },

  // Base TTL values in milliseconds
  BASE_TTL: {
    CRITICAL: 30 * 1000, // 30 seconds for critical data
    HIGH: 2 * 60 * 1000, // 2 minutes for high priority
    MEDIUM: 5 * 60 * 1000, // 5 minutes for medium priority
    LOW: 15 * 60 * 1000, // 15 minutes for low priority
    STATIC: 60 * 60 * 1000, // 1 hour for static data
  },

  // Data type classifications
  DATA_TYPES: {
    EMERGENCY: "CRITICAL",
    NOTIFICATIONS: "HIGH",
    MESSAGES: "MEDIUM",
    CONTACTS: "MEDIUM",
    JOBS: "MEDIUM",
    QUOTES: "LOW",
    REPORTS: "LOW",
    SETTINGS: "STATIC",
  },

  // Cache size limits
  LIMITS: {
    MAX_ENTRIES: 1000,
    CLEANUP_THRESHOLD: 800,
    MAX_MEMORY_MB: 50,
  },
};

// Multi-layer cache implementation
class MultiLayerCache {
  private l1Cache = new Map<string, CacheEntry>(); // In-memory cache
  private l2Cache = new Map<string, CacheEntry>(); // Compressed cache
  private hitStats = new Map<string, number>();
  private totalHits = 0;
  private totalMisses = 0;

  // Get data from cache with automatic promotion
  get(key: string): unknown {
    // Try L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      this.recordHit(key);
      l1Entry.lastAccessed = Date.now();
      l1Entry.accessCount++;
      return l1Entry.data;
    }

    // Try L2 cache
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && !this.isExpired(l2Entry)) {
      // Promote to L1 if frequently accessed
      if (l2Entry.accessCount > 3) {
        this.promoteToL1(key, l2Entry);
      }
      this.recordHit(key);
      l2Entry.lastAccessed = Date.now();
      l2Entry.accessCount++;
      return l2Entry.data;
    }

    this.recordMiss(key);
    return null;
  }

  // Set data in cache with intelligent placement
  set(key: string, data: any, ttl: number, metadata: CacheMetadata = {}): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      lastAccessed: Date.now(),
      accessCount: 1,
      size: this.estimateSize(data),
      metadata,
    };

    // Determine cache layer based on data characteristics
    if (this.shouldUseL1(entry)) {
      this.l1Cache.set(key, entry);
      this.l2Cache.delete(key); // Remove from L2 if exists
    } else {
      this.l2Cache.set(key, entry);
    }

    // Cleanup if necessary
    this.cleanup();
  }

  // Remove from cache
  delete(key: string): boolean {
    const l1Deleted = this.l1Cache.delete(key);
    const l2Deleted = this.l2Cache.delete(key);
    return l1Deleted || l2Deleted;
  }

  // Clear cache with optional pattern
  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.l1Cache.keys()) {
        if (regex.test(key)) this.l1Cache.delete(key);
      }
      for (const key of this.l2Cache.keys()) {
        if (regex.test(key)) this.l2Cache.delete(key);
      }
    } else {
      this.l1Cache.clear();
      this.l2Cache.clear();
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const totalRequests = this.totalHits + this.totalMisses;
    const hitRate = totalRequests > 0 ? this.totalHits / totalRequests : 0;

    return {
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      totalSize: this.l1Cache.size + this.l2Cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      memoryUsage: this.calculateMemoryUsage(),
      topKeys: this.getTopAccessedKeys(),
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private shouldUseL1(entry: CacheEntry): boolean {
    // Use L1 for critical data, small size, or high access frequency
    return (
      entry.metadata.priority === "CRITICAL" ||
      entry.size < 1024 || // Less than 1KB
      entry.metadata.district === "Śródmieście" ||
      entry.metadata.dataType === "EMERGENCY"
    );
  }

  private promoteToL1(key: string, entry: CacheEntry): void {
    this.l1Cache.set(key, entry);
    this.l2Cache.delete(key);
  }

  private recordHit(key: string): void {
    this.totalHits++;
    this.hitStats.set(key, (this.hitStats.get(key) || 0) + 1);
  }

  private recordMiss(_key: string): void {
    this.totalMisses++;
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.l1Cache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.l2Cache.values()) {
      totalSize += entry.size;
    }
    return Math.round((totalSize / 1024 / 1024) * 100) / 100; // MB
  }

  private getTopAccessedKeys(): string[] {
    return Array.from(this.hitStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => key);
  }

  private cleanup(): void {
    const totalEntries = this.l1Cache.size + this.l2Cache.size;

    if (totalEntries > CACHE_CONFIG.LIMITS.CLEANUP_THRESHOLD) {
      this.evictLeastUsed();
    }

    // Remove expired entries
    this.removeExpired();
  }

  private evictLeastUsed(): void {
    // Evict from L2 first (least recently used)
    const l2Entries = Array.from(this.l2Cache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    const toEvict = Math.min(100, l2Entries.length);
    for (let i = 0; i < toEvict; i++) {
      this.l2Cache.delete(l2Entries[i][0]);
    }

    // If still too large, evict from L1
    if (this.l1Cache.size + this.l2Cache.size > CACHE_CONFIG.LIMITS.CLEANUP_THRESHOLD) {
      const l1Entries = Array.from(this.l1Cache.entries()).sort(
        (a, b) => a[1].lastAccessed - b[1].lastAccessed
      );

      const l1ToEvict = Math.min(50, l1Entries.length);
      for (let i = 0; i < l1ToEvict; i++) {
        this.l1Cache.delete(l1Entries[i][0]);
      }
    }
  }

  private removeExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.l1Cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.l1Cache.delete(key);
      }
    }

    for (const [key, entry] of this.l2Cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.l2Cache.delete(key);
      }
    }
  }
}

// Cache utility functions
export class CacheManager {
  private cache = new MultiLayerCache();

  // Calculate optimal TTL based on district and data type
  calculateTTL(dataType: string, district?: string, priority?: string): number {
    let baseTTL = CACHE_CONFIG.BASE_TTL[CACHE_CONFIG.DATA_TYPES[dataType] || "MEDIUM"];

    // Adjust for district priority
    if (district && CACHE_CONFIG.DISTRICT_PRIORITIES[district]) {
      const districtMultiplier = CACHE_CONFIG.DISTRICT_PRIORITIES[district] * 0.2 + 0.8;
      baseTTL *= districtMultiplier;
    }

    // Adjust for explicit priority
    if (priority === "urgent") {
      baseTTL *= 0.5; // Shorter TTL for urgent data
    } else if (priority === "low") {
      baseTTL *= 2; // Longer TTL for low priority data
    }

    return Math.round(baseTTL);
  }

  // Generate cache key with consistent format
  generateKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join("|");

    return `${type}:${sortedParams}`;
  }

  // Get cached data
  get(key: string): unknown {
    return this.cache.get(key);
  }

  // Set cached data with metadata
  set(key: string, data: any, options: CacheOptions = {}): void {
    const ttl =
      options.ttl ||
      this.calculateTTL(options.dataType || "MEDIUM", options.district, options.priority);

    const metadata: CacheMetadata = {
      dataType: options.dataType,
      district: options.district,
      priority: options.priority,
      tags: options.tags || [],
    };

    this.cache.set(key, data, ttl, metadata);
  }

  // Invalidate cache by pattern or tags
  invalidate(pattern?: string, tags?: string[]): void {
    if (pattern) {
      this.cache.clear(pattern);
    }

    if (tags && tags.length > 0) {
      // Implementation for tag-based invalidation would go here
      // For now, we'll use pattern matching
      const tagPattern = tags.join("|");
      this.cache.clear(tagPattern);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  // Preload critical data
  async preloadCriticalData(dataLoader: (key: string) => Promise<any>): Promise<void> {
    const criticalKeys = ["emergency_contacts", "district_technicians", "active_emergencies"];

    const preloadPromises = criticalKeys.map(async (key) => {
      try {
        const data = await dataLoader(key);
        this.set(key, data, {
          dataType: "EMERGENCY",
          priority: "urgent",
          ttl: CACHE_CONFIG.BASE_TTL.CRITICAL,
        });
      } catch (error) {
        console.error(`Failed to preload ${key}:`, error);
      }
    });

    await Promise.all(preloadPromises);
  }
}

// Types
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  metadata: CacheMetadata;
}

interface CacheMetadata {
  dataType?: string;
  district?: string;
  priority?: string;
  tags?: string[];
}

interface CacheOptions {
  ttl?: number;
  dataType?: string;
  district?: string;
  priority?: string;
  tags?: string[];
}

interface CacheStats {
  l1Size: number;
  l2Size: number;
  totalSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  topKeys: string[];
}

// Export singleton instance
export const cacheManager = new CacheManager();
