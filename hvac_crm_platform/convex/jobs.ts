import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    assignedToMe: v.optional(v.boolean()),
    search: v.optional(v.string()),
    district: v.optional(v.string()),
    scheduledAfter: v.optional(v.number()),
    scheduledBefore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.search) {
      return await ctx.db
        .query("jobs")
        .withSearchIndex("search_jobs", (q) => q.search("title", args.search!))
        .collect();
    }

    let jobs;
    if (args.status) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .take(100);
    } else if (args.type) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_type", (q) => q.eq("type", args.type as any))
        .order("desc")
        .take(100);
    } else {
      jobs = await ctx.db.query("jobs").order("desc").take(100);
    }

    let filteredJobs = jobs;

    if (args.assignedToMe) {
      filteredJobs = jobs.filter((job) => job.assignedTechnicians.includes(userId));
    }

    // Add contact information to each job
    const jobsWithContacts = await Promise.all(
      filteredJobs.map(async (job) => {
        const contact = await ctx.db.get(job.contactId);
        return {
          ...job,
          contact,
        };
      })
    );

    let finalJobs = jobsWithContacts;

    // Filter by date range
    if (args.scheduledAfter || args.scheduledBefore) {
      finalJobs = finalJobs.filter((job) => {
        if (!job.scheduledDate) return false;
        if (args.scheduledAfter && job.scheduledDate < args.scheduledAfter) return false;
        if (args.scheduledBefore && job.scheduledDate > args.scheduledBefore) return false;
        return true;
      });
    }

    if (args.district) {
      finalJobs = finalJobs.filter((job) => job.contact?.district === args.district);
    }

    return finalJobs;
  },
});

export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const job = await ctx.db.get(args.id);
    if (!job) return null;

    // Get contact details
    const contact = await ctx.db.get(job.contactId);

    // Get assigned technicians details
    const technicians = await Promise.all(
      job.assignedTechnicians.map(async (techId) => {
        const user = await ctx.db.get(techId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", techId))
          .first();
        return { user, profile };
      })
    );

    // Get equipment used details
    let equipmentDetails: any[] = [];
    if (job.equipmentUsed) {
      equipmentDetails = await Promise.all(
        job.equipmentUsed.map(async (eq) => {
          const equipment = await ctx.db.get(eq.equipmentId);
          return { ...equipment, quantity: eq.quantity };
        })
      );
    }

    // Get related messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .order("desc")
      .take(20);

    return {
      ...job,
      contact,
      technicians,
      equipmentDetails,
      messages,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    contactId: v.id("contacts"),
    type: v.union(
      v.literal("installation"),
      v.literal("repair"),
      v.literal("maintenance"),
      v.literal("inspection"),
      v.literal("emergency"),
      v.literal("warranty")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    scheduledDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    assignedTechnicians: v.array(v.id("users")),
    equipmentUsed: v.optional(
      v.array(
        v.object({
          equipmentId: v.id("equipment"),
          quantity: v.number(),
        })
      )
    ),
    aiQuoteData: v.optional(
      v.object({
        transcriptId: v.optional(v.id("transcriptions")),
        estimatedCost: v.optional(v.number()),
        confidence: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const jobId = await ctx.db.insert("jobs", {
      ...args,
      status: "lead",
      createdBy: userId,
    });

    // Create notifications for assigned technicians
    for (const techId of args.assignedTechnicians) {
      await ctx.db.insert("notifications", {
        userId: techId,
        title: "New Job Assigned",
        message: `You have been assigned to: ${args.title}`,
        type: "job_assigned",
        priority: args.priority === "urgent" ? "high" : "medium",
        read: false,
        relatedId: jobId,
        actionUrl: `/jobs/${jobId}`,
      });
    }

    // Update equipment quantities if used
    if (args.equipmentUsed) {
      for (const eq of args.equipmentUsed) {
        const equipment = await ctx.db.get(eq.equipmentId);
        if (equipment) {
          const newQuantity = Math.max(0, equipment.quantity - eq.quantity);
          await ctx.db.patch(eq.equipmentId, { quantity: newQuantity });
        }
      }
    }

    return jobId;
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("installation"),
        v.literal("repair"),
        v.literal("maintenance"),
        v.literal("inspection"),
        v.literal("emergency"),
        v.literal("warranty")
      )
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))
    ),
    status: v.optional(
      v.union(
        v.literal("lead"),
        v.literal("quoted"),
        v.literal("approved"),
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("invoiced"),
        v.literal("paid"),
        v.literal("cancelled")
      )
    ),
    scheduledDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    assignedTechnicians: v.optional(v.array(v.id("users"))),
    laborCost: v.optional(v.number()),
    materialCost: v.optional(v.number()),
    totalCost: v.optional(v.number()),
    notes: v.optional(v.string()),
    routeOrder: v.optional(v.number()),
    nextServiceDue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const job = await ctx.db.get(id);

    if (!job) throw new Error("Job not found");

    // If status is being updated to completed, set completion date
    if (updates.status === "completed" && !updates.completedDate) {
      updates.completedDate = Date.now();

      // Set next service date for maintenance jobs
      if (job.type === "maintenance" || job.type === "installation") {
        const nextService = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
        updates.nextServiceDue = nextService;
      }
    }

    await ctx.db.patch(id, updates);

    // Create notifications for status changes
    if (updates.status && updates.status !== job.status) {
      const _contact = await ctx.db.get(job.contactId);

      // Notify assigned technicians
      for (const techId of job.assignedTechnicians) {
        await ctx.db.insert("notifications", {
          userId: techId,
          title: "Job Status Updated",
          message: `${job.title} status changed to ${updates.status}`,
          type: updates.status === "completed" ? "job_completed" : "system",
          priority: "medium",
          read: false,
          relatedId: id,
        });
      }
    }

    // Handle technician reassignment
    if (updates.assignedTechnicians && updates.assignedTechnicians !== job.assignedTechnicians) {
      const newTechnicians = updates.assignedTechnicians.filter(
        (techId) => !job.assignedTechnicians.includes(techId)
      );

      for (const techId of newTechnicians) {
        await ctx.db.insert("notifications", {
          userId: techId,
          title: "New Job Assignment",
          message: `You have been assigned to: ${job.title}`,
          type: "job_assigned",
          priority: job.priority === "urgent" ? "high" : "medium",
          read: false,
          relatedId: id,
        });
      }
    }
  },
});

export const getUpcoming = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_scheduled_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledDate"), now),
          q.lte(q.field("scheduledDate"), futureDate),
          q.neq(q.field("status"), "cancelled"),
          q.neq(q.field("status"), "completed")
        )
      )
      .collect();

    // Add contact information
    return await Promise.all(
      jobs.map(async (job) => {
        const contact = await ctx.db.get(job.contactId);
        return { ...job, contact };
      })
    );
  },
});

export const getServiceDue = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const nextMonth = now + 30 * 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("jobs")
      .withIndex("by_next_service")
      .filter((q) =>
        q.and(q.lte(q.field("nextServiceDue"), nextMonth), q.gte(q.field("nextServiceDue"), now))
      )
      .collect();
  },
});

export const optimizeRoute = mutation({
  args: {
    jobIds: v.array(v.id("jobs")),
    technicianId: v.id("users"),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get technician's home location
    const techProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.technicianId))
      .first();

    if (!techProfile?.homeLocation) {
      throw new Error("Technician home location not set");
    }

    // Get jobs with contact locations
    const jobs = await Promise.all(
      args.jobIds.map(async (jobId) => {
        const job = await ctx.db.get(jobId);
        const contact = job?.contactId ? await ctx.db.get(job.contactId) : null;
        return { job, contact };
      })
    );

    // Simple route optimization (in real app, use Google Maps API or similar)
    // For now, just order by district
    const optimizedJobs = jobs.sort((a, b) => {
      const districtA = a.contact?.district || "";
      const districtB = b.contact?.district || "";
      return districtA.localeCompare(districtB);
    });

    // Update route order for each job
    for (let i = 0; i < optimizedJobs.length; i++) {
      if (optimizedJobs[i].job?._id) {
        await ctx.db.patch(optimizedJobs[i].job?._id, {
          routeOrder: i + 1,
        });
      }
    }

    return optimizedJobs.map(({ job }) => job?._id);
  },
});

export const addServiceHistory = mutation({
  args: {
    jobId: v.id("jobs"),
    type: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    const currentHistory = job.serviceHistory || [];
    const newEntry = {
      date: Date.now(),
      type: args.type,
      notes: args.notes,
      technicianId: userId,
    };

    await ctx.db.patch(args.jobId, {
      serviceHistory: [...currentHistory, newEntry],
      lastServiceDate: Date.now(),
    });
  },
});

// Schedule-specific queries
export const listScheduled = query({
  args: {
    scheduledAfter: v.optional(v.number()),
    scheduledBefore: v.optional(v.number()),
    technicianId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let jobs = await ctx.db
      .query("jobs")
      .withIndex("by_scheduled_date")
      .filter((q) => q.neq(q.field("scheduledDate"), undefined))
      .collect();

    // Filter by date range
    if (args.scheduledAfter || args.scheduledBefore) {
      jobs = jobs.filter((job) => {
        if (!job.scheduledDate) return false;
        if (args.scheduledAfter && job.scheduledDate < args.scheduledAfter) return false;
        if (args.scheduledBefore && job.scheduledDate > args.scheduledBefore) return false;
        return true;
      });
    }

    // Filter by technician
    if (args.technicianId) {
      jobs = jobs.filter((job) => job.assignedTechnicians.includes(args.technicianId!));
    }

    // Add contact information
    return await Promise.all(
      jobs.map(async (job) => {
        const contact = await ctx.db.get(job.contactId);
        return { ...job, contact };
      })
    );
  },
});

export const getScheduleForDate = query({
  args: {
    date: v.number(), // timestamp for the specific date
    technicianId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    let jobs = await ctx.db
      .query("jobs")
      .withIndex("by_scheduled_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledDate"), startOfDay.getTime()),
          q.lte(q.field("scheduledDate"), endOfDay.getTime())
        )
      )
      .collect();

    // Filter by technician if specified
    if (args.technicianId) {
      jobs = jobs.filter((job) => job.assignedTechnicians.includes(args.technicianId!));
    }

    // Add contact information
    return await Promise.all(
      jobs.map(async (job) => {
        const contact = await ctx.db.get(job.contactId);
        return { ...job, contact };
      })
    );
  },
});

// Get scheduled jobs for a specific date (for route optimization)
export const getScheduledForDate = query({
  args: { date: v.string() }, // YYYY-MM-DD format
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const startOfDay = new Date(`${args.date}T00:00:00.000Z`).getTime();
    const endOfDay = new Date(`${args.date}T23:59:59.999Z`).getTime();

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_scheduled_date", (q) =>
        q.gte("scheduledDate", startOfDay).lte("scheduledDate", endOfDay)
      )
      .collect();

    // Add contact information and coordinates
    return await Promise.all(
      jobs.map(async (job) => {
        const contact = await ctx.db.get(job.contactId);
        return {
          ...job,
          contact,
          coordinates: contact?.coordinates,
          address: contact?.address,
          district: contact?.district,
        };
      })
    );
  },
});

// ============================================================================
// BULK OPERATIONS API
// ============================================================================

/**
 * Bulk update multiple jobs/services
 */
export const bulkUpdate = mutation({
  args: {
    jobIds: v.array(v.id("jobs")),
    updates: v.object({
      status: v.optional(v.string()),
      priority: v.optional(v.string()),
      district: v.optional(v.string()),
      assignedTechnicians: v.optional(v.array(v.id("users"))),
      scheduledDate: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = [];
    const errors = [];

    // Process each job update
    for (const jobId of args.jobIds) {
      try {
        const job = await ctx.db.get(jobId);
        if (!job) {
          errors.push({ jobId, error: "Job not found" });
          continue;
        }

        // Apply updates
        const updateData: any = {};
        if (args.updates.status) updateData.status = args.updates.status;
        if (args.updates.priority) updateData.priority = args.updates.priority;
        if (args.updates.assignedTechnicians)
          updateData.assignedTechnicians = args.updates.assignedTechnicians;
        if (args.updates.scheduledDate) updateData.scheduledDate = args.updates.scheduledDate;

        await ctx.db.patch(jobId, updateData);
        results.push({ jobId, success: true });
      } catch (error) {
        errors.push({ jobId, error: (error as Error).message });
      }
    }

    return {
      success: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    };
  },
});

/**
 * Bulk delete multiple jobs/services
 */
export const bulkDelete = mutation({
  args: {
    jobIds: v.array(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = [];
    const errors = [];

    // Process each job deletion
    for (const jobId of args.jobIds) {
      try {
        const job = await ctx.db.get(jobId);
        if (!job) {
          errors.push({ jobId, error: "Job not found" });
          continue;
        }

        await ctx.db.delete(jobId);
        results.push({ jobId, success: true });
      } catch (error) {
        errors.push({ jobId, error: (error as Error).message });
      }
    }

    return {
      success: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    };
  },
});

/**
 * Get jobs data for bulk operations (before changes)
 */
export const getBulkData = query({
  args: {
    jobIds: v.array(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const jobs = [];

    for (const jobId of args.jobIds) {
      const job = await ctx.db.get(jobId);
      if (job) {
        jobs.push(job);
      }
    }

    return jobs;
  },
});
