import { query, mutation, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Advanced notification caching configuration
const NOTIFICATION_CACHE_CONFIG = {
  // TTL based on notification priority and district affluence
  NOTIFICATION_LIST_TTL: 60000, // 1 minute for general notifications
  HIGH_PRIORITY_TTL: 15000, // 15 seconds for high priority
  URGENT_TTL: 5000, // 5 seconds for urgent notifications
  DISTRICT_MULTIPLIER: 0.7, // Reduce TTL by 30% for high-affluence districts

  // Cache keys
  NOTIFICATION_LIST_KEY: (userId: string, filters: any) => `notif_list_${userId}_${JSON.stringify(filters)}`,
  USER_UNREAD_COUNT_KEY: (userId: string) => `unread_count_${userId}`,

  // Rate limiting for notification creation
  RATE_LIMITS: {
    NOTIFICATION_CREATE: { requests: 100, window: 60000 }, // 100 notifications per minute
    BATCH_CREATE: { requests: 10, window: 60000 }, // 10 batch operations per minute
  }
};

// Notification cache
const notificationCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const notificationRateLimit = new Map<string, { count: number; resetTime: number }>();

// Cache helper functions for notifications
function getNotificationCacheKey(key: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {} as Record<string, any>);
  return `${key}_${JSON.stringify(sortedParams)}`;
}

function getNotificationTTL(priority: string, district?: string): number {
  let baseTTL = NOTIFICATION_CACHE_CONFIG.NOTIFICATION_LIST_TTL;

  switch (priority) {
    case 'urgent':
      baseTTL = NOTIFICATION_CACHE_CONFIG.URGENT_TTL;
      break;
    case 'high':
      baseTTL = NOTIFICATION_CACHE_CONFIG.HIGH_PRIORITY_TTL;
      break;
  }

  // Reduce TTL for high-affluence districts
  if (district && ['Śródmieście', 'Wilanów', 'Mokotów'].includes(district)) {
    baseTTL *= NOTIFICATION_CACHE_CONFIG.DISTRICT_MULTIPLIER;
  }

  return baseTTL;
}

function getCachedNotificationData(cacheKey: string): any | null {
  const cached = notificationCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.timestamp + cached.ttl) {
    notificationCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedNotificationData(cacheKey: string, data: any, ttl: number): void {
  notificationCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });

  // Cleanup old entries
  if (notificationCache.size > 500) {
    const now = Date.now();
    for (const [key, value] of notificationCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        notificationCache.delete(key);
      }
    }
  }
}

function invalidateNotificationCache(pattern: string): void {
  for (const key of notificationCache.keys()) {
    if (key.includes(pattern)) {
      notificationCache.delete(key);
    }
  }
}

async function checkNotificationRateLimit(userId: string, action: string): Promise<boolean> {
  const limit = NOTIFICATION_CACHE_CONFIG.RATE_LIMITS[action as keyof typeof NOTIFICATION_CACHE_CONFIG.RATE_LIMITS];
  if (!limit) return true;

  const key = `${userId}_${action}`;
  const now = Date.now();
  const userLimit = notificationRateLimit.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    notificationRateLimit.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }

  if (userLimit.count >= limit.requests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Enhanced notification listing with AI-driven prioritization
export const list = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    type: v.optional(v.string()),
    district: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate cache key for this query
    const cacheKey = getNotificationCacheKey('notification_list', {
      userId,
      unreadOnly: args.unreadOnly,
      priority: args.priority,
      type: args.type,
      district: args.district,
      limit: args.limit
    });

    // Check cache first
    const cachedResult = getCachedNotificationData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let query = ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId));

    // Apply filters
    let notifications = await query.collect();

    if (args.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (args.priority) {
      notifications = notifications.filter(n => n.priority === args.priority);
    }

    if (args.type) {
      notifications = notifications.filter(n => n.type === args.type);
    }

    if (args.district) {
      notifications = notifications.filter(n => n.districtContext?.district === args.district);
    }

    // AI-driven sorting by predicted importance and urgency
    notifications.sort((a, b) => {
      // Priority weight
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] || 2;
      const bPriority = priorityWeight[b.priority] || 2;

      // AI importance score
      const aImportance = a.predictedImportance || 0.5;
      const bImportance = b.predictedImportance || 0.5;

      // District affluence multiplier
      const aMultiplier = a.districtContext?.priorityMultiplier || 1;
      const bMultiplier = b.districtContext?.priorityMultiplier || 1;

      // Combined score
      const aScore = (aPriority * 2 + aImportance * 3 + aMultiplier) * (a.read ? 0.5 : 1);
      const bScore = (bPriority * 2 + bImportance * 3 + bMultiplier) * (b.read ? 0.5 : 1);

      return bScore - aScore;
    });

    const limit = args.limit || 50;
    const result = notifications.slice(0, limit);

    // Cache the result with appropriate TTL based on highest priority notification
    const highestPriority = result.length > 0 ? result[0].priority : 'medium';
    const ttl = getNotificationTTL(highestPriority, args.district);
    setCachedNotificationData(cacheKey, result, ttl);

    return result;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    await Promise.all(
      notifications.map(notification =>
        ctx.db.patch(notification._id, { read: true })
      )
    );
  },
});

// Enhanced notification creation with AI-driven features
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("job_assigned"),
      v.literal("job_completed"),
      v.literal("quote_accepted"),
      v.literal("quote_viewed"),
      v.literal("maintenance_due"),
      v.literal("low_stock"),
      v.literal("payment_due"),
      v.literal("payment_received"),
      v.literal("message"),
      v.literal("urgent_message"),
      v.literal("mention"),
      v.literal("thread_reply"),
      v.literal("channel_invite"),
      v.literal("district_alert"),
      v.literal("route_update"),
      v.literal("emergency"),
      v.literal("system")
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    relatedId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    districtContext: v.optional(v.object({
      district: v.string(),
      affluenceLevel: v.optional(v.number()),
      priorityMultiplier: v.optional(v.number())
    })),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      relevantRadius: v.optional(v.number())
    })),
    scheduledFor: v.optional(v.number()),
    batchId: v.optional(v.string()),
    aiGenerated: v.optional(v.boolean()),
    personalizedContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check rate limiting for notification creation
    const rateLimitPassed = await checkNotificationRateLimit(args.userId, 'NOTIFICATION_CREATE');
    if (!rateLimitPassed) {
      throw new Error("Notification creation rate limit exceeded");
    }

    // Get user profile for personalization
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Calculate AI importance score
    const predictedImportance = await calculateImportanceScore(ctx, {
      type: args.type,
      priority: args.priority || "medium",
      userRole: userProfile?.role || "technician",
      districtContext: args.districtContext,
      hasLocation: !!args.location
    });

    // Create personalized content if AI-generated
    let personalizedMessage = args.message;
    if (args.aiGenerated && userProfile) {
      personalizedMessage = await personalizeMessage(args.message, userProfile, args.districtContext);
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      priority: args.priority || "medium",
      relatedId: args.relatedId,
      actionUrl: args.actionUrl,
      districtContext: args.districtContext,
      location: args.location,
      scheduledFor: args.scheduledFor,
      batchId: args.batchId,
      aiGenerated: args.aiGenerated || false,
      personalizedContent: personalizedMessage !== args.message ? personalizedMessage : undefined,
      predictedImportance,
      read: false,
      deliveryAttempts: 0,
    });

    // Schedule delivery if not immediate
    if (args.scheduledFor && args.scheduledFor > Date.now()) {
      await ctx.scheduler.runAt(args.scheduledFor, internal.notifications.deliverScheduledNotification, {
        notificationId
      });
    } else {
      // Immediate delivery
      await ctx.scheduler.runAfter(0, internal.notifications.processNotificationDelivery, {
        notificationId
      });
    }

    // Invalidate user's notification cache
    invalidateNotificationCache(`notification_list_${args.userId}`);
    invalidateNotificationCache(`unread_count_${args.userId}`);

    return notificationId;
  },
});

// Batch notification creation for efficiency
export const createBatch = mutation({
  args: {
    notifications: v.array(v.object({
      userId: v.id("users"),
      title: v.string(),
      message: v.string(),
      type: v.string(),
      priority: v.optional(v.string()),
      relatedId: v.optional(v.string()),
      actionUrl: v.optional(v.string()),
      districtContext: v.optional(v.object({
        district: v.string(),
        affluenceLevel: v.optional(v.number()),
        priorityMultiplier: v.optional(v.number())
      }))
    })),
    batchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const batchId = args.batchId || `batch_${Date.now()}`;
    const notificationIds = [];

    for (const notification of args.notifications) {
      const id = await ctx.db.insert("notifications", {
        ...notification,
        priority: notification.priority as any || "medium",
        type: notification.type as any,
        batchId,
        read: false,
        deliveryAttempts: 0,
        predictedImportance: 0.5, // Default importance
      });
      notificationIds.push(id);
    }

    // Schedule batch delivery
    await ctx.scheduler.runAfter(0, internal.notifications.processBatchDelivery, {
      batchId,
      notificationIds
    });

    return { batchId, notificationIds };
  },
});

// AI-driven notification triggers
export const createSmartNotification = action({
  args: {
    triggerType: v.union(
      v.literal("job_status_change"),
      v.literal("location_based"),
      v.literal("time_based"),
      v.literal("affluence_based"),
      v.literal("emergency_proximity")
    ),
    context: v.object({
      jobId: v.optional(v.id("jobs")),
      userId: v.optional(v.id("users")),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      })),
      district: v.optional(v.string()),
      metadata: v.optional(v.string())
    })
  },
  handler: async (ctx, args): Promise<any> => {
    // AI decision engine for smart notifications
    const shouldTrigger = await evaluateNotificationTrigger(ctx, args.triggerType, args.context);

    if (!shouldTrigger.trigger) {
      return { triggered: false, reason: shouldTrigger.reason };
    }

    // Generate AI-optimized notification content
    const notificationContent = await generateSmartNotificationContent(ctx, args.triggerType, args.context);

    // Determine target users based on context
    const targetUsers = await getTargetUsers(ctx, args.triggerType, args.context);

    // Create notifications for each target user
    const notifications: any[] = [];
    for (const user of targetUsers) {
      const notification: any = await ctx.runMutation(internal.notifications.create, {
        userId: user.userId,
        title: notificationContent.title,
        message: notificationContent.message,
        type: notificationContent.type as any,
        priority: notificationContent.priority as any,
        relatedId: args.context.jobId,
        actionUrl: notificationContent.actionUrl,
        districtContext: args.context.district ? {
          district: args.context.district,
          affluenceLevel: await getDistrictAffluence(args.context.district),
          priorityMultiplier: await getDistrictPriorityMultiplier(args.context.district)
        } : undefined,
        location: args.context.location,
        aiGenerated: true
      });
      notifications.push(notification);
    }

    return { triggered: true, notifications };
  },
});

// Internal delivery functions
export const processNotificationDelivery = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    // Get user preferences
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", notification.userId))
      .first();

    const preferences = userProfile?.notificationPreferences || {
      email: true,
      sms: false,
      push: true,
      telegram: false
    };

    // Determine delivery channels based on priority and preferences
    const deliveryChannels = determineDeliveryChannels(notification.priority, preferences);

    // Update delivery attempts
    await ctx.db.patch(args.notificationId, {
      deliveryAttempts: (notification.deliveryAttempts || 0) + 1,
      lastAttemptAt: Date.now()
    });

    // Schedule actual delivery (would integrate with external services)
    for (const channel of deliveryChannels) {
      await ctx.scheduler.runAfter(0, internal.notifications.deliverViaChannel, {
        notificationId: args.notificationId,
        channel: channel as "email" | "push" | "telegram" | "sms",
        userProfile: userProfile?._id
      });
    }
  },
});

export const deliverScheduledNotification = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    // Simply trigger the regular delivery process for scheduled notifications
    await ctx.scheduler.runAfter(0, internal.notifications.processNotificationDelivery, {
      notificationId: args.notificationId
    });
  },
});

export const processBatchDelivery = internalMutation({
  args: {
    batchId: v.string(),
    notificationIds: v.array(v.id("notifications"))
  },
  handler: async (ctx, args) => {
    // Process batch notifications with rate limiting
    for (let i = 0; i < args.notificationIds.length; i++) {
      const delay = Math.floor(i / 10) * 1000; // 10 notifications per second max
      await ctx.scheduler.runAfter(delay, internal.notifications.processNotificationDelivery, {
        notificationId: args.notificationIds[i]
      });
    }
  },
});

export const deliverViaChannel = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    channel: v.union(v.literal("push"), v.literal("email"), v.literal("sms"), v.literal("telegram")),
    userProfile: v.optional(v.id("userProfiles"))
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    // Mark delivery attempt
    const updateData: any = {
      [`${args.channel}Sent`]: true,
      deliveredAt: Date.now()
    };

    // In a real implementation, this would call external APIs
    // For now, we'll just mark as delivered
    await ctx.db.patch(args.notificationId, updateData);

    // Log delivery for analytics
    await ctx.db.insert("integrationLogs", {
      service: args.channel,
      action: "notification_delivered",
      status: "success",
      data: JSON.stringify({
        notificationId: args.notificationId,
        userId: notification.userId,
        type: notification.type,
        priority: notification.priority
      }),
      relatedId: args.notificationId,
    });
  },
});

// AI Helper Functions
async function calculateImportanceScore(ctx: any, params: {
  type: string;
  priority: string;
  userRole: string;
  districtContext?: any;
  hasLocation: boolean;
}): Promise<number> {
  let score = 0.5; // Base score

  // Type-based scoring
  const typeScores: Record<string, number> = {
    emergency: 1.0,
    urgent_message: 0.9,
    job_assigned: 0.8,
    district_alert: 0.8,
    quote_accepted: 0.7,
    maintenance_due: 0.6,
    message: 0.4,
    system: 0.3
  };
  score += (typeScores[params.type] || 0.5) * 0.3;

  // Priority-based scoring
  const priorityScores = { urgent: 1.0, high: 0.8, medium: 0.5, low: 0.2 };
  score += (priorityScores[params.priority as keyof typeof priorityScores] || 0.5) * 0.3;

  // Role-based scoring
  const roleMultipliers = { admin: 1.2, manager: 1.1, technician: 1.0, sales: 0.9 };
  score *= roleMultipliers[params.userRole as keyof typeof roleMultipliers] || 1.0;

  // District affluence impact
  if (params.districtContext?.affluenceLevel) {
    score += (params.districtContext.affluenceLevel / 10) * 0.2;
  }

  // Location relevance
  if (params.hasLocation) {
    score += 0.1;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

async function personalizeMessage(message: string, userProfile: any, districtContext?: any): Promise<string> {
  // Simple personalization - in production would use AI/LLM
  let personalized = message;

  // Add user name
  if (userProfile.firstName) {
    personalized = `Hi ${userProfile.firstName}, ${personalized}`;
  }

  // Add district context
  if (districtContext?.district && userProfile.serviceAreas?.includes(districtContext.district)) {
    personalized += ` (Your area: ${districtContext.district})`;
  }

  // Add role-specific context
  if (userProfile.role === 'technician' && message.includes('job')) {
    personalized += ' Check your mobile app for route optimization.';
  }

  return personalized;
}

async function evaluateNotificationTrigger(ctx: any, triggerType: string, context: any): Promise<{trigger: boolean, reason?: string}> {
  switch (triggerType) {
    case 'job_status_change':
      // Always trigger for job status changes
      return { trigger: true };

    case 'location_based':
      if (!context.location) {
        return { trigger: false, reason: 'No location provided' };
      }
      // Check if user is within relevant area
      return { trigger: true };

    case 'time_based':
      // Check business hours, user preferences, etc.
      const hour = new Date().getHours();
      if (hour < 7 || hour > 22) {
        return { trigger: false, reason: 'Outside business hours' };
      }
      return { trigger: true };

    case 'affluence_based':
      if (!context.district) {
        return { trigger: false, reason: 'No district context' };
      }
      const affluence = await getDistrictAffluence(context.district);
      // Higher affluence areas get more proactive notifications
      return { trigger: affluence >= 6 };

    case 'emergency_proximity':
      // Always trigger emergency notifications
      return { trigger: true };

    default:
      return { trigger: false, reason: 'Unknown trigger type' };
  }
}

async function generateSmartNotificationContent(ctx: any, triggerType: string, context: any): Promise<{
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
}> {
  switch (triggerType) {
    case 'job_status_change':
      return {
        title: 'Job Update',
        message: 'A job in your area has been updated',
        type: 'job_assigned',
        priority: 'medium',
        actionUrl: `/jobs/${context.jobId}`
      };

    case 'location_based':
      return {
        title: 'Nearby Opportunity',
        message: `New service request near your location in ${context.district}`,
        type: 'district_alert',
        priority: 'medium',
        actionUrl: `/map?district=${context.district}`
      };

    case 'emergency_proximity':
      return {
        title: '🚨 Emergency Alert',
        message: `Emergency service needed in ${context.district}`,
        type: 'emergency',
        priority: 'urgent',
        actionUrl: `/emergency`
      };

    default:
      return {
        title: 'Notification',
        message: 'You have a new notification',
        type: 'system',
        priority: 'medium'
      };
  }
}

async function getTargetUsers(ctx: any, triggerType: string, context: any): Promise<{userId: string}[]> {
  switch (triggerType) {
    case 'job_status_change':
      if (context.jobId) {
        const job = await ctx.db.get(context.jobId);
        if (job) {
          return job.assignedTechnicians.map((id: string) => ({ userId: id }));
        }
      }
      return [];

    case 'location_based':
    case 'emergency_proximity':
      if (context.district) {
        const technicians = await ctx.db
          .query("userProfiles")
          .filter((q: any) =>
            q.and(
              q.eq(q.field("role"), "technician"),
              q.eq(q.field("serviceAreas"), context.district)
            )
          )
          .collect();
        return technicians.map((t: any) => ({ userId: t.userId }));
      }
      return [];

    default:
      return [];
  }
}

function determineDeliveryChannels(priority: string, preferences: any): string[] {
  const channels = [];

  // Always use push notifications
  if (preferences.push) {
    channels.push('push');
  }

  // High priority gets multiple channels
  if (priority === 'urgent' || priority === 'high') {
    if (preferences.sms) channels.push('sms');
    if (preferences.telegram) channels.push('telegram');
  }

  // Email for non-urgent notifications
  if (priority !== 'urgent' && preferences.email) {
    channels.push('email');
  }

  return channels;
}

async function getDistrictAffluence(district: string): Promise<number> {
  const affluenceMap: Record<string, number> = {
    "Śródmieście": 9,
    "Wilanów": 8,
    "Mokotów": 7,
    "Żoliborz": 7,
    "Ursynów": 6,
    "Wola": 6,
    "Praga-Południe": 4,
    "Targówek": 4,
    "Bemowo": 5,
    "Bielany": 5
  };
  return affluenceMap[district] || 5;
}

async function getDistrictPriorityMultiplier(district: string): Promise<number> {
  const affluence = await getDistrictAffluence(district);
  return Math.max(0.8, Math.min(1.5, affluence / 6));
}

// Internal create notification function
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    priority: v.string(),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type as any,
      priority: args.priority as any,
      metadata: args.metadata,
      status: "pending",
      channels: ["email"],
      scheduledFor: Date.now(),
      attempts: 0,
      maxAttempts: 3
    });
  }
});
