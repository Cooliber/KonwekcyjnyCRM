/**
 * Warsaw District Heatmap Component
 * Interactive map showing service density and affluence correlation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Eye,
  EyeOff,
  Filter,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import type { WarsawDistrictData, WarsawDistrict } from '../../types/hvac';

interface WarsawHeatmapProps {
  districtData: WarsawDistrictData[] | undefined;
  selectedDistrict?: WarsawDistrict;
  onDistrictSelect: (district: WarsawDistrict | 'all') => void;
  isLoading: boolean;
}

// Warsaw district coordinates (approximate centers)
const DISTRICT_COORDINATES: Record<WarsawDistrict, { lat: number; lng: number }> = {
  'Śródmieście': { lat: 52.2297, lng: 21.0122 },
  'Wilanów': { lat: 52.1659, lng: 21.0895 },
  'Mokotów': { lat: 52.1951, lng: 21.0450 },
  'Żoliborz': { lat: 52.2656, lng: 20.9814 },
  'Ursynów': { lat: 52.1394, lng: 21.0444 },
  'Wola': { lat: 52.2394, lng: 20.9706 },
  'Praga-Południe': { lat: 52.2394, lng: 21.0706 },
  'Targówek': { lat: 52.2894, lng: 21.0506 },
  'Ochota': { lat: 52.2094, lng: 20.9806 },
  'Praga-Północ': { lat: 52.2594, lng: 21.0406 },
  'Bemowo': { lat: 52.2594, lng: 20.9206 },
  'Bielany': { lat: 52.2894, lng: 20.9506 },
  'Białołęka': { lat: 52.3194, lng: 21.0806 },
  'Rembertów': { lat: 52.2594, lng: 21.1506 },
  'Wesoła': { lat: 52.2294, lng: 21.2006 },
  'Włochy': { lat: 52.1894, lng: 20.9006 },
  'Ursus': { lat: 52.1994, lng: 20.8706 }
};

// Color scale for affluence visualization
const getAffluenceColor = (score: number): string => {
  if (score >= 8) return '#10b981'; // High affluence - green
  if (score >= 6) return '#f59e0b'; // Medium affluence - orange
  if (score >= 4) return '#ef4444'; // Lower affluence - red
  return '#6b7280'; // Very low - gray
};

// Color scale for service demand
const getDemandColor = (demand: number, maxDemand: number): string => {
  const intensity = demand / maxDemand;
  if (intensity >= 0.8) return '#dc2626'; // High demand - red
  if (intensity >= 0.6) return '#ea580c'; // Medium-high - orange-red
  if (intensity >= 0.4) return '#f59e0b'; // Medium - orange
  if (intensity >= 0.2) return '#eab308'; // Low-medium - yellow
  return '#22c55e'; // Low demand - green
};

export function WarsawHeatmap({ 
  districtData, 
  selectedDistrict, 
  onDistrictSelect, 
  isLoading 
}: WarsawHeatmapProps) {
  const [viewMode, setViewMode] = useState<'affluence' | 'demand' | 'revenue'>('affluence');
  const [showDetails, setShowDetails] = useState(false);

  // Mock data if no real data available
  const mockDistrictData: WarsawDistrictData[] = React.useMemo(() => {
    if (districtData && districtData.length > 0) return districtData;
    
    return Object.entries(DISTRICT_COORDINATES).map(([district, coords]) => ({
      districtName: district as WarsawDistrict,
      affluenceScore: Math.floor(Math.random() * 6) + 4, // 4-10 scale
      serviceDemand: Math.floor(Math.random() * 50) + 10,
      averageJobValue: Math.floor(Math.random() * 3000) + 1500,
      activeInstallations: Math.floor(Math.random() * 100) + 20,
      coordinates: coords,
      completionRate: Math.floor(Math.random() * 20) + 80,
      customerSatisfaction: Math.floor(Math.random() * 2) + 3.5,
      responseTime: Math.floor(Math.random() * 30) + 15,
      monthlyRevenue: Math.floor(Math.random() * 50000) + 20000,
      yearlyRevenue: Math.floor(Math.random() * 500000) + 200000,
      revenueGrowth: Math.floor(Math.random() * 40) - 10 // -10% to +30%
    }));
  }, [districtData]);

  const maxDemand = Math.max(...mockDistrictData.map(d => d.serviceDemand));
  const maxRevenue = Math.max(...mockDistrictData.map(d => d.monthlyRevenue));

  // Prepare chart data
  const chartData = mockDistrictData.map(district => ({
    name: district.districtName.length > 10 
      ? district.districtName.substring(0, 8) + '...' 
      : district.districtName,
    fullName: district.districtName,
    affluence: district.affluenceScore,
    demand: district.serviceDemand,
    revenue: district.monthlyRevenue / 1000, // Convert to thousands
    avgJobValue: district.averageJobValue,
    installations: district.activeInstallations,
    satisfaction: district.customerSatisfaction,
    growth: district.revenueGrowth
  }));

  // Correlation data for scatter plot
  const correlationData = mockDistrictData.map(district => ({
    x: district.affluenceScore,
    y: district.averageJobValue,
    z: district.serviceDemand,
    name: district.districtName
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Warsaw District Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading district data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Warsaw District Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="affluence">Affluence</option>
              <option value="demand">Service Demand</option>
              <option value="revenue">Revenue</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* District Performance Chart */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'affluence') return [value, 'Affluence Score'];
                    if (name === 'demand') return [value, 'Service Demand'];
                    if (name === 'revenue') return [`${value}k PLN`, 'Monthly Revenue'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    const district = chartData.find(d => d.name === label);
                    return district ? district.fullName : label;
                  }}
                />
                <Bar 
                  dataKey={viewMode === 'affluence' ? 'affluence' : viewMode === 'demand' ? 'demand' : 'revenue'}
                  fill={viewMode === 'affluence' ? '#3b82f6' : viewMode === 'demand' ? '#f59e0b' : '#10b981'}
                  onClick={(data) => {
                    if (data && data.fullName) {
                      onDistrictSelect(data.fullName as WarsawDistrict);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        selectedDistrict === entry.fullName 
                          ? '#1f2937' 
                          : viewMode === 'affluence' 
                            ? getAffluenceColor(entry.affluence)
                            : viewMode === 'demand'
                              ? getDemandColor(entry.demand, maxDemand)
                              : '#10b981'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* District Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {mockDistrictData.slice(0, 8).map((district) => (
              <div
                key={district.districtName}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedDistrict === district.districtName 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => onDistrictSelect(district.districtName)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900">
                    {district.districtName.length > 12 
                      ? district.districtName.substring(0, 10) + '...' 
                      : district.districtName}
                  </h4>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: viewMode === 'affluence' 
                        ? getAffluenceColor(district.affluenceScore)
                        : getDemandColor(district.serviceDemand, maxDemand)
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Affluence:</span>
                    <span className="font-medium">{district.affluenceScore}/10</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Demand:</span>
                    <span className="font-medium">{district.serviceDemand}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Avg Job:</span>
                    <span className="font-medium">{(district.averageJobValue / 1000).toFixed(1)}k PLN</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Analytics */}
          {showDetails && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Affluence vs Job Value Correlation</h4>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    name="Affluence Score"
                    domain={[0, 10]}
                  />
                  <YAxis 
                    dataKey="y" 
                    name="Average Job Value"
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'y') return [`${(value as number / 1000).toFixed(1)}k PLN`, 'Avg Job Value'];
                      return [value, 'Affluence Score'];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.name;
                      }
                      return label;
                    }}
                  />
                  <Scatter dataKey="y" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>

              {/* Key Insights */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Key Insights</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Śródmieście shows highest affluence and job values</li>
                  <li>• Wilanów has premium pricing potential</li>
                  <li>• Praga districts show growing demand</li>
                  <li>• Mokotów offers balanced opportunity</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
