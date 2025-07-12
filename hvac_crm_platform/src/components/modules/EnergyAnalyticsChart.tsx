/**
 * Energy Analytics Chart Component
 * Real-time energy efficiency charts with Polish VAT calculations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Leaf, 
  Target,
  Download,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import type { EnergyAnalyticsData, WarsawDistrict } from '../../types/hvac';

interface EnergyAnalyticsChartProps {
  data: EnergyAnalyticsData[] | undefined;
  timeRange: string;
  district?: WarsawDistrict;
  isLoading: boolean;
  showVATBreakdown?: boolean;
}

// Polish VAT rate
const VAT_RATE = 0.23; // 23%

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#eab308'
};

export function EnergyAnalyticsChart({ 
  data, 
  timeRange, 
  district, 
  isLoading, 
  showVATBreakdown = true 
}: EnergyAnalyticsChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('area');
  const [selectedMetric, setSelectedMetric] = useState<'efficiency' | 'cost' | 'consumption' | 'carbon'>('efficiency');

  // Generate mock data if no real data available
  const mockData: EnergyAnalyticsData[] = React.useMemo(() => {
    if (data && data.length > 0) return data;
    
    const hours = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const interval = timeRange === '1h' ? 5 : timeRange === '24h' ? 1 : timeRange === '7d' ? 1 : 1;
    
    return Array.from({ length: hours }, (_, i) => {
      const timestamp = new Date();
      if (timeRange === '1h') {
        timestamp.setMinutes(timestamp.getMinutes() - (hours - i) * 5);
      } else if (timeRange === '24h') {
        timestamp.setHours(timestamp.getHours() - (hours - i));
      } else {
        timestamp.setDate(timestamp.getDate() - (hours - i));
      }

      const baseConsumption = 15 + Math.random() * 10; // 15-25 kWh
      const efficiency = 75 + Math.random() * 20; // 75-95%
      const baseCost = baseConsumption * 0.65; // 0.65 PLN per kWh
      const vatAmount = baseCost * VAT_RATE;

      return {
        timestamp,
        district: district || 'Śródmieście',
        equipmentId: `EQ-${Math.floor(Math.random() * 1000)}`,
        energyConsumption: Math.round(baseConsumption * 100) / 100,
        energyEfficiency: Math.round(efficiency * 100) / 100,
        carbonFootprint: Math.round(baseConsumption * 0.8 * 100) / 100, // 0.8 kg CO2 per kWh
        baseCost: Math.round(baseCost * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalCost: Math.round((baseCost + vatAmount) * 100) / 100,
        industryAverage: 82,
        targetEfficiency: 90,
        savingsPotential: Math.round((90 - efficiency) * 2 * 100) / 100 // Potential savings in PLN
      };
    });
  }, [data, timeRange, district]);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (mockData.length === 0) return null;

    const totalConsumption = mockData.reduce((sum, d) => sum + d.energyConsumption, 0);
    const avgEfficiency = mockData.reduce((sum, d) => sum + d.energyEfficiency, 0) / mockData.length;
    const totalCost = mockData.reduce((sum, d) => sum + d.totalCost, 0);
    const totalVAT = mockData.reduce((sum, d) => sum + d.vatAmount, 0);
    const totalCarbon = mockData.reduce((sum, d) => sum + d.carbonFootprint, 0);
    const totalSavings = mockData.reduce((sum, d) => sum + d.savingsPotential, 0);

    const efficiencyTrend = mockData.length > 1 
      ? ((mockData[mockData.length - 1].energyEfficiency - mockData[0].energyEfficiency) / mockData[0].energyEfficiency) * 100
      : 0;

    return {
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      avgEfficiency: Math.round(avgEfficiency * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      totalCarbon: Math.round(totalCarbon * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      efficiencyTrend: Math.round(efficiencyTrend * 100) / 100
    };
  }, [mockData]);

  // Prepare chart data
  const chartData = mockData.map((item, index) => ({
    time: timeRange === '1h' 
      ? item.timestamp.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : timeRange === '24h'
        ? item.timestamp.toLocaleTimeString('pl-PL', { hour: '2-digit' })
        : item.timestamp.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
    efficiency: item.energyEfficiency,
    consumption: item.energyConsumption,
    cost: item.totalCost,
    baseCost: item.baseCost,
    vatAmount: item.vatAmount,
    carbon: item.carbonFootprint,
    target: item.targetEfficiency,
    industry: item.industryAverage,
    savings: item.savingsPotential
  }));

  // VAT breakdown data for pie chart
  const vatBreakdownData = summaryStats ? [
    { name: 'Base Cost', value: summaryStats.totalCost - summaryStats.totalVAT, color: COLORS.primary },
    { name: 'VAT (23%)', value: summaryStats.totalVAT, color: COLORS.accent }
  ] : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Energy Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading energy analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Energy Analytics
            {district && <span className="ml-2 text-sm font-normal text-gray-500">({district})</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="efficiency">Efficiency</option>
              <option value="cost">Cost Analysis</option>
              <option value="consumption">Consumption</option>
              <option value="carbon">Carbon Footprint</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const types: typeof chartType[] = ['line', 'area', 'bar', 'composed'];
                const currentIndex = types.indexOf(chartType);
                setChartType(types[(currentIndex + 1) % types.length]);
              }}
            >
              {chartType === 'line' && <LineChartIcon className="w-4 h-4" />}
              {chartType === 'area' && <BarChart3 className="w-4 h-4" />}
              {chartType === 'bar' && <BarChart3 className="w-4 h-4" />}
              {chartType === 'composed' && <PieChartIcon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary KPIs */}
          {summaryStats && (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">Avg Efficiency</p>
                    <p className="text-lg font-bold text-blue-900">{summaryStats.avgEfficiency}%</p>
                  </div>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex items-center mt-1">
                  {summaryStats.efficiencyTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${summaryStats.efficiencyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(summaryStats.efficiencyTrend).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700">Total Cost</p>
                    <p className="text-lg font-bold text-green-900">{summaryStats.totalCost} PLN</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-xs text-green-600 mt-1">incl. {summaryStats.totalVAT} PLN VAT</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-700">Consumption</p>
                    <p className="text-lg font-bold text-orange-900">{summaryStats.totalConsumption} kWh</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-700">Carbon</p>
                    <p className="text-lg font-bold text-red-900">{summaryStats.totalCarbon} kg</p>
                  </div>
                  <Leaf className="w-5 h-5 text-red-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-700">VAT (23%)</p>
                    <p className="text-lg font-bold text-purple-900">{summaryStats.totalVAT} PLN</p>
                  </div>
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-yellow-700">Savings</p>
                    <p className="text-lg font-bold text-yellow-900">{summaryStats.totalSavings} PLN</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </div>
          )}

          {/* Main Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'line' && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'efficiency') return [`${value}%`, 'Efficiency'];
                        if (name === 'cost') return [`${value} PLN`, 'Total Cost'];
                        if (name === 'consumption') return [`${value} kWh`, 'Consumption'];
                        if (name === 'carbon') return [`${value} kg`, 'Carbon'];
                        return [value, name];
                      }}
                    />
                    {selectedMetric === 'efficiency' && (
                      <>
                        <Line type="monotone" dataKey="efficiency" stroke={COLORS.primary} strokeWidth={2} />
                        <Line type="monotone" dataKey="target" stroke={COLORS.success} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="industry" stroke={COLORS.warning} strokeDasharray="3 3" />
                      </>
                    )}
                    {selectedMetric === 'cost' && (
                      <>
                        <Line type="monotone" dataKey="cost" stroke={COLORS.primary} strokeWidth={2} />
                        <Line type="monotone" dataKey="baseCost" stroke={COLORS.secondary} strokeWidth={2} />
                      </>
                    )}
                    {selectedMetric === 'consumption' && (
                      <Line type="monotone" dataKey="consumption" stroke={COLORS.accent} strokeWidth={2} />
                    )}
                    {selectedMetric === 'carbon' && (
                      <Line type="monotone" dataKey="carbon" stroke={COLORS.danger} strokeWidth={2} />
                    )}
                  </LineChart>
                )}

                {chartType === 'area' && (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric === 'efficiency' ? 'efficiency' : selectedMetric === 'cost' ? 'cost' : selectedMetric === 'consumption' ? 'consumption' : 'carbon'}
                      stroke={COLORS.primary} 
                      fill={COLORS.primary} 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                )}

                {chartType === 'bar' && (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey={selectedMetric === 'efficiency' ? 'efficiency' : selectedMetric === 'cost' ? 'cost' : selectedMetric === 'consumption' ? 'consumption' : 'carbon'}
                      fill={COLORS.primary}
                    />
                  </BarChart>
                )}

                {chartType === 'composed' && selectedMetric === 'cost' && (
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="baseCost" fill={COLORS.primary} />
                    <Bar dataKey="vatAmount" fill={COLORS.accent} />
                    <Line type="monotone" dataKey="cost" stroke={COLORS.danger} strokeWidth={2} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* VAT Breakdown */}
            {showVATBreakdown && summaryStats && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={vatBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {vatBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} PLN`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Cost:</span>
                    <span className="font-medium">{(summaryStats.totalCost - summaryStats.totalVAT).toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (23%):</span>
                    <span className="font-medium">{summaryStats.totalVAT} PLN</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Total Cost:</span>
                    <span>{summaryStats.totalCost} PLN</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
