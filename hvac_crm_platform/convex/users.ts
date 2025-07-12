import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Type definitions for better type safety
interface TechnicianProfile {
  _id: Id<"users">;
  name: string;
  email?: string;
  role: string;
  homeLocation?: {
    lat: number;
    lng: number;
  };
  serviceAreas: string[];
  skills: string[];
  vehicleType: string;
  isActive: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

// Get all technicians for route optimization
export const getTechnicians = query({
  args: {
    ids: v.optional(v.array(v.id("users"))),
    serviceAreas: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<TechnicianProfile[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profiles with technician role
    let profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "technician"))
      .collect();

    // Filter by specific IDs if provided
    if (args.ids) {
      profiles = profiles.filter((profile) => args.ids?.includes(profile.userId));
    }

    // Filter by service areas if provided
    if (args.serviceAreas) {
      profiles = profiles.filter((profile) =>
        profile.serviceAreas?.some((area) => args.serviceAreas?.includes(area))
      );
    }

    // Filter by active status
    if (args.isActive !== undefined) {
      profiles = profiles.filter((profile) => profile.isActive === args.isActive);
    }

    // Get user details and combine with profiles
    return await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          _id: profile.userId,
          name: user?.name || "Unknown",
          email: user?.email,
          role: profile.role,
          homeLocation: profile.homeLocation,
          serviceAreas: profile.serviceAreas || [],
          skills: profile.skills || [],
          vehicleType: profile.vehicleType || "van",
          isActive: profile.isActive,
          workingHours: {
            start: "08:00",
            end: "17:00",
          },
        };
      })
    );
  },
});

// Get current user profile
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    const user = await ctx.db.get(userId);
    return {
      ...profile,
      user: user ? { name: user.name, email: user.email } : null,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    homeLocation: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    serviceAreas: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    vehicleType: v.optional(v.union(v.literal("van"), v.literal("car"), v.literal("motorcycle"))),
    notificationPreferences: v.optional(
      v.object({
        email: v.boolean(),
        sms: v.boolean(),
        push: v.boolean(),
        telegram: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      // Create new profile if it doesn't exist
      return await ctx.db.insert("userProfiles", {
        userId,
        firstName: "Technician",
        lastName: "User",
        role: "technician",
        phone: args.phone,
        specialties: args.skills || [],
        certifications: [],
        skills: args.skills || [],
        vehicleType: args.vehicleType || "van",
        hourlyRate: 50,
        homeLocation: args.homeLocation,
        serviceAreas: args.serviceAreas || ["Śródmieście"],
        notificationPreferences: args.notificationPreferences || {
          email: true,
          sms: false,
          push: true,
          telegram: false,
        },
        isActive: true,
      });
    } else {
      // Update existing profile
      return await ctx.db.patch(profile._id, {
        phone: args.phone ?? profile.phone,
        homeLocation: args.homeLocation ?? profile.homeLocation,
        serviceAreas: args.serviceAreas ?? profile.serviceAreas,
        skills: args.skills ?? profile.skills,
        vehicleType: args.vehicleType ?? profile.vehicleType,
        notificationPreferences: args.notificationPreferences ?? profile.notificationPreferences,
      });
    }
  },
});

// Get technician statistics
export const getTechnicianStats = query({
  args: { technicianId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get completed jobs in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const completedJobs = await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.gte(q.field("completedDate"), thirtyDaysAgo),
          q.eq(q.field("assignedTechnicians"), [args.technicianId])
        )
      )
      .collect();

    // Get optimized routes for last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentRoutes = await ctx.db
      .query("optimizedRoutes")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    // Calculate statistics
    const totalJobs = completedJobs.length;
    const avgEfficiency =
      recentRoutes.length > 0
        ? recentRoutes.reduce((sum, route) => sum + route.efficiency, 0) / recentRoutes.length
        : 0;
    const totalDistance = recentRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0);

    return {
      totalJobs,
      avgEfficiency: Math.round(avgEfficiency * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalRevenue,
      routesOptimized: recentRoutes.length,
      avgJobsPerRoute:
        recentRoutes.length > 0
          ? Math.round(
              recentRoutes.reduce((sum, route) => sum + route.points.length, 0) /
                recentRoutes.length
            )
          : 0,
    };
  },
});

// Get available technicians for a specific date and time
export const getAvailableTechnicians = query({
  args: {
    date: v.string(), // YYYY-MM-DD
    timeSlot: v.optional(
      v.object({
        start: v.string(), // HH:MM
        end: v.string(), // HH:MM
      })
    ),
    district: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<TechnicianProfile[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all active technicians
    const technicians: TechnicianProfile[] = await ctx.runQuery(api.users.getTechnicians, {
      isActive: true,
    });

    // Filter by service area (district)
    let availableTechnicians: TechnicianProfile[] = technicians;
    if (args.district) {
      availableTechnicians = technicians.filter((tech: TechnicianProfile) =>
        tech.serviceAreas.includes(args.district!)
      );
    }

    // Filter by required skills
    if (args.skills && args.skills.length > 0) {
      availableTechnicians = availableTechnicians.filter((tech: TechnicianProfile) =>
        args.skills?.every((skill) => tech.skills.includes(skill))
      );
    }

    // TODO: Check actual availability based on existing bookings
    // For now, return all matching technicians

    return availableTechnicians.map((tech: any) => ({
      ...tech,
      availability: "available", // This would be calculated based on existing jobs
      estimatedArrival: "30 min", // This would be calculated based on current location
    }));
  },
});
