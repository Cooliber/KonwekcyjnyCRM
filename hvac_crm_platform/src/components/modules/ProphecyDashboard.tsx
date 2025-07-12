import { useQuery } from "convex/react";
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export function ProphecyDashboard() {
  const [_selectedDistrict, _setSelectedDistrict] = useState("");
  const [timeRange, setTimeRange] = useState("7d");

  // Get recent data for analysis
  const _recentContacts = useQuery(api.contacts.list, {});
  const _recentJobs = useQuery(api.jobs.list, {});
  const _recentQuotes = useQuery(api.quotes.list, {});

  // Warsaw districts with affluence data
  const districtData = [
    { name: "Śródmieście", affluence: 0.9, avgQuote: 12500, jobs: 15, trend: "+12%" },
    { name: "Wilanów", affluence: 0.85, avgQuote: 11800, jobs: 8, trend: "+8%" },
    { name: "Mokotów", affluence: 0.75, avgQuote: 9500, jobs: 12, trend: "+5%" },
    { name: "Żoliborz", affluence: 0.7, avgQuote: 8800, jobs: 10, trend: "+3%" },
    { name: "Ursynów", affluence: 0.65, avgQuote: 8200, jobs: 14, trend: "+7%" },
    { name: "Wola", affluence: 0.6, avgQuote: 7500, jobs: 11, trend: "-2%" },
    { name: "Praga-Południe", affluence: 0.45, avgQuote: 6200, jobs: 9, trend: "+1%" },
    { name: "Targówek", affluence: 0.4, avgQuote: 5800, jobs: 7, trend: "-1%" },
  ];

  // AI Insights (mock data for demonstration)
  const aiInsights = [
    {
      type: "pricing",
      title: "Premium Pricing Opportunity",
      description: "Śródmieście customers show 20% higher acceptance rate for premium equipment",
      confidence: 0.85,
      action: "Increase premium equipment recommendations",
      impact: "+15% revenue potential",
    },
    {
      type: "demand",
      title: "Seasonal Demand Spike",
      description: "Heat pump installations expected to increase 40% in next 2 weeks",
      confidence: 0.78,
      action: "Stock additional heat pump units",
      impact: "Prevent stockouts",
    },
    {
      type: "service",
      title: "Maintenance Window Alert",
      description: "85 installations due for service in Mokotów district",
      confidence: 0.92,
      action: "Schedule proactive outreach campaign",
      impact: "+25 service jobs",
    },
    {
      type: "competition",
      title: "Market Gap Identified",
      description: "Low competition for VRF systems in Ursynów area",
      confidence: 0.73,
      action: "Target VRF marketing in Ursynów",
      impact: "New market opportunity",
    },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "pricing":
        return DollarSign;
      case "demand":
        return TrendingUp;
      case "service":
        return Clock;
      case "competition":
        return Target;
      default:
        return Brain;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            AI Prophecy Dashboard
          </h1>
          <p className="text-gray-600">Data-driven insights for Warsaw HVAC operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
              <p className="text-2xl font-semibold text-gray-900">87.3%</p>
              <p className="text-xs text-green-600">+2.1% this week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Quote Value</p>
              <p className="text-2xl font-semibold text-gray-900">8,750 PLN</p>
              <p className="text-xs text-green-600">+12% vs last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">68.5%</p>
              <p className="text-xs text-green-600">+5.2% this week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Insights</p>
              <p className="text-2xl font-semibold text-gray-900">{aiInsights.length}</p>
              <p className="text-xs text-blue-600">2 high priority</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-500" />
            AI-Powered Insights
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiInsights.map((insight, index) => {
              const IconComponent = getInsightIcon(insight.type);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(insight.confidence)}`}
                        >
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-gray-700">{insight.action}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-gray-700">{insight.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* District Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-500" />
            Warsaw District Analysis
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">District</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Affluence Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Quote</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Active Jobs</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Trend</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Opportunity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {districtData.map((district, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{district.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${district.affluence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round(district.affluence * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {district.avgQuote.toLocaleString()} PLN
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{district.jobs}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-medium ${
                          district.trend.startsWith("+")
                            ? "text-green-600"
                            : district.trend.startsWith("-")
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {district.trend}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pricing Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Dynamic Pricing Rules</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Premium Districts</p>
                  <p className="text-sm text-gray-600">Śródmieście, Wilanów, Mokotów</p>
                </div>
                <span className="text-green-600 font-medium">+20%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">High-End Equipment</p>
                  <p className="text-sm text-gray-600">Mitsubishi, Daikin, Fujitsu</p>
                </div>
                <span className="text-blue-600 font-medium">+15%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Emergency Service</p>
                  <p className="text-sm text-gray-600">Same-day installation</p>
                </div>
                <span className="text-yellow-600 font-medium">+30%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Budget Areas</p>
                  <p className="text-sm text-gray-600">Praga districts, Targówek</p>
                </div>
                <span className="text-red-600 font-medium">-10%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Market Predictions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Heat Pump Demand</p>
                  <p className="text-sm text-gray-600">Expected +40% increase next 2 weeks</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900">Supply Chain Alert</p>
                  <p className="text-sm text-gray-600">Potential delays for premium units</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">Opportunity Window</p>
                  <p className="text-sm text-gray-600">VRF systems in Ursynów district</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">Service Reminders</p>
                  <p className="text-sm text-gray-600">127 installations due for maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
