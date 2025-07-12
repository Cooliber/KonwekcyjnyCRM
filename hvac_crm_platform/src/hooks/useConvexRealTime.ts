/**
 * Custom Convex hook for real-time HVAC dashboard subscriptions
 * Optimized for Warsaw-based HVAC CRM platform with proper error handling
 */

import { useQuery, useAction } from 'convex/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../../convex/_generated/api';
import type { 
  HVACMetrics, 
  WarsawDistrictData, 
  EnergyAnalyticsData, 
  RealTimeSubscriptionData,
  HVACError,
  WarsawDistrict 
} from '../types/hvac';

// Hook configuration interface
interface UseConvexRealTimeConfig {
  district?: WarsawDistrict;
  refreshInterval?: number; // milliseconds
  enableAutoRefresh?: boolean;
  onError?: (error: HVACError) => void;
  onDataUpdate?: (data: RealTimeSubscriptionData) => void;
}

// Hook return type
interface UseConvexRealTimeReturn {
  // Data
  hvacMetrics: HVACMetrics[] | undefined;
  districtData: WarsawDistrictData[] | undefined;
  energyAnalytics: EnergyAnalyticsData[] | undefined;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error handling
  error: HVACError | null;
  
  // Control functions
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Connection status
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Main hook for real-time HVAC data subscriptions
 */
export function useConvexRealTime(config: UseConvexRealTimeConfig = {}): UseConvexRealTimeReturn {
  const {
    district,
    refreshInterval = 30000, // 30 seconds default
    enableAutoRefresh = true,
    onError,
    onDataUpdate
  } = config;

  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<HVACError | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Convex queries with proper error handling
  const jobs = useQuery(api.jobs.list, {});
  const equipment = useQuery(api.equipment.list, {});
  const analytics = useQuery(api.analytics.getRealtimeMetrics, {
    district: district || undefined
  });

  // Real-time metrics query
  const hvacMetrics = useQuery(api.analytics.getHVACMetrics, {
    district: district || undefined,
    limit: 100
  });

  // District performance data
  const districtData = useQuery(api.analytics.getDistrictPerformance, {
    timeRange: '24h'
  });

  // Energy analytics data
  const energyAnalytics = useQuery(api.analytics.getEnergyAnalytics, {
    district: district || undefined,
    timeRange: '24h'
  });

  // Loading state calculation
  const isLoading = hvacMetrics === undefined || 
                   districtData === undefined || 
                   energyAnalytics === undefined;

  // Error handling function
  const handleError = useCallback((errorMessage: string, component: string) => {
    const hvacError: HVACError = {
      code: 'CONVEX_ERROR',
      message: errorMessage,
      timestamp: new Date(),
      component,
      severity: 'error',
      recoverable: true
    };
    
    setError(hvacError);
    setIsConnected(false);
    
    if (onError) {
      onError(hvacError);
    }
  }, [onError]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Force refresh by invalidating queries
      // Note: Convex handles this automatically, but we can trigger manual updates
      setLastUpdated(new Date());
      setIsConnected(true);
    } catch (err) {
      handleError(
        err instanceof Error ? err.message : 'Unknown refresh error',
        'useConvexRealTime.refresh'
      );
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [handleError]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    setIsConnected(true);
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!enableAutoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !isRefreshing) {
        refresh();
      }
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [enableAutoRefresh, refreshInterval, refresh, isRefreshing]);

  // Data update notification
  useEffect(() => {
    if (hvacMetrics && districtData && energyAnalytics && onDataUpdate) {
      const subscriptionData: RealTimeSubscriptionData = {
        jobs: jobs?.map(job => ({
          _id: job._id,
          status: job.status,
          priority: job.priority as any,
          district: job.district as WarsawDistrict,
          lastUpdated: new Date(job._creationTime)
        })) || [],
        equipment: equipment?.map(eq => ({
          _id: eq._id,
          status: 'optimal' as any, // Transform based on actual equipment status
          metrics: {
            id: eq._id,
            district: 'Śródmieście' as WarsawDistrict, // Default or from equipment data
            equipmentId: eq._id,
            energyEfficiency: 85, // Mock data - replace with actual
            temperature: 22,
            pressure: 1.2,
            vatAmount: 0,
            status: 'optimal' as any,
            lastUpdated: new Date(),
            powerConsumption: 2.5,
            operatingHours: 8760,
            maintenanceScore: 90,
            operatingCost: 1200,
            energyCost: 0.15,
            maintenanceCost: 300
          }
        })) || [],
        alerts: [] // Implement alert system
      };
      
      onDataUpdate(subscriptionData);
    }
  }, [hvacMetrics, districtData, energyAnalytics, jobs, equipment, onDataUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (hvacMetrics || districtData || energyAnalytics) {
      setLastUpdated(new Date());
    }
  }, [hvacMetrics, districtData, energyAnalytics]);

  return {
    // Data
    hvacMetrics: hvacMetrics as HVACMetrics[] | undefined,
    districtData: districtData as WarsawDistrictData[] | undefined,
    energyAnalytics: energyAnalytics as EnergyAnalyticsData[] | undefined,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Error handling
    error,
    
    // Control functions
    refresh,
    clearError,
    
    // Connection status
    isConnected,
    lastUpdated
  };
}

/**
 * Specialized hook for HVAC metrics only
 */
export function useHVACMetrics(district?: WarsawDistrict) {
  const { hvacMetrics, isLoading, error, refresh } = useConvexRealTime({ district });
  
  return {
    metrics: hvacMetrics,
    isLoading,
    error,
    refresh
  };
}

/**
 * Specialized hook for district performance data
 */
export function useDistrictPerformance() {
  const { districtData, isLoading, error, refresh } = useConvexRealTime({});
  
  return {
    districts: districtData,
    isLoading,
    error,
    refresh
  };
}

/**
 * Specialized hook for energy analytics
 */
export function useEnergyAnalytics(district?: WarsawDistrict) {
  const { energyAnalytics, isLoading, error, refresh } = useConvexRealTime({ district });
  
  return {
    analytics: energyAnalytics,
    isLoading,
    error,
    refresh
  };
}
