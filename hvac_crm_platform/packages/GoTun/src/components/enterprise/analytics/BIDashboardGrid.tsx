/**
 * @fileoverview Business Intelligence Dashboard Grid Component
 * @description Interactive dashboard with real-time metrics and ACI-MCP powered analytics
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Zap,
  Brain,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Settings,
  Download,
  Filter,
  RefreshCw,
  Maximize2,
  Minimize2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../../../utils';
import { GOTUN_COLORS, GOTUN_ANIMATIONS, GOTUN_SHADOWS } from '../../constants';
import type { DashboardWidget, DashboardData, ChartConfig } from '../../../types';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface BIDashboardGridProps {
  widgets: DashboardWidget[];
  data: DashboardData;
  onWidgetUpdate: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  onWidgetDelete: (widgetId: string) => void;
  onWidgetAdd: (widget: Omit<DashboardWidget, 'id'>) => void;
  onLayoutChange: (layout: any[]) => void;
  className?: string;
  enableRealTime?: boolean;
  enableAIInsights?: boolean;
  enableWarsawAnalytics?: boolean;
}

interface WidgetHeaderProps {
  widget: DashboardWidget;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
  trend?: number[];
}

const WidgetHeader: React.FC<WidgetHeaderProps> = ({
  widget,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMaximize,
  isMaximized
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2">
        <h3 className="font-semibold text-gray-900">{widget.title}</h3>
        {widget.aiPowered && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-full">
            <Brain className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">AI</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={onToggleVisibility}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={widget.visible ? "Hide widget" : "Show widget"}
        >
          {widget.visible ? (
            <Eye className="w-4 h-4 text-gray-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <button
          onClick={onMaximize}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={isMaximized ? "Minimize" : "Maximize"}
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4 text-gray-500" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <button
          onClick={onEdit}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Edit widget"
        >
          <Edit3 className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          title="Delete widget"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  subtitle,
  trend
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            changeType === 'increase' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {changeType === 'increase' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {trend && trend.length > 0 && (
          <div className="w-20 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.map((val, idx) => ({ value: val, index: idx }))}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartWidget: React.FC<{
  widget: DashboardWidget;
  data: any[];
  config: ChartConfig;
}> = ({ widget, data, config }) => {
  const renderChart = () => {
    switch (widget.chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis} 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend />
            {config.series.map((series, index) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color || GOTUN_COLORS.primary[500]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis} 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend />
            {config.series.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                fill={series.color || GOTUN_COLORS.primary[500]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis} 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend />
            {config.series.map((series, index) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color || GOTUN_COLORS.primary[500]}
                fill={`${series.color || GOTUN_COLORS.primary[500]}40`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey={config.series[0]?.key || 'value'}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={config.series[index]?.color || GOTUN_COLORS.primary[500]} 
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis} 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              dataKey={config.series[0]?.key}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Scatter
              dataKey={config.series[0]?.key}
              fill={config.series[0]?.color || GOTUN_COLORS.primary[500]}
            />
          </ScatterChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Unsupported chart type: {widget.chartType}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export const BIDashboardGrid: React.FC<BIDashboardGridProps> = ({
  widgets,
  data,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetAdd,
  onLayoutChange,
  className,
  enableRealTime = true,
  enableAIInsights = true,
  enableWarsawAnalytics = true
}) => {
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Generate layout from widgets
  const layout = useMemo(() => {
    return widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.size.width,
      h: widget.size.height,
      minW: 2,
      minH: 2
    }));
  }, [widgets]);

  const handleLayoutChange = useCallback((newLayout: any[]) => {
    onLayoutChange(newLayout);
  }, [onLayoutChange]);

  const handleWidgetEdit = useCallback((widgetId: string) => {
    // Open widget edit modal
    console.log('Edit widget:', widgetId);
  }, []);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    onWidgetDelete(widgetId);
  }, [onWidgetDelete]);

  const handleWidgetToggleVisibility = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      onWidgetUpdate(widgetId, { visible: !widget.visible });
    }
  }, [widgets, onWidgetUpdate]);

  const handleWidgetMaximize = useCallback((widgetId: string) => {
    setMaximizedWidget(maximizedWidget === widgetId ? null : widgetId);
  }, [maximizedWidget]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible) return null;

    const widgetData = data[widget.dataSource] || [];
    const isMaximized = maximizedWidget === widget.id;

    return (
      <motion.div
        key={widget.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden",
          "hover:shadow-md transition-shadow duration-200",
          isMaximized && "fixed inset-4 z-50 shadow-2xl"
        )}
      >
        <WidgetHeader
          widget={widget}
          onEdit={() => handleWidgetEdit(widget.id)}
          onDelete={() => handleWidgetDelete(widget.id)}
          onToggleVisibility={() => handleWidgetToggleVisibility(widget.id)}
          onMaximize={() => handleWidgetMaximize(widget.id)}
          isMaximized={isMaximized}
        />
        
        <div className="flex-1">
          {widget.type === 'metric' ? (
            <MetricCard
              title={widget.title}
              value={widget.value || '0'}
              change={widget.change}
              changeType={widget.changeType}
              icon={widget.icon || BarChart3}
              color={widget.color || GOTUN_COLORS.primary[500]}
              subtitle={widget.subtitle}
              trend={widget.trend}
            />
          ) : (
            <ChartWidget
              widget={widget}
              data={widgetData}
              config={widget.chartConfig || { xAxis: 'name', series: [] }}
            />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
            <p className="text-gray-600 mt-1">
              Real-time analytics and AI-powered insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg",
                "hover:bg-primary-700 transition-colors duration-200",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onWidgetAdd({
                title: 'New Widget',
                type: 'metric',
                position: { x: 0, y: 0 },
                size: { width: 4, height: 3 },
                dataSource: 'default',
                visible: true
              })}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Widget</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          isDraggable={!maximizedWidget}
          isResizable={!maximizedWidget}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {widgets.map(renderWidget)}
        </ResponsiveGridLayout>
      </div>

      {/* Maximized Widget Overlay */}
      <AnimatePresence>
        {maximizedWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMaximizedWidget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
