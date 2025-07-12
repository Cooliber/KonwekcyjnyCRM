/**
 * @fileoverview GoTun Package UI Components
 * @description Enterprise-grade interface components for ACI-MCP integration
 * @version 1.0.0
 */

// Core UI Components
export { GoTunProvider } from './core/GoTunProvider';
export { GoTunLayout } from './core/GoTunLayout';
export { GoTunNavigation } from './core/GoTunNavigation';
export { GoTunStatusBar } from './core/GoTunStatusBar';

// Enterprise Module Components
export { AdvancedPipelineBoard } from './enterprise/sales/AdvancedPipelineBoard';
export { DealScoringPanel } from './enterprise/sales/DealScoringPanel';
export { RevenueForecasting } from './enterprise/sales/RevenueForecasting';
export { PipelineAnalytics } from './enterprise/sales/PipelineAnalytics';

export { BIDashboardGrid } from './enterprise/analytics/BIDashboardGrid';
export { CustomDashboardBuilder } from './enterprise/analytics/CustomDashboardBuilder';
export { RealTimeMetricsPanel } from './enterprise/analytics/RealTimeMetricsPanel';
export { KPIWidgetLibrary } from './enterprise/analytics/KPIWidgetLibrary';

export { IntegrationConsole } from './enterprise/integrations/IntegrationConsole';
export { APIGatewayManager } from './enterprise/integrations/APIGatewayManager';
export { WorkflowAutomationBuilder } from './enterprise/integrations/WorkflowAutomationBuilder';
export { SecurityCompliancePanel } from './enterprise/integrations/SecurityCompliancePanel';

export { CampaignBuilder } from './enterprise/marketing/CampaignBuilder';
export { LeadNurturingWorkflow } from './enterprise/marketing/LeadNurturingWorkflow';
export { AttributionAnalytics } from './enterprise/marketing/AttributionAnalytics';
export { PersonalizationEngine } from './enterprise/marketing/PersonalizationEngine';

export { TeamWorkspaceHub } from './enterprise/collaboration/TeamWorkspaceHub';
export { CommunicationCenter } from './enterprise/collaboration/CommunicationCenter';
export { ProductivityTracker } from './enterprise/collaboration/ProductivityTracker';
export { PermissionManager } from './enterprise/collaboration/PermissionManager';

// HVAC Optimization Components
export { WarsawDistrictMap } from './hvac/analytics/WarsawDistrictMap';
export { DistrictAnalyticsPanel } from './hvac/analytics/DistrictAnalyticsPanel';
export { AffluenceHeatmap } from './hvac/analytics/AffluenceHeatmap';
export { SeasonalForecastChart } from './hvac/forecasting/SeasonalForecastChart';

export { RouteOptimizationMap } from './hvac/optimization/RouteOptimizationMap';
export { TechnicianScheduler } from './hvac/optimization/TechnicianScheduler';
export { ServiceAreaPlanner } from './hvac/optimization/ServiceAreaPlanner';

export { ProphecyInsightsPanel } from './hvac/prophecy/ProphecyInsightsPanel';
export { PredictiveAlertsCenter } from './hvac/prophecy/PredictiveAlertsCenter';
export { CustomerLifetimeValueChart } from './hvac/prophecy/CustomerLifetimeValueChart';
export { EquipmentHealthMonitor } from './hvac/prophecy/EquipmentHealthMonitor';

// ACI-MCP Integration Components
export { ACIFunctionExplorer } from './integrations/aci-mcp/ACIFunctionExplorer';
export { UnifiedServerConsole } from './integrations/aci-mcp/UnifiedServerConsole';
export { AppsServerManager } from './integrations/aci-mcp/AppsServerManager';
export { VibeOpsMonitor } from './integrations/aci-mcp/VibeOpsMonitor';
export { ACIExecutionLogger } from './integrations/aci-mcp/ACIExecutionLogger';

// Shared UI Components
export { Card } from './ui/Card';
export { Button } from './ui/Button';
export { Input } from './ui/Input';
export { Select } from './ui/Select';
export { Modal } from './ui/Modal';
export { Tooltip } from './ui/Tooltip';
export { Badge } from './ui/Badge';
export { Progress } from './ui/Progress';
export { Spinner } from './ui/Spinner';
export { Alert } from './ui/Alert';
export { Tabs } from './ui/Tabs';
export { Table } from './ui/Table';
export { Chart } from './ui/Chart';
export { Map } from './ui/Map';
export { Calendar } from './ui/Calendar';
export { DatePicker } from './ui/DatePicker';
export { TimePicker } from './ui/TimePicker';
export { ColorPicker } from './ui/ColorPicker';
export { FileUpload } from './ui/FileUpload';
export { SearchBox } from './ui/SearchBox';
export { Pagination } from './ui/Pagination';
export { Breadcrumb } from './ui/Breadcrumb';
export { Sidebar } from './ui/Sidebar';
export { Header } from './ui/Header';
export { Footer } from './ui/Footer';
export { Layout } from './ui/Layout';

// Animation and Transition Components
export { FadeIn } from './animations/FadeIn';
export { SlideIn } from './animations/SlideIn';
export { ScaleIn } from './animations/ScaleIn';
export { Bounce } from './animations/Bounce';
export { Pulse } from './animations/Pulse';
export { Shimmer } from './animations/Shimmer';

// Form Components
export { Form } from './forms/Form';
export { FormField } from './forms/FormField';
export { FormSection } from './forms/FormSection';
export { FormValidation } from './forms/FormValidation';
export { DynamicForm } from './forms/DynamicForm';
export { FormBuilder } from './forms/FormBuilder';

// Data Visualization Components
export { LineChart } from './charts/LineChart';
export { BarChart } from './charts/BarChart';
export { PieChart } from './charts/PieChart';
export { AreaChart } from './charts/AreaChart';
export { ScatterChart } from './charts/ScatterChart';
export { HeatmapChart } from './charts/HeatmapChart';
export { GaugeChart } from './charts/GaugeChart';
export { TreemapChart } from './charts/TreemapChart';
export { SankeyChart } from './charts/SankeyChart';
export { RadarChart } from './charts/RadarChart';

// Layout Components
export { Grid } from './layout/Grid';
export { Flex } from './layout/Flex';
export { Stack } from './layout/Stack';
export { Container } from './layout/Container';
export { Section } from './layout/Section';
export { Divider } from './layout/Divider';
export { Spacer } from './layout/Spacer';

// Navigation Components
export { Menu } from './navigation/Menu';
export { MenuItem } from './navigation/MenuItem';
export { Dropdown } from './navigation/Dropdown';
export { Navbar } from './navigation/Navbar';
export { Stepper } from './navigation/Stepper';
export { Wizard } from './navigation/Wizard';

// Feedback Components
export { Toast } from './feedback/Toast';
export { Notification } from './feedback/Notification';
export { ConfirmDialog } from './feedback/ConfirmDialog';
export { LoadingOverlay } from './feedback/LoadingOverlay';
export { EmptyState } from './feedback/EmptyState';
export { ErrorBoundary } from './feedback/ErrorBoundary';

// Utility Components
export { Portal } from './utils/Portal';
export { LazyLoad } from './utils/LazyLoad';
export { InfiniteScroll } from './utils/InfiniteScroll';
export { VirtualList } from './utils/VirtualList';
export { ResizeObserver } from './utils/ResizeObserver';
export { ClickOutside } from './utils/ClickOutside';

// Type Exports
export type {
  GoTunComponentProps,
  GoTunTheme,
  GoTunColorScheme,
  GoTunSize,
  GoTunVariant,
  GoTunAnimation,
  GoTunBreakpoint,
  GoTunSpacing,
  GoTunShadow,
  GoTunBorderRadius,
  GoTunFontSize,
  GoTunFontWeight,
  GoTunLineHeight,
  GoTunZIndex
} from './types';

// Constants
export {
  GOTUN_COLORS,
  GOTUN_BREAKPOINTS,
  GOTUN_SPACING,
  GOTUN_SHADOWS,
  GOTUN_BORDER_RADIUS,
  GOTUN_FONT_SIZES,
  GOTUN_FONT_WEIGHTS,
  GOTUN_LINE_HEIGHTS,
  GOTUN_Z_INDEX,
  GOTUN_ANIMATIONS,
  GOTUN_TRANSITIONS
} from './constants';

// Hooks
export {
  useGoTun,
  useGoTunTheme,
  useGoTunBreakpoint,
  useGoTunAnimation,
  useGoTunLocalStorage,
  useGoTunSessionStorage,
  useGoTunDebounce,
  useGoTunThrottle,
  useGoTunIntersection,
  useGoTunMediaQuery,
  useGoTunKeyboard,
  useGoTunMouse,
  useGoTunTouch,
  useGoTunGeolocation,
  useGoTunNotification,
  useGoTunClipboard,
  useGoTunFullscreen,
  useGoTunOnline,
  useGoTunBattery,
  useGoTunNetwork,
  useGoTunPerformance
} from './hooks';

// Utilities
export {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  formatBytes,
  formatDuration,
  generateId,
  debounce,
  throttle,
  deepMerge,
  deepClone,
  isEqual,
  isEmpty,
  isNil,
  pick,
  omit,
  groupBy,
  sortBy,
  uniqBy,
  chunk,
  flatten,
  range,
  random,
  clamp,
  lerp,
  easeInOut,
  easeIn,
  easeOut,
  bezier
} from './utils';

// Version
export const GOTUN_UI_VERSION = '1.0.0';

// Package Description
export const GOTUN_UI_DESCRIPTION = 'Enterprise-grade UI components for HVAC CRM with ACI-MCP integration';

// Default Export
export { default } from './GoTun';
