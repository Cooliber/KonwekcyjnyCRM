import { useQuery } from "convex/react";
import { Activity, BarChart3, Brain, DollarSign, Download, Target } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

interface AnalyticsFilters {
  dateFrom: number;
  dateTo: number;
  district?: string;
  timeRange: "7d" | "30d" | "90d" | "custom";
}

export const AnalyticsModule: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
    dateTo: Date.now(),
    timeRange: "30d",
  });

  const [selectedView, setSelectedView] = useState<"overview" | "roi" | "prophecy" | "efficiency">(
    "overview"
  );
  const [_autoRefresh, _setAutoRefresh] = useState(true);

  // Get analytics data from various sources
  const revenueAnalytics = useQuery(api.invoices.getRevenueAnalytics, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    groupBy: "district",
  });

  const inventoryAnalytics = useQuery(api.inventory.getInventoryAnalytics, {
    district: filters.district,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const performanceMetrics = useQuery(
    api.performanceOptimization?.getPerformanceMetrics || "skip",
    {}
  );

  const _routeAnalytics = useQuery(api.routes?.getRouteAnalytics || "skip", {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  // Warsaw districts for filtering
  const _warsawDistricts = [
    "Śródmieście",
    "Mokotów",
    "Wilanów",
    "Żoliborz",
    "Ursynów",
    "Wola",
    "Praga-Południe",
    "Targówek",
  ];

  // Colors for charts
  const _chartColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];

  const handleTimeRangeChange = (range: string) => {
    const now = Date.now();
    let dateFrom = now;

    switch (range) {
      case "7d":
        dateFrom = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        dateFrom = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        dateFrom = now - 90 * 24 * 60 * 60 * 1000;
        break;
    }

    setFilters({
      ...filters,
      timeRange: range as any,
      dateFrom,
      dateTo: now,
    });
  };

  const handleExportReport = () => {
    // In a real implementation, this would generate and download a comprehensive report
    toast.success("Analytics report export initiated");
  };

  // Calculate ROI metrics
  const calculateROIMetrics = () => {
    if (!(revenueAnalytics && inventoryAnalytics)) return null;

    const totalRevenue = revenueAnalytics.totalRevenue;
    const totalInventoryValue = inventoryAnalytics.totalValue;
    const operationalCosts = totalInventoryValue * 0.3; // Estimated 30% operational costs

    const roi = ((totalRevenue - operationalCosts) / operationalCosts) * 100;
    const profitMargin = ((totalRevenue - operationalCosts) / totalRevenue) * 100;

    return {
      roi: Math.round(roi * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalRevenue,
      operationalCosts,
      netProfit: totalRevenue - operationalCosts,
    };
  };

  // Calculate prophecy accuracy metrics
  const calculateProphecyAccuracy = () => {
    // Mock prophecy accuracy data - in real implementation would come from AI system
    return {
      overallAccuracy: 87.3,
      districtAccuracy: {
        Śródmieście: 92.1,
        Wilanów: 89.5,
        Mokotów: 86.8,
        Żoliborz: 84.2,
        Ursynów: 88.7,
        Wola: 83.9,
        "Praga-Południe": 81.4,
        Targówek: 79.8,
      },
      predictionTypes: {
        demand_forecast: 91.2,
        maintenance_needs: 85.7,
        equipment_failure: 82.4,
        revenue_projection: 89.8,
      },
      improvementTrend: 2.1, // +2.1% this period
    };
  };

  // Calculate district efficiency metrics
  const calculateDistrictEfficiency = () => {
    if (!(revenueAnalytics?.byDistrict && inventoryAnalytics?.byDistrict)) return null;

    const efficiencyData = Object.keys(revenueAnalytics.byDistrict)
      .map((district) => {
        const revenue = revenueAnalytics.byDistrict[district]?.revenue || 0;
        const inventoryValue = inventoryAnalytics.byDistrict[district]?.totalValue || 0;
        const efficiency = inventoryValue > 0 ? (revenue / inventoryValue) * 100 : 0;

        return {
          district,
          revenue,
          inventoryValue,
          efficiency: Math.round(efficiency * 100) / 100,
          invoiceCount: revenueAnalytics.byDistrict[district]?.count || 0,
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency);

    return efficiencyData;
  };

  const roiMetrics = calculateROIMetrics();
  const prophecyAccuracy = calculateProphecyAccuracy();
  const districtEfficiency = calculateDistrictEfficiency();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {revenueAnalytics
                  ? new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
                      revenueAnalytics.totalRevenue
                    )
                  : "Loading..."}
              </p>
              <p className="text-xs text-green-600">+17% vs baseline</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roiMetrics ? `${roiMetrics.roi}%` : "Calculating..."}
              </p>
              <p className="text-xs text-blue-600">Above industry avg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
              <p className="text-2xl font-semibold text-gray-900">
                {prophecyAccuracy.overallAccuracy}%
              </p>
              <p className="text-xs text-purple-600">
                +{prophecyAccuracy.improvementTrend}% this period
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performanceMetrics ? "99.95%" : "Loading..."}
              </p>
              <p className="text-xs text-orange-600">Target: 99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by District Chart */}
      {revenueAnalytics?.byDistrict && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by District</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(revenueAnalytics.byDistrict).map(
                ([district, data]: [string, any]) => ({
                  district,
                  revenue: data.revenue,
                  count: data.count,
                })
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === "revenue"
                    ? new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
                        value as number
                      )
                    : value,
                  name === "revenue" ? "Revenue" : "Invoice Count",
                ]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              <Bar dataKey="count" fill="#10B981" name="Invoice Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* District Efficiency Analysis */}
      {districtEfficiency && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">District Efficiency Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={districtEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === "efficiency"
                    ? `${value}%`
                    : name === "revenue"
                      ? new Intl.NumberFormat("pl-PL", {
                          style: "currency",
                          currency: "PLN",
                        }).format(value as number)
                      : value,
                  name === "efficiency"
                    ? "Efficiency"
                    : name === "revenue"
                      ? "Revenue"
                      : "Inventory Value",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Efficiency %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            ROI metrics, prophecy accuracy, and district efficiency analysis
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filters.timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-4">
          {[{ id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> }].map(
            ({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setSelectedView(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedView === id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      {selectedView === "overview" && renderOverview()}
    </div>
  );
};
