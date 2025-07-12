import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Client portal caching configuration
const CLIENT_CACHE_CONFIG = {
  // TTL based on data type and update frequency
  DASHBOARD_TTL: 300000, // 5 minutes for dashboard data
  BOOKING_SLOTS_TTL: 60000, // 1 minute for booking slots
  SERVICE_HISTORY_TTL: 600000, // 10 minutes for service history
  HIGH_AFFLUENCE_MULTIPLIER: 0.5, // Reduce TTL by 50% for high-affluence clients

  // Cache keys
  DASHBOARD_KEY: (contactId: string) => `client_dashboard_${contactId}`,
  BOOKING_SLOTS_KEY: (district: string, serviceType: string, date: number) =>
    `booking_slots_${district}_${serviceType}_${Math.floor(date / 86400000)}`, // Daily cache
  ACCESS_KEY: (contactId: string, token: string) => `client_access_${contactId}_${token}`,

  // Rate limiting for client operations
  RATE_LIMITS: {
    BOOKING_CREATE: { requests: 5, window: 3600000 }, // 5 bookings per hour
    FEEDBACK_SUBMIT: { requests: 10, window: 3600000 }, // 10 feedback submissions per hour
    DASHBOARD_ACCESS: { requests: 100, window: 3600000 }, // 100 dashboard views per hour
  }
};

// Client portal cache
const clientCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const clientRateLimit = new Map<string, { count: number; resetTime: number }>();

// Cache helper functions for client portal
function getClientCacheKey(key: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {} as Record<string, any>);
  return `${key}_${JSON.stringify(sortedParams)}`;
}

function getClientTTL(baseKey: string, affluenceScore?: number): number {
  let baseTTL = CLIENT_CACHE_CONFIG.DASHBOARD_TTL;

  if (baseKey.includes('booking_slots')) {
    baseTTL = CLIENT_CACHE_CONFIG.BOOKING_SLOTS_TTL;
  } else if (baseKey.includes('service_history')) {
    baseTTL = CLIENT_CACHE_CONFIG.SERVICE_HISTORY_TTL;
  }

  // Reduce TTL for high-affluence clients (more frequent updates)
  if (affluenceScore && affluenceScore >= 8) {
    baseTTL *= CLIENT_CACHE_CONFIG.HIGH_AFFLUENCE_MULTIPLIER;
  }

  return baseTTL;
}

function getCachedClientData(cacheKey: string): any | null {
  const cached = clientCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.timestamp + cached.ttl) {
    clientCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedClientData(cacheKey: string, data: any, ttl: number): void {
  clientCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });

  // Cleanup old entries
  if (clientCache.size > 200) {
    const now = Date.now();
    for (const [key, value] of clientCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        clientCache.delete(key);
      }
    }
  }
}

function invalidateClientCache(pattern: string): void {
  for (const key of clientCache.keys()) {
    if (key.includes(pattern)) {
      clientCache.delete(key);
    }
  }
}

async function checkClientRateLimit(identifier: string, action: string): Promise<boolean> {
  const limit = CLIENT_CACHE_CONFIG.RATE_LIMITS[action as keyof typeof CLIENT_CACHE_CONFIG.RATE_LIMITS];
  if (!limit) return true;

  const key = `${identifier}_${action}`;
  const now = Date.now();
  const userLimit = clientRateLimit.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    clientRateLimit.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }

  if (userLimit.count >= limit.requests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Client portal authentication and access control
export const getClientAccess = query({
  args: { 
    contactId: v.optional(v.id("contacts")),
    accessToken: v.optional(v.string())
  },
  handler: async (ctx, _args) => {
    // For authenticated users, check if they have access to the contact
    const userId = await getAuthUserId(_ctx);
    
    if (userId) {
      // Internal user access
      const userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!userProfile) throw new Error("User profile not found");
      
      // Admins and managers can access any client portal
      if (["admin", "manager"].includes(userProfile.role)) {
        return { hasAccess: true, role: "internal", userRole: userProfile.role };
      }
      
      // Technicians can only access their assigned jobs' clients
      if (userProfile.role === "technician" && args.contactId) {
        const jobs = await ctx.db
          .query("jobs")
          .withIndex("by_contact", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("assignedTechnicians"), [userId]))
          .collect();
        
        return { hasAccess: jobs.length > 0, role: "technician", userRole: userProfile.role };
      }
      
      return { hasAccess: false, role: "internal", userRole: userProfile.role };
    }
    
    // External client access via token
    if (args.accessToken && args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (!contact) throw new Error("Contact not found");
      
      // Verify access token (simplified - in production use proper JWT or secure tokens)
      const expectedToken = `client_${args.contactId}_${contact.email}`;
      if (args.accessToken === expectedToken) {
        return { hasAccess: true, role: "client", contactId: args.contactId };
      }
    }
    
    return { hasAccess: false, role: "none" };
  },
});

// Get client dashboard data
export const getClientDashboard = query({
  args: { 
    contactId: v.id("contacts"),
    accessToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check rate limiting for dashboard access
    const rateLimitPassed = await checkClientRateLimit(args.contactId, 'DASHBOARD_ACCESS');
    if (!rateLimitPassed) {
      throw new Error("Dashboard access rate limit exceeded");
    }

    // Generate cache key for dashboard data
    const cacheKey = getClientCacheKey('client_dashboard', {
      contactId: args.contactId
    });

    // Check cache first
    const cachedResult = getCachedClientData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Verify access
    const access = await ctx.runQuery(api.clientPortal.getClientAccess, {
      contactId: args.contactId,
      accessToken: args.accessToken
    });

    if (!access.hasAccess) {
      throw new Error("Access denied");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    
    // Get client's service history
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(20);
    
    // Get quotes
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(10);
    
    // Get installations
    const installations = await ctx.db
      .query("installations")
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .collect();
    
    // Get messages (if client role)
    let messages: any[] = [];
    if (access.role === "client") {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
        .order("desc")
        .take(10);
    }
    
    // Calculate service statistics
    const completedJobs = jobs.filter(job => job.status === "completed");
    const totalSpent = completedJobs.reduce((sum, job) => sum + (job.totalCost || 0), 0);
    const avgJobValue = completedJobs.length > 0 ? totalSpent / completedJobs.length : 0;
    
    // Next service recommendations
    const nextServiceDue = installations
      .map(inst => inst.nextServiceDue)
      .filter((date): date is number => date !== undefined && date > Date.now())
      .sort((a: number, b: number) => a - b)[0];
    
    const result = {
      contact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        district: contact.district,
        type: contact.type,
        affluenceScore: contact.affluenceScore
      },
      statistics: {
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        totalSpent,
        avgJobValue,
        activeInstallations: installations.filter(i => i.status === "active").length
      },
      recentJobs: jobs.slice(0, 5),
      activeQuotes: quotes.filter(q => ["sent", "viewed"].includes(q.status as string)),
      installations,
      recentMessages: messages,
      nextServiceDue,
      recommendations: await generateServiceRecommendations(ctx, contact, installations, jobs)
    };

    // Cache the result with TTL based on client affluence
    const ttl = getClientTTL('client_dashboard', contact.affluenceScore);
    setCachedClientData(cacheKey, result, ttl);

    return result;
  },
});

// Get available booking slots
export const getAvailableSlots = query({
  args: {
    contactId: v.id("contacts"),
    serviceType: v.union(
      v.literal("maintenance"),
      v.literal("repair"),
      v.literal("installation"),
      v.literal("inspection")
    ),
    preferredDate: v.optional(v.number()),
    district: v.string()
  },
  handler: async (ctx, args) => {
    // Get technicians available in the district
    const technicians = await ctx.db
      .query("userProfiles")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "technician"),
          q.eq(q.field("serviceAreas"), [args.district])
        )
      )
      .collect();
    
    // Get existing jobs for the next 30 days
    const startDate = args.preferredDate || Date.now();
    const endDate = startDate + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const existingJobs = await ctx.db
      .query("jobs")
      .filter((q) => 
        q.and(
          q.gte(q.field("scheduledDate"), startDate),
          q.lte(q.field("scheduledDate"), endDate)
        )
      )
      .collect();
    
    // Generate available slots
    const slots = [];
    const currentDate = new Date(startDate);
    
    for (let day = 0; day < 14; day++) { // Next 14 days
      const date = new Date(currentDate);
      date.setDate(date.getDate() + day);
      
      // Skip weekends for regular services
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate time slots (8 AM to 6 PM)
      for (let hour = 8; hour < 18; hour += 2) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);
        
        // Check technician availability
        const availableTechnicians = technicians.filter(tech => {
          const techJobs = existingJobs.filter(job =>
            job.assignedTechnicians?.includes(tech.userId) &&
            job.scheduledDate &&
            Math.abs(job.scheduledDate - slotTime.getTime()) < (2 * 60 * 60 * 1000) // 2 hour window
          );
          return techJobs.length === 0;
        });
        
        if (availableTechnicians.length > 0) {
          slots.push({
            datetime: slotTime.getTime(),
            availableTechnicians: availableTechnicians.length,
            estimatedDuration: getEstimatedDuration(args.serviceType),
            district: args.district
          });
        }
      }
    }
    
    return slots.slice(0, 20); // Return top 20 slots
  },
});

// Book a service appointment
export const bookAppointment = mutation({
  args: {
    contactId: v.id("contacts"),
    serviceType: v.union(
      v.literal("maintenance"),
      v.literal("repair"),
      v.literal("installation"),
      v.literal("inspection")
    ),
    scheduledDate: v.number(),
    description: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    accessToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Verify access
    const access = await ctx.runQuery(api.clientPortal.getClientAccess, {
      contactId: args.contactId,
      accessToken: args.accessToken
    });
    
    if (!access.hasAccess) {
      throw new Error("Access denied");
    }
    
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    
    // Find available technician
    const technicians = await ctx.db
      .query("userProfiles")
      .filter((q) =>
        q.and(
          q.eq(q.field("role"), "technician"),
          q.eq(q.field("serviceAreas"), [contact.district || "Śródmieście"])
        )
      )
      .collect();
    
    if (technicians.length === 0) {
      throw new Error("No technicians available in your area");
    }
    
    // Create the job
    const jobId = await ctx.db.insert("jobs", {
      title: `${args.serviceType} - ${contact.name}`,
      description: args.description,
      contactId: args.contactId,
      type: args.serviceType,
      priority: args.priority || "medium",
      status: "scheduled",
      scheduledDate: args.scheduledDate,
      assignedTechnicians: [technicians[0].userId], // Assign first available
      createdBy: "system" as any, // System-created booking
    });
    
    // Create notification for assigned technician
    await ctx.db.insert("notifications", {
      userId: technicians[0].userId,
      title: "New Appointment Booked",
      message: `${contact.name} booked a ${args.serviceType} appointment`,
      type: "job_assigned",
      priority: "medium",
      read: false,
      relatedId: jobId,
      actionUrl: `/jobs/${jobId}`,
      districtContext: {
        district: contact.district || "Unknown",
        affluenceLevel: contact.affluenceScore || 5,
        priorityMultiplier: 1.0
      }
    });
    
    return { jobId, scheduledDate: args.scheduledDate, assignedTechnician: technicians[0] };
  },
});

// Submit feedback
export const submitFeedback = mutation({
  args: {
    contactId: v.id("contacts"),
    jobId: v.id("jobs"),
    rating: v.number(), // 1-5 stars
    feedback: v.string(),
    categories: v.array(v.string()), // ["punctuality", "quality", "communication", etc.]
    accessToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Verify access
    const access = await ctx.runQuery(api.clientPortal.getClientAccess, {
      contactId: args.contactId,
      accessToken: args.accessToken
    });
    
    if (!access.hasAccess) {
      throw new Error("Access denied");
    }
    
    // Store feedback in documents table
    const feedbackId = await ctx.db.insert("documents", {
      name: `Feedback - Job ${args.jobId}`,
      fileId: "feedback" as any, // Not a real file
      fileSize: 0,
      mimeType: "application/json",
      category: "report",
      contactId: args.contactId,
      jobId: args.jobId,
      uploadedBy: "client" as any,
      tags: ["feedback", "rating", ...args.categories],
      version: 1,
      accessLevel: "team",
    });
    
    // Update job with feedback reference
    await ctx.db.patch(args.jobId, {
      notes: `Client feedback submitted (${args.rating}/5 stars): ${args.feedback}`
    });
    
    return feedbackId;
  },
});

// Helper functions
function getEstimatedDuration(serviceType: string): number {
  const durations = {
    maintenance: 2, // 2 hours
    repair: 3,      // 3 hours
    installation: 6, // 6 hours
    inspection: 1    // 1 hour
  };
  return durations[serviceType as keyof typeof durations] || 2;
}

async function generateServiceRecommendations(ctx: any, contact: any, installations: any[], jobs: any[]) {
  const recommendations = [];
  
  // Maintenance recommendations based on installation age
  for (const installation of installations) {
    const daysSinceInstall = (Date.now() - installation.installationDate) / (1000 * 60 * 60 * 24);
    const daysSinceService = installation.lastServiceDate 
      ? (Date.now() - installation.lastServiceDate) / (1000 * 60 * 60 * 24)
      : daysSinceInstall;
    
    if (daysSinceService > 365) { // Annual maintenance
      recommendations.push({
        type: "maintenance",
        priority: "high",
        title: "Annual Maintenance Due",
        description: `Your ${installation.equipmentId} installation needs annual maintenance`,
        estimatedCost: 200 + (contact.affluenceScore || 5) * 20,
        urgency: daysSinceService > 400 ? "urgent" : "normal"
      });
    }
  }
  
  // Efficiency upgrade recommendations for older installations
  const oldInstallations = installations.filter(inst => {
    const age = (Date.now() - inst.installationDate) / (1000 * 60 * 60 * 24 * 365);
    return age > 5;
  });
  
  if (oldInstallations.length > 0) {
    recommendations.push({
      type: "upgrade",
      priority: "medium",
      title: "Energy Efficiency Upgrade",
      description: "Consider upgrading to newer, more efficient HVAC systems",
      estimatedCost: 3000 + (contact.affluenceScore || 5) * 500,
      urgency: "normal"
    });
  }
  
  return recommendations.slice(0, 5); // Top 5 recommendations
}
