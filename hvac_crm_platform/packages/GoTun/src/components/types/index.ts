/**
 * @fileoverview GoTun UI Component Types
 * @description TypeScript type definitions for GoTun UI components
 * @version 1.0.0
 */

import React from 'react';
import type { 
  GoTunConfig, 
  WarsawDistrict, 
  HVACEquipmentType,
  ACIFunction,
  ACIExecutionResult
} from '../../types';

// Base Component Props
export interface GoTunComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

// Theme and Design System Types
export interface GoTunTheme {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    accent: Record<string, string>;
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    neutral: Record<string, string>;
  };
  spacing: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  zIndex: Record<string, string>;
  breakpoints: Record<string, string>;
}

export type GoTunColorScheme = 'light' | 'dark' | 'auto';
export type GoTunSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GoTunVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'ghost' | 'outline' | 'solid' | 'soft' | 'gradient';
export type GoTunAnimation = 'none' | 'fast' | 'normal' | 'slow' | 'slower' | 'slowest';
export type GoTunBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type GoTunSpacing = keyof typeof import('../../constants').GOTUN_SPACING;
export type GoTunShadow = keyof typeof import('../../constants').GOTUN_SHADOWS;
export type GoTunBorderRadius = keyof typeof import('../../constants').GOTUN_BORDER_RADIUS;
export type GoTunFontSize = keyof typeof import('../../constants').GOTUN_FONT_SIZES;
export type GoTunFontWeight = keyof typeof import('../../constants').GOTUN_FONT_WEIGHTS;
export type GoTunLineHeight = keyof typeof import('../../constants').GOTUN_LINE_HEIGHTS;
export type GoTunZIndex = keyof typeof import('../../constants').GOTUN_Z_INDEX;

// Sales Pipeline Types
export interface Deal {
  id: string;
  title: string;
  description: string;
  value: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  stageId: string;
  priority: 'low' | 'medium' | 'high';
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
  daysInStage: number;
  district?: WarsawDistrict;
  equipmentTypes?: HVACEquipmentType[];
  aiScore?: number;
  aiScoring?: DealScoringResult;
  tags?: string[];
  notes?: string;
  attachments?: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  order: number;
  probability: number;
  color: string;
  automations: StageAutomation[];
  requirements: StageRequirement[];
  averageDaysInStage?: number;
  dealCount?: number;
  totalValue?: number;
}

export interface DealScoringResult {
  score: number;
  factors: ScoringFactor[];
  insights: ScoringInsight[];
  confidence: number;
  lastUpdated: string;
}

export interface ScoringFactor {
  name: string;
  value: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ScoringInsight {
  type: 'opportunity' | 'warning' | 'recommendation';
  message: string;
  confidence: number;
  actionable: boolean;
}

export interface StageAutomation {
  id: string;
  trigger: 'enter' | 'exit' | 'duration';
  action: AutomationAction;
  delay?: number;
  conditions?: AutomationCondition[];
}

export interface StageRequirement {
  field: string;
  required: boolean;
  validation?: FieldValidation;
}

export interface AutomationAction {
  type: 'email' | 'task' | 'notification' | 'webhook' | 'aci_function';
  parameters: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface FieldValidation {
  type: 'string' | 'number' | 'date' | 'email' | 'phone';
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

// Business Intelligence Types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'custom';
  chartType?: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'heatmap';
  position: WidgetPosition;
  size: WidgetSize;
  dataSource: string;
  chartConfig?: ChartConfig;
  visible: boolean;
  aiPowered?: boolean;
  refreshInterval?: number;
  
  // Metric widget specific
  value?: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  subtitle?: string;
  trend?: number[];
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface ChartConfig {
  xAxis: string;
  series: ChartSeries[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animations?: boolean;
}

export interface ChartSeries {
  key: string;
  name?: string;
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface DashboardData {
  [key: string]: any[];
}

// Warsaw Analytics Types
export interface DistrictAnalytics {
  district: WarsawDistrict;
  affluenceScore: number;
  affluenceChange: number;
  demandIndex: number;
  demandChange: number;
  competitionDensity: number;
  competitionChange: number;
  opportunityScore: number;
  opportunityChange: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  seasonalDemand: SeasonalDemandData[];
  equipmentDistribution: EquipmentDistribution[];
  marketPenetration: number;
  averageProjectValue: number;
  customerSatisfaction: number;
}

export interface SeasonalDemandData {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  multiplier: number;
  equipmentTypes: HVACEquipmentType[];
  peakMonths: string[];
}

export interface EquipmentDistribution {
  type: HVACEquipmentType;
  percentage: number;
  growth: number;
  averagePrice: number;
}

export interface HVACDemandData {
  district: WarsawDistrict;
  equipment: HVACEquipmentType;
  demand: number;
  season: string;
  timestamp: string;
}

export interface ProphecyInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  district?: WarsawDistrict;
  equipment?: HVACEquipmentType;
  timestamp: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

// ACI-MCP Integration Types
export interface ACIServerStatus {
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  uptime?: string;
  version?: string;
  lastError?: string;
  connectedApps?: string[];
  activeConnections?: number;
  requestsPerMinute?: number;
  errorRate?: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime-local' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: FieldValidation;
  options?: SelectOption[];
  multiple?: boolean;
  accept?: string; // for file inputs
  rows?: number; // for textarea
  cols?: number; // for textarea
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FormData {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string | string[];
}

// Chart Types
export interface ChartData {
  [key: string]: any;
}

export interface ChartProps extends GoTunComponentProps {
  data: ChartData[];
  width?: number | string;
  height?: number | string;
  responsive?: boolean;
  animations?: boolean;
  colors?: string[];
  theme?: 'light' | 'dark';
}

// Layout Types
export interface GridProps extends GoTunComponentProps {
  cols?: number | Record<GoTunBreakpoint, number>;
  gap?: GoTunSpacing;
  rows?: number;
  areas?: string[];
  autoFlow?: 'row' | 'column' | 'dense';
  autoRows?: string;
  autoCols?: string;
}

export interface FlexProps extends GoTunComponentProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: GoTunSpacing;
}

export interface StackProps extends GoTunComponentProps {
  direction?: 'horizontal' | 'vertical';
  spacing?: GoTunSpacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
  divider?: React.ReactNode;
}

// Animation Types
export interface AnimationProps {
  duration?: GoTunAnimation;
  delay?: number;
  easing?: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Event Types
export interface GoTunEvent<T = any> {
  type: string;
  target: T;
  currentTarget: T;
  timestamp: number;
  preventDefault: () => void;
  stopPropagation: () => void;
}

// Utility Types
export type Merge<T, U> = Omit<T, keyof U> & U;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Component State Types
export interface ComponentState {
  loading: boolean;
  error: string | null;
  data: any;
  lastUpdated: string;
}

export interface AsyncComponentState<T> extends ComponentState {
  data: T | null;
}

// Hook Types
export interface UseGoTunOptions {
  theme?: GoTunTheme;
  colorScheme?: GoTunColorScheme;
  animations?: boolean;
  reducedMotion?: boolean;
}

export interface UseGoTunReturn {
  theme: GoTunTheme;
  colorScheme: GoTunColorScheme;
  setColorScheme: (scheme: GoTunColorScheme) => void;
  toggleColorScheme: () => void;
  animations: boolean;
  setAnimations: (enabled: boolean) => void;
}

// Context Types
export interface GoTunContextValue {
  config: GoTunConfig;
  theme: GoTunTheme;
  colorScheme: GoTunColorScheme;
  animations: boolean;
  breakpoint: GoTunBreakpoint;
  isLoading: boolean;
  error: string | null;
}

// Provider Types
export interface GoTunProviderProps extends GoTunComponentProps {
  config?: Partial<GoTunConfig>;
  theme?: Partial<GoTunTheme>;
  colorScheme?: GoTunColorScheme;
  animations?: boolean;
}

// Module Types
export interface GoTunModuleProps extends GoTunComponentProps {
  config?: Partial<GoTunConfig>;
  searchTerm?: string;
  isActive?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

// Export all types
export type * from '../../types';
