/**
 * Performance Monitoring and Optimization Utilities
 * Tracks route optimization performance and map rendering metrics
 */

export interface PerformanceMetrics {
  routeOptimizationTime: number;
  mapRenderTime: number;
  hotspotPredictionTime: number;
  totalJobs: number;
  totalTechnicians: number;
  routingAccuracy: number;
  efficiencyGain: number;
  timestamp: number;
}

export interface RouteValidationResult {
  isValid: boolean;
  accuracy: number;
  issues: string[];
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Start timing a performance operation
   */
  startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  /**
   * End timing and return duration
   */
  endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      console.warn(`Timer for ${operation} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operation);
    return duration;
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      routeOptimizationTime: 0,
      mapRenderTime: 0,
      hotspotPredictionTime: 0,
      totalJobs: 0,
      totalTechnicians: 0,
      routingAccuracy: 0,
      efficiencyGain: 0,
      timestamp: Date.now(),
      ...metrics,
    };

    this.metrics.push(fullMetrics);

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log performance warnings
    this.checkPerformanceThresholds(fullMetrics);
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    avgRouteOptimizationTime: number;
    avgMapRenderTime: number;
    avgHotspotPredictionTime: number;
    avgRoutingAccuracy: number;
    avgEfficiencyGain: number;
    totalMetrics: number;
  } {
    if (this.metrics.length === 0) {
      return {
        avgRouteOptimizationTime: 0,
        avgMapRenderTime: 0,
        avgHotspotPredictionTime: 0,
        avgRoutingAccuracy: 0,
        avgEfficiencyGain: 0,
        totalMetrics: 0,
      };
    }

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        routeOptimizationTime: acc.routeOptimizationTime + metric.routeOptimizationTime,
        mapRenderTime: acc.mapRenderTime + metric.mapRenderTime,
        hotspotPredictionTime: acc.hotspotPredictionTime + metric.hotspotPredictionTime,
        routingAccuracy: acc.routingAccuracy + metric.routingAccuracy,
        efficiencyGain: acc.efficiencyGain + metric.efficiencyGain,
      }),
      {
        routeOptimizationTime: 0,
        mapRenderTime: 0,
        hotspotPredictionTime: 0,
        routingAccuracy: 0,
        efficiencyGain: 0,
      }
    );

    const count = this.metrics.length;

    return {
      avgRouteOptimizationTime: totals.routeOptimizationTime / count,
      avgMapRenderTime: totals.mapRenderTime / count,
      avgHotspotPredictionTime: totals.hotspotPredictionTime / count,
      avgRoutingAccuracy: totals.routingAccuracy / count,
      avgEfficiencyGain: totals.efficiencyGain / count,
      totalMetrics: count,
    };
  }

  /**
   * Check if performance metrics exceed thresholds
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const thresholds = {
      routeOptimizationTime: 5000, // 5 seconds
      mapRenderTime: 2000, // 2 seconds
      hotspotPredictionTime: 3000, // 3 seconds
      minRoutingAccuracy: 0.9, // 90%
      minEfficiencyGain: 0.15, // 15%
    };

    if (metrics.routeOptimizationTime > thresholds.routeOptimizationTime) {
      console.warn(
        `Route optimization took ${metrics.routeOptimizationTime}ms (threshold: ${thresholds.routeOptimizationTime}ms)`
      );
    }

    if (metrics.mapRenderTime > thresholds.mapRenderTime) {
      console.warn(
        `Map rendering took ${metrics.mapRenderTime}ms (threshold: ${thresholds.mapRenderTime}ms)`
      );
    }

    if (metrics.hotspotPredictionTime > thresholds.hotspotPredictionTime) {
      console.warn(
        `Hotspot prediction took ${metrics.hotspotPredictionTime}ms (threshold: ${thresholds.hotspotPredictionTime}ms)`
      );
    }

    if (metrics.routingAccuracy < thresholds.minRoutingAccuracy) {
      console.warn(
        `Routing accuracy is ${(metrics.routingAccuracy * 100).toFixed(1)}% (target: ${thresholds.minRoutingAccuracy * 100}%)`
      );
    }

    if (metrics.efficiencyGain < thresholds.minEfficiencyGain) {
      console.warn(
        `Efficiency gain is ${(metrics.efficiencyGain * 100).toFixed(1)}% (target: ${thresholds.minEfficiencyGain * 100}%)`
      );
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

/**
 * Validate route optimization results
 */
export function validateRouteOptimization(
  routes: any[],
  originalJobs: any[],
  _technicians: any[]
): RouteValidationResult {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if all jobs are assigned
  const assignedJobIds = new Set(routes.flatMap((route) => route.points.map((p: any) => p.id)));
  const totalJobs = originalJobs.length;
  const assignedJobs = assignedJobIds.size;

  if (assignedJobs < totalJobs) {
    issues.push(`${totalJobs - assignedJobs} jobs were not assigned to any technician`);
    recommendations.push("Check technician service areas and availability");
  }

  // Check route efficiency
  const avgEfficiency = routes.reduce((sum, route) => sum + route.efficiency, 0) / routes.length;
  if (avgEfficiency < 0.6) {
    issues.push(`Average route efficiency is low: ${(avgEfficiency * 100).toFixed(1)}%`);
    recommendations.push("Consider adjusting technician service areas or job priorities");
  }

  // Check for unbalanced workload
  const jobCounts = routes.map((route) => route.points.length);
  const maxJobs = Math.max(...jobCounts);
  const minJobs = Math.min(...jobCounts);

  if (maxJobs - minJobs > 3) {
    issues.push(`Unbalanced workload: ${maxJobs} vs ${minJobs} jobs per technician`);
    recommendations.push("Consider redistributing jobs for better balance");
  }

  // Check for urgent jobs scheduled late
  routes.forEach((route, index) => {
    const urgentJobIndex = route.points.findIndex((p: any) => p.priority === "urgent");
    if (urgentJobIndex > 2) {
      issues.push(`Urgent job scheduled as #${urgentJobIndex + 1} for technician ${index + 1}`);
      recommendations.push("Prioritize urgent jobs earlier in routes");
    }
  });

  // Calculate accuracy score
  let accuracy = 1.0;
  accuracy -= issues.length * 0.1; // Reduce by 10% per issue
  accuracy = Math.max(0, Math.min(1, accuracy));

  return {
    isValid: issues.length === 0,
    accuracy,
    issues,
    recommendations,
  };
}

/**
 * Optimize map rendering performance
 */
export function optimizeMapRendering(): {
  enableClustering: boolean;
  maxMarkersBeforeClustering: number;
  tileLoadingStrategy: "eager" | "lazy";
  markerIconCaching: boolean;
} {
  // Detect device capabilities
  const isLowEndDevice = navigator.hardwareConcurrency <= 2;
  const isSlowConnection =
    (navigator as any).connection?.effectiveType === "slow-2g" ||
    (navigator as any).connection?.effectiveType === "2g";

  return {
    enableClustering: isLowEndDevice,
    maxMarkersBeforeClustering: isLowEndDevice ? 50 : 200,
    tileLoadingStrategy: isSlowConnection ? "lazy" : "eager",
    markerIconCaching: true,
  };
}

/**
 * Monitor Core Web Vitals
 */
export function monitorWebVitals(): void {
  // Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log("LCP:", lastEntry.startTime);

    if (lastEntry.startTime > 2500) {
      console.warn("LCP is above 2.5s threshold");
    }
  }).observe({ entryTypes: ["largest-contentful-paint"] });

  // First Input Delay (FID)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry: any) => {
      console.log("FID:", entry.processingStart - entry.startTime);

      if (entry.processingStart - entry.startTime > 100) {
        console.warn("FID is above 100ms threshold");
      }
    });
  }).observe({ entryTypes: ["first-input"] });

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });

    if (clsValue > 0.1) {
      console.warn("CLS is above 0.1 threshold:", clsValue);
    }
  }).observe({ entryTypes: ["layout-shift"] });
}

/**
 * Memory usage monitoring
 */
export function monitorMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: "low" | "medium" | "high";
} {
  const memory = (performance as any).memory;

  if (!memory) {
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryPressure: "low",
    };
  }

  const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  let memoryPressure: "low" | "medium" | "high" = "low";

  if (usageRatio > 0.8) {
    memoryPressure = "high";
  } else if (usageRatio > 0.6) {
    memoryPressure = "medium";
  }

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    memoryPressure,
  };
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  monitorWebVitals();

  // Log memory usage every 30 seconds
  setInterval(() => {
    const memoryInfo = monitorMemoryUsage();
    if (memoryInfo.memoryPressure !== "low") {
      console.warn("Memory pressure detected:", memoryInfo);
    }
  }, 30000);
}
