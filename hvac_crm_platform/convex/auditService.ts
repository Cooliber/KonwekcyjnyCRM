import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Type definitions for audit service
interface HealthCheckStatus {
  status: "healthy" | "warning" | "error" | "unknown";
  lastSync: number | null;
  issues: string[];
}

interface HealthChecks {
  convexToWeaviate: HealthCheckStatus;
  communicationsToMap: HealthCheckStatus;
  clientPortalToSystems: HealthCheckStatus;
  notificationDelivery: HealthCheckStatus;
}

interface AuditCheckpointResult {
  checkpointId: Id<"integrationLogs">;
  timestamp: number;
  systemHealth: any;
}

/**
 * Audit Service for Cross-System Data Synchronization
 * Tracks data consistency across Convex, Weaviate, and Leaflet integrations
 */

// Get comprehensive audit report
export const getAuditReport = query({
  args: {
    timeRange: v.optional(
      v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"))
    ),
    service: v.optional(
      v.union(
        v.literal("telegram"),
        v.literal("sms"),
        v.literal("email"),
        v.literal("ai_transcription"),
        v.literal("ocr"),
        v.literal("maps")
      )
    ),
    status: v.optional(v.union(v.literal("success"), v.literal("error"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const timeRangeMs = getTimeRangeMs(timeRange);
    const cutoffTime = Date.now() - timeRangeMs;

    // Get integration logs
    let logsQuery = ctx.db
      .query("integrationLogs")
      .filter((q) => q.gte(q.field("_creationTime"), cutoffTime));

    if (args.service) {
      logsQuery = logsQuery.filter((q) => q.eq(q.field("service"), args.service));
    }

    if (args.status) {
      logsQuery = logsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const logs = await logsQuery.collect();

    // Calculate metrics
    const totalOperations = logs.length;
    const successfulOperations = logs.filter((log) => log.status === "success").length;
    const failedOperations = logs.filter((log) => log.status === "error").length;
    const pendingOperations = logs.filter((log) => log.status === "pending").length;

    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0;

    // Group by service
    const serviceBreakdown = logs.reduce(
      (acc, log) => {
        if (!acc[log.service]) {
          acc[log.service] = { total: 0, success: 0, error: 0, pending: 0 };
        }
        acc[log.service].total++;
        acc[log.service][log.status]++;
        return acc;
      },
      {} as Record<string, any>
    );

    // Group by action
    const actionBreakdown = logs.reduce(
      (acc, log) => {
        if (!acc[log.action]) {
          acc[log.action] = { total: 0, success: 0, error: 0, pending: 0 };
        }
        acc[log.action].total++;
        acc[log.action][log.status]++;
        return acc;
      },
      {} as Record<string, any>
    );

    // Recent errors
    const recentErrors = logs
      .filter((log) => log.status === "error")
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10)
      .map((log) => ({
        id: log._id,
        service: log.service,
        action: log.action,
        errorMessage: log.errorMessage,
        timestamp: log._creationTime,
        relatedId: log.relatedId,
      }));

    // Data sync health check
    const dataSyncHealth = await performDataSyncHealthCheck(ctx);

    return {
      summary: {
        timeRange,
        totalOperations,
        successfulOperations,
        failedOperations,
        pendingOperations,
        successRate: Math.round(successRate * 100) / 100,
      },
      serviceBreakdown,
      actionBreakdown,
      recentErrors,
      dataSyncHealth,
      generatedAt: Date.now(),
    };
  },
});

// Perform comprehensive data sync health check
async function performDataSyncHealthCheck(ctx: any) {
  const healthChecks: HealthChecks = {
    convexToWeaviate: { status: "unknown", lastSync: null, issues: [] },
    communicationsToMap: { status: "unknown", lastSync: null, issues: [] },
    clientPortalToSystems: { status: "unknown", lastSync: null, issues: [] },
    notificationDelivery: { status: "unknown", lastSync: null, issues: [] },
  };

  try {
    // Check Convex to Weaviate sync
    const weaviateSyncLogs = await ctx.db
      .query("integrationLogs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("service"), "ai_transcription"),
          q.eq(q.field("action"), "prophecy_data_sync"),
          q.gte(q.field("_creationTime"), Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
      .collect();

    healthChecks.convexToWeaviate.status = weaviateSyncLogs.length > 0 ? "healthy" : "warning";
    healthChecks.convexToWeaviate.lastSync =
      weaviateSyncLogs.length > 0
        ? Math.max(...weaviateSyncLogs.map((log: any) => log._creationTime))
        : null;

    if (weaviateSyncLogs.filter((log: any) => log.status === "error").length > 0) {
      healthChecks.convexToWeaviate.status = "error";
      healthChecks.convexToWeaviate.issues.push("Recent sync errors detected");
    }

    // Check communications to map integration
    const mapSyncLogs = await ctx.db
      .query("integrationLogs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("service"), "maps"),
          q.eq(q.field("action"), "communication_sync"),
          q.gte(q.field("_creationTime"), Date.now() - 60 * 60 * 1000)
        )
      )
      .collect();

    healthChecks.communicationsToMap.status = mapSyncLogs.length > 0 ? "healthy" : "warning";
    healthChecks.communicationsToMap.lastSync =
      mapSyncLogs.length > 0 ? Math.max(...mapSyncLogs.map((log: any) => log._creationTime)) : null;

    // Check client portal integration
    const portalSyncLogs = await ctx.db
      .query("integrationLogs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("service"), "client_portal"),
          q.gte(q.field("_creationTime"), Date.now() - 60 * 60 * 1000)
        )
      )
      .collect();

    healthChecks.clientPortalToSystems.status = portalSyncLogs.length > 0 ? "healthy" : "warning";
    healthChecks.clientPortalToSystems.lastSync =
      portalSyncLogs.length > 0
        ? Math.max(...portalSyncLogs.map((log: any) => log._creationTime))
        : null;

    // Check notification delivery
    const notificationLogs = await ctx.db
      .query("integrationLogs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("action"), "notification_delivered"),
          q.gte(q.field("_creationTime"), Date.now() - 60 * 60 * 1000)
        )
      )
      .collect();

    healthChecks.notificationDelivery.status = notificationLogs.length > 0 ? "healthy" : "warning";
    healthChecks.notificationDelivery.lastSync =
      notificationLogs.length > 0
        ? Math.max(...notificationLogs.map((log: any) => log._creationTime))
        : null;
  } catch (error) {
    console.error("Health check failed:", error);
  }

  return healthChecks;
}

// Create audit checkpoint
export const createAuditCheckpoint = mutation({
  args: {
    checkpointType: v.union(v.literal("daily"), v.literal("weekly"), v.literal("manual")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AuditCheckpointResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current system state
    const auditReport: any = await ctx.runQuery(api.auditService.getAuditReport, {
      timeRange: "24h",
    });

    // Create checkpoint log
    const checkpointId: Id<"integrationLogs"> = await ctx.db.insert("integrationLogs", {
      service: "maps",
      action: `audit_checkpoint_${args.checkpointType}`,
      status: "success",
      data: JSON.stringify({
        auditReport,
        description: args.description,
        createdBy: userId,
      }),
      relatedId: userId,
    });

    return {
      checkpointId,
      timestamp: Date.now(),
      systemHealth: auditReport.dataSyncHealth,
    };
  },
});

// Get data consistency report
export const getDataConsistencyReport = query({
  args: {
    entityType: v.optional(
      v.union(
        v.literal("messages"),
        v.literal("notifications"),
        v.literal("jobs"),
        v.literal("contacts")
      )
    ),
  },
  handler: async (ctx, args) => {
    const consistencyChecks = [];

    if (!args.entityType || args.entityType === "messages") {
      // Check message-notification consistency
      const recentMessages = await ctx.db
        .query("messages")
        .filter((q) => q.gte(q.field("_creationTime"), Date.now() - 24 * 60 * 60 * 1000))
        .collect();

      const messageNotifications = await ctx.db
        .query("notifications")
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "message"),
            q.gte(q.field("_creationTime"), Date.now() - 24 * 60 * 60 * 1000)
          )
        )
        .collect();

      consistencyChecks.push({
        entity: "messages",
        totalEntities: recentMessages.length,
        relatedNotifications: messageNotifications.length,
        consistencyRatio:
          recentMessages.length > 0 ? messageNotifications.length / recentMessages.length : 0,
        issues:
          recentMessages.length > messageNotifications.length
            ? [
                `${recentMessages.length - messageNotifications.length} messages missing notifications`,
              ]
            : [],
      });
    }

    if (!args.entityType || args.entityType === "jobs") {
      // Check job-location consistency
      const jobsWithLocation = await ctx.db
        .query("jobs")
        .filter((q) => q.neq(q.field("location"), undefined))
        .collect();

      const mapSyncLogs = await ctx.db
        .query("integrationLogs")
        .filter((q) =>
          q.and(q.eq(q.field("service"), "maps"), q.eq(q.field("action"), "job_location_sync"))
        )
        .collect();

      consistencyChecks.push({
        entity: "jobs",
        totalEntities: jobsWithLocation.length,
        mapSyncRecords: mapSyncLogs.length,
        consistencyRatio:
          jobsWithLocation.length > 0 ? mapSyncLogs.length / jobsWithLocation.length : 0,
        issues: [],
      });
    }

    return {
      consistencyChecks,
      overallHealth: consistencyChecks.every((check) => check.consistencyRatio >= 0.8)
        ? "healthy"
        : "warning",
      generatedAt: Date.now(),
    };
  },
});

// Repair data inconsistencies
export const repairDataInconsistencies = mutation({
  args: {
    repairType: v.union(
      v.literal("missing_notifications"),
      v.literal("orphaned_logs"),
      v.literal("stale_cache")
    ),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const repairResults = {
      repairType: args.repairType,
      dryRun: args.dryRun,
      itemsFound: 0,
      itemsRepaired: 0,
      errors: [] as string[],
    };

    try {
      if (args.repairType === "missing_notifications") {
        // Find messages without corresponding notifications
        const recentMessages = await ctx.db
          .query("messages")
          .filter((q) => q.gte(q.field("_creationTime"), Date.now() - 24 * 60 * 60 * 1000))
          .collect();

        for (const message of recentMessages) {
          const existingNotification = await ctx.db
            .query("notifications")
            .filter((q) => q.eq(q.field("relatedId"), message._id))
            .first();

          if (!existingNotification) {
            repairResults.itemsFound++;

            if (!args.dryRun) {
              // Create missing notification
              await ctx.db.insert("notifications", {
                userId: message.senderId,
                title: "Message Sync Repair",
                message: "Notification created during data repair",
                type: "system",
                priority: "low",
                read: true,
                relatedId: message._id,
                actionUrl: `/messages/${message._id}`,
              });
              repairResults.itemsRepaired++;
            }
          }
        }
      }

      // Log repair operation
      await ctx.db.insert("integrationLogs", {
        service: "maps",
        action: `data_repair_${args.repairType}`,
        status: "success",
        data: JSON.stringify(repairResults),
        relatedId: userId,
      });
    } catch (error) {
      repairResults.errors.push(error instanceof Error ? error.message : String(error));
    }

    return repairResults;
  },
});

// Helper function to convert time range to milliseconds
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}
