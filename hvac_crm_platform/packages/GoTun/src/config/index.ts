/**
 * @fileoverview GoTun Package Configuration
 * @description Default configuration for ACI-MCP integration and enterprise features
 * @version 1.0.0
 */

import type { GoTunConfig } from '../types';
import { 
  WARSAW_DISTRICTS, 
  HVAC_EQUIPMENT_TYPES, 
  QUALITY_STANDARDS, 
  PERFORMANCE_TARGETS,
  FEATURE_FLAGS,
  TIMEOUTS,
  RETRY_CONFIG,
  HEALTH_CHECK_CONFIG,
  SECURITY_CONFIG,
  GDPR_CONFIG
} from '../constants';

/**
 * Default GoTun Configuration
 * Provides sensible defaults for all modules while maintaining 137/137 quality standard
 */
export const DEFAULT_GOTUN_CONFIG: GoTunConfig = {
  // Core Configuration
  environment: 'development',
  debug: true,
  logLevel: 'info',
  
  // ACI-MCP Configuration
  aciMcp: {
    apiKey: process.env.ACI_API_KEY || '',
    linkedAccountOwnerId: process.env.ACI_LINKED_ACCOUNT_OWNER_ID || '',
    vibeopsApiKey: process.env.VIBEOPS_API_KEY,
    
    // Server Configurations
    unifiedServer: {
      endpoint: 'aci-mcp-unified',
      allowedAppsOnly: false,
      transport: 'stdio',
      port: 8000,
      capabilities: {
        searchFunctions: true,
        executeFunction: true,
        dynamicDiscovery: true
      }
    },
    
    appsServer: {
      endpoint: 'aci-mcp-apps',
      apps: [
        'SALESFORCE',
        'HUBSPOT',
        'ZAPIER',
        'GMAIL',
        'SLACK',
        'GOOGLE_SHEETS',
        'CALENDLY',
        'STRIPE'
      ],
      transport: 'stdio',
      port: 8001,
      appConfigs: {
        SALESFORCE: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 1000
          }
        },
        HUBSPOT: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 1000
          }
        },
        ZAPIER: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 50,
            requestsPerHour: 500
          }
        },
        GMAIL: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 250,
            requestsPerHour: 1000
          }
        },
        SLACK: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 50,
            requestsPerHour: 500
          }
        },
        GOOGLE_SHEETS: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 1000
          }
        },
        CALENDLY: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 50,
            requestsPerHour: 500
          }
        },
        STRIPE: {
          enabled: true,
          rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 1000
          }
        }
      }
    },
    
    vibeopsServer: {
      endpoint: 'aci-mcp-vibeops',
      transport: 'stdio',
      port: 8002,
      capabilities: {
        devopsAutomation: true,
        infrastructureManagement: true,
        monitoringAlerts: true,
        securityCompliance: true
      }
    },
    
    // Connection Settings
    timeout: TIMEOUTS.API_REQUEST,
    retryAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
    retryDelay: RETRY_CONFIG.INITIAL_DELAY,
    
    // Feature Flags
    enableUnifiedServer: FEATURE_FLAGS.ENABLE_ACI_UNIFIED_SERVER,
    enableAppsServer: FEATURE_FLAGS.ENABLE_ACI_APPS_SERVER,
    enableVibeOpsServer: FEATURE_FLAGS.ENABLE_ACI_VIBEOPS_SERVER
  },
  
  // Enterprise Module Configuration
  enterprise: {
    // Advanced Sales Pipeline Management
    salesPipeline: {
      enabled: FEATURE_FLAGS.ENABLE_ADVANCED_PIPELINE,
      customStages: [
        {
          id: 'lead',
          name: 'Lead',
          description: 'Initial contact with potential customer',
          order: 1,
          probability: 10,
          color: '#e3f2fd',
          automations: [],
          requirements: [
            {
              field: 'contact_info',
              required: true,
              validation: {
                type: 'email'
              }
            }
          ]
        },
        {
          id: 'qualified',
          name: 'Qualified',
          description: 'Lead has been qualified as potential customer',
          order: 2,
          probability: 25,
          color: '#f3e5f5',
          automations: [],
          requirements: [
            {
              field: 'budget_confirmed',
              required: true,
              validation: {
                type: 'number',
                min: 1000
              }
            }
          ]
        },
        {
          id: 'proposal',
          name: 'Proposal',
          description: 'Proposal has been sent to customer',
          order: 3,
          probability: 50,
          color: '#fff3e0',
          automations: [],
          requirements: [
            {
              field: 'proposal_sent',
              required: true,
              validation: {
                type: 'date'
              }
            }
          ]
        },
        {
          id: 'negotiation',
          name: 'Negotiation',
          description: 'Negotiating terms and pricing',
          order: 4,
          probability: 75,
          color: '#e8f5e8',
          automations: [],
          requirements: []
        },
        {
          id: 'closed_won',
          name: 'Closed Won',
          description: 'Deal successfully closed',
          order: 5,
          probability: 100,
          color: '#c8e6c9',
          automations: [],
          requirements: [
            {
              field: 'contract_signed',
              required: true,
              validation: {
                type: 'date'
              }
            }
          ]
        },
        {
          id: 'closed_lost',
          name: 'Closed Lost',
          description: 'Deal was not successful',
          order: 6,
          probability: 0,
          color: '#ffcdd2',
          automations: [],
          requirements: [
            {
              field: 'loss_reason',
              required: true,
              validation: {
                type: 'string'
              }
            }
          ]
        }
      ],
      dealScoring: {
        enabled: true,
        factors: [
          {
            id: 'budget',
            name: 'Budget Size',
            type: 'numeric',
            weight: 0.3,
            calculation: 'linear'
          },
          {
            id: 'timeline',
            name: 'Decision Timeline',
            type: 'categorical',
            weight: 0.2,
            calculation: 'categorical'
          },
          {
            id: 'authority',
            name: 'Decision Authority',
            type: 'boolean',
            weight: 0.25,
            calculation: 'boolean'
          },
          {
            id: 'need',
            name: 'Need Urgency',
            type: 'numeric',
            weight: 0.25,
            calculation: 'linear'
          }
        ],
        weights: {
          budget: 0.3,
          timeline: 0.2,
          authority: 0.25,
          need: 0.25
        },
        aiEnhanced: true
      },
      forecasting: {
        enabled: true,
        methods: ['linear', 'exponential', 'ai_enhanced'],
        timeHorizons: [1, 3, 6, 12], // months
        confidenceIntervals: [80, 90, 95]
      },
      automation: {
        enabled: true,
        triggers: [],
        actions: []
      }
    },
    
    // Business Intelligence Dashboard
    businessIntelligence: {
      enabled: FEATURE_FLAGS.ENABLE_BI_DASHBOARD,
      dashboards: [
        {
          id: 'sales_overview',
          name: 'Sales Overview',
          description: 'High-level sales performance metrics',
          layout: {
            type: 'grid',
            columns: 12,
            rows: 8,
            responsive: true
          },
          widgets: [
            {
              id: 'revenue_chart',
              type: 'chart',
              title: 'Monthly Revenue',
              position: { x: 0, y: 0 },
              size: { width: 6, height: 4 },
              dataSource: 'sales_data',
              configuration: {
                chartType: 'line',
                aggregation: 'sum',
                groupBy: ['month'],
                filters: [],
                formatting: {
                  numberFormat: 'currency',
                  showLegend: true,
                  showGrid: true
                }
              }
            },
            {
              id: 'pipeline_funnel',
              type: 'chart',
              title: 'Sales Pipeline',
              position: { x: 6, y: 0 },
              size: { width: 6, height: 4 },
              dataSource: 'pipeline_data',
              configuration: {
                chartType: 'bar',
                aggregation: 'count',
                groupBy: ['stage'],
                filters: [],
                formatting: {
                  showLegend: false,
                  showGrid: true
                }
              }
            }
          ],
          permissions: [
            {
              userId: 'admin',
              role: 'admin',
              restrictions: []
            }
          ]
        }
      ],
      dataConnections: [
        {
          id: 'convex_sales',
          name: 'Convex Sales Data',
          type: 'convex',
          configuration: {
            endpoint: process.env.CONVEX_URL || '',
            authentication: {
              type: 'api_key',
              credentials: {
                apiKey: process.env.CONVEX_API_KEY || ''
              }
            }
          },
          schema: {
            tables: [
              {
                name: 'deals',
                columns: [
                  { name: 'id', type: 'string', nullable: false },
                  { name: 'title', type: 'string', nullable: false },
                  { name: 'value', type: 'number', nullable: false },
                  { name: 'stage', type: 'string', nullable: false },
                  { name: 'created_at', type: 'date', nullable: false }
                ],
                primaryKey: ['id']
              }
            ],
            relationships: []
          }
        }
      ],
      refreshIntervals: [
        {
          widgetId: 'revenue_chart',
          interval: 300, // 5 minutes
          enabled: true
        }
      ],
      caching: {
        enabled: true,
        ttl: 300, // 5 minutes
        strategy: 'ttl',
        maxSize: 100 // MB
      }
    },
    
    // Enterprise Integrations
    integrations: {
      enabled: FEATURE_FLAGS.ENABLE_ENTERPRISE_INTEGRATIONS,
      providers: [],
      apiGateway: {
        enabled: true,
        baseUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000/api',
        authentication: true,
        rateLimiting: true,
        caching: true,
        logging: true,
        monitoring: true
      },
      security: {
        gdpr: {
          enabled: GDPR_CONFIG.DATA_RETENTION_PERIOD > 0,
          dataRetentionPeriod: GDPR_CONFIG.DATA_RETENTION_PERIOD,
          rightToBeForgotten: true,
          consentManagement: true,
          dataPortability: true
        },
        owasp: {
          enabled: true,
          inputValidation: true,
          outputEncoding: true,
          authenticationControls: true,
          sessionManagement: true,
          accessControls: true
        },
        encryption: {
          atRest: true,
          inTransit: true,
          algorithm: SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
          keyRotation: true,
          keyRotationInterval: 90 // days
        },
        audit: {
          enabled: true,
          events: ['login', 'logout', 'data_access', 'data_modification'],
          retention: GDPR_CONFIG.AUDIT_LOG_RETENTION,
          realTimeAlerts: true
        }
      },
      monitoring: {
        enabled: true,
        metrics: [
          {
            name: 'integration_requests',
            type: 'counter',
            description: 'Number of integration requests',
            labels: ['provider', 'endpoint', 'status']
          },
          {
            name: 'integration_response_time',
            type: 'histogram',
            description: 'Integration response time',
            labels: ['provider', 'endpoint']
          }
        ],
        alerts: [
          {
            name: 'high_error_rate',
            condition: 'error_rate > 0.05',
            threshold: 0.05,
            severity: 'high',
            channels: ['email', 'slack']
          }
        ],
        dashboards: ['integration_overview']
      }
    },
    
    // Marketing Automation
    marketing: {
      enabled: FEATURE_FLAGS.ENABLE_MARKETING_AUTOMATION,
      campaigns: [],
      leadNurturing: {
        enabled: true,
        workflows: [],
        scoring: {
          enabled: true,
          factors: [
            {
              name: 'email_engagement',
              type: 'behavioral',
              weight: 0.3,
              calculation: 'engagement_score'
            },
            {
              name: 'website_activity',
              type: 'behavioral',
              weight: 0.25,
              calculation: 'activity_score'
            },
            {
              name: 'demographic_fit',
              type: 'demographic',
              weight: 0.25,
              calculation: 'demographic_score'
            },
            {
              name: 'company_size',
              type: 'demographic',
              weight: 0.2,
              calculation: 'company_score'
            }
          ],
          thresholds: [
            {
              name: 'cold',
              minScore: 0,
              maxScore: 25,
              actions: ['nurture_campaign']
            },
            {
              name: 'warm',
              minScore: 26,
              maxScore: 75,
              actions: ['sales_qualified_lead']
            },
            {
              name: 'hot',
              minScore: 76,
              maxScore: 100,
              actions: ['immediate_sales_contact']
            }
          ]
        }
      },
      attribution: {
        enabled: true,
        models: [
          {
            name: 'first_touch',
            type: 'first_touch',
            weight: 0.2
          },
          {
            name: 'last_touch',
            type: 'last_touch',
            weight: 0.3
          },
          {
            name: 'linear',
            type: 'linear',
            weight: 0.5
          }
        ],
        touchpoints: [
          {
            channel: 'email',
            weight: 1.0,
            lookbackWindow: 30
          },
          {
            channel: 'social',
            weight: 0.8,
            lookbackWindow: 7
          },
          {
            channel: 'organic_search',
            weight: 1.2,
            lookbackWindow: 14
          }
        ]
      },
      personalization: {
        enabled: true,
        rules: [],
        aiEnhanced: true
      }
    },
    
    // Team Collaboration
    collaboration: {
      enabled: FEATURE_FLAGS.ENABLE_TEAM_COLLABORATION,
      workspaces: [],
      permissions: {
        roles: [
          {
            id: 'admin',
            name: 'Administrator',
            description: 'Full system access',
            permissions: ['*']
          },
          {
            id: 'manager',
            name: 'Manager',
            description: 'Team management access',
            permissions: ['read', 'write', 'manage_team']
          },
          {
            id: 'user',
            name: 'User',
            description: 'Standard user access',
            permissions: ['read', 'write']
          },
          {
            id: 'viewer',
            name: 'Viewer',
            description: 'Read-only access',
            permissions: ['read']
          }
        ],
        permissions: [
          {
            id: 'read',
            name: 'Read',
            description: 'View data and content',
            resource: '*',
            action: 'read'
          },
          {
            id: 'write',
            name: 'Write',
            description: 'Create and edit content',
            resource: '*',
            action: 'write'
          },
          {
            id: 'delete',
            name: 'Delete',
            description: 'Delete content',
            resource: '*',
            action: 'delete'
          },
          {
            id: 'manage_team',
            name: 'Manage Team',
            description: 'Manage team members',
            resource: 'team',
            action: 'manage'
          }
        ],
        inheritance: true
      },
      communication: {
        chat: {
          enabled: true,
          features: ['real_time_messaging', 'file_sharing', 'emoji_reactions'],
          integrations: ['slack']
        },
        video: {
          enabled: true,
          provider: 'webrtc',
          features: ['screen_sharing', 'recording', 'breakout_rooms']
        },
        notifications: {
          enabled: true,
          channels: ['email', 'push', 'in_app'],
          rules: [
            {
              event: 'mention',
              channels: ['push', 'in_app'],
              conditions: []
            },
            {
              event: 'task_assigned',
              channels: ['email', 'push'],
              conditions: []
            }
          ]
        }
      },
      productivity: {
        timeTracking: {
          enabled: true,
          automatic: false,
          categories: [
            {
              id: 'development',
              name: 'Development',
              color: '#2196f3',
              billable: true
            },
            {
              id: 'meetings',
              name: 'Meetings',
              color: '#ff9800',
              billable: true
            },
            {
              id: 'admin',
              name: 'Administrative',
              color: '#9c27b0',
              billable: false
            }
          ]
        },
        projectManagement: {
          enabled: true,
          methodologies: ['agile', 'kanban', 'scrum'],
          features: ['task_management', 'milestone_tracking', 'resource_planning']
        },
        analytics: {
          enabled: true,
          metrics: ['productivity_score', 'collaboration_index', 'task_completion_rate'],
          reports: ['team_performance', 'project_status', 'time_allocation']
        }
      }
    }
  },
  
  // HVAC Optimization Configuration
  hvac: {
    // Warsaw Districts Configuration
    warsawDistricts: {
      enabled: FEATURE_FLAGS.ENABLE_WARSAW_OPTIMIZATION,
      districts: WARSAW_DISTRICTS.map(district => ({
        name: district,
        affluenceScore: 75, // Default score, will be calculated
        populationDensity: 5000, // Default density
        commercialDensity: 100, // Default commercial density
        averagePropertyValue: 500000, // Default property value in PLN
        hvacDemandIndex: 1.0, // Default demand index
        seasonalFactors: [
          { season: 'spring', demandMultiplier: 1.1, serviceTypes: ['split_ac', 'ventilation'] },
          { season: 'summer', demandMultiplier: 1.8, serviceTypes: ['split_ac', 'central_ac'] },
          { season: 'autumn', demandMultiplier: 0.9, serviceTypes: ['heat_pump', 'ventilation'] },
          { season: 'winter', demandMultiplier: 1.2, serviceTypes: ['heat_pump', 'humidifier'] }
        ],
        competitorDensity: 0.5, // Default competitor density
        marketPenetration: 0.1 // Default market penetration
      })),
      affluenceAnalysis: true,
      routeOptimization: true,
      marketIntelligence: true
    },
    
    // Route Optimization Configuration
    routeOptimization: {
      enabled: FEATURE_FLAGS.ENABLE_ROUTE_OPTIMIZATION,
      algorithm: 'ai_enhanced',
      factors: [
        { name: 'distance', weight: 0.3, type: 'distance' },
        { name: 'traffic', weight: 0.25, type: 'traffic' },
        { name: 'priority', weight: 0.2, type: 'priority' },
        { name: 'time_window', weight: 0.15, type: 'time' },
        { name: 'cost', weight: 0.1, type: 'cost' }
      ],
      realTimeTraffic: true,
      weatherConsideration: true
    },
    
    // Affluence Analysis Configuration
    affluenceAnalysis: {
      enabled: FEATURE_FLAGS.ENABLE_AFFLUENCE_ANALYSIS,
      dataSources: [
        { name: 'property_values', type: 'property_values', weight: 0.4 },
        { name: 'income_data', type: 'income_data', weight: 0.3 },
        { name: 'business_density', type: 'business_density', weight: 0.2 },
        { name: 'demographic', type: 'demographic', weight: 0.1 }
      ],
      updateFrequency: 24, // hours
      aiEnhanced: true
    },
    
    // Seasonal Forecasting Configuration
    seasonalForecasting: {
      enabled: FEATURE_FLAGS.ENABLE_SEASONAL_FORECASTING,
      forecastHorizon: 12, // months
      equipmentTypes: [...HVAC_EQUIPMENT_TYPES],
      weatherIntegration: true,
      historicalDataYears: 3
    },
    
    // Prophecy Engine Configuration
    prophecyEngine: {
      enabled: FEATURE_FLAGS.ENABLE_PROPHECY_ENGINE,
      models: [
        {
          name: 'customer_lifetime_value',
          type: 'customer_lifetime_value',
          algorithm: 'gradient_boosting',
          features: ['purchase_history', 'engagement_score', 'demographic_data'],
          accuracy: 0.85
        },
        {
          name: 'service_demand_forecast',
          type: 'service_demand',
          algorithm: 'neural_network',
          features: ['seasonal_patterns', 'weather_data', 'historical_demand'],
          accuracy: 0.90
        },
        {
          name: 'equipment_failure_prediction',
          type: 'equipment_failure',
          algorithm: 'random_forest',
          features: ['equipment_age', 'maintenance_history', 'usage_patterns'],
          accuracy: 0.82
        },
        {
          name: 'market_demand_analysis',
          type: 'market_demand',
          algorithm: 'transformer',
          features: ['economic_indicators', 'competitor_analysis', 'market_trends'],
          accuracy: 0.88
        }
      ],
      updateFrequency: 6, // hours
      confidenceThreshold: 0.8
    }
  },
  
  // Performance and Quality Configuration
  performance: {
    responseTimeTarget: PERFORMANCE_TARGETS.API_RESPONSE_TIME,
    throughputTarget: PERFORMANCE_TARGETS.THROUGHPUT,
    uptimeTarget: PERFORMANCE_TARGETS.CONCURRENT_USERS,
    cacheEnabled: FEATURE_FLAGS.ENABLE_CACHING,
    rateLimiting: true
  },
  
  // Security and Compliance
  security: {
    gdprCompliance: QUALITY_STANDARDS.GDPR_COMPLIANCE,
    owaspCompliance: QUALITY_STANDARDS.OWASP_COMPLIANCE,
    encryptionEnabled: true,
    auditLogging: FEATURE_FLAGS.ENABLE_AUDIT_LOGGING
  }
};

/**
 * Environment-specific configuration overrides
 */
export const getEnvironmentConfig = (environment: string): Partial<GoTunConfig> => {
  switch (environment) {
    case 'production':
      return {
        debug: false,
        logLevel: 'warn',
        performance: {
          responseTimeTarget: 100,
          throughputTarget: 20000,
          uptimeTarget: 99.99,
          cacheEnabled: true,
          rateLimiting: true
        }
      };
    
    case 'staging':
      return {
        debug: false,
        logLevel: 'info',
        performance: {
          responseTimeTarget: 150,
          throughputTarget: 10000,
          uptimeTarget: 99.9,
          cacheEnabled: true,
          rateLimiting: true
        }
      };
    
    case 'development':
    default:
      return {
        debug: true,
        logLevel: 'debug',
        performance: {
          responseTimeTarget: 300,
          throughputTarget: 1000,
          uptimeTarget: 99.0,
          cacheEnabled: false,
          rateLimiting: false
        }
      };
  }
};

/**
 * Merge configuration with environment overrides
 */
export const createGoTunConfig = (
  customConfig?: Partial<GoTunConfig>,
  environment?: string
): GoTunConfig => {
  const envConfig = getEnvironmentConfig(environment || process.env.NODE_ENV || 'development');
  
  return {
    ...DEFAULT_GOTUN_CONFIG,
    ...envConfig,
    ...customConfig
  };
};
