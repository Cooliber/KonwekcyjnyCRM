/**
 * @fileoverview GoTun Package Type Definitions
 * @description Comprehensive TypeScript types for ACI-MCP integration and enterprise features
 * @version 1.0.0
 */

// Core GoTun Types
export interface GoTunConfig {
  // Core Configuration
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  // ACI-MCP Configuration
  aciMcp: ACIMCPConfig;
  
  // Enterprise Module Configuration
  enterprise: {
    salesPipeline: AdvancedPipelineConfig;
    businessIntelligence: BIDashboardConfig;
    integrations: EnterpriseIntegrationConfig;
    marketing: MarketingAutomationConfig;
    collaboration: CollaborationConfig;
  };
  
  // HVAC Optimization Configuration
  hvac: {
    warsawDistricts: WarsawDistrictConfig;
    routeOptimization: RouteOptimizationConfig;
    affluenceAnalysis: AffluenceAnalysisConfig;
    seasonalForecasting: SeasonalForecastConfig;
    prophecyEngine: ProphecyEngineConfig;
  };
  
  // Performance and Quality Configuration
  performance: {
    responseTimeTarget: number; // milliseconds
    throughputTarget: number; // requests/second
    uptimeTarget: number; // percentage
    cacheEnabled: boolean;
    rateLimiting: boolean;
  };
  
  // Security and Compliance
  security: {
    gdprCompliance: boolean;
    owaspCompliance: boolean;
    encryptionEnabled: boolean;
    auditLogging: boolean;
  };
}

// ACI-MCP Integration Types
export interface ACIMCPConfig {
  apiKey: string;
  linkedAccountOwnerId: string;
  vibeopsApiKey?: string;
  
  // Server Configurations
  unifiedServer: ACIUnifiedServerConfig;
  appsServer: ACIAppsServerConfig;
  vibeopsServer: ACIVibeOpsServerConfig;
  
  // Connection Settings
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  
  // Feature Flags
  enableUnifiedServer: boolean;
  enableAppsServer: boolean;
  enableVibeOpsServer: boolean;
}

export interface ACIUnifiedServerConfig {
  endpoint: string;
  allowedAppsOnly: boolean;
  transport: 'stdio' | 'sse';
  port: number;
  
  // Capabilities
  capabilities: {
    searchFunctions: boolean;
    executeFunction: boolean;
    dynamicDiscovery: boolean;
  };
}

export interface ACIAppsServerConfig {
  endpoint: string;
  apps: string[];
  transport: 'stdio' | 'sse';
  port: number;
  
  // App-specific configurations
  appConfigs: Record<string, AppConfig>;
}

export interface ACIVibeOpsServerConfig {
  endpoint: string;
  transport: 'stdio' | 'sse';
  port: number;
  
  // DevOps capabilities
  capabilities: {
    devopsAutomation: boolean;
    infrastructureManagement: boolean;
    monitoringAlerts: boolean;
    securityCompliance: boolean;
  };
}

export interface AppConfig {
  enabled: boolean;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  authentication?: {
    type: 'oauth' | 'api_key' | 'basic';
    credentials: Record<string, string>;
  };
  customSettings?: Record<string, unknown>;
}

// ACI Function Types
export interface ACIFunction {
  id: string;
  name: string;
  description: string;
  app: string;
  category: string;
  parameters: ACIFunctionParameter[];
  returnType: string;
  examples: ACIFunctionExample[];
}

export interface ACIFunctionParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export interface ACIFunctionExample {
  description: string;
  parameters: Record<string, unknown>;
  expectedResult: unknown;
}

export interface ACIExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata: {
    executionTime: number;
    functionId: string;
    timestamp: string;
    requestId: string;
  };
}

// Enterprise Feature Types
export interface AdvancedPipelineConfig {
  enabled: boolean;
  customStages: PipelineStage[];
  dealScoring: DealScoringConfig;
  forecasting: ForecastingConfig;
  automation: PipelineAutomationConfig;
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
}

export interface DealScoringConfig {
  enabled: boolean;
  factors: ScoringFactor[];
  weights: Record<string, number>;
  aiEnhanced: boolean;
}

export interface ScoringFactor {
  id: string;
  name: string;
  type: 'numeric' | 'boolean' | 'categorical';
  weight: number;
  calculation: string;
}

export interface ForecastingConfig {
  enabled: boolean;
  methods: ('linear' | 'exponential' | 'ai_enhanced')[];
  timeHorizons: number[]; // months
  confidenceIntervals: number[];
}

export interface PipelineAutomationConfig {
  enabled: boolean;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
}

export interface AutomationTrigger {
  id: string;
  name: string;
  event: string;
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

export interface AutomationAction {
  id: string;
  name: string;
  type: 'email' | 'task' | 'notification' | 'webhook' | 'aci_function';
  parameters: Record<string, unknown>;
}

export interface StageAutomation {
  trigger: 'enter' | 'exit' | 'duration';
  action: AutomationAction;
  delay?: number; // minutes
}

export interface StageRequirement {
  field: string;
  required: boolean;
  validation?: {
    type: 'string' | 'number' | 'date' | 'email' | 'phone';
    pattern?: string;
    min?: number;
    max?: number;
  };
}

// Business Intelligence Types
export interface BIDashboardConfig {
  enabled: boolean;
  dashboards: DashboardDefinition[];
  dataConnections: DataConnection[];
  refreshIntervals: RefreshInterval[];
  caching: CachingConfig;
}

export interface DashboardDefinition {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  permissions: DashboardPermission[];
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  rows: number;
  responsive: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'map' | 'custom';
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  dataSource: string;
  configuration: WidgetConfiguration;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfiguration {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string[];
  filters?: WidgetFilter[];
  formatting?: WidgetFormatting;
}

export interface WidgetFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface WidgetFormatting {
  numberFormat?: string;
  dateFormat?: string;
  colorScheme?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface DashboardPermission {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  restrictions?: string[];
}

export interface DataConnection {
  id: string;
  name: string;
  type: 'convex' | 'weaviate' | 'supabase' | 'api' | 'aci_function';
  configuration: DataConnectionConfig;
  schema: DataSchema;
}

export interface DataConnectionConfig {
  endpoint?: string;
  authentication?: {
    type: string;
    credentials: Record<string, string>;
  };
  parameters?: Record<string, unknown>;
}

export interface DataSchema {
  tables: DataTable[];
  relationships: DataRelationship[];
}

export interface DataTable {
  name: string;
  columns: DataColumn[];
  primaryKey: string[];
}

export interface DataColumn {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

export interface DataRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
}

export interface RefreshInterval {
  widgetId: string;
  interval: number; // seconds
  enabled: boolean;
}

export interface CachingConfig {
  enabled: boolean;
  ttl: number; // seconds
  strategy: 'lru' | 'fifo' | 'ttl';
  maxSize: number; // MB
}

// HVAC Optimization Types
export type WarsawDistrict = 
  | 'Śródmieście'
  | 'Mokotów'
  | 'Ochota'
  | 'Wola'
  | 'Żoliborz'
  | 'Praga-Północ'
  | 'Praga-Południe'
  | 'Targówek'
  | 'Rembertów'
  | 'Wawer'
  | 'Wilanów'
  | 'Ursynów'
  | 'Włochy'
  | 'Ursus'
  | 'Bemowo'
  | 'Bielany'
  | 'Białołęka';

export type HVACEquipmentType = 
  | 'split_ac'
  | 'central_ac'
  | 'heat_pump'
  | 'ventilation'
  | 'air_purifier'
  | 'humidifier'
  | 'dehumidifier';

export interface WarsawDistrictConfig {
  enabled: boolean;
  districts: DistrictProfile[];
  affluenceAnalysis: boolean;
  routeOptimization: boolean;
  marketIntelligence: boolean;
}

export interface DistrictProfile {
  name: WarsawDistrict;
  affluenceScore: number;
  populationDensity: number;
  commercialDensity: number;
  averagePropertyValue: number;
  hvacDemandIndex: number;
  seasonalFactors: SeasonalFactor[];
  competitorDensity: number;
  marketPenetration: number;
}

export interface SeasonalFactor {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  demandMultiplier: number;
  serviceTypes: HVACEquipmentType[];
}

export interface RouteOptimizationConfig {
  enabled: boolean;
  algorithm: 'genetic' | 'simulated_annealing' | 'ai_enhanced';
  factors: RouteOptimizationFactor[];
  realTimeTraffic: boolean;
  weatherConsideration: boolean;
}

export interface RouteOptimizationFactor {
  name: string;
  weight: number;
  type: 'distance' | 'time' | 'traffic' | 'priority' | 'cost';
}

export interface AffluenceAnalysisConfig {
  enabled: boolean;
  dataSources: AffluenceDataSource[];
  updateFrequency: number; // hours
  aiEnhanced: boolean;
}

export interface AffluenceDataSource {
  name: string;
  type: 'property_values' | 'income_data' | 'business_density' | 'demographic';
  weight: number;
  apiEndpoint?: string;
}

export interface SeasonalForecastConfig {
  enabled: boolean;
  forecastHorizon: number; // months
  equipmentTypes: HVACEquipmentType[];
  weatherIntegration: boolean;
  historicalDataYears: number;
}

export interface ProphecyEngineConfig {
  enabled: boolean;
  models: ProphecyModel[];
  updateFrequency: number; // hours
  confidenceThreshold: number;
}

export interface ProphecyModel {
  name: string;
  type: 'customer_lifetime_value' | 'service_demand' | 'equipment_failure' | 'market_demand';
  algorithm: 'neural_network' | 'random_forest' | 'gradient_boosting' | 'transformer';
  features: string[];
  accuracy: number;
}

// Integration Platform Types
export interface EnterpriseIntegrationConfig {
  enabled: boolean;
  providers: IntegrationProvider[];
  apiGateway: APIGatewayConfig;
  security: SecurityComplianceConfig;
  monitoring: IntegrationMonitoringConfig;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  type: 'crm' | 'marketing' | 'accounting' | 'communication' | 'productivity' | 'custom';
  enabled: boolean;
  configuration: ProviderConfiguration;
  rateLimits: RateLimit[];
  healthCheck: HealthCheckConfig;
}

export interface ProviderConfiguration {
  authentication: AuthenticationConfig;
  endpoints: EndpointConfig[];
  dataMapping: DataMappingConfig;
  webhooks: WebhookConfig[];
}

export interface AuthenticationConfig {
  type: 'oauth2' | 'api_key' | 'basic' | 'jwt';
  credentials: Record<string, string>;
  refreshToken?: string;
  expiresAt?: string;
}

export interface EndpointConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  parameters: Record<string, unknown>;
}

export interface DataMappingConfig {
  inbound: FieldMapping[];
  outbound: FieldMapping[];
  transformations: DataTransformation[];
}

export interface FieldMapping {
  source: string;
  target: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
}

export interface DataTransformation {
  field: string;
  operation: 'format' | 'calculate' | 'lookup' | 'validate';
  parameters: Record<string, unknown>;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
}

export interface RateLimit {
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // seconds
  timeout: number; // seconds
  endpoint: string;
  expectedStatus: number;
}

export interface APIGatewayConfig {
  enabled: boolean;
  baseUrl: string;
  authentication: boolean;
  rateLimiting: boolean;
  caching: boolean;
  logging: boolean;
  monitoring: boolean;
}

export interface SecurityComplianceConfig {
  gdpr: GDPRConfig;
  owasp: OWASPConfig;
  encryption: EncryptionConfig;
  audit: AuditConfig;
}

export interface GDPRConfig {
  enabled: boolean;
  dataRetentionPeriod: number; // days
  rightToBeForgotten: boolean;
  consentManagement: boolean;
  dataPortability: boolean;
}

export interface OWASPConfig {
  enabled: boolean;
  inputValidation: boolean;
  outputEncoding: boolean;
  authenticationControls: boolean;
  sessionManagement: boolean;
  accessControls: boolean;
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  algorithm: string;
  keyRotation: boolean;
  keyRotationInterval: number; // days
}

export interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: number; // days
  realTimeAlerts: boolean;
}

export interface IntegrationMonitoringConfig {
  enabled: boolean;
  metrics: MonitoringMetric[];
  alerts: AlertConfig[];
  dashboards: string[];
}

export interface MonitoringMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels: string[];
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

// Marketing Automation Types
export interface MarketingAutomationConfig {
  enabled: boolean;
  campaigns: CampaignConfig[];
  leadNurturing: LeadNurturingConfig;
  attribution: AttributionConfig;
  personalization: PersonalizationConfig;
}

export interface CampaignConfig {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'multi_channel';
  enabled: boolean;
  schedule: CampaignSchedule;
  targeting: TargetingConfig;
  content: ContentConfig;
  automation: CampaignAutomation;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring' | 'triggered';
  startDate?: string;
  endDate?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  timezone: string;
}

export interface TargetingConfig {
  segments: AudienceSegment[];
  filters: TargetingFilter[];
  exclusions: string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria[];
  size: number;
}

export interface SegmentCriteria {
  field: string;
  operator: string;
  value: unknown;
  logic: 'and' | 'or';
}

export interface TargetingFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface ContentConfig {
  templates: ContentTemplate[];
  personalization: PersonalizationRule[];
  abTesting: ABTestConfig;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  subject?: string;
  body: string;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: string;
  defaultValue?: string;
  required: boolean;
}

export interface PersonalizationRule {
  field: string;
  condition: string;
  replacement: string;
}

export interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
  trafficSplit: number[];
  duration: number; // days
  successMetric: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  weight: number;
}

export interface CampaignAutomation {
  triggers: CampaignTrigger[];
  actions: CampaignAction[];
  conditions: CampaignCondition[];
}

export interface CampaignTrigger {
  type: 'time_based' | 'behavior_based' | 'event_based';
  configuration: Record<string, unknown>;
}

export interface CampaignAction {
  type: 'send_email' | 'send_sms' | 'add_tag' | 'update_field' | 'create_task';
  configuration: Record<string, unknown>;
}

export interface CampaignCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface LeadNurturingConfig {
  enabled: boolean;
  workflows: NurturingWorkflow[];
  scoring: LeadScoringConfig;
}

export interface NurturingWorkflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  goals: WorkflowGoal[];
}

export interface WorkflowTrigger {
  type: string;
  conditions: TriggerCondition[];
}

export interface WorkflowStep {
  id: string;
  type: 'email' | 'sms' | 'wait' | 'condition' | 'action';
  configuration: Record<string, unknown>;
  delay?: number; // hours
}

export interface WorkflowGoal {
  name: string;
  metric: string;
  target: number;
}

export interface LeadScoringConfig {
  enabled: boolean;
  factors: LeadScoringFactor[];
  thresholds: ScoringThreshold[];
}

export interface LeadScoringFactor {
  name: string;
  type: 'demographic' | 'behavioral' | 'engagement';
  weight: number;
  calculation: string;
}

export interface ScoringThreshold {
  name: string;
  minScore: number;
  maxScore: number;
  actions: string[];
}

export interface AttributionConfig {
  enabled: boolean;
  models: AttributionModel[];
  touchpoints: TouchpointConfig[];
}

export interface AttributionModel {
  name: string;
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';
  weight: number;
}

export interface TouchpointConfig {
  channel: string;
  weight: number;
  lookbackWindow: number; // days
}

export interface PersonalizationConfig {
  enabled: boolean;
  rules: PersonalizationRule[];
  aiEnhanced: boolean;
}

// Collaboration Types
export interface CollaborationConfig {
  enabled: boolean;
  workspaces: WorkspaceConfig[];
  permissions: PermissionConfig;
  communication: CommunicationConfig;
  productivity: ProductivityConfig;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  description: string;
  members: WorkspaceMember[];
  channels: CommunicationChannel[];
  documents: DocumentConfig[];
}

export interface WorkspaceMember {
  userId: string;
  role: 'admin' | 'member' | 'guest';
  permissions: string[];
  joinedAt: string;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'video' | 'announcement';
  private: boolean;
  members: string[];
}

export interface DocumentConfig {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'form';
  permissions: DocumentPermission[];
  versions: DocumentVersion[];
}

export interface DocumentPermission {
  userId: string;
  level: 'view' | 'comment' | 'edit' | 'admin';
}

export interface DocumentVersion {
  id: string;
  version: string;
  createdBy: string;
  createdAt: string;
  changes: string;
}

export interface PermissionConfig {
  roles: Role[];
  permissions: Permission[];
  inheritance: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inherits?: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface CommunicationConfig {
  chat: ChatConfig;
  video: VideoConfig;
  notifications: NotificationConfig;
}

export interface ChatConfig {
  enabled: boolean;
  features: string[];
  integrations: string[];
}

export interface VideoConfig {
  enabled: boolean;
  provider: string;
  features: string[];
}

export interface NotificationConfig {
  enabled: boolean;
  channels: string[];
  rules: NotificationRule[];
}

export interface NotificationRule {
  event: string;
  channels: string[];
  conditions: NotificationCondition[];
}

export interface NotificationCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface ProductivityConfig {
  timeTracking: TimeTrackingConfig;
  projectManagement: ProjectManagementConfig;
  analytics: ProductivityAnalyticsConfig;
}

export interface TimeTrackingConfig {
  enabled: boolean;
  automatic: boolean;
  categories: TimeCategory[];
}

export interface TimeCategory {
  id: string;
  name: string;
  color: string;
  billable: boolean;
}

export interface ProjectManagementConfig {
  enabled: boolean;
  methodologies: string[];
  features: string[];
}

export interface ProductivityAnalyticsConfig {
  enabled: boolean;
  metrics: string[];
  reports: string[];
}

// Event and Module Types
export interface GoTunEvent {
  type: string;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GoTunModule {
  name: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  configuration: Record<string, unknown>;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Workflow Automation Types
export interface WorkflowAutomation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  variables: WorkflowVariable[];
}

export interface WorkflowVariable {
  name: string;
  type: string;
  value: unknown;
  scope: 'global' | 'workflow' | 'step';
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: unknown;
  logic: 'and' | 'or';
}

// Re-export all types for convenience
export type * from './aci-mcp';
export type * from './enterprise';
export type * from './hvac';
export type * from './integrations';
