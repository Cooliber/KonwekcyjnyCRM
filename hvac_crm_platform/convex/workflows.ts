import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

// Type definitions for workflow actions
interface WorkflowAction {
  type:
    | "SEND_NOTIFICATION"
    | "UPDATE_RECORD"
    | "CREATE_TASK"
    | "ASSIGN_TECHNICIAN"
    | "UPDATE_STATUS"
    | "TRIGGER_ROUTE_OPTIMIZATION"
    | "TRIGGER_WEBHOOK"
    | "GENERATE_INVOICE";
  config: {
    target: string;
    template?: string;
    channel: "email" | "sms" | "push" | "telegram";
    timeout?: number;
  };
}

interface WorkflowExecutionResult {
  executionTime: number;
  workflowsProcessed: number;
  successfulExecutions: number;
  failedExecutions: number;
  results: Array<{
    workflowId: string;
    workflowName: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

interface Workflow {
  _id: Id<"workflows">;
  name: string;
  description?: string;
  triggerEvent: string;
  triggerCondition: {
    entityType: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  actions: WorkflowAction[];
  status: "active" | "disabled";
  metrics: {
    executions: number;
    successes: number;
    failures: number;
    lastError?: string;
  };
  createdBy: Id<"users">;
}

/**
 * Workflow Automation Engine for HVAC CRM
 * Provides custom rule builder for Jobs/Contacts automation
 * Target: <1s execution for 100 rules, 90% test coverage
 */

// Get all workflows with filtering
export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("disabled"))),
    triggerEvent: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("workflows");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.triggerEvent) {
      query = query.filter((q) => q.eq(q.field("triggerEvent"), args.triggerEvent));
    }

    const workflows = await query.order("desc").take(args.limit || 50);

    return workflows;
  },
});

// Create new workflow
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    triggerEvent: v.union(
      v.literal("JOB_STATUS_CHANGE"),
      v.literal("CONTACT_CREATED"),
      v.literal("INVOICE_GENERATED"),
      v.literal("EQUIPMENT_LOW_STOCK"),
      v.literal("SCHEDULED_TIME")
    ),
    triggerCondition: v.object({
      entityType: v.union(v.literal("job"), v.literal("contact"), v.literal("invoice")),
      conditions: v.array(
        v.object({
          field: v.string(),
          operator: v.union(
            v.literal("eq"),
            v.literal("neq"),
            v.literal("gt"),
            v.literal("lt"),
            v.literal("contains")
          ),
          value: v.any(),
        })
      ),
    }),
    actions: v.array(
      v.object({
        type: v.union(
          v.literal("SEND_NOTIFICATION"),
          v.literal("UPDATE_RECORD"),
          v.literal("CREATE_TASK"),
          v.literal("ASSIGN_TECHNICIAN"),
          v.literal("UPDATE_STATUS"),
          v.literal("TRIGGER_ROUTE_OPTIMIZATION"),
          v.literal("TRIGGER_WEBHOOK"),
          v.literal("GENERATE_INVOICE")
        ),
        config: v.object({
          target: v.string(),
          template: v.optional(v.string()),
          channel: v.union(
            v.literal("email"),
            v.literal("sms"),
            v.literal("push"),
            v.literal("telegram")
          ),
          timeout: v.optional(v.number()),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workflowId = await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      triggerEvent: args.triggerEvent,
      triggerCondition: args.triggerCondition,
      actions: args.actions,
      status: "active",
      metrics: {
        executions: 0,
        successes: 0,
        failures: 0,
      },
      createdBy: userId,
    });

    return workflowId;
  },
});

// Update workflow
export const update = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerCondition: v.optional(
      v.object({
        entityType: v.union(v.literal("job"), v.literal("contact"), v.literal("invoice")),
        conditions: v.array(
          v.object({
            field: v.string(),
            operator: v.union(
              v.literal("eq"),
              v.literal("neq"),
              v.literal("gt"),
              v.literal("lt"),
              v.literal("contains")
            ),
            value: v.any(),
          })
        ),
      })
    ),
    actions: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("SEND_NOTIFICATION"),
            v.literal("UPDATE_RECORD"),
            v.literal("CREATE_TASK"),
            v.literal("ASSIGN_TECHNICIAN"),
            v.literal("UPDATE_STATUS"),
            v.literal("TRIGGER_ROUTE_OPTIMIZATION"),
            v.literal("TRIGGER_WEBHOOK"),
            v.literal("GENERATE_INVOICE")
          ),
          config: v.object({
            target: v.string(),
            template: v.optional(v.string()),
            channel: v.union(
              v.literal("email"),
              v.literal("sms"),
              v.literal("push"),
              v.literal("telegram")
            ),
            timeout: v.optional(v.number()),
          }),
        })
      )
    ),
    status: v.optional(v.union(v.literal("active"), v.literal("disabled"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    return id;
  },
});

// Execute workflow engine - processes all active workflows
export const executeWorkflows = internalAction({
  args: {
    triggerEvent: v.string(),
    entityId: v.string(),
    entityType: v.union(v.literal("job"), v.literal("contact"), v.literal("invoice")),
    entityData: v.any(),
  },
  handler: async (ctx, args): Promise<WorkflowExecutionResult> => {
    const startTime = Date.now();

    // Get all active workflows for this trigger event
    const workflows: Workflow[] = await ctx.runQuery(internal.workflows.getActiveWorkflows, {
      triggerEvent: args.triggerEvent,
      entityType: args.entityType,
    });

    const results: Array<{
      workflowId: string;
      workflowName: string;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];

    for (const workflow of workflows) {
      try {
        const shouldExecute = await evaluateConditions(workflow.triggerCondition, args.entityData);

        if (shouldExecute) {
          const result: any = await ctx.runMutation(internal.workflows.executeWorkflowActions, {
            workflowId: workflow._id,
            entityId: args.entityId,
            entityType: args.entityType,
            entityData: args.entityData,
            actions: workflow.actions,
          });

          results.push({
            workflowId: workflow._id,
            workflowName: workflow.name,
            success: true,
            result,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          workflowId: workflow._id,
          workflowName: workflow.name,
          success: false,
          error: errorMessage,
        });

        // Update workflow metrics
        await ctx.runMutation(internal.workflows.updateWorkflowMetrics, {
          workflowId: workflow._id,
          success: false,
          error: errorMessage,
        });
      }
    }

    const executionTime = Date.now() - startTime;

    // Log performance metrics
    await ctx.runMutation(internal.workflows.logPerformanceMetrics, {
      triggerEvent: args.triggerEvent,
      workflowsProcessed: workflows.length,
      executionTime,
      results,
    });

    return {
      executionTime,
      workflowsProcessed: workflows.length,
      successfulExecutions: results.filter((r) => r.success).length,
      failedExecutions: results.filter((r) => !r.success).length,
      results,
    };
  },
});

// Internal query to get active workflows
export const getActiveWorkflows = internalQuery({
  args: {
    triggerEvent: v.string(),
    entityType: v.string(),
  },
  handler: async (ctx, args): Promise<Workflow[]> => {
    return await ctx.db
      .query("workflows")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("triggerEvent"), args.triggerEvent),
          q.eq(q.field("triggerCondition.entityType"), args.entityType)
        )
      )
      .collect();
  },
});

// Internal mutation to execute workflow actions
export const executeWorkflowActions = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    entityId: v.string(),
    entityType: v.string(),
    entityData: v.any(),
    actions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const actionResults = [];

    for (const action of args.actions) {
      try {
        let result;

        switch (action.type) {
          case "ASSIGN_TECHNICIAN":
            result = await assignTechnician(ctx, args.entityId, action.config);
            break;

          case "SEND_NOTIFICATION":
            result = await sendNotification(ctx, args.entityData, action.config);
            break;

          case "UPDATE_STATUS":
            result = await updateEntityStatus(ctx, args.entityId, args.entityType, action.config);
            break;

          case "CREATE_TASK":
            result = await createTask(ctx, args.entityData, action.config);
            break;

          case "TRIGGER_ROUTE_OPTIMIZATION":
            result = await triggerRouteOptimization(ctx, args.entityData, action.config);
            break;

          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }

        actionResults.push({
          actionType: action.type,
          success: true,
          result,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        actionResults.push({
          actionType: action.type,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Update workflow metrics
    await ctx.db.patch(args.workflowId, {
      lastTriggered: Date.now(),
      metrics: {
        executions: (await ctx.db.get(args.workflowId))?.metrics.executions + 1,
        successes:
          (await ctx.db.get(args.workflowId))?.metrics.successes +
          (actionResults.every((r) => r.success) ? 1 : 0),
        failures:
          (await ctx.db.get(args.workflowId))?.metrics.failures +
          (actionResults.some((r) => !r.success) ? 1 : 0),
      },
    });

    return actionResults;
  },
});

// Helper function to evaluate workflow conditions
function evaluateConditions(triggerCondition: any, entityData: any): boolean {
  for (const condition of triggerCondition.conditions) {
    const fieldValue = getNestedValue(entityData, condition.field);

    switch (condition.operator) {
      case "eq":
        if (fieldValue !== condition.value) return false;
        break;
      case "neq":
        if (fieldValue === condition.value) return false;
        break;
      case "gt":
        if (fieldValue <= condition.value) return false;
        break;
      case "lt":
        if (fieldValue >= condition.value) return false;
        break;
      case "contains":
        if (!String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase()))
          return false;
        break;
      default:
        return false;
    }
  }

  return true;
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Action implementations
async function assignTechnician(ctx: any, entityId: string, parameters: any) {
  const { district, priority, specialtyRequired } = parameters;

  // Find available technicians in the district
  const technicians = await ctx.db
    .query("userProfiles")
    .filter((q: any) => q.and(q.eq(q.field("role"), "technician"), q.eq(q.field("isActive"), true)))
    .collect();

  // Filter by district and specialty
  const availableTechnicians = technicians.filter(
    (tech: any) =>
      tech.serviceAreas?.includes(district) &&
      (!specialtyRequired || tech.specialties?.includes(specialtyRequired))
  );

  if (availableTechnicians.length === 0) {
    throw new Error("No available technicians found");
  }

  // Simple assignment logic - can be enhanced with load balancing
  const assignedTechnician = availableTechnicians[0];

  // Update job with assigned technician
  await ctx.db.patch(entityId as any, {
    assignedTechnicians: [assignedTechnician.userId],
  });

  return { assignedTechnicianId: assignedTechnician.userId };
}

async function sendNotification(ctx: any, entityData: any, parameters: any) {
  const { userId, title, message, type, priority } = parameters;

  const notificationId = await ctx.db.insert("notifications", {
    userId: userId || entityData.assignedTo || entityData.createdBy,
    title: title || "Workflow Notification",
    message: message || "Automated workflow action triggered",
    type: type || "system",
    priority: priority || "medium",
    read: false,
    aiGenerated: true,
  });

  return { notificationId };
}

async function updateEntityStatus(
  ctx: any,
  entityId: string,
  _entityType: string,
  parameters: any
) {
  const { status } = parameters;

  await ctx.db.patch(entityId as any, { status });

  return { updatedStatus: status };
}

async function createTask(ctx: any, entityData: any, parameters: any) {
  const { title, description, assignedTo, priority } = parameters;

  const taskId = await ctx.db.insert("jobs", {
    title: title || "Automated Task",
    description: description || "Task created by workflow automation",
    contactId: entityData.contactId,
    type: "maintenance",
    priority: priority || "medium",
    status: "lead",
    assignedTechnicians: assignedTo ? [assignedTo] : [],
    createdBy: entityData.createdBy,
  });

  return { taskId };
}

async function triggerRouteOptimization(_ctx: any, entityData: any, parameters: any) {
  const { district, date } = parameters;

  // This would trigger the route optimization system
  // For now, we'll just log the trigger
  return {
    routeOptimizationTriggered: true,
    district: district || entityData.district,
    date: date || new Date().toISOString().split("T")[0],
  };
}

// Internal mutation to update workflow metrics
export const updateWorkflowMetrics = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return;

    await ctx.db.patch(args.workflowId, {
      metrics: {
        executions: workflow.metrics.executions + 1,
        successes: workflow.metrics.successes + (args.success ? 1 : 0),
        failures: workflow.metrics.failures + (args.success ? 0 : 1),
        lastError: args.error,
      },
    });
  },
});

// Internal mutation to log performance metrics
export const logPerformanceMetrics = internalMutation({
  args: {
    triggerEvent: v.string(),
    workflowsProcessed: v.number(),
    executionTime: v.number(),
    results: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    // Log to integration logs for monitoring
    await ctx.db.insert("integrationLogs", {
      service: "workflows",
      action: `workflow_execution_${args.triggerEvent}`,
      status: "success",
      data: JSON.stringify({
        workflowsProcessed: args.workflowsProcessed,
        executionTime: args.executionTime,
        successRate: args.results.filter((r) => r.success).length / args.results.length,
        performanceTarget: args.executionTime < 1000 ? "met" : "exceeded",
      }),
      relatedId: args.triggerEvent,
    });
  },
});
