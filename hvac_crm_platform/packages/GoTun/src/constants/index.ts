/**
 * @fileoverview GoTun Package Constants
 * @description Core constants for ACI-MCP integration and enterprise features
 * @version 1.0.0
 */

import type { WarsawDistrict, HVACEquipmentType } from '../types';

// Warsaw Districts Configuration
export const WARSAW_DISTRICTS: readonly WarsawDistrict[] = [
  'Śródmieście',
  'Mokotów',
  'Ochota',
  'Wola',
  'Żoliborz',
  'Praga-Północ',
  'Praga-Południe',
  'Targówek',
  'Rembertów',
  'Wawer',
  'Wilanów',
  'Ursynów',
  'Włochy',
  'Ursus',
  'Bemowo',
  'Bielany',
  'Białołęka'
] as const;

// HVAC Equipment Types
export const HVAC_EQUIPMENT_TYPES: readonly HVACEquipmentType[] = [
  'split_ac',
  'central_ac',
  'heat_pump',
  'ventilation',
  'air_purifier',
  'humidifier',
  'dehumidifier'
] as const;

// ACI-MCP Endpoints Configuration
export const ACI_MCP_ENDPOINTS = {
  UNIFIED_SERVER: 'aci-mcp-unified',
  APPS_SERVER: 'aci-mcp-apps',
  VIBEOPS_SERVER: 'aci-mcp-vibeops'
} as const;

// Enterprise Applications for ACI Apps Server
export const ENTERPRISE_APPS = {
  CRM: ['SALESFORCE', 'HUBSPOT', 'PIPEDRIVE'],
  MARKETING: ['MAILCHIMP', 'SENDGRID', 'KLAVIYO'],
  COMMUNICATION: ['SLACK', 'MICROSOFT_TEAMS', 'DISCORD'],
  PRODUCTIVITY: ['GOOGLE_WORKSPACE', 'MICROSOFT_365', 'NOTION'],
  AUTOMATION: ['ZAPIER', 'MAKE', 'INTEGROMAT'],
  PAYMENT: ['STRIPE', 'PAYPAL', 'SQUARE'],
  SCHEDULING: ['CALENDLY', 'ACUITY', 'BOOKINGCOM'],
  ANALYTICS: ['GOOGLE_ANALYTICS', 'MIXPANEL', 'AMPLITUDE'],
  STORAGE: ['GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE'],
  ACCOUNTING: ['QUICKBOOKS', 'XERO', 'FRESHBOOKS']
} as const;

// Quality Standards for 137/137 Godlike Quality
export const QUALITY_STANDARDS = {
  TEST_COVERAGE_TARGET: 90,
  RESPONSE_TIME_TARGET: 200, // milliseconds
  UPTIME_TARGET: 99.99, // percentage
  ERROR_RATE_TARGET: 0.01, // 1%
  TYPESCRIPT_STRICT: true,
  GDPR_COMPLIANCE: true,
  OWASP_COMPLIANCE: true,
  WCAG_COMPLIANCE: 'AA',
  PERFORMANCE_BUDGET: {
    BUNDLE_SIZE: 800, // KB
    FIRST_CONTENTFUL_PAINT: 1.5, // seconds
    LARGEST_CONTENTFUL_PAINT: 2.5, // seconds
    CUMULATIVE_LAYOUT_SHIFT: 0.1,
    FIRST_INPUT_DELAY: 100 // milliseconds
  }
} as const;

// Performance Targets
export const PERFORMANCE_TARGETS = {
  API_RESPONSE_TIME: 200, // milliseconds
  DATABASE_QUERY_TIME: 50, // milliseconds
  CACHE_HIT_RATIO: 95, // percentage
  CONCURRENT_USERS: 1000,
  THROUGHPUT: 10000, // requests per minute
  MEMORY_USAGE: 512, // MB
  CPU_USAGE: 70, // percentage
  DISK_USAGE: 80 // percentage
} as const;

// Warsaw District Affluence Scores (1-100)
export const WARSAW_DISTRICT_AFFLUENCE: Record<WarsawDistrict, number> = {
  'Śródmieście': 95,
  'Mokotów': 90,
  'Wilanów': 95,
  'Żoliborz': 85,
  'Ochota': 80,
  'Wola': 75,
  'Ursynów': 85,
  'Bielany': 70,
  'Bemowo': 65,
  'Włochy': 60,
  'Ursus': 55,
  'Praga-Północ': 50,
  'Praga-Południe': 55,
  'Targówek': 45,
  'Rembertów': 60,
  'Wawer': 65,
  'Białołęka': 50
} as const;

// HVAC Seasonal Demand Multipliers
export const HVAC_SEASONAL_DEMAND = {
  spring: {
    split_ac: 1.2,
    central_ac: 1.1,
    heat_pump: 0.9,
    ventilation: 1.0,
    air_purifier: 1.1,
    humidifier: 0.8,
    dehumidifier: 1.0
  },
  summer: {
    split_ac: 2.0,
    central_ac: 1.8,
    heat_pump: 0.7,
    ventilation: 1.3,
    air_purifier: 1.2,
    humidifier: 0.6,
    dehumidifier: 1.4
  },
  autumn: {
    split_ac: 0.8,
    central_ac: 0.7,
    heat_pump: 1.2,
    ventilation: 1.0,
    air_purifier: 1.0,
    humidifier: 1.1,
    dehumidifier: 0.9
  },
  winter: {
    split_ac: 0.5,
    central_ac: 0.4,
    heat_pump: 1.5,
    ventilation: 0.9,
    air_purifier: 0.9,
    humidifier: 1.3,
    dehumidifier: 0.7
  }
} as const;

// ACI Function Categories
export const ACI_FUNCTION_CATEGORIES = {
  SALES: 'sales_automation',
  MARKETING: 'marketing_automation',
  ANALYTICS: 'business_intelligence',
  COMMUNICATION: 'team_communication',
  PRODUCTIVITY: 'workflow_automation',
  INTEGRATION: 'system_integration',
  AI_ML: 'artificial_intelligence',
  DATA: 'data_management',
  SECURITY: 'security_compliance',
  MONITORING: 'system_monitoring'
} as const;

// Error Codes
export const ERROR_CODES = {
  // ACI-MCP Errors
  ACI_CONNECTION_FAILED: 'ACI_CONNECTION_FAILED',
  ACI_AUTHENTICATION_FAILED: 'ACI_AUTHENTICATION_FAILED',
  ACI_FUNCTION_NOT_FOUND: 'ACI_FUNCTION_NOT_FOUND',
  ACI_EXECUTION_FAILED: 'ACI_EXECUTION_FAILED',
  ACI_RATE_LIMIT_EXCEEDED: 'ACI_RATE_LIMIT_EXCEEDED',
  
  // Enterprise Module Errors
  PIPELINE_CONFIGURATION_INVALID: 'PIPELINE_CONFIGURATION_INVALID',
  BI_DASHBOARD_CREATION_FAILED: 'BI_DASHBOARD_CREATION_FAILED',
  INTEGRATION_SETUP_FAILED: 'INTEGRATION_SETUP_FAILED',
  MARKETING_CAMPAIGN_FAILED: 'MARKETING_CAMPAIGN_FAILED',
  COLLABORATION_WORKSPACE_ERROR: 'COLLABORATION_WORKSPACE_ERROR',
  
  // HVAC Optimization Errors
  DISTRICT_ANALYSIS_FAILED: 'DISTRICT_ANALYSIS_FAILED',
  ROUTE_OPTIMIZATION_FAILED: 'ROUTE_OPTIMIZATION_FAILED',
  AFFLUENCE_CALCULATION_FAILED: 'AFFLUENCE_CALCULATION_FAILED',
  SEASONAL_FORECAST_FAILED: 'SEASONAL_FORECAST_FAILED',
  PROPHECY_ENGINE_ERROR: 'PROPHECY_ENGINE_ERROR',
  
  // General Errors
  CONFIGURATION_INVALID: 'CONFIGURATION_INVALID',
  MODULE_INITIALIZATION_FAILED: 'MODULE_INITIALIZATION_FAILED',
  HEALTH_CHECK_FAILED: 'HEALTH_CHECK_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND'
} as const;

// Event Types
export const EVENT_TYPES = {
  // Core Events
  MODULE_INITIALIZED: 'module_initialized',
  MODULE_STARTED: 'module_started',
  MODULE_STOPPED: 'module_stopped',
  CONFIGURATION_UPDATED: 'configuration_updated',
  
  // ACI-MCP Events
  ACI_FUNCTION_EXECUTED: 'aci_function_executed',
  ACI_CONNECTION_ESTABLISHED: 'aci_connection_established',
  ACI_CONNECTION_LOST: 'aci_connection_lost',
  
  // Enterprise Events
  PIPELINE_STAGE_CHANGED: 'pipeline_stage_changed',
  DEAL_SCORED: 'deal_scored',
  DASHBOARD_UPDATED: 'dashboard_updated',
  INTEGRATION_SYNCED: 'integration_synced',
  CAMPAIGN_LAUNCHED: 'campaign_launched',
  
  // HVAC Events
  ROUTE_OPTIMIZED: 'route_optimized',
  DISTRICT_ANALYZED: 'district_analyzed',
  SEASONAL_FORECAST_UPDATED: 'seasonal_forecast_updated',
  PROPHECY_PREDICTION_MADE: 'prophecy_prediction_made',
  
  // System Events
  HEALTH_CHECK_COMPLETED: 'health_check_completed',
  PERFORMANCE_METRIC_RECORDED: 'performance_metric_recorded',
  ERROR_OCCURRED: 'error_occurred',
  WARNING_ISSUED: 'warning_issued'
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// Cache Keys
export const CACHE_KEYS = {
  ACI_FUNCTIONS: 'aci_functions',
  DISTRICT_ANALYSIS: 'district_analysis',
  ROUTE_OPTIMIZATION: 'route_optimization',
  SEASONAL_FORECAST: 'seasonal_forecast',
  AFFLUENCE_SCORES: 'affluence_scores',
  PIPELINE_METRICS: 'pipeline_metrics',
  BI_DASHBOARD_DATA: 'bi_dashboard_data',
  INTEGRATION_STATUS: 'integration_status'
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

// Rate Limits
export const RATE_LIMITS = {
  ACI_UNIFIED_SERVER: {
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_HOUR: 1000
  },
  ACI_APPS_SERVER: {
    REQUESTS_PER_MINUTE: 200,
    REQUESTS_PER_HOUR: 2000
  },
  ACI_VIBEOPS_SERVER: {
    REQUESTS_PER_MINUTE: 50,
    REQUESTS_PER_HOUR: 500
  },
  ENTERPRISE_APIS: {
    REQUESTS_PER_MINUTE: 300,
    REQUESTS_PER_HOUR: 3000
  }
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // milliseconds
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY: 10000 // milliseconds
} as const;

// Health Check Configuration
export const HEALTH_CHECK_CONFIG = {
  INTERVAL: 30000, // 30 seconds
  TIMEOUT: 5000, // 5 seconds
  FAILURE_THRESHOLD: 3,
  SUCCESS_THRESHOLD: 2
} as const;

// Monitoring Metrics
export const MONITORING_METRICS = {
  RESPONSE_TIME: 'response_time',
  THROUGHPUT: 'throughput',
  ERROR_RATE: 'error_rate',
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  DISK_USAGE: 'disk_usage',
  NETWORK_IO: 'network_io',
  CACHE_HIT_RATIO: 'cache_hit_ratio',
  ACTIVE_CONNECTIONS: 'active_connections',
  QUEUE_SIZE: 'queue_size'
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  HASH_ALGORITHM: 'SHA-256',
  JWT_ALGORITHM: 'RS256',
  SESSION_TIMEOUT: 3600, // 1 hour
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_COMPLEXITY: {
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  }
} as const;

// GDPR Configuration
export const GDPR_CONFIG = {
  DATA_RETENTION_PERIOD: 2555, // 7 years in days
  CONSENT_EXPIRY: 365, // 1 year in days
  DELETION_GRACE_PERIOD: 30, // 30 days
  AUDIT_LOG_RETENTION: 2555 // 7 years in days
} as const;

// API Versions
export const API_VERSIONS = {
  GOTUN: 'v1',
  ACI_MCP: 'v1',
  ENTERPRISE: 'v1',
  HVAC: 'v1',
  INTEGRATIONS: 'v1'
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ACI_UNIFIED_SERVER: true,
  ENABLE_ACI_APPS_SERVER: true,
  ENABLE_ACI_VIBEOPS_SERVER: true,
  ENABLE_ADVANCED_PIPELINE: true,
  ENABLE_BI_DASHBOARD: true,
  ENABLE_ENTERPRISE_INTEGRATIONS: true,
  ENABLE_MARKETING_AUTOMATION: true,
  ENABLE_TEAM_COLLABORATION: true,
  ENABLE_WARSAW_OPTIMIZATION: true,
  ENABLE_ROUTE_OPTIMIZATION: true,
  ENABLE_AFFLUENCE_ANALYSIS: true,
  ENABLE_SEASONAL_FORECASTING: true,
  ENABLE_PROPHECY_ENGINE: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_CACHING: true,
  ENABLE_MONITORING: true,
  ENABLE_AUDIT_LOGGING: true
} as const;

// Default Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  DATABASE_QUERY: 10000, // 10 seconds
  CACHE_OPERATION: 5000, // 5 seconds
  FILE_UPLOAD: 300000, // 5 minutes
  WEBSOCKET_CONNECTION: 10000, // 10 seconds
  HEALTH_CHECK: 5000 // 5 seconds
} as const;
