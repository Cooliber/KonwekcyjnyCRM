/**
 * Route Optimization Engine for Warsaw HVAC Technicians
 * Implements TSP algorithms with district-based efficiency calculations
 */

import { calculateDistance } from "./geocoding";

export interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
  address: string;
  district: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: number; // minutes
  timeWindow?: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  jobType: "installation" | "repair" | "maintenance" | "inspection" | "emergency";
}

export interface TechnicianProfile {
  id: string;
  name: string;
  homeLocation: { lat: number; lng: number };
  serviceAreas: string[]; // Warsaw districts
  workingHours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  skills: string[];
  vehicleType: "van" | "car" | "motorcycle";
}

export interface OptimizedRoute {
  technicianId: string;
  points: RoutePoint[];
  totalDistance: number; // km
  totalDuration: number; // minutes
  efficiency: number; // 0-1 score
  districtCoverage: string[];
  estimatedCost: number; // PLN
}

// Warsaw district efficiency multipliers based on traffic and accessibility
const DISTRICT_EFFICIENCY: Record<string, number> = {
  Śródmieście: 0.7, // Heavy traffic, parking issues
  Wilanów: 0.9, // Good accessibility, less traffic
  Mokotów: 0.8, // Moderate traffic
  Żoliborz: 0.85, // Good accessibility
  Ursynów: 0.9, // Suburban, easier navigation
  Wola: 0.75, // Industrial area, moderate traffic
  "Praga-Południe": 0.8, // Improving infrastructure
  Targówek: 0.85, // Less congested
  Bemowo: 0.9, // Suburban efficiency
  Bielany: 0.85, // Good road network
};

// Priority weights for job scheduling
const PRIORITY_WEIGHTS = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Job type duration estimates (minutes)
const JOB_DURATION_ESTIMATES = {
  emergency: 120,
  installation: 240,
  repair: 90,
  maintenance: 60,
  inspection: 45,
};

/**
 * Optimize routes for multiple technicians using enhanced TSP algorithm
 */
export function optimizeRoutes(
  technicians: TechnicianProfile[],
  jobs: RoutePoint[],
  options: {
    maxJobsPerTechnician?: number;
    prioritizeUrgent?: boolean;
    respectTimeWindows?: boolean;
    minimizeTravel?: boolean;
  } = {}
): OptimizedRoute[] {
  const {
    maxJobsPerTechnician = 8,
    prioritizeUrgent = true,
    respectTimeWindows = true,
    minimizeTravel = true,
  } = options;

  // Sort jobs by priority and urgency
  const sortedJobs = [...jobs].sort((a, b) => {
    if (prioritizeUrgent) {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
    }
    return a.estimatedDuration - b.estimatedDuration;
  });

  const routes: OptimizedRoute[] = [];
  const assignedJobs = new Set<string>();

  for (const technician of technicians) {
    const availableJobs = sortedJobs.filter(
      (job) => !assignedJobs.has(job.id) && technician.serviceAreas.includes(job.district)
    );

    if (availableJobs.length === 0) continue;

    const route = optimizeSingleTechnicianRoute(
      technician,
      availableJobs.slice(0, maxJobsPerTechnician),
      { respectTimeWindows, minimizeTravel }
    );

    // Mark jobs as assigned
    route.points.forEach((point) => assignedJobs.add(point.id));
    routes.push(route);
  }

  return routes.sort((a, b) => b.efficiency - a.efficiency);
}

/**
 * Optimize route for a single technician using nearest neighbor with improvements
 */
function optimizeSingleTechnicianRoute(
  technician: TechnicianProfile,
  jobs: RoutePoint[],
  _options: { respectTimeWindows: boolean; minimizeTravel: boolean }
): OptimizedRoute {
  if (jobs.length === 0) {
    return {
      technicianId: technician.id,
      points: [],
      totalDistance: 0,
      totalDuration: 0,
      efficiency: 0,
      districtCoverage: [],
      estimatedCost: 0,
    };
  }

  // Start from technician's home location
  let currentLocation = technician.homeLocation;
  const optimizedPoints: RoutePoint[] = [];
  const remainingJobs = [...jobs];
  let totalDistance = 0;
  let totalDuration = 0;

  // Nearest neighbor algorithm with district efficiency
  while (remainingJobs.length > 0) {
    let bestJob: RoutePoint | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    let bestIndex = -1;

    for (let i = 0; i < remainingJobs.length; i++) {
      const job = remainingJobs[i];
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        job.lat,
        job.lng
      );

      // Calculate efficiency score considering multiple factors
      const districtEfficiency = DISTRICT_EFFICIENCY[job.district] || 0.8;
      const priorityBonus = PRIORITY_WEIGHTS[job.priority];
      const travelTime = distance / districtEfficiency; // Adjusted for district efficiency

      // Score: lower is better (minimize travel time, prioritize urgent jobs)
      const score = travelTime - priorityBonus * 5;

      if (score < bestScore) {
        bestScore = score;
        bestJob = job;
        bestIndex = i;
      }
    }

    if (bestJob) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        bestJob.lat,
        bestJob.lng
      );

      totalDistance += distance;
      totalDuration += (distance / (DISTRICT_EFFICIENCY[bestJob.district] || 0.8)) * 60; // Convert to minutes
      totalDuration += JOB_DURATION_ESTIMATES[bestJob.jobType];

      optimizedPoints.push(bestJob);
      currentLocation = { lat: bestJob.lat, lng: bestJob.lng };
      remainingJobs.splice(bestIndex, 1);
    }
  }

  // Calculate return trip to home
  if (optimizedPoints.length > 0) {
    const lastPoint = optimizedPoints[optimizedPoints.length - 1];
    const returnDistance = calculateDistance(
      lastPoint.lat,
      lastPoint.lng,
      technician.homeLocation.lat,
      technician.homeLocation.lng
    );
    totalDistance += returnDistance;
    totalDuration += returnDistance * 60; // Convert to minutes
  }

  // Calculate efficiency metrics
  const districtCoverage = [...new Set(optimizedPoints.map((p) => p.district))];
  const efficiency = calculateRouteEfficiency(optimizedPoints, totalDistance, totalDuration);
  const estimatedCost = calculateRouteCost(totalDistance, totalDuration, technician.vehicleType);

  return {
    technicianId: technician.id,
    points: optimizedPoints,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration: Math.round(totalDuration),
    efficiency,
    districtCoverage,
    estimatedCost,
  };
}

/**
 * Calculate route efficiency score (0-1, higher is better)
 */
function calculateRouteEfficiency(
  points: RoutePoint[],
  totalDistance: number,
  totalDuration: number
): number {
  if (points.length === 0) return 0;

  const jobTime = points.reduce((sum, point) => sum + JOB_DURATION_ESTIMATES[point.jobType], 0);
  const _travelTime = totalDuration - jobTime;

  // Efficiency = job time / total time (higher is better)
  const timeEfficiency = jobTime / totalDuration;

  // Distance efficiency (jobs per km)
  const distanceEfficiency = Math.min(points.length / totalDistance, 1);

  // Priority efficiency (higher priority jobs boost score)
  const avgPriority =
    points.reduce((sum, point) => sum + PRIORITY_WEIGHTS[point.priority], 0) / points.length;
  const priorityEfficiency = avgPriority / 4; // Normalize to 0-1

  // Combined efficiency score
  return timeEfficiency * 0.5 + distanceEfficiency * 0.3 + priorityEfficiency * 0.2;
}

/**
 * Calculate estimated route cost in PLN
 */
function calculateRouteCost(distance: number, duration: number, vehicleType: string): number {
  const fuelCostPerKm = {
    van: 0.8, // PLN per km
    car: 0.6,
    motorcycle: 0.3,
  };

  const hourlyRate = 80; // PLN per hour for technician
  const fuelCost = distance * (fuelCostPerKm[vehicleType as keyof typeof fuelCostPerKm] || 0.6);
  const laborCost = (duration / 60) * hourlyRate;

  return Math.round(fuelCost + laborCost);
}

/**
 * Generate turn-by-turn directions for a route
 */
export function generateRouteDirections(route: OptimizedRoute): string[] {
  const directions: string[] = [];

  if (route.points.length === 0) {
    return ["No jobs assigned for this route."];
  }

  directions.push(`🏠 Start from home base`);

  route.points.forEach((point, index) => {
    const stepNumber = index + 1;
    const priorityEmoji = {
      urgent: "🚨",
      high: "⚡",
      medium: "📋",
      low: "📝",
    };

    directions.push(
      `${stepNumber}. ${priorityEmoji[point.priority]} ${point.jobType.toUpperCase()} - ${point.address} (${point.district})`
    );
    directions.push(`   ⏱️ Est. duration: ${JOB_DURATION_ESTIMATES[point.jobType]} min`);
  });

  directions.push(`🏠 Return to home base`);
  directions.push(
    `📊 Total: ${route.totalDistance}km, ${Math.round(route.totalDuration / 60)}h ${route.totalDuration % 60}m`
  );
  directions.push(`💰 Estimated cost: ${route.estimatedCost} PLN`);

  return directions;
}
