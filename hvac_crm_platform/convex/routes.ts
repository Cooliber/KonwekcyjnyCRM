import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Type definitions for route optimization
interface JobWithCoordinates {
  _id: Id<"jobs">;
  title: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration?: number;
  requiredSkills?: string[];
  district?: string;
  address?: string;
  type?: string;
  preferredTimeSlot?: {
    start: string;
    end: string;
  };
}

interface TechnicianProfile {
  _id: Id<"users">;
  name: string;
  homeLocation?: {
    lat: number;
    lng: number;
  };
  serviceAreas: string[];
  skills: string[];
  vehicleType: string;
}

interface RoutePoint {
  id: Id<"jobs">;
  lat: number;
  lng: number;
  address: string;
  district: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  jobType: "installation" | "repair" | "maintenance" | "inspection" | "emergency";
}

interface OptimizedRoute {
  technicianId: Id<"users">;
  points: RoutePoint[];
  totalDistance: number;
  totalDuration: number;
  efficiency: number;
  districtCoverage: string[];
  estimatedCost: number;
  efficiencyScore?: number;
}

interface RouteOptimizationResult {
  optimizedRoutes: OptimizedRoute[];
  totalJobs: number;
  unassignedJobs: JobWithCoordinates[];
  optimizationMetrics: {
    totalDistance: number;
    averageJobsPerTechnician: number;
    efficiencyScore: number;
  };
}

// Route optimization action
export const optimizeRoutes = action({
  args: {
    date: v.string(), // YYYY-MM-DD format
    technicianIds: v.optional(v.array(v.id("users"))),
    maxJobsPerTechnician: v.optional(v.number()),
    prioritizeUrgent: v.optional(v.boolean()),
  },
  handler: async (ctx, _args): Promise<RouteOptimizationResult> => {
    const userId = await getAuthUserId(_ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get scheduled jobs for the date
    const rawJobs = await ctx.runQuery(api.jobs.getScheduledForDate, {
      date: args.date
    });

    // Filter jobs that have coordinates and transform to JobWithCoordinates
    const jobs: JobWithCoordinates[] = rawJobs
      .filter((job: any) => job.coordinates && job.coordinates.lat && job.coordinates.lng)
      .map((job: any) => ({
        ...job,
        coordinates: job.coordinates!,
        priority: job.priority || "medium",
        type: job.type || "maintenance"
      }));

    // Get available technicians
    const technicians: TechnicianProfile[] = await ctx.runQuery(api.users.getTechnicians, {
      ids: args.technicianIds
    });

    // Transform data for route optimization
    const routePoints: RoutePoint[] = jobs.map((job) => ({
      id: job._id,
      lat: job.coordinates.lat,
      lng: job.coordinates.lng,
      address: job.address || "Unknown address",
      district: job.district || "Unknown",
      priority: job.priority,
      estimatedDuration: getJobDuration(job.type || "maintenance"),
      timeWindow: job.preferredTimeSlot ? {
        start: job.preferredTimeSlot.start,
        end: job.preferredTimeSlot.end
      } : undefined,
      jobType: (job.type as "installation" | "repair" | "maintenance" | "inspection" | "emergency") || "maintenance"
    }));

    const technicianProfiles: Array<{
      id: Id<"users">;
      name: string;
      homeLocation: { lat: number; lng: number };
      serviceAreas: string[];
      workingHours: { start: string; end: string };
      vehicleType: string;
      skills: string[];
    }> = technicians.map((tech: TechnicianProfile) => ({
      id: tech._id,
      name: tech.name,
      homeLocation: tech.homeLocation || { lat: 52.2297, lng: 21.0122 }, // Default Warsaw center
      serviceAreas: tech.serviceAreas || ["Śródmieście"],
      workingHours: {
        start: "08:00",
        end: "17:00"
      },
      skills: tech.skills || [],
      vehicleType: tech.vehicleType || "van"
    }));

    // Perform route optimization
    const optimizedRoutes = optimizeRoutesAlgorithm(
      technicianProfiles,
      routePoints,
      {
        maxJobsPerTechnician: args.maxJobsPerTechnician || 8,
        prioritizeUrgent: args.prioritizeUrgent ?? true,
        respectTimeWindows: true,
        minimizeTravel: true
      }
    );

    // Store optimized routes
    const routeIds: Id<"optimizedRoutes">[] = await Promise.all(
      optimizedRoutes.map((route: OptimizedRoute) =>
        ctx.runMutation(api.routes.create, {
          technicianId: route.technicianId,
          date: args.date,
          points: route.points,
          totalDistance: route.totalDistance,
          totalDuration: route.totalDuration,
          efficiency: route.efficiencyScore || 0.8,
          estimatedCost: route.estimatedCost
        })
      )
    );

    return {
      optimizedRoutes,
      totalJobs: routePoints.length,
      unassignedJobs: jobs.filter(job => !optimizedRoutes.some(route =>
        route.points.some(point => point.id === job._id)
      )),
      optimizationMetrics: {
        totalDistance: optimizedRoutes.reduce((sum, r) => sum + r.totalDistance, 0),
        averageJobsPerTechnician: routePoints.length / technicianProfiles.length,
        efficiencyScore: optimizedRoutes.reduce((sum, r) => sum + r.efficiency, 0) / optimizedRoutes.length
      }
    };
  },
});

// Get route analytics for dashboard
export const getRouteAnalytics = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d")
    )),
    district: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<{
    totalRoutes: number;
    averageEfficiency: number;
    totalDistance: number;
    costSavings: number;
    topPerformingTechnicians: Array<{
      technicianId: string;
      name: string;
      efficiency: number;
      completedRoutes: number;
    }>;
    districtPerformance: Array<{
      district: string;
      routeCount: number;
      averageDistance: number;
      efficiency: number;
    }>;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timeRange = args.timeRange || "30d";
    const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    // Get routes within time range
    const routes = await ctx.db
      .query("optimizedRoutes")
      .filter(q => q.gte(q.field("_creationTime"), startDate))
      .collect();

    // Filter by district if specified
    const filteredRoutes = args.district
      ? routes.filter(route =>
          route.points?.some((point: any) => point.district === args.district)
        )
      : routes;

    // Calculate analytics
    const totalRoutes = filteredRoutes.length;
    const averageEfficiency = totalRoutes > 0
      ? filteredRoutes.reduce((sum, route) => sum + (route.efficiency || 0), 0) / totalRoutes
      : 0;
    const totalDistance = filteredRoutes.reduce((sum, route) => sum + (route.totalDistance || 0), 0);
    const costSavings = Math.round(totalDistance * 0.15); // Estimated 15% cost savings

    // Get technician performance
    const technicianStats = new Map<string, {
      name: string;
      efficiency: number;
      completedRoutes: number;
      totalEfficiency: number;
    }>();

    for (const route of filteredRoutes) {
      const existing = technicianStats.get(route.technicianId) || {
        name: "Unknown",
        efficiency: 0,
        completedRoutes: 0,
        totalEfficiency: 0
      };

      existing.completedRoutes++;
      existing.totalEfficiency += route.efficiency || 0;
      existing.efficiency = existing.totalEfficiency / existing.completedRoutes;

      technicianStats.set(route.technicianId, existing);
    }

    const topPerformingTechnicians = Array.from(technicianStats.entries())
      .map(([technicianId, stats]) => ({
        technicianId,
        name: stats.name,
        efficiency: Math.round(stats.efficiency * 100) / 100,
        completedRoutes: stats.completedRoutes
      }))
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);

    // Get district performance
    const districtStats = new Map<string, {
      routeCount: number;
      totalDistance: number;
      totalEfficiency: number;
    }>();

    for (const route of filteredRoutes) {
      const districts = route.points?.map((point: any) => point.district).filter(Boolean) || [];
      for (const district of districts) {
        const existing = districtStats.get(district) || {
          routeCount: 0,
          totalDistance: 0,
          totalEfficiency: 0
        };

        existing.routeCount++;
        existing.totalDistance += route.totalDistance || 0;
        existing.totalEfficiency += route.efficiency || 0;

        districtStats.set(district, existing);
      }
    }

    const districtPerformance = Array.from(districtStats.entries())
      .map(([district, stats]) => ({
        district,
        routeCount: stats.routeCount,
        averageDistance: Math.round(stats.totalDistance / stats.routeCount * 100) / 100,
        efficiency: Math.round(stats.totalEfficiency / stats.routeCount * 100) / 100
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    return {
      totalRoutes,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      costSavings,
      topPerformingTechnicians,
      districtPerformance
    };
  }
});

// Get optimized routes for a date
export const getRoutesForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("optimizedRoutes")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Create optimized route record
export const create = mutation({
  args: {
    technicianId: v.string(),
    date: v.string(),
    points: v.array(v.object({
      id: v.string(),
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      district: v.string(),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      estimatedDuration: v.number(),
      jobType: v.union(
        v.literal("installation"),
        v.literal("repair"), 
        v.literal("maintenance"),
        v.literal("inspection"),
        v.literal("emergency")
      )
    })),
    totalDistance: v.number(),
    totalDuration: v.number(),
    efficiency: v.number(),
    estimatedCost: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("optimizedRoutes", {
      technicianId: args.technicianId,
      date: args.date,
      points: args.points,
      totalDistance: args.totalDistance,
      totalDuration: args.totalDuration,
      efficiency: args.efficiency,
      estimatedCost: args.estimatedCost,
      status: "active",
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

// Helper functions
function getJobDuration(jobType: string): number {
  const durations = {
    emergency: 120,
    installation: 240,
    repair: 90,
    maintenance: 60,
    inspection: 45
  };
  return durations[jobType as keyof typeof durations] || 90;
}

// Simplified route optimization algorithm for server-side
function optimizeRoutesAlgorithm(
  technicians: Array<{
    id: Id<"users">;
    name: string;
    homeLocation: { lat: number; lng: number };
    serviceAreas: string[];
    workingHours: { start: string; end: string };
    vehicleType: string;
    skills: string[];
  }>,
  jobs: RoutePoint[],
  options: {
    maxJobsPerTechnician: number;
    prioritizeUrgent: boolean;
    respectTimeWindows: boolean;
    minimizeTravel: boolean;
  }
): OptimizedRoute[] {
  const routes: OptimizedRoute[] = [];
  const assignedJobs = new Set<string>();

  // Priority weights
  const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

  // Sort jobs by priority
  const sortedJobs = [...jobs].sort((a: RoutePoint, b: RoutePoint) =>
    priorityWeights[b.priority] - priorityWeights[a.priority]
  );

  for (const technician of technicians) {
    const availableJobs = sortedJobs.filter(job => 
      !assignedJobs.has(job.id) &&
      technician.serviceAreas.includes(job.district)
    ).slice(0, options.maxJobsPerTechnician);

    if (availableJobs.length === 0) continue;

    // Simple nearest neighbor optimization
    const optimizedPoints = nearestNeighborRoute(technician.homeLocation, availableJobs);
    
    // Calculate metrics
    const totalDistance = calculateTotalDistance(technician.homeLocation, optimizedPoints);
    const totalDuration = optimizedPoints.reduce((sum, point) => sum + point.estimatedDuration, 0) + (totalDistance * 60);
    const efficiency = optimizedPoints.length / Math.max(totalDistance, 1);
    const estimatedCost = Math.round(totalDistance * 0.6 + (totalDuration / 60) * 80);

    routes.push({
      technicianId: technician.id,
      points: optimizedPoints,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration: Math.round(totalDuration),
      efficiency: Math.min(efficiency, 1),
      districtCoverage: [...new Set(optimizedPoints.map(p => p.district))],
      estimatedCost
    });

    // Mark jobs as assigned
    optimizedPoints.forEach(point => assignedJobs.add(point.id));
  }

  return routes;
}

function nearestNeighborRoute(startLocation: { lat: number; lng: number }, jobs: RoutePoint[]): RoutePoint[] {
  if (jobs.length === 0) return [];
  
  const route: any[] = [];
  const remaining = [...jobs];
  let currentLocation = startLocation;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      remaining[0].lat, remaining[0].lng
    );

    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        remaining[i].lat, remaining[i].lng
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nextJob = remaining.splice(nearestIndex, 1)[0];
    route.push(nextJob);
    currentLocation = { lat: nextJob.lat, lng: nextJob.lng };
  }

  return route;
}

function calculateTotalDistance(startLocation: { lat: number; lng: number }, points: RoutePoint[]): number {
  if (points.length === 0) return 0;
  
  let total = calculateDistance(
    startLocation.lat, startLocation.lng,
    points[0].lat, points[0].lng
  );

  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(
      points[i-1].lat, points[i-1].lng,
      points[i].lat, points[i].lng
    );
  }

  // Add return trip
  total += calculateDistance(
    points[points.length - 1].lat, points[points.length - 1].lng,
    startLocation.lat, startLocation.lng
  );

  return total;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
