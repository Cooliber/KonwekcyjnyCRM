import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  Building,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface CustomerPortalUser {
  _id: Id<"customerPortalUsers">;
  contactId: Id<"contacts">;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role:
    | "primary_contact"
    | "facility_manager"
    | "technician_contact"
    | "billing_contact"
    | "viewer";
  permissions: Array<
    | "view_equipment"
    | "view_service_history"
    | "book_services"
    | "view_invoices"
    | "download_documents"
    | "manage_users"
    | "view_analytics"
  >;
  status: "active" | "pending_verification" | "suspended" | "deactivated";
  emailVerified: boolean;
  lastLogin?: number;
  loginCount: number;
  twoFactorEnabled: boolean;
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    dashboardLayout?: string;
  };
  activeSessions: Array<{
    sessionId: string;
    deviceInfo: string;
    ipAddress: string;
    lastActivity: number;
    expiresAt: number;
  }>;
  createdBy: Id<"users">;
  lastModifiedBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

interface ServiceRequest {
  _id: string;
  clientId: string;
  userId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: "maintenance" | "repair" | "installation" | "consultation" | "emergency";
  status: "submitted" | "acknowledged" | "scheduled" | "in_progress" | "completed" | "cancelled";
  preferredDate: string;
  preferredTime: string;
  contactPerson: string;
  contactPhone: string;
  location: {
    building: string;
    floor: string;
    room: string;
    notes: string;
  };
  attachments: string[];
  estimatedCost?: number;
  scheduledDate?: string;
  assignedTechnician?: string;
  completionNotes?: string;
  customerRating?: number;
  customerFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

interface PortalAnalytics {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  completedRequests: number;
  averageRating: number;
  loginActivity: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  requestsByCategory: {
    maintenance: number;
    repair: number;
    installation: number;
    consultation: number;
    emergency: number;
  };
}

export function CustomerPortalModule() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [_selectedUser, setSelectedUser] = useState<CustomerPortalUser | null>(null);
  const [_isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [_isRequestDialogOpen, _setIsRequestDialogOpen] = useState(false);

  // Real Convex queries
  const portalUsers =
    useQuery(api.customerPortal.getCustomerPortalUsers, {
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      role: roleFilter !== "all" ? (roleFilter as any) : undefined,
      limit: 50,
    }) || [];

  const _createCustomerPortalUser = useMutation(api.customerPortal.createCustomerPortalUser);
  const _updateCustomerPortalUser = useMutation(api.customerPortal.updateCustomerPortalUser);
  const _bookServiceAppointment = useMutation(api.customerPortal.bookServiceAppointment);

  // Mock service requests and analytics - these could also be moved to Convex
  const serviceRequests: ServiceRequest[] = [
    {
      _id: "req1",
      clientId: "client1",
      userId: "1",
      title: "Przegląd klimatyzacji - sala konferencyjna",
      description:
        "Proszę o przegląd systemu klimatyzacji w sali konferencyjnej A. Zauważalne wahania temperatury.",
      priority: "medium",
      category: "maintenance",
      status: "scheduled",
      preferredDate: "2024-03-20",
      preferredTime: "10:00",
      contactPerson: "Anna Kowalska",
      contactPhone: "+48 123 456 789",
      location: {
        building: "Główny budynek",
        floor: "3",
        room: "Sala konferencyjna A",
        notes: "Dostęp przez recepcję",
      },
      attachments: ["photo1.jpg"],
      estimatedCost: 350,
      scheduledDate: "2024-03-20T10:00:00Z",
      assignedTechnician: "Jan Kowalski",
      createdAt: "2024-03-15T09:00:00Z",
      updatedAt: "2024-03-15T14:30:00Z",
    },
    {
      _id: "req2",
      clientId: "client2",
      userId: "2",
      title: "Naprawa pompy ciepła",
      description:
        "Pompa ciepła na 5. piętrze nie działa prawidłowo. Brak ogrzewania w open space.",
      priority: "high",
      category: "repair",
      status: "in_progress",
      preferredDate: "2024-03-16",
      preferredTime: "08:00",
      contactPerson: "Piotr Nowak",
      contactPhone: "+48 987 654 321",
      location: {
        building: "Tower A",
        floor: "5",
        room: "Open space",
        notes: "Pompa na dachu",
      },
      attachments: [],
      estimatedCost: 1200,
      scheduledDate: "2024-03-16T08:00:00Z",
      assignedTechnician: "Marek Wiśniewski",
      createdAt: "2024-03-15T07:30:00Z",
      updatedAt: "2024-03-16T09:15:00Z",
    },
  ];

  const analytics: PortalAnalytics = {
    totalUsers: 24,
    activeUsers: 18,
    pendingRequests: 5,
    completedRequests: 89,
    averageRating: 4.6,
    loginActivity: {
      daily: 12,
      weekly: 18,
      monthly: 22,
    },
    requestsByCategory: {
      maintenance: 45,
      repair: 28,
      installation: 12,
      consultation: 8,
      emergency: 6,
    },
  };

  const filteredUsers = portalUsers.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: CustomerPortalUser["status"]) => {
    const variants = {
      active: "success",
      inactive: "secondary",
      pending: "warning",
      suspended: "destructive",
    } as const;

    const labels = {
      active: "Aktywny",
      inactive: "Nieaktywny",
      pending: "Oczekujący",
      suspended: "Zawieszony",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getRoleBadge = (role: CustomerPortalUser["role"]) => {
    const variants = {
      admin: "default",
      manager: "secondary",
      user: "outline",
      viewer: "outline",
    } as const;

    const labels = {
      admin: "Administrator",
      manager: "Menedżer",
      user: "Użytkownik",
      viewer: "Przeglądający",
    };

    return <Badge variant={variants[role]}>{labels[role]}</Badge>;
  };

  const getRequestStatusBadge = (status: ServiceRequest["status"]) => {
    const variants = {
      submitted: "secondary",
      acknowledged: "warning",
      scheduled: "default",
      in_progress: "warning",
      completed: "success",
      cancelled: "destructive",
    } as const;

    const labels = {
      submitted: "Zgłoszony",
      acknowledged: "Potwierdzony",
      scheduled: "Zaplanowany",
      in_progress: "W trakcie",
      completed: "Zakończony",
      cancelled: "Anulowany",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: ServiceRequest["priority"]) => {
    const variants = {
      low: "secondary",
      medium: "default",
      high: "warning",
      urgent: "destructive",
    } as const;

    const labels = {
      low: "Niski",
      medium: "Średni",
      high: "Wysoki",
      urgent: "Pilny",
    };

    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>;
  };

  const handleCreateUser = () => {
    setIsCreateUserDialogOpen(true);
  };

  const handleEditUser = (user: CustomerPortalUser) => {
    setSelectedUser(user);
    setIsCreateUserDialogOpen(true);
  };

  const handleViewUser = (user: CustomerPortalUser) => {
    setSelectedUser(user);
    toast.success(`Otwieranie profilu ${user.firstName} ${user.lastName}`);
  };

  const handleSendInvitation = (user: CustomerPortalUser) => {
    toast.success(`Wysyłanie zaproszenia do ${user.email}`);
  };

  const handleResetPassword = (user: CustomerPortalUser) => {
    toast.success(`Reset hasła dla ${user.email}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portal Klienta</h1>
          <p className="text-gray-600 mt-1">
            Zarządzanie dostępem klientów i zgłoszeniami serwisowymi
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateUser} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj Użytkownika
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Konfiguracja
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywni Użytkownicy</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.activeUsers}</p>
                <p className="text-sm text-gray-500">z {analytics.totalUsers} łącznie</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oczekujące Zgłoszenia</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.pendingRequests}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Średnia Ocena</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Logowania (miesięcznie)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.loginActivity.monthly}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Użytkownicy</TabsTrigger>
          <TabsTrigger value="requests">Zgłoszenia</TabsTrigger>
          <TabsTrigger value="analytics">Analityka</TabsTrigger>
          <TabsTrigger value="settings">Ustawienia</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Szukaj użytkowników..."
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
                    <SelectItem value="inactive">Nieaktywny</SelectItem>
                    <SelectItem value="pending">Oczekujący</SelectItem>
                    <SelectItem value="suspended">Zawieszony</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rola" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie role</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Menedżer</SelectItem>
                    <SelectItem value="user">Użytkownik</SelectItem>
                    <SelectItem value="viewer">Przeglądający</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Odśwież
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        {getStatusBadge(user.status)}
                        {getRoleBadge(user.role)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{user.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Ostatnie logowanie: {formatDate(user.lastLogin)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Uprawnienia:</span>
                        {user.permissions.viewInvoices && <Badge variant="outline">Faktury</Badge>}
                        {user.permissions.requestService && (
                          <Badge variant="outline">Zgłoszenia</Badge>
                        )}
                        {user.permissions.viewReports && <Badge variant="outline">Raporty</Badge>}
                        {user.permissions.manageUsers && (
                          <Badge variant="outline">Zarządzanie</Badge>
                        )}
                        {user.permissions.viewEquipment && (
                          <Badge variant="outline">Urządzenia</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInvitation(user)}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(user)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {/* Service Requests */}
          <div className="grid gap-4">
            {serviceRequests.map((request) => (
              <Card key={request._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{request.title}</h3>
                        {getRequestStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>

                      <p className="text-gray-600 mb-3">{request.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {request.preferredDate} {request.preferredTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {request.location.building}, {request.location.room}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{request.contactPerson}</span>
                        </div>
                        {request.estimatedCost && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{request.estimatedCost} PLN</span>
                          </div>
                        )}
                      </div>

                      {request.assignedTechnician && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Wrench className="w-4 h-4" />
                          <span>Przypisany technik: {request.assignedTechnician}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aktywność Logowań</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Dzisiaj</span>
                    <span className="font-semibold">{analytics.loginActivity.daily}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ten tydzień</span>
                    <span className="font-semibold">{analytics.loginActivity.weekly}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ten miesiąc</span>
                    <span className="font-semibold">{analytics.loginActivity.monthly}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zgłoszenia według Kategorii</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.requestsByCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="capitalize">{category}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia Portalu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Ustawienia portalu będą dostępne wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
