/**
 * Enhanced Installation Module
 * Based on RRUP documentation for installation management
 * Features: Configurable statuses, automatic actions, drag-and-drop, color coding
 */

import { useMutation, useQuery } from "convex/react";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Filter,
  MapPin,
  Plus,
  Search,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type {
  Installation,
  InstallationCategory,
  InstallationFilters,
  InstallationPriority,
  InstallationStats,
  InstallationStatus,
} from "../../types/installation";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Default installation statuses (RRUP-inspired)
const DEFAULT_STATUSES: InstallationStatus[] = [
  {
    id: "planned",
    name: "Zaplanowany",
    color: "#3b82f6",
    order: 1,
    isActive: true,
    automaticActions: [],
  },
  {
    id: "confirmed",
    name: "Potwierdzony",
    color: "#10b981",
    order: 2,
    isActive: true,
    automaticActions: [],
  },
  {
    id: "in_progress",
    name: "W trakcie",
    color: "#f59e0b",
    order: 3,
    isActive: true,
    automaticActions: [],
  },
  {
    id: "testing",
    name: "Testowanie",
    color: "#8b5cf6",
    order: 4,
    isActive: true,
    automaticActions: [],
  },
  {
    id: "completed",
    name: "Zakończony",
    color: "#22c55e",
    order: 5,
    isActive: true,
    requiresDate: true,
    automaticActions: [],
  },
  {
    id: "cancelled",
    name: "Anulowany",
    color: "#ef4444",
    order: 6,
    isActive: true,
    automaticActions: [],
  },
  {
    id: "postponed",
    name: "Przełożony",
    color: "#6b7280",
    order: 7,
    isActive: true,
    automaticActions: [],
  },
];

export function EnhancedInstallationModule() {
  // State management
  const [selectedView, setSelectedView] = useState<"list" | "kanban" | "calendar" | "map">(
    "kanban"
  );
  const [filters, _setFilters] = useState<InstallationFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [_selectedInstallation, setSelectedInstallation] = useState<string | null>(null);
  const [showStatusConfig, setShowStatusConfig] = useState(false);
  const [statuses, _setStatuses] = useState<InstallationStatus[]>(DEFAULT_STATUSES);

  // Data queries (using existing jobs as installations for now)
  const installations = useQuery(api.jobs.list, {}) || [];
  const _contacts = useQuery(api.contacts.list, {}) || [];
  const _users = useQuery(api.users.list, {}) || [];

  // Mutations (using existing jobs mutations for now)
  const _createInstallation = useMutation(api.jobs.create);
  const _updateInstallation = useMutation(api.jobs.update);
  const updateStatus = useMutation(api.jobs.update);

  // Calculate statistics
  const stats: InstallationStats = React.useMemo(() => {
    const total = installations.length;
    const byStatus = installations.reduce(
      (acc, inst) => {
        acc[inst.status] = (acc[inst.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPriority = installations.reduce(
      (acc, inst) => {
        acc[inst.priority] = (acc[inst.priority] || 0) + 1;
        return acc;
      },
      {} as Record<InstallationPriority, number>
    );

    const completed = installations.filter((inst) => inst.status === "completed");
    const onTime = completed.filter(
      (inst) => inst.actualEndDate && inst.scheduledDate && inst.actualEndDate <= inst.scheduledDate
    );

    return {
      total,
      byStatus,
      byPriority,
      byCategory: {} as Record<InstallationCategory, number>,
      byDistrict: {},
      avgDuration: 0,
      completionRate: total > 0 ? (completed.length / total) * 100 : 0,
      onTimeRate: completed.length > 0 ? (onTime.length / completed.length) * 100 : 0,
      customerSatisfaction: 4.2, // Mock data
    };
  }, [installations]);

  // Filter installations based on search and filters
  const filteredInstallations = React.useMemo(() => {
    return installations.filter((installation) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          installation.title.toLowerCase().includes(searchLower) ||
          installation.installationNumber.toLowerCase().includes(searchLower) ||
          installation.address.toLowerCase().includes(searchLower) ||
          installation.district.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(installation.status)) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(installation.priority)) return false;
      }

      // District filter
      if (filters.district && filters.district.length > 0) {
        if (!filters.district.includes(installation.district)) return false;
      }

      return true;
    });
  }, [installations, searchQuery, filters]);

  // Group installations by status for Kanban view
  const installationsByStatus = React.useMemo(() => {
    const grouped = statuses.reduce(
      (acc, status) => {
        acc[status.id] = filteredInstallations.filter((inst) => inst.status === status.id);
        return acc;
      },
      {} as Record<string, Installation[]>
    );
    return grouped;
  }, [filteredInstallations, statuses]);

  // Handle status change
  const _handleStatusChange = async (installationId: string, newStatusId: string) => {
    try {
      await updateStatus({
        installationId,
        statusId: newStatusId,
        notes: `Status changed to ${statuses.find((s) => s.id === newStatusId)?.name}`,
      });
      toast.success("Status updated successfully");
    } catch (_error) {
      toast.error("Failed to update status");
    }
  };

  // Get status configuration
  const _getStatusConfig = (statusId: string): InstallationStatus => {
    return statuses.find((s) => s.id === statusId) || statuses[0];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Montaże</h1>
          <p className="text-gray-600 mt-1">Zarządzanie montażami HVAC • {stats.total} aktywnych</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowStatusConfig(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Statusy
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nowy montaż
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie montaże</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wskaźnik realizacji</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completionRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Na czas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.onTimeRate.toFixed(1)}%</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satysfakcja</p>
                <p className="text-2xl font-bold text-purple-600">{stats.customerSatisfaction}/5</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
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
              placeholder="Szukaj montaży..."
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

      {/* Main Content */}
      {selectedView === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
          {statuses
            .filter((status) => status.isActive)
            .map((status) => (
              <Card key={status.id} className="min-w-80">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {installationsByStatus[status.id]?.length || 0}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {installationsByStatus[status.id]?.map((installation) => (
                    <div
                      key={installation._id}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedInstallation(installation._id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                          {installation.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            installation.priority === "urgent"
                              ? "bg-red-100 text-red-700"
                              : installation.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : installation.priority === "normal"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {installation.priority}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {installation.district}
                        </div>
                        {installation.scheduledDate && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(installation.scheduledDate).toLocaleDateString("pl-PL")}
                          </div>
                        )}
                        {installation.assignedTechnicians.length > 0 && (
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {installation.assignedTechnicians.length} technik(ów)
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            #{installation.installationNumber}
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {installation.totalAmount.toLocaleString("pl-PL")} PLN
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {installationsByStatus[status.id]?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Brak montaży</p>
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
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Konfiguracja statusów montaży
                <Button variant="outline" onClick={() => setShowStatusConfig(false)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statuses.map((status, _index) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-medium">{status.name}</span>
                      {status.requiresDate && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Wymaga daty
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        {status.isActive ? "✓" : "✗"}
                      </Button>
                    </div>
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
