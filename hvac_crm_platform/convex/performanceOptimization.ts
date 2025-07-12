import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Performance Optimization Service
 * Implements caching, rate limiting, and cost reduction strategies
 * Target: 99.9% uptime, 25% server cost reduction
 */

// Type definitions for performance configuration
type DistrictName =
  | "Śródmieście"
  | "Wilanów"
  | "Mokotów"
  | "Żoliborz"
  | "Ursynów"
  | "Wola"
  | "Praga-Południe"
  | "Targówek";

interface DistrictCachePriority {
  [key: string]: number;
  Śródmieście: number;
  Wilanów: number;
  Mokotów: number;
  Żoliborz: number;
  Ursynów: number;
  Wola: number;
  "Praga-Południe": number;
  Targówek: number;
}

// Performance configuration
const PERFORMANCE_CONFIG = {
  // Caching TTL (Time To Live) in milliseconds
  CACHE_TTL: {
    HIGH_PRIORITY: 2 * 60 * 1000, // 2 minutes for high-priority data
    MEDIUM_PRIORITY: 5 * 60 * 1000, // 5 minutes for medium-priority data
    LOW_PRIORITY: 15 * 60 * 1000, // 15 minutes for low-priority data
    STATIC_DATA: 60 * 60 * 1000, // 1 hour for static data
  },

  // Rate limiting
  RATE_LIMITS: {
    MESSAGES_PER_MINUTE: 60,
    NOTIFICATIONS_PER_MINUTE: 100,
    API_CALLS_PER_MINUTE: 1000,
    PROPHECY_REQUESTS_PER_HOUR: 50,
  },

  // Warsaw district priority weights for caching
  DISTRICT_CACHE_PRIORITY: {
    Śródmieście: 1.0, // Highest priority - shortest TTL
    Wilanów: 1.1,
    Mokotów: 1.2,
    Żoliborz: 1.3,
    Ursynów: 1.4,
    Wola: 1.5,
    "Praga-Południe": 1.6,
    Targówek: 1.7, // Lowest priority - longest TTL
  } as DistrictCachePriority,

  // Performance thresholds
  THRESHOLDS: {
    MAX_RESPONSE_TIME: 200, // 200ms max response time
    MAX_CONCURRENT_USERS: 500, // 500 concurrent users
    MIN_CACHE_HIT_RATE: 0.8, // 80% cache hit rate
    MAX_DB_QUERIES_PER_REQUEST: 5,
  },
};

// In-memory cache for high-performance data access
const performanceCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    ttl: number;
    hitCount: number;
    district?: string;
  }
>();

// Rate limiting tracking
const rateLimitTracker = new Map<
  string,
  {
    count: number;
    resetTime: number;
  }
>();

// Performance metrics tracking
let performanceMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0,
  rateLimitViolations: 0,
  lastResetTime: Date.now(),
};

// Optimized message retrieval with intelligent caching
export const getOptimizedMessages = query({
  args: {
    channelId: v.optional(v.string()),
    limit: v.optional(v.number()),
    district: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate cache key
    const cacheKey = `messages_${args.channelId || "all"}_${args.limit || 50}_${args.district || "all"}_${userId}`;

    // Check cache first
    const cached = getCachedData(cacheKey, args.district);
    if (cached) {
      recordPerformanceMetric("cache_hit", Date.now() - startTime);
      return cached;
    }

    // Apply rate limiting
    if (!checkRateLimit(userId, "messages")) {
      throw new Error("Rate limit exceeded for messages");
    }

    // Fetch from database with optimizations
    let messagesQuery = ctx.db.query("messages");

    if (args.channelId) {
      messagesQuery = messagesQuery.filter((q) => q.eq(q.field("channelId"), args.channelId));
    }

    if (args.district) {
      messagesQuery = messagesQuery.filter((q) =>
        q.eq(q.field("districtContext.district"), args.district)
      );
    }

    const messages = await messagesQuery.order("desc").take(args.limit || 50);

    // Determine cache TTL based on priority and district
    const ttl = calculateCacheTTL(args.priority, args.district);

    // Cache the result
    setCachedData(cacheKey, messages, ttl, args.district);

    recordPerformanceMetric("cache_miss", Date.now() - startTime);
    return messages;
  },
});

// Optimized notification retrieval with smart batching
export const getOptimizedNotifications = query({
  args: {
    limit: v.optional(v.number()),
    district: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cacheKey = `notifications_${userId}_${args.limit || 50}_${args.district || "all"}_${args.priority || "all"}`;

    // Check cache
    const cached = getCachedData(cacheKey, args.district);
    if (cached) {
      recordPerformanceMetric("cache_hit", Date.now() - startTime);
      return cached;
    }

    // Rate limiting
    if (!checkRateLimit(userId, "notifications")) {
      throw new Error("Rate limit exceeded for notifications");
    }

    // Optimized query with indexes
    let notificationsQuery = ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("userId"), userId));

    if (args.priority) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.eq(q.field("priority"), args.priority)
      );
    }

    if (args.district) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.eq(q.field("districtContext.district"), args.district)
      );
    }

    const notifications = await notificationsQuery.order("desc").take(args.limit || 50);

    // Smart caching based on notification priority
    const ttl =
      args.priority === "urgent"
        ? PERFORMANCE_CONFIG.CACHE_TTL.HIGH_PRIORITY
        : calculateCacheTTL("medium", args.district);

    setCachedData(cacheKey, notifications, ttl, args.district);

    recordPerformanceMetric("cache_miss", Date.now() - startTime);
    return notifications;
  },
});

// Batch operations for improved performance
export const batchCreateNotifications = mutation({
  args: {
    notifications: v.array(
      v.object({
        userId: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.string(),
        priority: v.optional(v.string()),
        district: v.optional(v.string()),
      })
    ),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Rate limiting for batch operations
    if (!checkRateLimit(userId, "batch_notifications")) {
      throw new Error("Rate limit exceeded for batch operations");
    }

    const batchSize = args.batchSize || 10;
    const results = [];

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < args.notifications.length; i += batchSize) {
      const batch = args.notifications.slice(i, i + batchSize);

      const batchPromises = batch.map((notification) =>
        ctx.db.insert("notifications", {
          ...notification,
          priority: (notification.priority as any) || "medium",
          type: notification.type as any,
          read: false,
          districtContext: notification.district
            ? {
                district: notification.district,
                affluenceLevel: 5,
                priorityMultiplier: 1.0,
              }
            : undefined,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Invalidate relevant caches
      invalidateDistrictCache(batch[0]?.district);
    }

    return {
      created: results.length,
      batchCount: Math.ceil(args.notifications.length / batchSize),
    };
  },
});

// Performance monitoring and metrics
export const getPerformanceMetrics = query({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cacheHitRate =
      performanceMetrics.totalRequests > 0
        ? performanceMetrics.cacheHits / performanceMetrics.totalRequests
        : 0;

    const uptime = Date.now() - performanceMetrics.lastResetTime;

    return {
      ...performanceMetrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      uptime,
      cacheSize: performanceCache.size,
      rateLimitViolations: performanceMetrics.rateLimitViolations,
      targetMetrics: {
        cacheHitRate: PERFORMANCE_CONFIG.THRESHOLDS.MIN_CACHE_HIT_RATE,
        maxResponseTime: PERFORMANCE_CONFIG.THRESHOLDS.MAX_RESPONSE_TIME,
        maxConcurrentUsers: PERFORMANCE_CONFIG.THRESHOLDS.MAX_CONCURRENT_USERS,
      },
    };
  },
});

// Cache management functions
function getCachedData(key: string, _district?: string): unknown {
  const cached = performanceCache.get(key);

  if (!cached) {
    performanceMetrics.cacheMisses++;
    return null;
  }

  // Check if cache has expired
  if (Date.now() > cached.timestamp + cached.ttl) {
    performanceCache.delete(key);
    performanceMetrics.cacheMisses++;
    return null;
  }

  // Update hit count and metrics
  cached.hitCount++;
  performanceMetrics.cacheHits++;
  performanceMetrics.totalRequests++;

  return cached.data;
}

function setCachedData(key: string, data: any, ttl: number, district?: string): void {
  performanceCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    hitCount: 0,
    district,
  });

  // Cleanup old cache entries if cache is getting too large
  if (performanceCache.size > 1000) {
    cleanupCache();
  }
}

function calculateCacheTTL(priority?: string, district?: string): number {
  let baseTTL = PERFORMANCE_CONFIG.CACHE_TTL.MEDIUM_PRIORITY;

  // Adjust TTL based on priority
  if (priority === "high") {
    baseTTL = PERFORMANCE_CONFIG.CACHE_TTL.HIGH_PRIORITY;
  } else if (priority === "low") {
    baseTTL = PERFORMANCE_CONFIG.CACHE_TTL.LOW_PRIORITY;
  }

  // Adjust TTL based on district priority
  if (district && PERFORMANCE_CONFIG.DISTRICT_CACHE_PRIORITY[district]) {
    baseTTL *= PERFORMANCE_CONFIG.DISTRICT_CACHE_PRIORITY[district];
  }

  return Math.round(baseTTL);
}

function checkRateLimit(userId: string, operation: string): boolean {
  const key = `${userId}_${operation}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  let tracker = rateLimitTracker.get(key);

  if (!tracker || now > tracker.resetTime) {
    tracker = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitTracker.set(key, tracker);
    return true;
  }

  const limit = getOperationLimit(operation);

  if (tracker.count >= limit) {
    performanceMetrics.rateLimitViolations++;
    return false;
  }

  tracker.count++;
  return true;
}

function getOperationLimit(operation: string): number {
  switch (operation) {
    case "messages":
      return PERFORMANCE_CONFIG.RATE_LIMITS.MESSAGES_PER_MINUTE;
    case "notifications":
      return PERFORMANCE_CONFIG.RATE_LIMITS.NOTIFICATIONS_PER_MINUTE;
    case "batch_notifications":
      return 10; // Lower limit for batch operations
    default:
      return PERFORMANCE_CONFIG.RATE_LIMITS.API_CALLS_PER_MINUTE;
  }
}

function invalidateDistrictCache(district?: string): void {
  if (!district) return;

  for (const [key, cached] of performanceCache.entries()) {
    if (cached.district === district) {
      performanceCache.delete(key);
    }
  }
}

function cleanupCache(): void {
  const now = Date.now();
  const entriesToDelete = [];

  for (const [key, cached] of performanceCache.entries()) {
    // Remove expired entries
    if (now > cached.timestamp + cached.ttl) {
      entriesToDelete.push(key);
    }
  }

  // Remove expired entries
  entriesToDelete.forEach((key) => performanceCache.delete(key));

  // If still too large, remove least recently used entries
  if (performanceCache.size > 800) {
    const sortedEntries = Array.from(performanceCache.entries())
      .sort((a, b) => a[1].hitCount - b[1].hitCount)
      .slice(0, 200); // Remove 200 least used entries

    sortedEntries.forEach(([key]) => performanceCache.delete(key));
  }
}

function recordPerformanceMetric(_type: "cache_hit" | "cache_miss", responseTime: number): void {
  performanceMetrics.totalRequests++;

  // Update average response time
  performanceMetrics.averageResponseTime =
    (performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1) +
      responseTime) /
    performanceMetrics.totalRequests;
}

// Reset performance metrics (for testing/monitoring)
export const resetPerformanceMetrics = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      rateLimitViolations: 0,
      lastResetTime: Date.now(),
    };

    performanceCache.clear();
    rateLimitTracker.clear();

    return { success: true, resetAt: Date.now() };
  },
});
