import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  TrendingUp,
  MapPin,
  Building,
  User,
  Phone,
  Mail,
  Settings,
  BarChart3,
  RefreshCw,
  Bell,
  Star,
  DollarSign,
  FileText,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import type { WarsawDistrict } from '../../types/hvac';
import { Id } from '../../../convex/_generated/dataModel';

interface ServiceAgreement {
  _id: Id<"serviceAgreements">;
  agreementNumber: string;
  title: string;
  clientId: Id<"contacts">;
  clientName: string;
  clientAddress: string;
  district: WarsawDistrict;
  serviceLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'pending' | 'suspended' | 'expired' | 'cancelled' | 'renewal_pending';
  startDate: number;
  endDate: number;
  monthlyValue: number;
  annualValue: number;
  currency: string;
  vatRate: number;
  equipmentCount: number;
  equipmentIds: Id<"equipment">[];
  serviceFrequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  responseTime: number; // hours
  slaLevel: number; // percentage
  emergencySupport: boolean;
  partsIncluded: boolean;
  laborIncluded: boolean;
  lastServiceDate?: number;
  nextServiceDate: number;
  completedServices: number;
  totalServices: number;
  satisfactionScore: number; // 1-5
  slaCompliance: number; // percentage
  avgResponseTime: number;
  renewalDate: number;
  autoRenewal: boolean;
  renewalNotificationSent: boolean;
  serviceHistory: Array<{
    date: number;
    type: string;
    technicianId: Id<"users">;
    duration: number;
    notes: string;
    satisfactionRating?: number;
    slaCompliant: boolean;
  }>;
  districtPriority: number;
  routeOptimized: boolean;
  notificationSettings: {
    serviceReminders: boolean;
    slaBreaches: boolean;
    renewalAlerts: boolean;
    satisfactionSurveys: boolean;
  };
  relatedJobIds: Id<"jobs">[];
  createdBy: Id<"users">;
  lastModifiedBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

interface ServiceSchedule {
  _id: string;
  agreementId: string;
  scheduledDate: string;
  serviceType: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  technicianId?: string;
  technicianName?: string;
  estimatedDuration: number; // hours
  actualDuration?: number;
  notes?: string;
  equipmentIds: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SLAMetrics {
  agreementId: string;
  responseTimeCompliance: number; // percentage
  serviceQualityScore: number; // 1-5
  completionRate: number; // percentage
  customerSatisfaction: number; // 1-5
  costEfficiency: number; // percentage
  equipmentUptime: number; // percentage
}

export function ServiceAgreementModule() {
  const [activeTab, setActiveTab] = useState('agreements');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceLevelFilter, setServiceLevelFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<ServiceAgreement | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Real Convex queries
  const agreements = useQuery(api.serviceAgreements.getServiceAgreements, {
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    district: districtFilter !== 'all' ? districtFilter : undefined,
    serviceLevel: serviceLevelFilter !== 'all' ? serviceLevelFilter as any : undefined,
    limit: 50
  }) || [];

  const createServiceAgreement = useMutation(api.serviceAgreements.createServiceAgreement);
  const updateServiceAgreement = useMutation(api.serviceAgreements.updateServiceAgreement);
  const recordServiceCompletion = useMutation(api.serviceAgreements.recordServiceCompletion);
  const renewServiceAgreement = useMutation(api.serviceAgreements.renewServiceAgreement);

  // Get agreements due for service
  const agreementsDueForService = useQuery(api.serviceAgreements.getAgreementsDueForService, {
    daysAhead: 7
  }) || [];

  // Get SLA compliance report
  const slaReport = useQuery(api.serviceAgreements.getSLAComplianceReport, {
    district: districtFilter !== 'all' ? districtFilter : undefined
  });

  // Mock service schedules - these could also be moved to Convex
  const serviceSchedules: ServiceSchedule[] = [
    {
      _id: 's1',
      agreementId: '1',
      scheduledDate: '2024-04-15',
      serviceType: 'preventive',
      status: 'scheduled',
      technicianName: 'Jan Kowalski',
      estimatedDuration: 6,
      equipmentIds: ['eq1', 'eq2', 'eq3'],
      priority: 'medium'
    },
    {
      _id: 's2',
      agreementId: '2',
      scheduledDate: '2024-08-01',
      serviceType: 'preventive',
      status: 'scheduled',
      estimatedDuration: 4,
      equipmentIds: ['eq4', 'eq5'],
      priority: 'low'
    }
  ];

  // No need for additional filtering since we're using Convex queries with filters
  const filteredAgreements = agreements;

  // Helper functions
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pl-PL');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  // Event handlers
  const handleCreateAgreement = async (agreementData: any) => {
    try {
      const agreementId = await createServiceAgreement({
        agreementNumber: agreementData.agreementNumber,
        title: agreementData.title,
        clientId: agreementData.clientId,
        clientName: agreementData.clientName,
        clientAddress: agreementData.clientAddress,
        district: agreementData.district,
        serviceLevel: agreementData.serviceLevel,
        startDate: new Date(agreementData.startDate).getTime(),
        endDate: new Date(agreementData.endDate).getTime(),
        monthlyValue: agreementData.monthlyValue,
        equipmentIds: agreementData.equipmentIds || [],
        serviceFrequency: agreementData.serviceFrequency,
        responseTime: agreementData.responseTime,
        slaLevel: agreementData.slaLevel,
        emergencySupport: agreementData.emergencySupport || false,
        partsIncluded: agreementData.partsIncluded || false,
        laborIncluded: agreementData.laborIncluded || false,
        autoRenewal: agreementData.autoRenewal || false
      });

      toast.success(`Umowa serwisowa ${agreementData.agreementNumber} została utworzona`);
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(`Błąd podczas tworzenia umowy: ${error}`);
    }
  };

  const handleUpdateAgreement = async (agreement: ServiceAgreement, updates: any) => {
    try {
      await updateServiceAgreement({
        agreementId: agreement._id,
        updates
      });

      toast.success(`Umowa ${agreement.agreementNumber} została zaktualizowana`);
    } catch (error) {
      toast.error(`Błąd podczas aktualizacji umowy: ${error}`);
    }
  };

  const handleRecordService = async (agreement: ServiceAgreement, serviceData: any) => {
    try {
      await recordServiceCompletion({
        agreementId: agreement._id,
        serviceData: {
          date: new Date(serviceData.date).getTime(),
          type: serviceData.type,
          technicianId: serviceData.technicianId,
          duration: serviceData.duration,
          notes: serviceData.notes,
          satisfactionRating: serviceData.satisfactionRating,
          slaCompliant: serviceData.slaCompliant,
          partsUsed: serviceData.partsUsed,
          cost: serviceData.cost
        }
      });

      toast.success(`Serwis dla umowy ${agreement.agreementNumber} został zarejestrowany`);
    } catch (error) {
      toast.error(`Błąd podczas rejestracji serwisu: ${error}`);
    }
  };

  const handleRenewAgreement = async (agreement: ServiceAgreement) => {
    try {
      const newEndDate = new Date(agreement.endDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      await renewServiceAgreement({
        agreementId: agreement._id,
        newEndDate: newEndDate.getTime()
      });

      toast.success(`Umowa ${agreement.agreementNumber} została odnowiona`);
    } catch (error) {
      toast.error(`Błąd podczas odnawiania umowy: ${error}`);
    }
  };

  const getStatusBadge = (status: ServiceAgreement['status']) => {
    const variants = {
      active: 'success',
      pending: 'warning',
      suspended: 'destructive',
      expired: 'secondary',
      cancelled: 'destructive',
      renewal_pending: 'warning'
    } as const;

    const labels = {
      active: 'Aktywny',
      pending: 'Oczekujący',
      suspended: 'Zawieszony',
      expired: 'Wygasły',
      cancelled: 'Anulowany',
      renewal_pending: 'Oczekuje odnowienia'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getServiceLevelBadge = (level: ServiceAgreement['serviceLevel']) => {
    const variants = {
      basic: 'secondary',
      standard: 'default',
      premium: 'warning',
      enterprise: 'success'
    } as const;

    const labels = {
      basic: 'Podstawowy',
      standard: 'Standardowy',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };

    return (
      <Badge variant={variants[level]}>
        {labels[level]}
      </Badge>
    );
  };

  const getSLAColor = (slaLevel: number) => {
    if (slaLevel >= 99) return 'text-green-600';
    if (slaLevel >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getServiceProgress = (completed: number, total: number) => {
    return (completed / total) * 100;
  };

  const handleCreateAgreement = () => {
    setIsCreateDialogOpen(true);
  };

  const handleViewAgreement = (agreement: ServiceAgreement) => {
    setSelectedAgreement(agreement);
    toast.success(`Otwieranie umowy serwisowej ${agreement.agreementNumber}`);
  };

  const handleScheduleService = (agreement: ServiceAgreement) => {
    toast.success(`Planowanie serwisu dla ${agreement.agreementNumber}`);
  };

  const handleRenewAgreement = (agreement: ServiceAgreement) => {
    toast.success(`Inicjowanie odnowienia umowy ${agreement.agreementNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Umowy Serwisowe</h1>
          <p className="text-gray-600 mt-1">
            Zarządzanie umowami serwisowymi z monitoringiem SLA
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateAgreement} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Nowa Umowa
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Raporty SLA
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywne Umowy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agreements.filter(a => a.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Średnie SLA</p>
                <p className="text-2xl font-bold text-gray-900">97.3%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Przychód Miesięczny</p>
                <p className="text-2xl font-bold text-gray-900">12.7k PLN</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satysfakcja</p>
                <p className="text-2xl font-bold text-gray-900">4.5/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agreements">Umowy</TabsTrigger>
          <TabsTrigger value="schedule">Harmonogram</TabsTrigger>
          <TabsTrigger value="sla">Monitoring SLA</TabsTrigger>
          <TabsTrigger value="renewals">Odnowienia</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Szukaj umów..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie statusy</SelectItem>
                    <SelectItem value="active">Aktywny</SelectItem>
                    <SelectItem value="pending">Oczekujący</SelectItem>
                    <SelectItem value="suspended">Zawieszony</SelectItem>
                    <SelectItem value="expired">Wygasły</SelectItem>
                    <SelectItem value="cancelled">Anulowany</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={serviceLevelFilter} onValueChange={setServiceLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Poziom serwisu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie poziomy</SelectItem>
                    <SelectItem value="basic">Podstawowy</SelectItem>
                    <SelectItem value="standard">Standardowy</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={districtFilter} onValueChange={setDistrictFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dzielnica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie dzielnice</SelectItem>
                    <SelectItem value="Śródmieście">Śródmieście</SelectItem>
                    <SelectItem value="Mokotów">Mokotów</SelectItem>
                    <SelectItem value="Wilanów">Wilanów</SelectItem>
                    <SelectItem value="Żoliborz">Żoliborz</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Odśwież
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agreements List */}
          <div className="grid gap-4">
            {filteredAgreements.map((agreement) => (
              <Card key={agreement._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{agreement.title}</h3>
                        {getStatusBadge(agreement.status)}
                        {getServiceLevelBadge(agreement.serviceLevel)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{agreement.agreementNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{agreement.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{agreement.district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{agreement.monthlyValue.toLocaleString('pl-PL')} PLN/mies.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">SLA Level</p>
                          <p className={`font-semibold ${getSLAColor(agreement.slaLevel)}`}>
                            {agreement.slaLevel}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Czas odpowiedzi</p>
                          <p className="font-semibold">{agreement.responseTime}h</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Następny serwis</p>
                          <p className="font-semibold">{agreement.nextServiceDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Satysfakcja</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{agreement.satisfactionScore}/5</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Postęp serwisów ({agreement.completedServices}/{agreement.totalServices})</span>
                          <span>{Math.round(getServiceProgress(agreement.completedServices, agreement.totalServices))}%</span>
                        </div>
                        <Progress 
                          value={getServiceProgress(agreement.completedServices, agreement.totalServices)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAgreement(agreement)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Szczegóły
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleService(agreement)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Zaplanuj
                      </Button>
                      {new Date(agreement.renewalDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenewAgreement(agreement)}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Odnów
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Harmonogram Serwisów</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Harmonogram serwisów będzie dostępny wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Monitoring SLA będzie dostępny wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals">
          <Card>
            <CardHeader>
              <CardTitle>Odnowienia Umów</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Moduł odnowień będzie dostępny wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
