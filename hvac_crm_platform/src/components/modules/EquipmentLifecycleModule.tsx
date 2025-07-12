import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { WarsawDistrict } from "../../types/hvac";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface Equipment {
  _id: Id<"equipmentLifecycle">;
  equipmentId: Id<"equipment">;
  serialNumber: string;
  model: string;
  manufacturer: string;
  type:
    | "split_ac"
    | "multi_split"
    | "vrf_system"
    | "heat_pump"
    | "thermostat"
    | "ductwork"
    | "ventilation";
  status:
    | "operational"
    | "maintenance_required"
    | "repair_needed"
    | "end_of_life"
    | "decommissioned";
  location: {
    clientId: Id<"contacts">;
    clientName: string;
    address: string;
    district: WarsawDistrict;
    building?: string;
    floor?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  installation: {
    date: number;
    technicianId: Id<"users">;
    warrantyExpiry: number;
    cost: number;
    jobId?: Id<"jobs">;
  };
  specifications: {
    capacity: number; // kW
    energyClass: string;
    refrigerant: string;
    powerConsumption: number; // kW
    dimensions: string;
    weight: number; // kg
  };
  lifecycle: {
    age: number; // months
    expectedLifespan: number; // months
    remainingLife: number; // months
    depreciation: number; // percentage
    currentValue: number; // PLN
    replacementCost: number; // PLN
  };
  performance: {
    efficiency: number; // percentage
    energyConsumption: number; // kWh/month
    operatingHours: number;
    faultCount: number;
    lastEfficiencyTest?: number;
  };
  maintenanceHistory: Array<{
    date: number;
    type: "routine" | "preventive" | "corrective" | "emergency";
    technicianId: Id<"users">;
    description: string;
    cost: number;
    partsReplaced?: string[];
    nextMaintenanceDue?: number;
  }>;
  alerts: Array<{
    type:
      | "maintenance_due"
      | "warranty_expiring"
      | "efficiency_drop"
      | "fault_detected"
      | "end_of_life_approaching";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    createdAt: number;
    acknowledged: boolean;
    acknowledgedBy?: Id<"users">;
  }>;
  predictions?: {
    nextFailureProbability: number; // 0-1
    maintenanceRecommendations: string[];
    replacementRecommendation?: number; // timestamp
    costOptimizationSuggestions: string[];
  };
  districtPriority: number;
  routeOptimized: boolean;
  createdBy: Id<"users">;
  lastModifiedBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

interface MaintenanceRecord {
  _id: string;
  equipmentId: string;
  date: string;
  type: "preventive" | "corrective" | "emergency" | "inspection";
  technicianId: string;
  technicianName: string;
  description: string;
  partsReplaced: string[];
  cost: number;
  duration: number; // hours
  notes: string;
  nextServiceDate: string;
}

interface PerformanceMetrics {
  date: string;
  efficiency: number;
  energyConsumption: number;
  uptime: number;
  temperature: number;
  pressure: number;
}

export function EquipmentLifecycleModule() {
  const [activeTab, setActiveTab] = useState("equipment");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [_selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [_isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Real Convex queries
  const equipment =
    useQuery(api.equipmentLifecycle.getEquipmentLifecycle, {
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      district: districtFilter !== "all" ? districtFilter : undefined,
      type: typeFilter !== "all" ? (typeFilter as any) : undefined,
      limit: 50,
    }) || [];

  const createEquipmentLifecycle = useMutation(api.equipmentLifecycle.createEquipmentLifecycle);
  const updateEquipmentLifecycle = useMutation(api.equipmentLifecycle.updateEquipmentLifecycle);

  // Get equipment requiring maintenance
  const _equipmentRequiringMaintenance =
    useQuery(api.equipmentLifecycle.getEquipmentRequiringMaintenance, {
      daysAhead: 30,
    }) || [];

  // Get performance analytics
  const _performanceAnalytics = useQuery(api.equipmentLifecycle.getEquipmentPerformanceAnalytics, {
    timeRange: "30d",
    district: districtFilter !== "all" ? districtFilter : undefined,
  });

  // Mock performance metrics data - this could also be moved to Convex
  const performanceData: PerformanceMetrics[] = [
    {
      date: "2024-01",
      efficiency: 92.1,
      energyConsumption: 2100,
      uptime: 98.2,
      temperature: 22.5,
      pressure: 1.2,
    },
    {
      date: "2024-02",
      efficiency: 93.5,
      energyConsumption: 2050,
      uptime: 98.8,
      temperature: 22.3,
      pressure: 1.1,
    },
    {
      date: "2024-03",
      efficiency: 94.2,
      energyConsumption: 2000,
      uptime: 99.1,
      temperature: 22.1,
      pressure: 1.0,
    },
    {
      date: "2024-04",
      efficiency: 93.8,
      energyConsumption: 2080,
      uptime: 98.5,
      temperature: 22.4,
      pressure: 1.1,
    },
    {
      date: "2024-05",
      efficiency: 94.5,
      energyConsumption: 1980,
      uptime: 99.3,
      temperature: 22.0,
      pressure: 1.0,
    },
    {
      date: "2024-06",
      efficiency: 95.1,
      energyConsumption: 1950,
      uptime: 99.5,
      temperature: 21.8,
      pressure: 0.9,
    },
  ];

  // No need for additional filtering since we're using Convex queries with filters
  const filteredEquipment = equipment;

  // Helper functions
  const _formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pl-PL");
  };

  const _formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);
  };

  // Event handlers
  const _handleCreateEquipment = async (equipmentData: any) => {
    try {
      const _equipmentId = await createEquipmentLifecycle({
        equipmentId: equipmentData.equipmentId,
        serialNumber: equipmentData.serialNumber,
        model: equipmentData.model,
        manufacturer: equipmentData.manufacturer,
        type: equipmentData.type,
        location: {
          clientId: equipmentData.location.clientId,
          clientName: equipmentData.location.clientName,
          address: equipmentData.location.address,
          district: equipmentData.location.district,
          building: equipmentData.location.building,
          floor: equipmentData.location.floor,
          room: equipmentData.location.room,
        },
        installation: {
          date: new Date(equipmentData.installation.date).getTime(),
          technicianId: equipmentData.installation.technicianId,
          warrantyExpiry: new Date(equipmentData.installation.warrantyExpiry).getTime(),
          cost: equipmentData.installation.cost,
        },
        specifications: equipmentData.specifications,
        expectedLifespan: equipmentData.expectedLifespan || 180, // 15 years default
      });

      toast.success(`Sprzęt ${equipmentData.serialNumber} został dodany do systemu`);
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(`Błąd podczas dodawania sprzętu: ${error}`);
    }
  };

  const _handleUpdateEquipment = async (equipment: Equipment, updates: any) => {
    try {
      await updateEquipmentLifecycle({
        equipmentLifecycleId: equipment._id,
        updates,
      });

      toast.success(`Sprzęt ${equipment.serialNumber} został zaktualizowany`);
    } catch (error) {
      toast.error(`Błąd podczas aktualizacji sprzętu: ${error}`);
    }
  };

  const getStatusBadge = (status: Equipment["status"]) => {
    const variants = {
      operational: "success",
      maintenance_required: "warning",
      repair_needed: "destructive",
      end_of_life: "secondary",
      decommissioned: "destructive",
    } as const;

    const labels = {
      operational: "Operacyjny",
      maintenance_required: "Wymaga serwisu",
      repair_needed: "Wymaga naprawy",
      end_of_life: "Koniec żywotności",
      decommissioned: "Wycofany",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: Equipment["type"]) => {
    const labels = {
      split_ac: "Split AC",
      multi_split: "Multi Split",
      vrf_system: "VRF",
      heat_pump: "Pompa ciepła",
      thermostat: "Termostat",
      ductwork: "Kanały",
      ventilation: "Wentylacja",
      other: "Inne",
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getLifecycleColor = (remainingLife: number, expectedLifespan: number) => {
    const percentage = (remainingLife / expectedLifespan) * 100;
    if (percentage > 70) return "text-green-600";
    if (percentage > 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return "text-green-600";
    if (efficiency >= 90) return "text-yellow-600";
    return "text-red-600";
  };

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleViewEquipment = (item: Equipment) => {
    setSelectedEquipment(item);
    toast.success(`Otwieranie szczegółów urządzenia ${item.serialNumber}`);
  };

  const handleScheduleMaintenance = (item: Equipment) => {
    toast.success(`Planowanie serwisu dla ${item.serialNumber}`);
  };

  const handleGenerateReport = (item: Equipment) => {
    toast.success(`Generowanie raportu dla ${item.serialNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cykl Życia Urządzeń</h1>
          <p className="text-gray-600 mt-1">
            Kompleksowe zarządzanie urządzeniami HVAC z monitoringiem wydajności
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreateDialog} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj Urządzenie
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Raporty
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urządzenia Aktywne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {equipment.filter((e) => e.status === "operational").length}
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
                <p className="text-sm font-medium text-gray-600">Średnia Efektywność</p>
                <p className="text-2xl font-bold text-gray-900">93.0%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywne Alerty</p>
                <p className="text-2xl font-bold text-gray-900">
                  {equipment.reduce((sum, e) => sum + e.alerts.active, 0)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Średni Uptime</p>
                <p className="text-2xl font-bold text-gray-900">98.2%</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment">Urządzenia</TabsTrigger>
          <TabsTrigger value="maintenance">Serwis</TabsTrigger>
          <TabsTrigger value="performance">Wydajność</TabsTrigger>
          <TabsTrigger value="lifecycle">Cykl Życia</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Szukaj urządzeń..."
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
                    <SelectItem value="operational">Operacyjny</SelectItem>
                    <SelectItem value="maintenance">Serwis</SelectItem>
                    <SelectItem value="repair">Naprawa</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="decommissioned">Wycofany</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    <SelectItem value="split_ac">Split AC</SelectItem>
                    <SelectItem value="vrf_system">VRF</SelectItem>
                    <SelectItem value="chiller">Chiller</SelectItem>
                    <SelectItem value="heat_pump">Pompa ciepła</SelectItem>
                    <SelectItem value="ventilation">Wentylacja</SelectItem>
                    <SelectItem value="other">Inne</SelectItem>
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

          {/* Equipment List */}
          <div className="grid gap-4">
            {filteredEquipment.map((item) => (
              <Card key={item._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{item.model}</h3>
                        {getStatusBadge(item.status)}
                        {getTypeBadge(item.type)}
                        {item.alerts.active > 0 && (
                          <Badge variant="destructive">
                            {item.alerts.active} alert{item.alerts.active > 1 ? "y" : ""}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{item.serialNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{item.location.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location.district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>{item.specifications.capacity} kW</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Efektywność</p>
                          <p
                            className={`font-semibold ${getEfficiencyColor(item.performance.efficiency)}`}
                          >
                            {item.performance.efficiency}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Uptime</p>
                          <p className="font-semibold">{item.performance.uptime}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Następny serwis</p>
                          <p className="font-semibold">{item.maintenance.nextService}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pozostały czas życia</p>
                          <p
                            className={`font-semibold ${getLifecycleColor(item.lifecycle.remainingLife, item.lifecycle.expectedLifespan)}`}
                          >
                            {Math.round(item.lifecycle.remainingLife / 12)} lat
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            Cykl życia ({item.lifecycle.age}/{item.lifecycle.expectedLifespan}{" "}
                            miesięcy)
                          </span>
                          <span>
                            {Math.round(
                              (item.lifecycle.age / item.lifecycle.expectedLifespan) * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={(item.lifecycle.age / item.lifecycle.expectedLifespan) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewEquipment(item)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Szczegóły
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleMaintenance(item)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Serwis
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(item)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Raport
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Historia Serwisu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Historia serwisu będzie dostępna wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Efektywności</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#1A3E7C"
                      strokeWidth={2}
                      dot={{ fill: "#1A3E7C" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zużycie Energii</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="energyConsumption"
                      stroke="#F2994A"
                      fill="#F2994A"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle">
          <Card>
            <CardHeader>
              <CardTitle>Analiza Cyklu Życia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analiza cyklu życia będzie dostępna wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
