import React, { useState, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  Eye, 
  Play, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Zap,
  BarChart3,
  Table,
  PieChart,
  LineChart,
  Gauge,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency } from '../../../lib/utils';

interface PreviewPanelProps {
  reportId: string | null;
  config: any;
  onExecute: () => Promise<any>;
}

export function PreviewPanel({ reportId, config, onExecute }: PreviewPanelProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const executeReport = useAction(api.reports.execute);

  const handlePreview = async () => {
    if (!reportId) {
      setError('Please save the report first');
      return;
    }

    setIsLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const result = await executeReport({
        reportId: reportId as any,
        useCache: true
      });
      
      setPreviewData(result);
      setExecutionTime(Date.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute report');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualization = () => {
    if (!previewData || !previewData.data || previewData.data.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No data to display</p>
        </div>
      );
    }

    const data = previewData.data.slice(0, 10); // Limit preview data
    const colors = config.visualization.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    switch (config.visualization.type) {
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  {Object.keys(data[0] || {}).slice(0, 4).map(key => (
                    <th key={key} className="text-left p-2 font-medium text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((row: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    {Object.keys(row).slice(0, 4).map(key => (
                      <td key={key} className="p-2 text-gray-600">
                        {typeof row[key] === 'number' && key.includes('amount') 
                          ? formatCurrency(row[key])
                          : String(row[key]).slice(0, 20)
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 5 && (
              <div className="text-center text-xs text-gray-500 py-2">
                ... and {data.length - 5} more rows
              </div>
            )}
          </div>
        );

      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.visualization.xAxis || Object.keys(data[0])[0]} 
                fontSize={10}
              />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar 
                dataKey={config.visualization.yAxis || Object.keys(data[0])[1]} 
                fill={colors[0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.visualization.xAxis || Object.keys(data[0])[0]} 
                fontSize={10}
              />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={config.visualization.yAxis || Object.keys(data[0])[1]} 
                stroke={colors[0]} 
                strokeWidth={2}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'pie_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={data.slice(0, 5)}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey={config.visualization.yAxis || Object.keys(data[0])[1]}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.slice(0, 5).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'area_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.visualization.xAxis || Object.keys(data[0])[0]} 
                fontSize={10}
              />
              <YAxis fontSize={10} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey={config.visualization.yAxis || Object.keys(data[0])[1]} 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'gauge':
        const value = data[0]?.[config.visualization.valueField] || 0;
        const maxValue = config.visualization.maxValue || 100;
        const percentage = (value / maxValue) * 100;
        
        return (
          <div className="flex flex-col items-center py-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={colors[0]}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${percentage * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{value}</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {config.visualization.kpiTitle || 'Value'}
            </div>
          </div>
        );

      case 'kpi_card':
        const kpiValue = data[0]?.[config.visualization.valueField] || 0;
        const formattedValue = config.visualization.format === 'currency' 
          ? formatCurrency(kpiValue)
          : config.visualization.format === 'percentage'
          ? `${kpiValue}%`
          : kpiValue;

        return (
          <div className="text-center py-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formattedValue}
            </div>
            <div className="text-sm text-gray-600">
              {config.visualization.kpiTitle || 'KPI Value'}
            </div>
            <div className="flex items-center justify-center mt-2">
              <Activity className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+12.5% from last period</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">Unsupported visualization type</p>
          </div>
        );
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Preview
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isLoading || !reportId}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            {isLoading ? 'Running...' : 'Execute'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Executing report...</span>
          </div>
        )}

        {!isLoading && !error && !previewData && (
          <div className="text-center text-gray-500 py-8">
            <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium">Ready to preview</p>
            <p className="text-xs">Click Execute to run the report</p>
          </div>
        )}

        {previewData && (
          <div className="space-y-4">
            {/* Execution Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center p-2 bg-green-50 rounded">
                <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-green-800">
                  {previewData.metadata.totalRows} rows
                </span>
              </div>
              <div className="flex items-center p-2 bg-blue-50 rounded">
                <Clock className="w-3 h-3 text-blue-600 mr-1" />
                <span className="text-blue-800">
                  {executionTime}ms
                </span>
              </div>
            </div>

            {/* Warsaw Metrics */}
            {previewData.metadata.warsawMetrics && (
              <div className="p-2 bg-purple-50 rounded">
                <div className="flex items-center mb-1">
                  <Zap className="w-3 h-3 text-purple-600 mr-1" />
                  <span className="text-xs font-medium text-purple-800">Warsaw Intelligence</span>
                </div>
                <div className="text-xs text-purple-700 space-y-1">
                  {previewData.metadata.warsawMetrics.affluenceScore && (
                    <div>Affluence: {previewData.metadata.warsawMetrics.affluenceScore.toFixed(2)}x</div>
                  )}
                  {previewData.metadata.warsawMetrics.routeEfficiency && (
                    <div>Route Efficiency: {previewData.metadata.warsawMetrics.routeEfficiency.toFixed(1)}%</div>
                  )}
                  {previewData.metadata.warsawMetrics.seasonalFactor && (
                    <div>Seasonal Factor: {previewData.metadata.warsawMetrics.seasonalFactor.toFixed(2)}x</div>
                  )}
                </div>
              </div>
            )}

            {/* Visualization */}
            <div className="border border-gray-200 rounded-md p-3">
              {renderVisualization()}
            </div>

            {/* Data Sources Used */}
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Data Sources:</div>
              <div className="flex flex-wrap gap-1">
                {previewData.metadata.dataSourcesUsed.map((source: string, index: number) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded text-xs"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
