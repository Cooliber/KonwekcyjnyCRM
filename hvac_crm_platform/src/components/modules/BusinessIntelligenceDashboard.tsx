import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
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
  AreaChart
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
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate, getDistrictColor } from '../../lib/utils';

interface KPIWidget {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  jobs?: number;
  date?: string;
  district?: string;
}

export function BusinessIntelligenceDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Data queries
  const jobs = useQuery(api.jobs.list, {}) || [];
  const contacts = useQuery(api.contacts.list, {}) || [];
  const quotes = useQuery(api.quotes.list, {}) || [];
  const equipment = useQuery(api.equipment.list, {}) || [];

  // Calculate KPIs
  const kpis: KPIWidget[] = React.useMemo(() => {
    const totalRevenue = quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
    
    const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const totalContacts = contacts.length;

    return [
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        change: 12.5,
        changeType: 'increase' as const,
        icon: DollarSign,
        color: '#10b981',
        description: 'Monthly recurring revenue'
      },
      {
        id: 'active_jobs',
        title: 'Active Jobs',
        value: activeJobs,
        change: 8.2,
        changeType: 'increase' as const,
        icon: Wrench,
        color: '#f59e0b',
        description: 'Currently in progress'
      },
      {
        id: 'completion_rate',
        title: 'Completion Rate',
        value: `${((completedJobs / jobs.length) * 100 || 0).toFixed(1)}%`,
        change: 5.1,
        changeType: 'increase' as const,
        icon: Target,
        color: '#3b82f6',
        description: 'Jobs completed successfully'
      },
      {
        id: 'customers',
        title: 'Total Customers',
        value: totalContacts,
        change: 15.3,
        changeType: 'increase' as const,
        icon: Users,
        color: '#8b5cf6',
        description: 'Active customer base'
      }
    ];
  }, [jobs, contacts, quotes]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600">Analytics and insights for your HVAC business</p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
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
