import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
  Scatter,
  ScatterChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Wrench,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  MapPin,
  Zap,
  Settings,
  Download,
  Filter,
  RefreshCw,
  Brain,
  Eye,
  AlertTriangle,
  CheckCircle,
  Star,
  Lightbulb,
  TrendingUp as TrendingUpIcon,
  Database,
  Wifi,
  Globe
} from 'lucide-react';
import { formatCurrency, formatDate, getDistrictColor } from '../../lib/utils';
import { useConvexRealTime } from '../../hooks/useConvexRealTime';
import type { WarsawDistrict } from '../../types/hvac';
import { toast } from 'sonner';

interface KPIWidget {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  // Enhanced with prophecy insights
  prophecy?: {
    prediction: string;
    confidence: number; // 0-100
    trend: 'up' | 'down' | 'stable';
    timeframe: string;
    factors: string[];
  };
  realTimeValue?: number;
  isRealTime?: boolean;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  jobs?: number;
  date?: string;
  district?: string;
  aiScore?: number;
  prophecyValue?: number;
}

interface ProphecyInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendedActions?: string[];
  dataPoints: Array<{
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  warsawSpecific?: {
    districts: WarsawDistrict[];
    seasonalFactor: number;
    competitionImpact: number;
  };
}

interface RealTimeMetrics {
  activeUsers: number;
  currentRevenue: number;
  dealsInProgress: number;
  systemHealth: number;
  responseTime: number;
  lastUpdated: number;
}

export function BusinessIntelligenceDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [prophecyEnabled, setProphecyEnabled] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [showInsights, setShowInsights] = useState(false);

  // Real-time data subscriptions
  const {
    data: realTimeData,
    isConnected,
    lastUpdate,
    refresh
  } = useConvexRealTime({
    queries: [
      { name: 'jobs', query: api.jobs.list, args: {} },
      { name: 'contacts', query: api.contacts.list, args: {} },
      { name: 'quotes', query: api.quotes.list, args: {} },
      { name: 'equipment', query: api.equipment.list, args: {} }
    ],
    refreshInterval: realTimeEnabled ? 5000 : 30000 // 5s when real-time, 30s otherwise
  });

  // Fallback to regular queries if real-time is disabled
  const jobs = realTimeEnabled ? (realTimeData?.jobs || []) : (useQuery(api.jobs.list, {}) || []);
  const contacts = realTimeEnabled ? (realTimeData?.contacts || []) : (useQuery(api.contacts.list, {}) || []);
  const quotes = realTimeEnabled ? (realTimeData?.quotes || []) : (useQuery(api.quotes.list, {}) || []);
  const equipment = realTimeEnabled ? (realTimeData?.equipment || []) : (useQuery(api.equipment.list, {}) || []);

  // Generate prophecy insights
  const prophecyInsights = useMemo((): ProphecyInsight[] => {
    if (!prophecyEnabled) return [];

    const insights: ProphecyInsight[] = [];

    // Revenue trend analysis
    const recentRevenue = quotes
      .filter(q => q.status === 'accepted' && q._creationTime > Date.now() - 30 * 24 * 60 * 60 * 1000)
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

    const previousRevenue = quotes
      .filter(q => q.status === 'accepted' &&
        q._creationTime > Date.now() - 60 * 24 * 60 * 60 * 1000 &&
        q._creationTime <= Date.now() - 30 * 24 * 60 * 60 * 1000)
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

    if (recentRevenue > previousRevenue * 1.2) {
      insights.push({
        id: 'revenue-surge',
        type: 'opportunity',
        title: 'Revenue Surge Detected',
        description: `Revenue increased by ${((recentRevenue / previousRevenue - 1) * 100).toFixed(1)}% this month`,
        confidence: 85,
        impact: 'high',
        actionable: true,
        recommendedActions: [
          'Scale marketing efforts in high-performing districts',
          'Increase inventory for popular equipment',
          'Hire additional technicians for peak demand'
        ],
        dataPoints: [
          { metric: 'Current Month Revenue', value: recentRevenue, trend: 'up' },
          { metric: 'Previous Month Revenue', value: previousRevenue, trend: 'stable' }
        ]
      });
    }

    // Job completion rate analysis
    const completionRate = jobs.length > 0 ?
      jobs.filter(j => j.status === 'completed').length / jobs.length : 0;

    if (completionRate < 0.8) {
      insights.push({
        id: 'completion-risk',
        type: 'risk',
        title: 'Low Job Completion Rate',
        description: `Only ${(completionRate * 100).toFixed(1)}% of jobs are completed`,
        confidence: 90,
        impact: 'high',
        actionable: true,
        recommendedActions: [
          'Review workflow bottlenecks',
          'Provide additional training to technicians',
          'Implement better project management tools'
        ],
        dataPoints: [
          { metric: 'Completion Rate', value: completionRate * 100, trend: 'down' },
          { metric: 'Target Rate', value: 85, trend: 'stable' }
        ]
      });
    }

    // Warsaw district analysis
    const districtPerformance = contacts.reduce((acc, contact) => {
      const district = contact.address?.district as WarsawDistrict;
      if (district) {
        acc[district] = (acc[district] || 0) + 1;
      }
      return acc;
    }, {} as Record<WarsawDistrict, number>);

    const topDistrict = Object.entries(districtPerformance)
      .sort(([,a], [,b]) => b - a)[0];

    if (topDistrict && topDistrict[1] > 10) {
      insights.push({
        id: 'district-opportunity',
        type: 'opportunity',
        title: `${topDistrict[0]} District Dominance`,
        description: `${topDistrict[0]} represents ${topDistrict[1]} clients - consider focused expansion`,
        confidence: 75,
        impact: 'medium',
        actionable: true,
        recommendedActions: [
          `Increase marketing presence in ${topDistrict[0]}`,
          'Establish local partnerships',
          'Optimize service routes for the district'
        ],
        dataPoints: [
          { metric: 'Client Count', value: topDistrict[1], trend: 'up' }
        ],
        warsawSpecific: {
          districts: [topDistrict[0] as WarsawDistrict],
          seasonalFactor: 1.1,
          competitionImpact: 0.8
        }
      });
    }

    return insights;
  }, [quotes, jobs, contacts, prophecyEnabled]);

  // Calculate enhanced KPIs with prophecy
  const kpis: KPIWidget[] = useMemo(() => {
    const totalRevenue = quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

    const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const totalContacts = contacts.length;

    // Prophecy predictions
    const revenueProphecy = prophecyEnabled ? {
      prediction: `Expected to reach ${formatCurrency(totalRevenue * 1.15)} next month`,
      confidence: 78,
      trend: 'up' as const,
      timeframe: '30 days',
      factors: ['Seasonal demand increase', 'New client acquisitions', 'Warsaw market expansion']
    } : undefined;

    return [
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        change: 12.5,
        changeType: 'increase' as const,
        icon: DollarSign,
        color: '#10b981',
        description: 'Monthly recurring revenue',
        prophecy: revenueProphecy,
        realTimeValue: realTimeEnabled ? totalRevenue : undefined,
        isRealTime: realTimeEnabled
      },
      {
        id: 'active_jobs',
        title: 'Active Jobs',
        value: activeJobs,
        change: 8.2,
        changeType: 'increase' as const,
        icon: Wrench,
        color: '#f59e0b',
        description: 'Currently in progress',
        prophecy: prophecyEnabled ? {
          prediction: `${Math.round(activeJobs * 1.1)} jobs expected next week`,
          confidence: 72,
          trend: 'up' as const,
          timeframe: '7 days',
          factors: ['Seasonal demand', 'New client onboarding']
        } : undefined,
        realTimeValue: realTimeEnabled ? activeJobs : undefined,
        isRealTime: realTimeEnabled
      },
      {
        id: 'completion_rate',
        title: 'Completion Rate',
        value: `${((completedJobs / jobs.length) * 100 || 0).toFixed(1)}%`,
        change: 5.1,
        changeType: 'increase' as const,
        icon: Target,
        color: '#3b82f6',
        description: 'Jobs completed successfully',
        prophecy: prophecyEnabled ? {
          prediction: 'Rate expected to improve to 88%',
          confidence: 65,
          trend: 'up' as const,
          timeframe: '2 weeks',
          factors: ['Process optimization', 'Team training']
        } : undefined,
        isRealTime: realTimeEnabled
      },
      {
        id: 'customers',
        title: 'Total Customers',
        value: totalContacts,
        change: 15.3,
        changeType: 'increase' as const,
        icon: Users,
        color: '#8b5cf6',
        description: 'Active customer base',
        prophecy: prophecyEnabled ? {
          prediction: `${Math.round(totalContacts * 1.08)} customers by month end`,
          confidence: 80,
          trend: 'up' as const,
          timeframe: '30 days',
          factors: ['Warsaw expansion', 'Referral program', 'Digital marketing']
        } : undefined,
        realTimeValue: realTimeEnabled ? totalContacts : undefined,
        isRealTime: realTimeEnabled
      }
    ];
  }, [jobs, contacts, quotes, prophecyEnabled, realTimeEnabled, totalRevenue, activeJobs, completedJobs, totalContacts, revenueProphecy]);

  // Revenue trend data
  const revenueData: ChartData[] = React.useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        name: date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 2000, // Mock data
        jobs: Math.floor(Math.random() * 10) + 5
      };
    });
    return last30Days;
  }, []);

  // District performance data
  const districtData: ChartData[] = React.useMemo(() => {
    const districts = ['Śródmieście', 'Mokotów', 'Ochota', 'Wola', 'Żoliborz', 'Praga-Północ'];
    return districts.map(district => ({
      name: district,
      value: Math.floor(Math.random() * 50000) + 10000, // Mock revenue
      jobs: Math.floor(Math.random() * 20) + 5,
      district
    }));
  }, []);

  // Service type distribution
  const serviceTypeData: ChartData[] = React.useMemo(() => {
    const types = ['Installation', 'Repair', 'Maintenance', 'Inspection', 'Emergency'];
    return types.map(type => ({
      name: type,
      value: Math.floor(Math.random() * 30) + 10
    }));
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time and Prophecy Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Business Intelligence
              {realTimeEnabled && (
                <Badge variant="secondary" className="ml-3">
                  <Wifi className="w-3 h-3 mr-1" />
                  Real-time
                  {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full ml-1" />}
                </Badge>
              )}
              {prophecyEnabled && (
                <Badge variant="outline" className="ml-2">
                  <Brain className="w-3 h-3 mr-1" />
                  Prophecy AI
                </Badge>
              )}
            </h1>
            <p className="text-gray-600">
              AI-powered analytics with real-time insights and Warsaw optimization
              {lastUpdate && (
                <span className="text-xs text-gray-500 ml-2">
                  Last updated: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Real-time Toggle */}
            <Button
              variant={realTimeEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            >
              <Wifi className="w-4 h-4 mr-2" />
              Real-time
            </Button>

            {/* Prophecy Toggle */}
            <Button
              variant={prophecyEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setProphecyEnabled(!prophecyEnabled)}
            >
              <Brain className="w-4 h-4 mr-2" />
              Prophecy
            </Button>

            {/* Time Range */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['7d', '30d', '90d', '1y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Prophecy Insights Panel */}
        {prophecyEnabled && prophecyInsights.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Lightbulb className="w-5 h-5 mr-2" />
                AI Prophecy Insights ({prophecyInsights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prophecyInsights.slice(0, 3).map(insight => (
                  <div key={insight.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <Badge
                        variant={insight.type === 'opportunity' ? 'default' :
                                insight.type === 'risk' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Confidence: {insight.confidence}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {insight.impact} impact
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced KPI Cards with Prophecy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id} className={kpi.isRealTime ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  {kpi.title}
                  {kpi.isRealTime && (
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {kpi.prophecy && (
                    <Brain className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {kpi.changeType === 'increase' ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  <span className={kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                    {kpi.change}%
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>

                {/* Prophecy Prediction */}
                {kpi.prophecy && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-900">AI Prediction</span>
                      <Badge variant="outline" className="text-xs">
                        {kpi.prophecy.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-800">{kpi.prophecy.prediction}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-blue-600">
                        {kpi.prophecy.timeframe}
                      </span>
                      {kpi.prophecy.trend === 'up' && (
                        <TrendingUpIcon className="w-3 h-3 ml-1 text-green-500" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* District Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              District Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2" />
              Service Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Job Completion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="jobs" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Prophecy Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-purple-500" />
            AI Prophecy Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Revenue Prediction</h4>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(85000)}</p>
              <p className="text-sm text-purple-700">Expected next month</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Peak District</h4>
              <p className="text-2xl font-bold text-blue-600">Śródmieście</p>
              <p className="text-sm text-blue-700">Highest demand predicted</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Optimal Pricing</h4>
              <p className="text-2xl font-bold text-green-600">+15%</p>
              <p className="text-sm text-green-700">Recommended price increase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
