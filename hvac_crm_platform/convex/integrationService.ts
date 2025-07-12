import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";

/**
 * Integration Service for Communications, Map, and Prophecy Systems
 * Handles data synchronization and cross-system coordination
 */

// Data sync mutation for cross-system integration
export const syncCommunicationData = mutation({
  args: {
    messageId: v.id("messages"),
    includeMapUpdate: v.optional(v.boolean()),
    includeProphecySync: v.optional(v.boolean()),
    auditLevel: v.optional(v.union(v.literal("basic"), v.literal("detailed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the message data
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const syncResults = {
      messageId: args.messageId,
      mapUpdated: false,
      prophecyUpdated: false,
      auditLogId: null as string | null,
      errors: [] as string[],
    };

    try {
      // 1. Update map system if location/district context exists
      if (args.includeMapUpdate && (message.location || message.districtContext)) {
        await ctx.scheduler.runAfter(0, internal.integrationService.updateMapSystem, {
          messageId: args.messageId,
          location: message.location,
          districtContext: message.districtContext,
          jobId: message.jobId,
        });
        syncResults.mapUpdated = true;
      }

      // 2. Sync with prophecy system if relevant data exists
      if (args.includeProphecySync && message.districtContext) {
        await ctx.scheduler.runAfter(0, internal.integrationService.syncProphecyData, {
          messageId: args.messageId,
          content: message.content,
          districtContext: message.districtContext,
          timestamp: message._creationTime,
        });
        syncResults.prophecyUpdated = true;
      }

      // 3. Create audit log
      const auditLogId = await ctx.db.insert("integrationLogs", {
        service: "maps",
        action: "communication_sync",
        status: "success",
        data: JSON.stringify({
          messageId: args.messageId,
          mapUpdated: syncResults.mapUpdated,
          prophecyUpdated: syncResults.prophecyUpdated,
          auditLevel: args.auditLevel || "basic",
        }),
        relatedId: args.messageId,
      });
      syncResults.auditLogId = auditLogId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      syncResults.errors.push(errorMessage);

      // Log error
      await ctx.db.insert("integrationLogs", {
        service: "maps",
        action: "communication_sync",
        status: "error",
        errorMessage,
        data: JSON.stringify({ messageId: args.messageId }),
        relatedId: args.messageId,
      });
    }

    return syncResults;
  },
});

// Internal mutation to update map system
export const updateMapSystem = internalMutation({
  args: {
    messageId: v.id("messages"),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        relevantRadius: v.optional(v.number()),
      })
    ),
    districtContext: v.optional(
      v.object({
        district: v.string(),
        urgencyLevel: v.optional(v.string()),
      })
    ),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    // Update job location if job is linked
    if (args.jobId && args.location) {
      await ctx.db.patch(args.jobId, {
        location: args.location,
      });
    }

    // Create district alert if urgent
    if (args.districtContext?.urgencyLevel === "emergency") {
      // Find technicians in the district
      const technicians = await ctx.db
        .query("userProfiles")
        .filter((q) => q.eq(q.field("role"), "technician"))
        .collect();

      const districtTechnicians = technicians.filter((tech) =>
        tech.serviceAreas?.includes(args.districtContext?.district)
      );

      // Create route update notifications
      for (const tech of districtTechnicians) {
        await ctx.db.insert("notifications", {
          userId: tech.userId,
          title: `🗺️ Route Update - ${args.districtContext.district}`,
          message: `Emergency location added to your route in ${args.districtContext.district}`,
          type: "route_update",
          priority: "high",
          read: false,
          relatedId: args.messageId,
          actionUrl: `/map?emergency=${args.messageId}`,
          districtContext: {
            district: args.districtContext.district,
            affluenceLevel: 5, // Default for emergency
            priorityMultiplier: 2.0,
          },
          location: args.location,
        });
      }
    }

    return { success: true, updatedAt: Date.now() };
  },
});

// Internal mutation to sync prophecy data
export const syncProphecyData = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    districtContext: v.object({
      district: v.string(),
      urgencyLevel: v.optional(v.string()),
    }),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Extract service-related keywords for prophecy analysis
    const serviceKeywords = extractServiceKeywords(args.content);

    if (serviceKeywords.length > 0) {
      // Store in prophecy data for future analysis
      const prophecyData = {
        district: args.districtContext.district,
        serviceIndicators: serviceKeywords,
        urgencyLevel: args.districtContext.urgencyLevel || "normal",
        timestamp: args.timestamp,
        source: "communication",
        messageId: args.messageId,
      };

      // In a real implementation, this would sync with Weaviate
      // For now, we'll store in integration logs for tracking
      await ctx.db.insert("integrationLogs", {
        service: "ai_transcription",
        action: "prophecy_data_sync",
        status: "success",
        data: JSON.stringify(prophecyData),
        relatedId: args.messageId,
      });

      // Trigger prophecy analysis if enough data points
      const recentProphecyData = await ctx.db
        .query("integrationLogs")
        .filter((q) =>
          q.and(
            q.eq(q.field("service"), "ai_transcription"),
            q.eq(q.field("action"), "prophecy_data_sync"),
            q.gte(q.field("_creationTime"), Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          )
        )
        .collect();

      if (recentProphecyData.length >= 10) {
        // Schedule prophecy analysis
        await ctx.scheduler.runAfter(0, internal.integrationService.triggerProphecyAnalysis, {
          district: args.districtContext.district,
          dataPoints: recentProphecyData.length,
        });
      }
    }

    return { success: true, keywordsExtracted: serviceKeywords.length };
  },
});

// Internal mutation to trigger prophecy analysis
export const triggerProphecyAnalysis = internalMutation({
  args: {
    district: v.string(),
    dataPoints: v.number(),
  },
  handler: async (ctx, args) => {
    // Create notification for management about prophecy insights
    const managers = await ctx.db
      .query("userProfiles")
      .filter((q) => q.or(q.eq(q.field("role"), "admin"), q.eq(q.field("role"), "manager")))
      .collect();

    for (const manager of managers) {
      await ctx.db.insert("notifications", {
        userId: manager.userId,
        title: `🔮 Prophecy Analysis Ready - ${args.district}`,
        message: `AI analysis complete for ${args.district} with ${args.dataPoints} data points`,
        type: "district_alert",
        priority: "medium",
        read: false,
        relatedId: `prophecy_${args.district}_${Date.now()}`,
        actionUrl: `/prophecy?district=${args.district}`,
        districtContext: {
          district: args.district,
          affluenceLevel: 5,
          priorityMultiplier: 1.0,
        },
        aiGenerated: true,
      });
    }

    return { success: true, notificationsSent: managers.length };
  },
});

// Helper function to extract service keywords
function extractServiceKeywords(content: string): string[] {
  const keywords = [
    "installation",
    "maintenance",
    "repair",
    "service",
    "emergency",
    "heating",
    "cooling",
    "ventilation",
    "AC",
    "air conditioning",
    "split",
    "central",
    "duct",
    "filter",
    "thermostat",
    "urgent",
    "broken",
    "not working",
    "cold",
    "hot",
    "noise",
  ];

  const contentLower = content.toLowerCase();
  return keywords.filter((keyword) => contentLower.includes(keyword));
}

// Client portal integration sync
export const syncClientPortalActivity = mutation({
  args: {
    contactId: v.id("contacts"),
    activityType: v.union(
      v.literal("booking_created"),
      v.literal("feedback_submitted"),
      v.literal("portal_accessed"),
      v.literal("service_viewed")
    ),
    activityData: v.string(), // JSON string
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get contact information
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    // Parse activity data
    const activityData = JSON.parse(args.activityData);

    // Create integration log
    const logId = await ctx.db.insert("integrationLogs", {
      service: "maps",
      action: `client_portal_${args.activityType}`,
      status: "success",
      data: JSON.stringify({
        contactId: args.contactId,
        district: contact.district,
        activityType: args.activityType,
        activityData,
        location: args.location,
      }),
      relatedId: args.contactId,
    });

    // Sync with prophecy system for booking activities
    if (args.activityType === "booking_created" && contact.district) {
      await ctx.scheduler.runAfter(0, internal.integrationService.syncProphecyData, {
        messageId: logId as any, // Use log ID as reference
        content: `Client booking: ${activityData.serviceType || "service"} in ${contact.district}`,
        districtContext: {
          district: contact.district,
          urgencyLevel: activityData.urgency || "normal",
        },
        timestamp: Date.now(),
      });
    }

    return { success: true, logId };
  },
});
