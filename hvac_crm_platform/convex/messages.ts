import { query, mutation, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Advanced caching configuration for performance optimization
const CACHE_CONFIG = {
  // TTL in milliseconds - shorter for high-affluence districts
  MESSAGE_LIST_TTL: 30000, // 30 seconds for general messages
  DISTRICT_MESSAGE_TTL: 15000, // 15 seconds for high-affluence districts
  THREAD_TTL: 60000, // 1 minute for threads
  EMERGENCY_TTL: 5000, // 5 seconds for emergency messages

  // Cache keys
  MESSAGE_LIST_KEY: (channelId: string, userId: string) => `msg_list_${channelId}_${userId}`,
  THREAD_KEY: (threadId: string) => `thread_${threadId}`,
  USER_CHANNELS_KEY: (userId: string) => `user_channels_${userId}`,

  // Rate limiting configuration
  RATE_LIMITS: {
    MESSAGE_SEND: { requests: 30, window: 60000 }, // 30 messages per minute
    EMERGENCY_SEND: { requests: 5, window: 300000 }, // 5 emergency alerts per 5 minutes
    THREAD_CREATE: { requests: 10, window: 60000 }, // 10 threads per minute
    FILE_UPLOAD: { requests: 10, window: 300000 }, // 10 file uploads per 5 minutes
  }
};

// In-memory cache for high-performance access
const messageCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Cache helper functions
function getCacheKey(key: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {} as Record<string, any>);
  return `${key}_${JSON.stringify(sortedParams)}`;
}

function isHighAffluenceDistrict(district?: string): boolean {
  const highAffluenceDistricts = ['Śródmieście', 'Wilanów', 'Mokotów'];
  return district ? highAffluenceDistricts.includes(_district) : false;
}

function getTTL(baseKey: string, district?: string): number {
  if (baseKey.includes('emergency')) return CACHE_CONFIG.EMERGENCY_TTL;
  if (baseKey.includes('thread')) return CACHE_CONFIG.THREAD_TTL;
  if (district && isHighAffluenceDistrict(district)) return CACHE_CONFIG.DISTRICT_MESSAGE_TTL;
  return CACHE_CONFIG.MESSAGE_LIST_TTL;
}

function getCachedData(cacheKey: string): unknown {
  const cached = messageCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.timestamp + cached.ttl) {
    messageCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedData(cacheKey: string, data: any, ttl: number): void {
  messageCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });

  // Cleanup old cache entries periodically
  if (messageCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of messageCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        messageCache.delete(key);
      }
    }
  }
}

function invalidateCache(pattern: string): void {
  for (const key of messageCache.keys()) {
    if (key.includes(pattern)) {
      messageCache.delete(key);
    }
  }
}

async function checkRateLimit(userId: string, action: string, isEmergency: boolean = false): Promise<boolean> {
  // AI exemption for emergency alerts
  if (isEmergency && action === 'MESSAGE_SEND') {
    return true;
  }

  const limit = CACHE_CONFIG.RATE_LIMITS[action as keyof typeof CACHE_CONFIG.RATE_LIMITS];
  if (!limit) return true;

  const key = `${userId}_${action}`;
  const now = Date.now();
  const userLimit = rateLimitCache.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }

  if (userLimit.count >= limit.requests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Enhanced message listing with intelligent caching and performance optimization
export const list = query({
  args: {
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    contactId: v.optional(v.id("contacts")),
    threadId: v.optional(v.string()),
    limit: v.optional(v.number()),
    before: v.optional(v.string()), // Cursor for pagination
    includeThreads: v.optional(v.boolean()),
    district: v.optional(v.string()), // For cache TTL optimization
  },
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    // Generate cache key for this query
    const cacheKey = getCacheKey('message_list', {
      userId,
      channelId: args.channelId,
      jobId: args.jobId,
      contactId: args.contactId,
      threadId: args.threadId,
      limit,
      before: args.before,
      includeThreads: args.includeThreads
    });

    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    let messages;

    // Build query based on context
    if (args.threadId) {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
        .order("asc") // Threads show chronologically
        .take(limit);
    } else if (args.channelId) {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
        .order("desc")
        .take(limit);
    } else if (args.jobId) {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
        .order("desc")
        .take(limit);
    } else if (args.contactId) {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
        .order("desc")
        .take(limit);
    } else {
      messages = await ctx.db.query("messages").order("desc").take(limit);
    }

    // Get enhanced message details with threading support
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const senderProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", message.senderId))
          .first();

        // Get file URL if it's a file message
        let fileUrl = null;
        if (message.fileId) {
          fileUrl = await ctx.storage.getUrl(message.fileId);
        }

        // Get thread information
        let threadInfo = null;
        if (message.threadId && args.includeThreads) {
          const threadMessages = await ctx.db
            .query("messages")
            .withIndex("by_thread", (q) => q.eq("threadId", message.threadId))
            .take(3); // Preview of thread

          threadInfo = {
            messageCount: threadMessages.length,
            lastMessage: threadMessages[threadMessages.length - 1],
            participants: message.threadParticipants || []
          };
        }

        // Get reply context
        let replyTo = null;
        if (message.replyTo) {
          replyTo = await ctx.db.get(message.replyTo);
        }

        // Check read status for current user
        const isRead = message.readBy?.some(r => r.userId === userId) || false;
        const deliveredToUser = message.readBy?.find(r => r.userId === userId)?.deliveredAt;

        return {
          ...message,
          sender: {
            ...sender,
            profile: senderProfile,
          },
          fileUrl,
          threadInfo,
          replyTo,
          isRead,
          deliveredToUser,
          // Add Warsaw district context if available
          districtInfo: message.districtContext ? {
            ...message.districtContext,
            isHighPriority: message.districtContext.urgencyLevel === "emergency"
          } : null
        };
      })
    );

    // Return in correct order (threads are chronological, others are reverse chronological)
    const result = args.threadId ? messagesWithDetails : messagesWithDetails.reverse();

    // Cache the result with appropriate TTL
    const ttl = getTTL('message_list', args.district);
    setCachedData(cacheKey, result, ttl);

    return result;
  },
});

// Enhanced send message with threading and district context
export const send = mutation({
  args: {
    content: v.string(),
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    contactId: v.optional(v.id("contacts")),
    replyTo: v.optional(v.id("messages")),
    threadId: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    districtContext: v.optional(v.object({
      district: v.string(),
      urgencyLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("emergency")),
      routeOptimized: v.optional(v.boolean()),
      estimatedResponseTime: v.optional(v.number())
    })),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
      address: v.optional(v.string())
    })),
    mentions: v.optional(v.array(v.id("users"))),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check rate limiting with AI exemption for emergency messages
    const isEmergency = args.districtContext?.urgencyLevel === 'emergency' || args.priority === 'urgent';
    const rateLimitPassed = await checkRateLimit(userId, 'MESSAGE_SEND', isEmergency);

    if (!rateLimitPassed) {
      throw new Error("Rate limit exceeded. Please wait before sending another message.");
    }

    // Generate thread ID if this is a reply and no thread exists
    let threadId = args.threadId;
    let isThreadStarter = false;
    let threadParticipants: string[] = [];

    if (args.replyTo && !threadId) {
      const parentMessage = await ctx.db.get(args.replyTo);
      if (parentMessage) {
        threadId = parentMessage.threadId || `thread_${args.replyTo}`;
        threadParticipants = parentMessage.threadParticipants || [parentMessage.senderId];
        if (!threadParticipants.includes(userId)) {
          threadParticipants.push(userId);
        }
      }
    } else if (!args.replyTo && args.threadId) {
      isThreadStarter = true;
      threadParticipants = [userId];
    }

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      senderId: userId,
      channelId: args.channelId,
      jobId: args.jobId,
      contactId: args.contactId,
      replyTo: args.replyTo,
      threadId,
      isThreadStarter,
      threadParticipants: threadParticipants as Id<"users">[],
      type: "text",
      priority: args.priority || "normal",
      districtContext: args.districtContext,
      location: args.location,
      scheduledFor: args.scheduledFor,
      metadata: {
        mentions: args.mentions,
        hashtags: extractHashtags(args.content),
        links: extractLinks(args.content)
      },
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });

    // Create enhanced notifications
    await createMessageNotifications(ctx, {
      messageId,
      senderId: userId,
      content: args.content,
      channelId: args.channelId,
      jobId: args.jobId,
      contactId: args.contactId,
      mentions: args.mentions,
      priority: args.priority || "normal",
      districtContext: args.districtContext,
      threadId,
      isReply: !!args.replyTo
    });

    // Invalidate relevant caches
    if (args.channelId) {
      invalidateCache(`message_list_${args.channelId}`);
    }
    if (args.jobId) {
      invalidateCache(`message_list_${args.jobId}`);
    }
    if (threadId) {
      invalidateCache(`thread_${threadId}`);
    }

    // Invalidate user-specific caches
    invalidateCache(`user_channels_${userId}`);

    return messageId;
  },
});

export const sendFile = mutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("messages", {
      content: `Shared file: ${args.fileName}`,
      senderId: userId,
      type: "file",
      fileId: args.fileId,
      fileName: args.fileName,
      channelId: args.channelId,
      jobId: args.jobId,
      contactId: args.contactId,
      readBy: [{
        userId,
        readAt: Date.now(),
      }],
    });
  },
});

export const sendImage = mutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("messages", {
      content: `Shared image: ${args.fileName}`,
      senderId: userId,
      type: "image",
      fileId: args.fileId,
      fileName: args.fileName,
      channelId: args.channelId,
      jobId: args.jobId,
      contactId: args.contactId,
      readBy: [{
        userId,
        readAt: Date.now(),
      }],
    });
  },
});

export const sendTelegramMessage = mutation({
  args: {
    content: v.string(),
    telegramMessageId: v.string(),
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    // Find user by Telegram ID (this would need to be implemented)
    // For now, use system user
    const systemUserId = "system"; // This should be a real user ID

    return await ctx.db.insert("messages", {
      content: args.content,
      senderId: systemUserId as any,
      type: "telegram",
      telegramMessageId: args.telegramMessageId,
      isFromTelegram: true,
      channelId: args.channelId,
      jobId: args.jobId,
    });
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const currentReadBy = message.readBy || [];
    const alreadyRead = currentReadBy.some(r => r.userId === userId);

    if (!alreadyRead) {
      await ctx.db.patch(args.messageId, {
        readBy: [
          ...currentReadBy,
          {
            userId,
            readAt: Date.now(),
          }
        ],
      });
    }
  },
});

export const getChannels = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get distinct channels from messages
    const messages = await ctx.db.query("messages").collect();
    const channels = new Set<string>();
    
    messages.forEach(message => {
      if (message.channelId) {
        channels.add(message.channelId);
      }
    });

    return Array.from(channels).map(channelId => ({
      id: channelId,
      name: channelId === "general" ? "General" : 
            channelId === "technicians" ? "Technicians" :
            channelId === "sales" ? "Sales" : channelId,
    }));
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Helper functions for message processing
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return content.match(hashtagRegex) || [];
}

function extractLinks(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.match(urlRegex) || [];
}

// Enhanced notification creation for messages
async function createMessageNotifications(ctx: any, params: {
  messageId: string;
  senderId: string;
  content: string;
  channelId?: string;
  jobId?: string;
  contactId?: string;
  mentions?: string[];
  priority: string;
  districtContext?: any;
  threadId?: string;
  isReply: boolean;
}) {
  const notifications: any[] = [];

  // Job-based notifications
  if (params.jobId) {
    const job = await ctx.db.get(params.jobId);
    if (job) {
      // Notify assigned technicians
      for (const techId of job.assignedTechnicians) {
        if (techId !== params.senderId) {
          notifications.push({
            userId: techId,
            title: params.isReply ? "Thread Reply" : "New Message",
            message: `${params.isReply ? "Reply in" : "New message in"} job: ${job.title}`,
            type: params.isReply ? "thread_reply" : "message",
            priority: mapMessagePriorityToNotification(params.priority),
            read: false,
            relatedId: params.messageId,
            actionUrl: `/jobs/${params.jobId}`,
            districtContext: params.districtContext ? {
              district: params.districtContext.district,
              affluenceLevel: await getDistrictAffluence(params.districtContext.district),
              priorityMultiplier: await getDistrictPriorityMultiplier(params.districtContext.district)
            } : undefined
          });
        }
      }
    }
  }

  // Mention notifications
  if (params.mentions && params.mentions.length > 0) {
    for (const mentionedUserId of params.mentions) {
      if (mentionedUserId !== params.senderId) {
        notifications.push({
          userId: mentionedUserId,
          title: "You were mentioned",
          message: `You were mentioned in a message: ${params.content.substring(0, 50)}...`,
          type: "mention",
          priority: "medium",
          read: false,
          relatedId: params.messageId,
          actionUrl: params.channelId ? `/chat/${params.channelId}` : `/jobs/${params.jobId}`
        });
      }
    }
  }

  // Channel-based notifications
  if (params.channelId) {
    const channel = await ctx.db
      .query("conversationChannels")
      .filter((q: any) => q.eq(q.field("name"), params.channelId))
      .first();

    if (channel) {
      for (const participantId of channel.participants) {
        if (participantId !== params.senderId) {
          // Check user's notification preferences for this channel
          const shouldNotify = await shouldSendChannelNotification(ctx, participantId, channel);

          if (shouldNotify) {
            notifications.push({
              userId: participantId,
              title: `Message in ${channel.name}`,
              message: params.content.substring(0, 100),
              type: "message",
              priority: mapMessagePriorityToNotification(params.priority),
              read: false,
              relatedId: params.messageId,
              actionUrl: `/chat/${params.channelId}`
            });
          }
        }
      }
    }
  }

  // Urgent/Emergency notifications for Warsaw districts
  if (params.districtContext?.urgencyLevel === "emergency") {
    // Notify all technicians in the district
    const districtTechnicians = await ctx.db
      .query("userProfiles")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("role"), "technician"),
          q.field("serviceAreas").includes(params.districtContext.district)
        )
      )
      .collect();

    for (const tech of districtTechnicians) {
      if (tech.userId !== params.senderId) {
        notifications.push({
          userId: tech.userId,
          title: `🚨 EMERGENCY - ${params.districtContext.district}`,
          message: `Emergency in ${params.districtContext.district}: ${params.content}`,
          type: "emergency",
          priority: "urgent",
          read: false,
          relatedId: params.messageId,
          actionUrl: `/emergency/${params.messageId}`,
          districtContext: {
            district: params.districtContext.district,
            affluenceLevel: await getDistrictAffluence(params.districtContext.district),
            priorityMultiplier: 2.0 // Emergency multiplier
          }
        });
      }
    }
  }

  // Batch insert notifications
  await Promise.all(
    notifications.map(notification => ctx.db.insert("notifications", notification))
  );
}

// Helper functions for district-based features
async function getDistrictAffluence(district: string): Promise<number> {
  // Warsaw district affluence mapping (1-10 scale)
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
  return Math.max(0.8, Math.min(1.5, affluence / 6)); // 0.8x to 1.5x multiplier
}

function mapMessagePriorityToNotification(messagePriority: string): "low" | "medium" | "high" | "urgent" {
  switch (messagePriority) {
    case "urgent": return "urgent";
    case "high": return "high";
    case "normal": return "medium";
    case "low": return "low";
    default: return "medium";
  }
}

async function shouldSendChannelNotification(ctx: any, userId: string, channel: any): Promise<boolean> {
  // Check user's notification preferences
  const userProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!userProfile?.notificationPreferences) return true;

  // Respect channel notification level
  if (channel.notificationLevel === "none") return false;
  if (channel.notificationLevel === "mentions") return false; // Only mentions, handled separately

  return true; // Default to sending notifications
}

// Start a new thread from a message
export const startThread = mutation({
  args: {
    messageId: v.id("messages"),
    initialReply: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const originalMessage = await ctx.db.get(args.messageId);
    if (!originalMessage) throw new Error("Original message not found");

    const threadId = `thread_${args.messageId}`;

    // Update original message to be thread starter
    await ctx.db.patch(args.messageId, {
      threadId,
      isThreadStarter: true,
      threadParticipants: [originalMessage.senderId, userId]
    });

    // Create the first reply
    const replyId = await ctx.db.insert("messages", {
      content: args.initialReply,
      senderId: userId,
      channelId: originalMessage.channelId,
      jobId: originalMessage.jobId,
      contactId: originalMessage.contactId,
      replyTo: args.messageId,
      threadId,
      threadParticipants: [originalMessage.senderId, userId],
      type: "text",
      priority: "normal",
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });

    // Notify original message sender
    await ctx.db.insert("notifications", {
      userId: originalMessage.senderId,
      title: "Thread Started",
      message: `Someone started a thread on your message`,
      type: "thread_reply",
      priority: "medium",
      read: false,
      relatedId: replyId,
      actionUrl: `/chat/thread/${threadId}`
    });

    return { threadId, replyId };
  },
});

// Send urgent message with district-specific routing
export const sendUrgentMessage = mutation({
  args: {
    content: v.string(),
    district: v.string(),
    urgencyLevel: v.union(v.literal("high"), v.literal("emergency")),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string())
    })),
    estimatedResponseTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create urgent message
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      senderId: userId,
      channelId: `emergency_${args.district}`,
      type: "urgent_alert",
      priority: "urgent",
      districtContext: {
        district: args.district,
        urgencyLevel: args.urgencyLevel,
        routeOptimized: false,
        estimatedResponseTime: args.estimatedResponseTime
      },
      location: args.location,
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });

    // Trigger emergency notification system
    await createEmergencyNotifications(ctx, {
      messageId,
      senderId: userId,
      content: args.content,
      district: args.district,
      urgencyLevel: args.urgencyLevel,
      location: args.location
    });

    return messageId;
  },
});

// Get thread messages
export const getThread = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .take(args.limit || 100);

    // Note: Message read status should be updated via separate mutation

    return messages;
  },
});

// Send voice note
export const sendVoiceNote = mutation({
  args: {
    fileId: v.id("_storage"),
    duration: v.number(), // seconds
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    contactId: v.optional(v.id("contacts")),
    transcription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("messages", {
      content: args.transcription || `Voice note (${args.duration}s)`,
      senderId: userId,
      type: "voice_note",
      fileId: args.fileId,
      fileMimeType: "audio/webm",
      channelId: args.channelId,
      jobId: args.jobId,
      contactId: args.contactId,
      metadata: {
        duration: args.duration
      },
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });
  },
});

// Emergency notification helper
async function createEmergencyNotifications(ctx: any, params: {
  messageId: string;
  senderId: string;
  content: string;
  district: string;
  urgencyLevel: string;
  location?: any;
}) {
  // Get all technicians in the district
  const districtTechnicians = await ctx.db
    .query("userProfiles")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("role"), "technician"),
        q.eq(q.field("serviceAreas"), [params.district])
      )
    )
    .collect();

  // Get managers and admins
  const managers = await ctx.db
    .query("userProfiles")
    .filter((q: any) =>
      q.or(
        q.eq(q.field("role"), "manager"),
        q.eq(q.field("role"), "admin")
      )
    )
    .collect();

  const allRecipients = [...districtTechnicians, ...managers];

  // Create urgent notifications
  await Promise.all(
    allRecipients.map(async (recipient) => {
      if (recipient.userId !== params.senderId) {
        await ctx.db.insert("notifications", {
          userId: recipient.userId,
          title: `🚨 ${params.urgencyLevel.toUpperCase()} - ${params.district}`,
          message: `${params.urgencyLevel} in ${params.district}: ${params.content}`,
          type: "emergency",
          priority: "urgent",
          read: false,
          relatedId: params.messageId,
          actionUrl: `/emergency/${params.messageId}`,
          districtContext: {
            district: params.district,
            affluenceLevel: await getDistrictAffluence(params.district),
            priorityMultiplier: 2.0
          },
          location: params.location,
          // Schedule immediate delivery
          scheduledFor: Date.now(),
          aiGenerated: false
        });
      }
    })
  );
}