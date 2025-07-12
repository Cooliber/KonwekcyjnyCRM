import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Wrench,
  MapPin,
  Calendar,
  Clock,
  Target,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  Star,
  Building,
  Thermometer,
  Gauge,
  RefreshCw,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';
import type { WarsawDistrict } from '../../types/hvac';
import { Id } from '../../../convex/_generated/dataModel';

interface AnalyticsData {
  revenue: {
    monthly: number;
    quarterly: number;
    annual: number;
    growth: number;
  };
  customers: {
    total: number;
    new: number;
    retention: number;
    satisfaction: number;
  };
  services: {
    completed: number;
    pending: number;
    efficiency: number;
    avgResponseTime: number;
  };
  equipment: {
    monitored: number;
    alerts: number;
    uptime: number;
    energyEfficiency: number;
  };
}

interface DistrictPerformance {
  district: WarsawDistrict;
  revenue: number;
  customers: number;
  services: number;
  satisfaction: number;
  growth: number;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  services: number;
  customers: number;
  efficiency: number;
}

export function AdvancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Real Convex queries
  const analyticsData = useQuery(api.advancedAnalytics.getAnalyticsData, {
    timeRange,
    district: selectedDistrict !== 'all' ? selectedDistrict : undefined
  });

  const revenueMetrics = useQuery(api.advancedAnalytics.getRevenueMetrics, {
    timeRange,
    district: selectedDistrict !== 'all' ? selectedDistrict : undefined
  });

  const customerMetrics = useQuery(api.advancedAnalytics.getCustomerMetrics, {
    timeRange,
    district: selectedDistrict !== 'all' ? selectedDistrict : undefined
  });

  const serviceMetrics = useQuery(api.advancedAnalytics.getServiceMetrics, {
    timeRange,
    district: selectedDistrict !== 'all' ? selectedDistrict : undefined
  });

  const equipmentMetrics = useQuery(api.advancedAnalytics.getEquipmentMetrics, {
    timeRange,
    district: selectedDistrict !== 'all' ? selectedDistrict : undefined
  });

  // Combine metrics into analytics data structure
  const combinedAnalyticsData: AnalyticsData = {
    revenue: revenueMetrics ? {
      monthly: revenueMetrics.totalRevenue,
      quarterly: revenueMetrics.totalRevenue * 3,
      annual: revenueMetrics.totalRevenue * 12,
      growth: revenueMetrics.growth
    } : { monthly: 0, quarterly: 0, annual: 0, growth: 0 },
    customers: customerMetrics ? {
      total: customerMetrics.total,
      new: customerMetrics.new,
      retention: customerMetrics.retention,
      satisfaction: customerMetrics.satisfaction
    } : { total: 0, new: 0, retention: 0, satisfaction: 0 },
    services: serviceMetrics ? {
      completed: serviceMetrics.completed,
      pending: serviceMetrics.pending,
      efficiency: serviceMetrics.efficiency,
      avgResponseTime: serviceMetrics.avgResponseTime
    } : { completed: 0, pending: 0, efficiency: 0, avgResponseTime: 0 },
    equipment: equipmentMetrics ? {
      monitored: equipmentMetrics.monitored,
      alerts: equipmentMetrics.alerts,
      uptime: equipmentMetrics.uptime,
      energyEfficiency: equipmentMetrics.energyEfficiency
    } : { monitored: 0, alerts: 0, uptime: 0, energyEfficiency: 0 }
  };

  // Use real data if available, fallback to loading state
  const displayData = analyticsData || combinedAnalyticsData;
  const isLoading = !analyticsData || !revenueMetrics || !customerMetrics || !serviceMetrics || !equipmentMetrics;

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Convex queries will automatically refresh
      toast.success('Dane zostały odświeżone');
    } catch (error) {
      toast.error('Błąd podczas odświeżania danych');
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // Mock district performance data - this could also be moved to Convex
  const districtPerformance: DistrictPerformance[] = [
    {
      district: 'Śródmieście',
      revenue: 45000,
      customers: 28,
      services: 34,
      satisfaction: 4.8,
      growth: 18.5
    },
    {
      district: 'Mokotów',
      revenue: 32000,
      customers: 22,
      services: 26,
      satisfaction: 4.5,
      growth: 12.3
    },
    {
      district: 'Wilanów',
      revenue: 28000,
      customers: 18,
      services: 19,
      satisfaction: 4.7,
      growth: 22.1
    },
    {
      district: 'Żoliborz',
      revenue: 20000,
      customers: 15,
      services: 10,
      satisfaction: 4.3,
      growth: 8.7
    }
  ];

  const timeSeriesData: TimeSeriesData[] = [
    { date: '2024-01', revenue: 98000, services: 67, customers: 144, efficiency: 94.2 },
    { date: '2024-02', revenue: 112000, services: 78, customers: 148, efficiency: 95.1 },
    { date: '2024-03', revenue: 125000, services: 89, customers: 156, efficiency: 96.8 },
    { date: '2024-04', revenue: 118000, services: 82, customers: 159, efficiency: 95.9 },
    { date: '2024-05', revenue: 134000, services: 95, customers: 162, efficiency: 97.2 },
    { date: '2024-06', revenue: 142000, services: 103, customers: 168, efficiency: 97.8 }
  ];

  const serviceTypeData = [
    { name: 'Instalacje', value: 35, color: '#1A3E7C' },
    { name: 'Serwis', value: 40, color: '#F2994A' },
    { name: 'Konserwacja', value: 20, color: '#27AE60' },
    { name: 'Naprawa', value: 5, color: '#E74C3C' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Dane zostały odświeżone');
  };

  const handleExport = () => {
    toast.success('Eksportowanie raportu...');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zaawansowana Analityka</h1>
          <p className="text-gray-600 mt-1">
            Kompleksowa analiza wydajności HVAC z optymalizacją dla Warszawy
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dni</SelectItem>
              <SelectItem value="30d">30 dni</SelectItem>
              <SelectItem value="90d">90 dni</SelectItem>
              <SelectItem value="1y">1 rok</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Eksport
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Przychód Miesięczny</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    formatCurrency(displayData.revenue.monthly)
                  )}
                </p>
                <div className="flex items-center mt-1">
                  {!isLoading && React.createElement(getGrowthIcon(displayData.revenue.growth), {
                    className: `w-4 h-4 mr-1 ${getGrowthColor(displayData.revenue.growth)}`
                  })}
                  {!isLoading && (
                    <span className={`text-sm font-medium ${getGrowthColor(displayData.revenue.growth)}`}>
                      {displayData.revenue.growth > 0 ? '+' : ''}{displayData.revenue.growth.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Klienci</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    displayData.customers.total
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? (
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    `+${displayData.customers.new} nowych`
                  )}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efektywność Serwisu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    `${displayData.services.efficiency.toFixed(1)}%`
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? (
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    `Śr. czas: ${displayData.services.avgResponseTime.toFixed(1)}h`
                  )}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime Urządzeń</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.equipment.uptime}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analyticsData.equipment.alerts} alertów
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="revenue">Przychody</TabsTrigger>
          <TabsTrigger value="performance">Wydajność</TabsTrigger>
          <TabsTrigger value="districts">Dzielnice</TabsTrigger>
          <TabsTrigger value="predictions">Prognozy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Przychodów</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#1A3E7C" 
                      strokeWidth={2}
                      dot={{ fill: '#1A3E7C' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rozkład Typów Usług</CardTitle>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Efektywność Serwisu</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#F2994A" 
                      fill="#F2994A" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Wzrost Liczby Klientów</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="customers" fill="#27AE60" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Analiza Przychodów</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Miesięczny</p>
                  <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.monthly)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Kwartalny</p>
                  <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.quarterly)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Roczny</p>
                  <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.annual)}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1A3E7C" 
                    strokeWidth={3}
                    dot={{ fill: '#1A3E7C', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>KPI Wydajności</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Efektywność Serwisu</span>
                    <span className="text-sm text-gray-600">{analyticsData.services.efficiency}%</span>
                  </div>
                  <Progress value={analyticsData.services.efficiency} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Retencja Klientów</span>
                    <span className="text-sm text-gray-600">{analyticsData.customers.retention}%</span>
                  </div>
                  <Progress value={analyticsData.customers.retention} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Uptime Urządzeń</span>
                    <span className="text-sm text-gray-600">{analyticsData.equipment.uptime}%</span>
                  </div>
                  <Progress value={analyticsData.equipment.uptime} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Efektywność Energetyczna</span>
                    <span className="text-sm text-gray-600">{analyticsData.equipment.energyEfficiency}%</span>
                  </div>
                  <Progress value={analyticsData.equipment.energyEfficiency} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satysfakcja Klientów</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {analyticsData.customers.satisfaction}/5
                  </div>
                  <div className="flex justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.floor(analyticsData.customers.satisfaction)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-center text-gray-600">
                  Średnia ocena na podstawie {analyticsData.customers.total} opinii
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="districts">
          <Card>
            <CardHeader>
              <CardTitle>Wydajność według Dzielnic Warszawy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {districtPerformance.map((district) => (
                  <div key={district.district} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold">{district.district}</h3>
                      <div className="flex items-center gap-2">
                        {React.createElement(getGrowthIcon(district.growth), {
                          className: `w-4 h-4 ${getGrowthColor(district.growth)}`
                        })}
                        <span className={`text-sm font-medium ${getGrowthColor(district.growth)}`}>
                          {district.growth > 0 ? '+' : ''}{district.growth}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Przychód</p>
                        <p className="font-semibold">{formatCurrency(district.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Klienci</p>
                        <p className="font-semibold">{district.customers}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Serwisy</p>
                        <p className="font-semibold">{district.services}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Satysfakcja</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{district.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Prognozy AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Moduł prognoz AI będzie dostępny wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
