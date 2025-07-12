import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Settings,
  Target,
  Server
} from 'lucide-react';
import { cacheManager } from '../../lib/cacheStrategy';

interface PerformanceMetrics {
  totalRequests: number;
  cacheHitRate: number;
  averageResponseTime: number;
  uptime: number;
  cacheSize: number;
  rateLimitViolations: number;
  targetMetrics: {
    cacheHitRate: number;
    maxResponseTime: number;
    maxConcurrentUsers: number;
  };
}

export const PerformanceDashboard: React.FC = () => {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Get performance metrics from Convex
  const performanceMetrics = useQuery(api.performanceOptimization.getPerformanceMetrics, {});
  
  // Get cache statistics from client-side cache
  const [cacheStats, setCacheStats] = useState(cacheManager.getStats());

  // Reset performance metrics mutation
  const resetMetrics = useMutation(api.performanceOptimization.resetPerformanceMetrics);

  // Update cache stats periodically
  useEffect(() => {
    const updateCacheStats = () => {
      setCacheStats(cacheManager.getStats());
    };

    const interval = setInterval(updateCacheStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh performance data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger re-fetch by updating a state that forces re-render
      setCacheStats(cacheManager.getStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleResetMetrics = async () => {
    try {
      await resetMetrics({});
      setCacheStats(cacheManager.getStats());
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getHealthStatus = (metrics: PerformanceMetrics) => {
    const cacheHitRateOk = metrics.cacheHitRate >= metrics.targetMetrics.cacheHitRate;
    const responseTimeOk = metrics.averageResponseTime <= metrics.targetMetrics.maxResponseTime;
    const rateLimitOk = metrics.rateLimitViolations < 10;

    if (cacheHitRateOk && responseTimeOk && rateLimitOk) {
      return { status: 'healthy', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (cacheHitRateOk || responseTimeOk) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const renderMetricCard = (
    title: string, 
    value: string | number, 
    target?: string | number, 
    icon: React.ReactNode,
    trend?: 'up' | 'down' | 'stable'
  ) => {
    const isTargetMet = target ? (typeof value === 'number' && typeof target === 'number' ? value >= target : true) : true;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-semibold ${isTargetMet ? 'text-gray-900' : 'text-red-600'}`}>
              {value}
            </p>
            {target && (
              <p className="text-xs text-gray-500">Target: {target}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {trend && (
              <div className={`p-1 rounded ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4" />}
              </div>
            )}
            <div className="p-3 rounded-lg bg-gray-100">
              {icon}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!performanceMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const healthStatus = getHealthStatus(performanceMetrics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            Performance Dashboard
          </h1>
          <p className="text-gray-600">Real-time system performance and optimization metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Auto-refresh toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>

          {/* Refresh interval selector */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value={5000}>5s</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
          </select>

          {/* Reset metrics button */}
          <button
            onClick={handleResetMetrics}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* System Health Status */}
      <div className={`rounded-lg p-4 ${healthStatus.bgColor}`}>
        <div className="flex items-center space-x-3">
          {healthStatus.status === 'healthy' && <CheckCircle className={`w-6 h-6 ${healthStatus.color}`} />}
          {healthStatus.status !== 'healthy' && <AlertTriangle className={`w-6 h-6 ${healthStatus.color}`} />}
          <div>
            <h3 className={`font-semibold ${healthStatus.color}`}>
              System Status: {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </h3>
            <p className="text-sm text-gray-600">
              Uptime: {formatUptime(performanceMetrics.uptime)} | 
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Cache Hit Rate',
          `${Math.round(performanceMetrics.cacheHitRate * 100)}%`,
          `${Math.round(performanceMetrics.targetMetrics.cacheHitRate * 100)}%`,
          <Database className="w-6 h-6 text-blue-600" />,
          performanceMetrics.cacheHitRate >= performanceMetrics.targetMetrics.cacheHitRate ? 'up' : 'down'
        )}

        {renderMetricCard(
          'Avg Response Time',
          `${Math.round(performanceMetrics.averageResponseTime)}ms`,
          `${performanceMetrics.targetMetrics.maxResponseTime}ms`,
          <Clock className="w-6 h-6 text-green-600" />,
          performanceMetrics.averageResponseTime <= performanceMetrics.targetMetrics.maxResponseTime ? 'up' : 'down'
        )}

        {renderMetricCard(
          'Total Requests',
          performanceMetrics.totalRequests.toLocaleString(),
          undefined,
          <BarChart3 className="w-6 h-6 text-purple-600" />,
          'up'
        )}

        {renderMetricCard(
          'Rate Limit Violations',
          performanceMetrics.rateLimitViolations,
          '< 10',
          <AlertTriangle className="w-6 h-6 text-red-600" />,
          performanceMetrics.rateLimitViolations < 10 ? 'stable' : 'down'
        )}
      </div>

      {/* Cache Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Cache Performance
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">L1 Cache Size</span>
              <span className="font-medium">{cacheStats.l1Size} entries</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">L2 Cache Size</span>
              <span className="font-medium">{cacheStats.l2Size} entries</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <span className="font-medium">{cacheStats.memoryUsage} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hit Rate</span>
              <span className={`font-medium ${cacheStats.hitRate >= 0.8 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(cacheStats.hitRate * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Performance Targets
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime Target</span>
              <span className="font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cost Reduction Target</span>
              <span className="font-medium text-green-600">25%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Max Response Time</span>
              <span className="font-medium">{performanceMetrics.targetMetrics.maxResponseTime}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Max Concurrent Users</span>
              <span className="font-medium">{performanceMetrics.targetMetrics.maxConcurrentUsers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Cached Keys */}
      {cacheStats.topKeys.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-purple-600" />
            Most Accessed Cache Keys
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cacheStats.topKeys.slice(0, 10).map((key, index) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                <span className="text-sm text-gray-600 truncate flex-1 mx-3">{key}</span>
                <span className="text-xs text-gray-500">Frequent</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          Performance Recommendations
        </h3>
        
        <div className="space-y-3">
          {performanceMetrics.cacheHitRate < 0.8 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Low Cache Hit Rate</p>
                <p className="text-xs text-yellow-700">Consider increasing cache TTL for frequently accessed data</p>
              </div>
            </div>
          )}
          
          {performanceMetrics.averageResponseTime > performanceMetrics.targetMetrics.maxResponseTime && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">High Response Time</p>
                <p className="text-xs text-red-700">Optimize database queries and increase caching</p>
              </div>
            </div>
          )}
          
          {performanceMetrics.rateLimitViolations > 5 && (
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">Rate Limit Violations Detected</p>
                <p className="text-xs text-orange-700">Review API usage patterns and implement request batching</p>
              </div>
            </div>
          )}
          
          {performanceMetrics.cacheHitRate >= 0.8 && 
           performanceMetrics.averageResponseTime <= performanceMetrics.targetMetrics.maxResponseTime && 
           performanceMetrics.rateLimitViolations <= 5 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">System Performance Optimal</p>
                <p className="text-xs text-green-700">All performance targets are being met</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
