/**
 * Real-Time HVAC Dashboard Component
 * Enhanced dashboard for Warsaw-based HVAC CRM platform
 * Features: Real-time metrics, district visualization, energy analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Gauge, 
  MapPin, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { useConvexRealTime } from '../../hooks/useConvexRealTime';
import { RealTimeMetrics } from './RealTimeMetrics';
import { WarsawHeatmap } from './WarsawHeatmap';
import { EnergyAnalyticsChart } from './EnergyAnalyticsChart';
import type { WarsawDistrict, HVACDashboardProps } from '../../types/hvac';
import { toast } from 'sonner';

// Warsaw districts for filter dropdown
const WARSAW_DISTRICTS: WarsawDistrict[] = [
  'Śródmieście', 'Wilanów', 'Mokotów', 'Żoliborz', 'Ursynów', 
  'Wola', 'Praga-Południe', 'Targówek', 'Ochota', 'Praga-Północ'
];

export function HVACDashboard({
  district,
  timeRange = '24h',
  refreshInterval = 30000,
  showPredictions = true,
  enableRealTime = true
}: HVACDashboardProps) {
  // State management
  const [selectedDistrict, setSelectedDistrict] = useState<WarsawDistrict | undefined>(district);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time data hook
  const {
    hvacMetrics,
    districtData,
    energyAnalytics,
    isLoading,
    isRefreshing,
    error,
    refresh,
    clearError,
    isConnected,
    lastUpdated
  } = useConvexRealTime({
    district: selectedDistrict,
    refreshInterval,
    enableAutoRefresh: enableRealTime,
    onError: (error) => {
      toast.error(`HVAC Dashboard Error: ${error.message}`);
    },
    onDataUpdate: (data) => {
      // Handle real-time data updates
      if (data.alerts.length > 0) {
        const criticalAlerts = data.alerts.filter(alert => alert.severity === 'critical');
        if (criticalAlerts.length > 0) {
          toast.error(`Critical HVAC Alert: ${criticalAlerts[0].message}`);
        }
      }
    }
  });

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!hvacMetrics || hvacMetrics.length === 0) {
      return {
        totalSystems: 0,
        averageEfficiency: 0,
        criticalAlerts: 0,
        energyCost: 0,
        optimalSystems: 0
      };
    }

    const totalSystems = hvacMetrics.length;
    const averageEfficiency = hvacMetrics.reduce((sum, metric) => sum + metric.energyEfficiency, 0) / totalSystems;
    const criticalAlerts = hvacMetrics.filter(metric => metric.status === 'critical').length;
    const energyCost = hvacMetrics.reduce((sum, metric) => sum + metric.energyCost, 0);
    const optimalSystems = hvacMetrics.filter(metric => metric.status === 'optimal').length;

    return {
      totalSystems,
      averageEfficiency: Math.round(averageEfficiency),
      criticalAlerts,
      energyCost: Math.round(energyCost * 100) / 100,
      optimalSystems
    };
  }, [hvacMetrics]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('HVAC Dashboard refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh dashboard');
    }
  };

  // Handle district filter change
  const handleDistrictChange = (newDistrict: WarsawDistrict | 'all') => {
    setSelectedDistrict(newDistrict === 'all' ? undefined : newDistrict);
  };

  // Error display
  if (error && !isLoading) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              HVAC Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error.message}</p>
            <div className="flex gap-2">
              <Button onClick={clearError} variant="outline">
                Clear Error
              </Button>
              <Button onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto' : ''}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time HVAC Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Warsaw District Monitoring • {isConnected ? 'Connected' : 'Disconnected'}
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* District Filter */}
          <select
            value={selectedDistrict || 'all'}
            onChange={(e) => handleDistrictChange(e.target.value as WarsawDistrict | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Districts</option>
            {WARSAW_DISTRICTS.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>

          {/* Time Range Filter */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Advanced Metrics Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
          >
            {showAdvancedMetrics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Systems</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalSystems}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold text-green-600">{summaryMetrics.averageEfficiency}%</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{summaryMetrics.criticalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Energy Cost</p>
                <p className="text-2xl font-bold text-orange-600">{summaryMetrics.energyCost} PLN/h</p>
              </div>
              <Gauge className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimal Systems</p>
                <p className="text-2xl font-bold text-green-600">{summaryMetrics.optimalSystems}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Metrics */}
        <RealTimeMetrics 
          metrics={hvacMetrics}
          isLoading={isLoading}
          showAdvanced={showAdvancedMetrics}
        />

        {/* Warsaw District Heatmap */}
        <WarsawHeatmap 
          districtData={districtData}
          selectedDistrict={selectedDistrict}
          onDistrictSelect={handleDistrictChange}
          isLoading={isLoading}
        />
      </div>

      {/* Energy Analytics Chart - Full Width */}
      <EnergyAnalyticsChart 
        data={energyAnalytics}
        timeRange={selectedTimeRange}
        district={selectedDistrict}
        isLoading={isLoading}
        showVATBreakdown={true}
      />
    </div>
  );
}
