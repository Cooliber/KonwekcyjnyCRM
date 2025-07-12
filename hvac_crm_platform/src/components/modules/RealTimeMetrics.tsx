/**
 * Real-Time HVAC Metrics Component
 * Displays live equipment status, performance indicators, and alerts
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Thermometer, 
  Gauge, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { HVACMetrics, HVACStatus } from '../../types/hvac';

interface RealTimeMetricsProps {
  metrics: HVACMetrics[] | undefined;
  isLoading: boolean;
  showAdvanced?: boolean;
}

// Status color mapping
const STATUS_COLORS: Record<HVACStatus, string> = {
  optimal: '#10b981',
  warning: '#f59e0b', 
  critical: '#ef4444',
  offline: '#6b7280',
  maintenance: '#8b5cf6'
};

// Status icons mapping
const STATUS_ICONS: Record<HVACStatus, React.ComponentType<{ className?: string }>> = {
  optimal: CheckCircle,
  warning: AlertTriangle,
  critical: AlertTriangle,
  offline: Clock,
  maintenance: Settings
};

export function RealTimeMetrics({ metrics, isLoading, showAdvanced = false }: RealTimeMetricsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'chart'>('grid');

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Real-Time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading HVAC metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Real-Time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No HVAC metrics available</p>
            <p className="text-sm text-gray-500 mt-1">Check your equipment connections</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregated metrics
  const aggregatedMetrics = React.useMemo(() => {
    const total = metrics.length;
    const avgEfficiency = metrics.reduce((sum, m) => sum + m.energyEfficiency, 0) / total;
    const avgTemperature = metrics.reduce((sum, m) => sum + m.temperature, 0) / total;
    const avgPressure = metrics.reduce((sum, m) => sum + m.pressure, 0) / total;
    const totalPowerConsumption = metrics.reduce((sum, m) => sum + m.powerConsumption, 0);
    const statusCounts = metrics.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<HVACStatus, number>);

    return {
      total,
      avgEfficiency: Math.round(avgEfficiency),
      avgTemperature: Math.round(avgTemperature * 10) / 10,
      avgPressure: Math.round(avgPressure * 100) / 100,
      totalPowerConsumption: Math.round(totalPowerConsumption * 100) / 100,
      statusCounts
    };
  }, [metrics]);

  // Prepare chart data
  const efficiencyTrendData = metrics.slice(-10).map((metric, index) => ({
    time: `${index + 1}`,
    efficiency: metric.energyEfficiency,
    temperature: metric.temperature,
    pressure: metric.pressure * 10 // Scale for visibility
  }));

  const statusDistributionData = Object.entries(aggregatedMetrics.statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status as HVACStatus]
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Real-Time Metrics
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({aggregatedMetrics.total} systems)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'chart' : 'grid')}
            >
              {viewMode === 'grid' ? <BarChart /> : <Eye />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'grid' ? (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Avg Efficiency</p>
                    <p className="text-2xl font-bold text-blue-900">{aggregatedMetrics.avgEfficiency}%</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Avg Temperature</p>
                    <p className="text-2xl font-bold text-green-900">{aggregatedMetrics.avgTemperature}°C</p>
                  </div>
                  <Thermometer className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Avg Pressure</p>
                    <p className="text-2xl font-bold text-orange-900">{aggregatedMetrics.avgPressure} bar</p>
                  </div>
                  <Gauge className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Total Power</p>
                    <p className="text-2xl font-bold text-purple-900">{aggregatedMetrics.totalPowerConsumption} kW</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">System Status Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recent Equipment Status</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {metrics.slice(0, 8).map((metric) => {
                    const StatusIcon = STATUS_ICONS[metric.status];
                    return (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
                      >
                        <div className="flex items-center">
                          <StatusIcon 
                            className="w-4 h-4 mr-2" 
                            style={{ color: STATUS_COLORS[metric.status] }}
                          />
                          <span className="text-sm font-medium">{metric.district}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{metric.energyEfficiency}%</p>
                          <p className="text-xs text-gray-500">{metric.temperature}°C</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Advanced Metrics */}
            {showAdvanced && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Advanced Performance Metrics</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Maintenance Score</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(metrics.reduce((sum, m) => sum + m.maintenanceScore, 0) / metrics.length)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Operating Hours</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(metrics.reduce((sum, m) => sum + m.operatingHours, 0) / metrics.length)}h
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Avg Operating Cost</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(metrics.reduce((sum, m) => sum + m.operatingCost, 0) / metrics.length)} PLN
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Chart View */
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Performance Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={efficiencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Efficiency (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Temperature (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
