/**
 * Enhanced Service Module
 * Based on RRUP documentation for service management
 * Features: Configurable statuses, automatic actions, priorities, categories
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Wrench as Tool,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3,
  Star,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import type { 
  Service, 
  ServiceStatus, 
  ServicePriority, 
  ServiceCategory,
  ServiceType,
  ServiceFilters,
  ServiceStats
} from '../../types/service';
import { toast } from 'sonner';

// Default service statuses (RRUP-inspired)
const DEFAULT_SERVICE_STATUSES: ServiceStatus[] = [
  { 
    id: 'reported', 
    name: 'Zgłoszony', 
    color: '#3b82f6', 
    order: 1, 
    isActive: true, 
    requiresDate: false,
    automaticActions: [
      {
        id: 'auto_1',
        type: 'email',
        recipient: 'client',
        template: 'Dziękujemy za zgłoszenie serwisu {{serwis_numer}}. Skontaktujemy się w ciągu 2 godzin.'
      }
    ]
  },
  { 
    id: 'scheduled', 
    name: 'Zaplanowany', 
    color: '#10b981', 
    order: 2, 
    isActive: true, 
    requiresDate: true,
    automaticActions: [
      {
        id: 'auto_2',
        type: 'sms',
        recipient: 'client',
        template: 'Serwis {{serwis_numer}} zaplanowany na {{serwis_data}} o {{serwis_czas}}. {{firma_telefon}}'
      }
    ]
  },
  { 
    id: 'in_progress', 
    name: 'W trakcie', 
    color: '#f59e0b', 
    order: 3, 
    isActive: true, 
    requiresDate: false,
    automaticActions: []
  },
  { 
    id: 'waiting_parts', 
    name: 'Oczekuje na części', 
    color: '#8b5cf6', 
    order: 4, 
    isActive: true, 
    requiresDate: false,
    automaticActions: [
      {
        id: 'auto_3',
        type: 'task',
        recipient: 'manager',
        template: 'Zamów części dla serwisu {{serwis_numer}} - {{serwis_tytul}}'
      }
    ]
  },
  { 
    id: 'completed', 
    name: 'Zrealizowany', 
    color: '#22c55e', 
    order: 5, 
    isActive: true, 
    requiresDate: true,
    automaticActions: [
      {
        id: 'auto_4',
        type: 'email',
        recipient: 'client',
        template: 'Serwis {{serwis_numer}} został zakończony. Dziękujemy za zaufanie. {{firma_nazwa}}'
      }
    ]
  },
  { 
    id: 'cancelled', 
    name: 'Anulowany', 
    color: '#ef4444', 
    order: 6, 
    isActive: true, 
    requiresDate: false,
    automaticActions: []
  }
];

// Service priority configurations
const PRIORITY_CONFIG = {
  emergency: { label: 'Awaria', color: '#dc2626', icon: AlertTriangle },
  urgent: { label: 'Pilny', color: '#ea580c', icon: Clock },
  high: { label: 'Wysoki', color: '#f59e0b', icon: AlertTriangle },
  normal: { label: 'Normalny', color: '#3b82f6', icon: CheckCircle },
  low: { label: 'Niski', color: '#6b7280', icon: Clock }
};

// Service category configurations
const CATEGORY_CONFIG = {
  preventive_maintenance: { label: 'Konserwacja prewencyjna', icon: Tool },
  corrective_maintenance: { label: 'Konserwacja naprawcza', icon: Tool },
  emergency_repair: { label: 'Naprawa awaryjna', icon: AlertTriangle },
  warranty_service: { label: 'Serwis gwarancyjny', icon: CheckCircle },
  inspection: { label: 'Przegląd', icon: Eye },
  cleaning: { label: 'Czyszczenie', icon: Tool },
  filter_replacement: { label: 'Wymiana filtrów', icon: Tool },
  refrigerant_service: { label: 'Serwis czynnika', icon: Tool },
  electrical_service: { label: 'Serwis elektryczny', icon: Tool },
  mechanical_service: { label: 'Serwis mechaniczny', icon: Tool },
  diagnostic: { label: 'Diagnostyka', icon: Search },
  upgrade: { label: 'Modernizacja', icon: Upload },
  seasonal_service: { label: 'Serwis sezonowy', icon: Calendar }
};

export function EnhancedServiceModule() {
  // State management
  const [selectedView, setSelectedView] = useState<'list' | 'kanban' | 'calendar' | 'map'>('kanban');
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showStatusConfig, setShowStatusConfig] = useState(false);
  const [statuses, setStatuses] = useState<ServiceStatus[]>(DEFAULT_SERVICE_STATUSES);

  // Data queries (using existing jobs as services for now)
  const services = useQuery(api.jobs.list, {}) || [];
  const contacts = useQuery(api.contacts.list, {}) || [];
  const users = useQuery(api.users.list, {}) || [];

  // Mutations (using existing jobs mutations for now)
  const createService = useMutation(api.jobs.create);
  const updateService = useMutation(api.jobs.update);

  // Calculate statistics
  const stats: ServiceStats = React.useMemo(() => {
    const total = services.length;
    const byStatus = services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = services.reduce((acc, service) => {
      acc[service.priority as ServicePriority] = (acc[service.priority as ServicePriority] || 0) + 1;
      return acc;
    }, {} as Record<ServicePriority, number>);

    const completed = services.filter(service => service.status === 'completed');
    const overdue = services.filter(service => 
      service.scheduledDate && service.scheduledDate < Date.now() && service.status !== 'completed'
    );

    return {
      total,
      byStatus,
      byPriority,
      byCategory: {} as Record<ServiceCategory, number>,
      byType: {} as Record<ServiceType, number>,
      byDistrict: {},
      avgResponseTime: 2.5, // hours - mock data
      avgCompletionTime: 4.2, // hours - mock data
      firstTimeFixRate: 85, // percentage - mock data
      customerSatisfactionAvg: 4.3, // 1-5 scale - mock data
      overdueCount: overdue.length
    };
  }, [services]);

  // Filter services based on search and filters
  const filteredServices = React.useMemo(() => {
    return services.filter(service => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          service.title.toLowerCase().includes(searchLower) ||
          service.description.toLowerCase().includes(searchLower) ||
          service.district?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(service.status)) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(service.priority as ServicePriority)) return false;
      }

      return true;
    });
  }, [services, searchQuery, filters]);

  // Group services by status for Kanban view
  const servicesByStatus = React.useMemo(() => {
    const grouped = statuses.reduce((acc, status) => {
      acc[status.id] = filteredServices.filter(service => service.status === status.id);
      return acc;
    }, {} as Record<string, any[]>);
    return grouped;
  }, [filteredServices, statuses]);

  // Handle status change with automatic actions
  const handleStatusChange = async (serviceId: string, newStatusId: string) => {
    try {
      const newStatus = statuses.find(s => s.id === newStatusId);
      
      // Update service status
      await updateService({
        id: serviceId,
        status: newStatusId
      });

      // Execute automatic actions
      if (newStatus?.automaticActions && newStatus.automaticActions.length > 0) {
        for (const action of newStatus.automaticActions) {
          // Here you would implement the actual action execution
          console.log(`Executing ${action.type} action:`, action.template);
          
          // Show notification about automatic action
          toast.info(`Automatyczna akcja: ${action.type} wysłany do ${action.recipient}`);
        }
      }

      toast.success('Status serwisu zaktualizowany');
    } catch (error) {
      toast.error('Błąd podczas aktualizacji statusu');
    }
  };

  // Get status configuration
  const getStatusConfig = (statusId: string): ServiceStatus => {
    return statuses.find(s => s.id === statusId) || statuses[0];
  };

  // Get priority configuration
  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serwisy</h1>
          <p className="text-gray-600 mt-1">
            Zarządzanie serwisami HVAC • {stats.total} aktywnych • {stats.overdueCount} przeterminowanych
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowStatusConfig(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Statusy
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nowy serwis
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie serwisy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Tool className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Przeterminowane</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Czas reakcji</p>
                <p className="text-2xl font-bold text-green-600">{stats.avgResponseTime}h</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pierwsza naprawa</p>
                <p className="text-2xl font-bold text-blue-600">{stats.firstTimeFixRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satysfakcja</p>
                <p className="text-2xl font-bold text-purple-600">{stats.customerSatisfactionAvg}/5</p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Szukaj serwisów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="kanban">Kanban</option>
            <option value="list">Lista</option>
            <option value="calendar">Kalendarz</option>
            <option value="map">Mapa</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtry
          </Button>
        </div>
      </div>

      {/* Main Content - Kanban View */}
      {selectedView === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 overflow-x-auto">
          {statuses.filter(status => status.isActive).map(status => (
            <Card key={status.id} className="min-w-80">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                    {status.requiresDate && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                        Data
                      </span>
                    )}
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {servicesByStatus[status.id]?.length || 0}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {servicesByStatus[status.id]?.map(service => {
                  const priorityConfig = getPriorityConfig(service.priority);
                  const PriorityIcon = priorityConfig.icon;
                  
                  return (
                    <div
                      key={service._id}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedService(service._id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                          {service.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <PriorityIcon 
                            className="w-3 h-3" 
                            style={{ color: priorityConfig.color }}
                          />
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: priorityConfig.color + '20',
                              color: priorityConfig.color 
                            }}
                          >
                            {priorityConfig.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {service.district || 'Brak lokalizacji'}
                        </div>
                        {service.scheduledDate && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(service.scheduledDate).toLocaleDateString('pl-PL')}
                          </div>
                        )}
                        {service.assignedTechnicians.length > 0 && (
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {service.assignedTechnicians.length} technik(ów)
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            #{service._id.slice(-6)}
                          </span>
                          <div className="flex items-center space-x-1">
                            {service.priority === 'emergency' && (
                              <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">
                                AWARIA
                              </span>
                            )}
                            {status.automaticActions.length > 0 && (
                              <MessageSquare className="w-3 h-3 text-blue-500" title="Automatyczne akcje" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {servicesByStatus[status.id]?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Tool className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Brak serwisów</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Configuration Modal */}
      {showStatusConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Konfiguracja statusów serwisów
                <Button variant="outline" onClick={() => setShowStatusConfig(false)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statuses.map((status, index) => (
                  <div key={status.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="font-medium">{status.name}</span>
                        {status.requiresDate && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Wymaga daty realizacji
                          </span>
                        )}
                        {status.automaticActions.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {status.automaticActions.length} akcji automatycznych
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          {status.isActive ? '✓' : '✗'}
                        </Button>
                      </div>
                    </div>
                    
                    {status.automaticActions.length > 0 && (
                      <div className="ml-7 space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Akcje automatyczne:</h5>
                        {status.automaticActions.map(action => (
                          <div key={action.id} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-medium capitalize">{action.type}</span> → {action.recipient}: 
                            <span className="italic ml-1">{action.template.substring(0, 50)}...</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
