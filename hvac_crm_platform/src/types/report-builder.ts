/**
 * Type definitions for the Report Builder module
 * Ensures 137/137 godlike quality with comprehensive TypeScript support
 */

// Data Source Types
export interface DataSource {
  id: string;
  type: "convex" | "supabase" | "weaviate" | "calculated";
  table?: string;
  query?: string;
  field?: string;
  filters?: DataFilter[];
  joins?: DataJoin[];
}

export interface DataFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "starts_with"
    | "in"
    | "between";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface DataJoin {
  table: string;
  on: string;
  type: "inner" | "left" | "right";
}

// Visualization Types
export interface VisualizationType {
  type:
    | "table"
    | "bar_chart"
    | "line_chart"
    | "pie_chart"
    | "area_chart"
    | "scatter_plot"
    | "heatmap"
    | "gauge"
    | "kpi_card";
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max" | "distinct";
  colors?: string[];
  customSettings?: Record<string, any>;
}

// Calculated Field Types
export interface CalculatedField {
  name: string;
  formula: string;
  dataType: "number" | "string" | "date" | "boolean";
}

// Report Configuration
export interface ReportConfig {
  name: string;
  description?: string;
  type: "dashboard" | "table" | "chart" | "kpi" | "custom";
  config: {
    dataSources: DataSource[];
    visualization: VisualizationType;
    calculatedFields?: CalculatedField[];
    warsawSettings?: WarsawSettings;
  };
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isTemplate?: boolean;
}

// Warsaw-specific Settings
export interface WarsawSettings {
  districtFilter?: string;
  affluenceWeighting?: boolean;
  seasonalAdjustment?: boolean;
  routeOptimization?: boolean;
}

// Execution Result Types
export interface ExecutionResult {
  data: Record<string, any>[];
  metadata: ExecutionMetadata;
}

export interface ExecutionMetadata {
  totalRows: number;
  executionTime: number;
  dataSourcesUsed: string[];
  generatedAt: number;
  convexTime?: number;
  supabaseTime?: number;
  weaviateTime?: number;
  warsawMetrics?: WarsawMetrics;
}

export interface WarsawMetrics {
  districtsAnalyzed: string[];
  affluenceScore?: number;
  routeEfficiency?: number;
  seasonalFactor?: number;
}

// Query Performance
export interface QueryPerformance {
  totalTime: number;
  convexTime?: number;
  supabaseTime?: number;
  weaviateTime?: number;
}

// Report Template Types
export interface ReportTemplate {
  _id: string;
  name: string;
  description?: string;
  category:
    | "hvac_performance"
    | "financial"
    | "operational"
    | "customer"
    | "equipment"
    | "district_analysis";
  type: "dashboard" | "table" | "chart" | "kpi" | "custom";
  config: ReportConfig["config"];
  tags?: string[];
  isPublic: boolean;
  createdBy: string;
  _creationTime: number;
}

// Sharing and Permissions
export interface SharePermission {
  userId: string;
  permission: "view" | "edit" | "admin";
}

export interface ReportShare {
  reportId: string;
  sharedWith: SharePermission[];
  isPublic: boolean;
}

// Export Types
export type ExportFormat = "pdf" | "excel" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  parameters?: Record<string, any>;
  includeMetadata?: boolean;
  warsawOptimized?: boolean;
}

// Schedule Types
export interface ReportSchedule {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  time?: string;
  recipients?: string[];
  format: ExportFormat | "email";
}

// Analytics Types
export interface ReportAnalytics {
  totalExecutions: number;
  avgExecutionTime: number;
  dataSourceUsage: Record<string, number>;
  warsawMetrics: {
    avgAffluenceScore: number;
    avgRouteEfficiency: number;
    districtsAnalyzed: string[];
  };
}

// Field Types for Drag & Drop
export interface DraggableFieldType {
  table: string;
  field: string;
  type: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Component Props Types
export interface ReportDesignerProps {
  config: ReportConfig;
  onChange: (config: ReportConfig) => void;
  onExecute: () => Promise<ExecutionResult>;
}

export interface DataSourcePanelProps {
  dataSources: DataSource[];
  onChange: (dataSources: DataSource[]) => void;
}

export interface VisualizationPanelProps {
  visualization: VisualizationType;
  onChange: (visualization: VisualizationType) => void;
}

// Error Types
export interface ReportError {
  code: string;
  message: string;
  timestamp: Date;
  component: string;
  severity: "info" | "warning" | "error" | "critical";
  recoverable: boolean;
}

// Cache Types
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  strategy: "lru" | "fifo" | "ttl";
  maxSize: number;
}

// Utility Types
export type ReportStatus = "draft" | "published" | "archived" | "scheduled";
export type DataSourceType = DataSource["type"];
export type VisualizationChartType = VisualizationType["type"];
export type AggregationType = NonNullable<VisualizationType["aggregation"]>;
export type FilterOperator = DataFilter["operator"];

// Warsaw District Types
export type WarsawDistrict =
  | "Śródmieście"
  | "Mokotów"
  | "Żoliborz"
  | "Ochota"
  | "Wola"
  | "Praga-Północ"
  | "Praga-Południe"
  | "Targówek"
  | "Bemowo"
  | "Ursynów"
  | "Wilanów"
  | "Białołęka"
  | "Bielany"
  | "Włochy"
  | "Ursus"
  | "Wawer"
  | "Wesola"
  | "Rembertów";

// Form Types
export type ReportFormData = Omit<ReportConfig, "config"> & {
  config: Partial<ReportConfig["config"]>;
};

export type ReportUpdateData = Partial<ReportConfig>;

// API Response Types
export interface ReportListResponse {
  reports: ReportTemplate[];
  total: number;
  hasMore: boolean;
}

export interface ReportExecutionResponse {
  success: boolean;
  data?: ExecutionResult;
  error?: ReportError;
  cached?: boolean;
}
