import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table, 
  Gauge,
  ScatterChart,
  Activity,
  TrendingUp,
  Settings,
  Palette
} from 'lucide-react';

interface VisualizationPanelProps {
  visualization: any;
  onChange: (visualization: any) => void;
}

export function VisualizationPanel({ visualization, onChange }: VisualizationPanelProps) {
  const visualizationTypes = [
    { type: 'table', icon: Table, label: 'Table', description: 'Tabular data display' },
    { type: 'bar_chart', icon: BarChart3, label: 'Bar Chart', description: 'Compare categories' },
    { type: 'line_chart', icon: LineChart, label: 'Line Chart', description: 'Show trends over time' },
    { type: 'pie_chart', icon: PieChart, label: 'Pie Chart', description: 'Show proportions' },
    { type: 'area_chart', icon: Activity, label: 'Area Chart', description: 'Filled line chart' },
    { type: 'scatter_plot', icon: ScatterChart, label: 'Scatter Plot', description: 'Show correlations' },
    { type: 'gauge', icon: Gauge, label: 'Gauge', description: 'Single value indicator' },
    { type: 'kpi_card', icon: TrendingUp, label: 'KPI Card', description: 'Key performance indicator' }
  ];

  const aggregationTypes = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'distinct', label: 'Distinct Count' }
  ];

  const colorPalettes = [
    {
      name: 'Default',
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    },
    {
      name: 'Warsaw Districts',
      colors: ['#1f2937', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    },
    {
      name: 'HVAC Professional',
      colors: ['#0ea5e9', '#06b6d4', '#10b981', '#84cc16', '#eab308']
    },
    {
      name: 'Seasonal',
      colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
    }
  ];

  const handleVisualizationChange = (field: string, value: any) => {
    onChange({
      ...visualization,
      [field]: value
    });
  };

  const handleColorPaletteChange = (colors: string[]) => {
    onChange({
      ...visualization,
      colors
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visualization Type Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Chart Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {visualizationTypes.map(({ type, icon: Icon, label, description }) => (
              <button
                key={type}
                onClick={() => handleVisualizationChange('type', type)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  visualization.type === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={description}
              >
                <Icon className="w-5 h-5 mb-1" />
                <div className="text-xs font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Axis Configuration for Charts */}
        {['bar_chart', 'line_chart', 'area_chart', 'scatter_plot'].includes(visualization.type) && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                X-Axis Field
              </label>
              <input
                type="text"
                value={visualization.xAxis || ''}
                onChange={(e) => handleVisualizationChange('xAxis', e.target.value)}
                placeholder="e.g., district, date, category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Y-Axis Field
              </label>
              <input
                type="text"
                value={visualization.yAxis || ''}
                onChange={(e) => handleVisualizationChange('yAxis', e.target.value)}
                placeholder="e.g., revenue, count, hours"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Group By Configuration */}
        {!['gauge', 'kpi_card'].includes(visualization.type) && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Group By
            </label>
            <input
              type="text"
              value={visualization.groupBy || ''}
              onChange={(e) => handleVisualizationChange('groupBy', e.target.value)}
              placeholder="e.g., district, type, status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Aggregation Type */}
        {!['table'].includes(visualization.type) && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Aggregation
            </label>
            <select
              value={visualization.aggregation || 'count'}
              onChange={(e) => handleVisualizationChange('aggregation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {aggregationTypes.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Color Palette Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
            <Palette className="w-4 h-4 mr-1" />
            Color Palette
          </label>
          <div className="space-y-2">
            {colorPalettes.map((palette) => (
              <button
                key={palette.name}
                onClick={() => handleColorPaletteChange(palette.colors)}
                className={`w-full p-2 rounded-lg border-2 transition-colors ${
                  JSON.stringify(visualization.colors) === JSON.stringify(palette.colors)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{palette.name}</span>
                  <div className="flex space-x-1">
                    {palette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Settings for specific chart types */}
        {visualization.type === 'gauge' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Value Field
              </label>
              <input
                type="text"
                value={visualization.valueField || ''}
                onChange={(e) => handleVisualizationChange('valueField', e.target.value)}
                placeholder="e.g., completion_rate, efficiency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Min Value
                </label>
                <input
                  type="number"
                  value={visualization.minValue || 0}
                  onChange={(e) => handleVisualizationChange('minValue', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Max Value
                </label>
                <input
                  type="number"
                  value={visualization.maxValue || 100}
                  onChange={(e) => handleVisualizationChange('maxValue', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {visualization.type === 'kpi_card' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                KPI Title
              </label>
              <input
                type="text"
                value={visualization.kpiTitle || ''}
                onChange={(e) => handleVisualizationChange('kpiTitle', e.target.value)}
                placeholder="e.g., Total Revenue, Active Jobs"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Value Field
              </label>
              <input
                type="text"
                value={visualization.valueField || ''}
                onChange={(e) => handleVisualizationChange('valueField', e.target.value)}
                placeholder="e.g., totalAmount, count"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Format
              </label>
              <select
                value={visualization.format || 'number'}
                onChange={(e) => handleVisualizationChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="number">Number</option>
                <option value="currency">Currency (PLN)</option>
                <option value="percentage">Percentage</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="pt-3 border-t border-gray-200">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
