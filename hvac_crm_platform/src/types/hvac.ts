/**
 * TypeScript type definitions for HVAC Dashboard components
 * Optimized for Warsaw-based HVAC CRM platform with real-time capabilities
 */

import { Id } from "../../convex/_generated/dataModel";

// Warsaw district types
export type WarsawDistrict = 
  | 'Śródmieście' 
  | 'Wilanów' 
  | 'Mokotów' 
  | 'Żoliborz' 
  | 'Ursynów' 
  | 'Wola' 
  | 'Praga-Południe' 
  | 'Targówek'
  | 'Ochota'
  | 'Praga-Północ'
  | 'Bemowo'
  | 'Bielany'
  | 'Białołęka'
  | 'Rembertów'
  | 'Wesoła'
  | 'Wilanów'
  | 'Włochy'
  | 'Ursus';

// HVAC equipment status types
export type HVACStatus = 'optimal' | 'warning' | 'critical' | 'offline' | 'maintenance';

// Job priority types
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

// Job types for HVAC services
export type JobType = 'installation' | 'repair' | 'maintenance' | 'inspection' | 'emergency';

// Real-time HVAC metrics interface
export interface HVACMetrics {
  id: string;
  district: WarsawDistrict;
  equipmentId: string;
  energyEfficiency: number; // 0-100 percentage
  temperature: number; // Celsius
  pressure: number; // Bar
  vatAmount: number; // Polish VAT (23%)
  status: HVACStatus;
  lastUpdated: Date;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Performance indicators
  powerConsumption: number; // kW
  operatingHours: number;
  maintenanceScore: number; // 0-100
  // Cost analysis
  operatingCost: number; // PLN
  energyCost: number; // PLN per hour
  maintenanceCost: number; // PLN
}

// Warsaw district data with affluence correlation
export interface WarsawDistrictData {
  districtName: WarsawDistrict;
  affluenceScore: number; // 1-10 scale
  serviceDemand: number; // Number of active requests
  averageJobValue: number; // PLN
  activeInstallations: number;
  // Geographic data
  coordinates: {
    lat: number;
    lng: number;
  };
  // Performance metrics
  completionRate: number; // 0-100 percentage
  customerSatisfaction: number; // 1-5 scale
  responseTime: number; // Minutes
  // Revenue data
  monthlyRevenue: number; // PLN
  yearlyRevenue: number; // PLN
  revenueGrowth: number; // Percentage change
}

// Energy analytics data structure
export interface EnergyAnalyticsData {
  timestamp: Date;
  district: WarsawDistrict;
  equipmentId: string;
  // Energy metrics
  energyConsumption: number; // kWh
  energyEfficiency: number; // 0-100 percentage
  carbonFootprint: number; // kg CO2
  // Cost breakdown with Polish VAT
  baseCost: number; // PLN without VAT
  vatAmount: number; // 23% VAT in PLN
  totalCost: number; // PLN with VAT
  // Comparative metrics
  industryAverage: number;
  targetEfficiency: number;
  savingsPotential: number; // PLN
}

// Real-time subscription data types
export interface RealTimeSubscriptionData {
  jobs: Array<{
    _id: Id<"jobs">;
    status: string;
    priority: JobPriority;
    district: WarsawDistrict;
    lastUpdated: Date;
  }>;
  equipment: Array<{
    _id: Id<"equipment">;
    status: HVACStatus;
    metrics: HVACMetrics;
  }>;
  alerts: Array<{
    id: string;
    type: 'maintenance' | 'emergency' | 'efficiency' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    district: WarsawDistrict;
    timestamp: Date;
  }>;
}

// Dashboard widget configuration
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'map' | 'table' | 'alert';
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: {
    dataSource: string;
    refreshInterval: number; // seconds
    filters?: Record<string, any>;
  };
}

// Chart data interfaces for Recharts compatibility
export interface ChartDataPoint {
  name: string;
  value: number;
  timestamp?: Date;
  district?: WarsawDistrict;
  // Additional metrics
  efficiency?: number;
  cost?: number;
  vatAmount?: number;
  target?: number;
}

// Performance targets for Warsaw HVAC operations
export interface PerformanceTargets {
  energyEfficiency: number; // Target percentage
  responseTime: number; // Target minutes
  completionRate: number; // Target percentage
  customerSatisfaction: number; // Target score 1-5
  costReduction: number; // Target percentage
  carbonReduction: number; // Target kg CO2
}

// Prophecy/AI prediction interfaces
export interface HVACPrediction {
  equipmentId: string;
  district: WarsawDistrict;
  predictionType: 'maintenance' | 'failure' | 'efficiency' | 'cost';
  confidence: number; // 0-100 percentage
  predictedDate: Date;
  estimatedCost: number; // PLN
  recommendedAction: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Error handling for real-time components
export interface HVACError {
  code: string;
  message: string;
  timestamp: Date;
  component: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  recoverable: boolean;
}

// Export utility type for component props
export type HVACDashboardProps = {
  district?: WarsawDistrict;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d' | '1y';
  refreshInterval?: number;
  showPredictions?: boolean;
  enableRealTime?: boolean;
};
