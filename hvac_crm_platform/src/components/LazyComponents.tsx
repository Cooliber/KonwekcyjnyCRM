/**
 * Optimized Lazy-Loaded Components
 * Performance-optimized lazy loading for 137/137 godlike quality
 * Implements code splitting and preloading strategies
 */

import React, { Suspense } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { PerformanceOptimizer } from '../lib/performanceOptimization';

// Loading component with performance indicators
const LoadingSpinner = ({ componentName }: { componentName: string }) => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Loading {componentName}...</p>
        <p className="text-xs text-gray-500 mt-1">Optimizing for performance</p>
      </div>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ componentName }: { componentName: string }) => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="w-8 h-8 text-red-500" />
      <div>
        <p className="text-sm font-medium text-gray-900">Failed to load {componentName}</p>
        <p className="text-xs text-gray-500 mt-1">Please refresh the page to try again</p>
      </div>
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundaries
function withLazyLoading<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  preloadCondition?: () => boolean
) {
  const LazyComponent = PerformanceOptimizer.createLazyComponent(
    importFn,
    componentName,
    preloadCondition
  );

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <ErrorBoundary
      level="component"
      fallback={<ErrorFallback componentName={componentName} />}
    >
      <Suspense fallback={<LoadingSpinner componentName={componentName} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
}

// Dashboard Components - High Priority (preload on route hover)
export const LazyHVACDashboard = withLazyLoading(
  () => import('./modules/HVACDashboard'),
  'HVAC Dashboard',
  () => window.location.pathname === '/' || window.location.pathname.includes('dashboard')
);

export const LazyDashboardOverview = withLazyLoading(
  () => import('./modules/DashboardOverview'),
  'Dashboard Overview',
  () => window.location.pathname === '/'
);

export const LazyPerformanceDashboard = withLazyLoading(
  () => import('./modules/PerformanceDashboard'),
  'Performance Dashboard'
);

// Analytics Components - Medium Priority
export const LazyBusinessIntelligenceDashboard = withLazyLoading(
  () => import('./modules/BusinessIntelligenceDashboard'),
  'Business Intelligence Dashboard'
);

export const LazyAdvancedAnalyticsDashboard = withLazyLoading(
  () => import('./modules/AdvancedAnalyticsDashboard'),
  'Advanced Analytics Dashboard'
);

export const LazyEnergyAnalyticsChart = withLazyLoading(
  () => import('./modules/EnergyAnalyticsChart'),
  'Energy Analytics Chart'
);

// Core Modules - Medium Priority
export const LazyJobsModule = withLazyLoading(
  () => import('./modules/JobsModule'),
  'Jobs Module'
);

export const LazyContactsModule = withLazyLoading(
  () => import('./modules/ContactsModule'),
  'Contacts Module'
);

export const LazyEquipmentModule = withLazyLoading(
  () => import('./modules/EquipmentModule'),
  'Equipment Module'
);

export const LazyInventoryModule = withLazyLoading(
  () => import('./modules/InventoryModule'),
  'Inventory Module'
);

export const LazyQuotesModule = withLazyLoading(
  () => import('./modules/QuotesModule'),
  'Quotes Module'
);

export const LazyInvoicesModule = withLazyLoading(
  () => import('./modules/InvoicesModule'),
  'Invoices Module'
);

export const LazyScheduleModule = withLazyLoading(
  () => import('./modules/ScheduleModule'),
  'Schedule Module'
);

// Advanced Features - Low Priority (load on demand)
export const LazySalesPipelineModule = withLazyLoading(
  () => import('./modules/SalesPipelineModule'),
  'Sales Pipeline Module'
);

export const LazyCustomReportBuilder = withLazyLoading(
  () => import('./modules/CustomReportBuilder'),
  'Custom Report Builder'
);

export const LazyWorkflowBuilder = withLazyLoading(
  () => import('./modules/WorkflowBuilder'),
  'Workflow Builder'
);

export const LazyContractManagementModule = withLazyLoading(
  () => import('./modules/ContractManagementModule'),
  'Contract Management Module'
);

export const LazyServiceAgreementModule = withLazyLoading(
  () => import('./modules/ServiceAgreementModule'),
  'Service Agreement Module'
);

export const LazyEquipmentLifecycleModule = withLazyLoading(
  () => import('./modules/EquipmentLifecycleModule'),
  'Equipment Lifecycle Module'
);

export const LazyCustomerPortalModule = withLazyLoading(
  () => import('./modules/CustomerPortalModule'),
  'Customer Portal Module'
);

// Map and Location Components
export const LazyMapModule = withLazyLoading(
  () => import('./modules/MapModule'),
  'Map Module'
);

export const LazyWarsawHeatmap = withLazyLoading(
  () => import('./modules/WarsawHeatmap'),
  'Warsaw Heatmap'
);

export const LazyMobileMapInterface = withLazyLoading(
  () => import('./modules/MobileMapInterface'),
  'Mobile Map Interface'
);

// Chat and Communication
export const LazyChatModule = withLazyLoading(
  () => import('./modules/ChatModule'),
  'Chat Module'
);

export const LazyNotificationCenter = withLazyLoading(
  () => import('./modules/NotificationCenter'),
  'Notification Center'
);

// Real-time Components
export const LazyRealTimeMetrics = withLazyLoading(
  () => import('./modules/RealTimeMetrics'),
  'Real-time Metrics'
);

export const LazyRealTimeSubscriptionManager = withLazyLoading(
  () => import('./modules/RealTimeSubscriptionManager'),
  'Real-time Subscription Manager'
);

// Prophecy and AI Components
export const LazyProphecyDashboard = withLazyLoading(
  () => import('./modules/ProphecyDashboard'),
  'Prophecy Dashboard'
);

export const LazyProphecyHotspotsPanel = withLazyLoading(
  () => import('./modules/ProphecyHotspotsPanel'),
  'Prophecy Hotspots Panel'
);

// Enhanced Installation and Service Modules
export const LazyEnhancedInstallationModule = withLazyLoading(
  () => import('./modules/EnhancedInstallationModule'),
  'Enhanced Installation Module'
);

export const LazyEnhancedServiceModule = withLazyLoading(
  () => import('./modules/EnhancedServiceModule'),
  'Enhanced Service Module'
);

// Client Portal Components
export const LazyClientPortal = withLazyLoading(
  () => import('./modules/ClientPortal'),
  'Client Portal'
);

// File Management
export const LazyFileUploadManager = withLazyLoading(
  () => import('./modules/FileUploadManager'),
  'File Upload Manager'
);

// Utility function to preload critical components
export function preloadCriticalComponents() {
  // Preload dashboard components immediately
  import('./modules/HVACDashboard').catch(() => {});
  import('./modules/DashboardOverview').catch(() => {});
  
  // Preload core modules after a short delay
  setTimeout(() => {
    import('./modules/JobsModule').catch(() => {});
    import('./modules/ContactsModule').catch(() => {});
    import('./modules/EquipmentModule').catch(() => {});
  }, 1000);
  
  // Preload analytics components after user interaction
  setTimeout(() => {
    import('./modules/BusinessIntelligenceDashboard').catch(() => {});
    import('./modules/AdvancedAnalyticsDashboard').catch(() => {});
  }, 3000);
}

// Utility function to preload components based on route
export function preloadComponentsForRoute(route: string) {
  switch (route) {
    case '/dashboard':
      import('./modules/HVACDashboard').catch(() => {});
      import('./modules/DashboardOverview').catch(() => {});
      import('./modules/PerformanceDashboard').catch(() => {});
      break;
    case '/analytics':
      import('./modules/BusinessIntelligenceDashboard').catch(() => {});
      import('./modules/AdvancedAnalyticsDashboard').catch(() => {});
      import('./modules/EnergyAnalyticsChart').catch(() => {});
      break;
    case '/jobs':
      import('./modules/JobsModule').catch(() => {});
      import('./modules/ScheduleModule').catch(() => {});
      break;
    case '/contacts':
      import('./modules/ContactsModule').catch(() => {});
      break;
    case '/equipment':
      import('./modules/EquipmentModule').catch(() => {});
      import('./modules/InventoryModule').catch(() => {});
      break;
    case '/sales':
      import('./modules/SalesPipelineModule').catch(() => {});
      import('./modules/QuotesModule').catch(() => {});
      break;
    case '/map':
      import('./modules/MapModule').catch(() => {});
      import('./modules/WarsawHeatmap').catch(() => {});
      break;
    default:
      // Preload dashboard by default
      import('./modules/HVACDashboard').catch(() => {});
      break;
  }
}

// Performance monitoring for lazy components
export function monitorLazyComponentPerformance() {
  if (typeof window === 'undefined') return;

  // Monitor bundle loading performance
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name.includes('chunk') && entry.duration > 1000) {
        console.warn(`🐌 Slow chunk load: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });

  return () => observer.disconnect();
}
