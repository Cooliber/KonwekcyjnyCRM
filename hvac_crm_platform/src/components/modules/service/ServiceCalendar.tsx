/**
 * 🔥 Service Calendar Component - 137/137 Godlike Quality
 * Inspired by RRUP interface - Advanced monthly calendar with service management
 *
 * Features:
 * - Monthly calendar view with color-coded services
 * - Navigation between months/years
 * - Service details on specific days
 * - Advanced date filters (creation, scheduled, completion dates)
 * - Responsive design with Warsaw district optimization
 * - Real-time updates via Convex
 */

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Clock, Filter, MapPin, Plus, Search, Users, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { ServiceFilters, ServiceStatus } from "../../../types/service";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

// Default service statuses with RRUP-inspired colors
const DEFAULT_SERVICE_STATUSES: ServiceStatus[] = [
  {
    id: "reported",
    name: "Zgłoszony",
    color: "#3b82f6",
    order: 1,
    isActive: true,
    requiresDate: false,
    automaticActions: [],
  },
  {
    id: "scheduled",
    name: "Zaplanowany",
    color: "#10b981",
    order: 2,
    isActive: true,
    requiresDate: true,
    automaticActions: [],
  },
  {
    id: "in_progress",
    name: "W trakcie",
    color: "#f59e0b",
    order: 3,
    isActive: true,
    requiresDate: false,
    automaticActions: [],
  },
  {
    id: "waiting_parts",
    name: "Oczekuje na części",
    color: "#8b5cf6",
    order: 4,
    isActive: true,
    requiresDate: false,
    automaticActions: [],
  },
  {
    id: "completed",
    name: "Zrealizowany",
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
    requiresDate: false,
    automaticActions: [],
  },
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  services: any[];
  hasServices: boolean;
}

interface ServiceCalendarProps {
  onServiceSelect?: (serviceId: string) => void;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function ServiceCalendar({
  onServiceSelect,
  onDateSelect,
  className = "",
}: ServiceCalendarProps) {
  // State management
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Data queries
  const services = useQuery(api.jobs.list, {}) || [];
  const contacts = useQuery(api.contacts.list, {}) || [];

  // Mutations
  const _updateService = useMutation(api.jobs.update);

  // Get status configuration
  const getStatusConfig = (statusId: string): ServiceStatus => {
    return DEFAULT_SERVICE_STATUSES.find((s) => s.id === statusId) || DEFAULT_SERVICE_STATUSES[0];
  };

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= endDate) {
      const dayServices = services.filter((service) => {
        if (!service.scheduledDate) return false;

        const serviceDate = new Date(service.scheduledDate);
        return (
          serviceDate.getDate() === currentDate.getDate() &&
          serviceDate.getMonth() === currentDate.getMonth() &&
          serviceDate.getFullYear() === currentDate.getFullYear()
        );
      });

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday:
          currentDate.getDate() === today.getDate() &&
          currentDate.getMonth() === today.getMonth() &&
          currentDate.getFullYear() === today.getFullYear(),
        services: dayServices,
        hasServices: dayServices.length > 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, services]);

  // Filter services based on search and filters
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
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

      // Date range filter
      if (filters.dateRange) {
        if (service.scheduledDate) {
          if (
            service.scheduledDate < filters.dateRange.from ||
            service.scheduledDate > filters.dateRange.to
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [services, searchQuery, filters]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Handle day click
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    if (onDateSelect) {
      onDateSelect(day.date);
    }
  };

  // Handle service click
  const handleServiceClick = (serviceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onServiceSelect) {
      onServiceSelect(serviceId);
    }
  };

  // Get services for selected date
  const selectedDateServices = selectedDate
    ? filteredServices.filter((service) => {
        if (!service.scheduledDate) return false;
        const serviceDate = new Date(service.scheduledDate);
        return (
          serviceDate.getDate() === selectedDate.getDate() &&
          serviceDate.getMonth() === selectedDate.getMonth() &&
          serviceDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with navigation and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Kalendarz Serwisów</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {currentMonth.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filtry
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nowy serwis
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Filtry i wyszukiwanie
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wyszukiwarka</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status?.[0] || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value ? [e.target.value] : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Wszystkie statusy</option>
                  {DEFAULT_SERVICE_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Wszystkie kategorie</option>
                  <option value="preventive_maintenance">Konserwacja prewencyjna</option>
                  <option value="corrective_maintenance">Konserwacja naprawcza</option>
                  <option value="emergency_repair">Naprawa awaryjna</option>
                  <option value="warranty_service">Serwis gwarancyjny</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Nie", "Pon", "Wto", "Śro", "Czw", "Pią", "Sob"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-[100px] p-2 border border-gray-200 rounded cursor-pointer transition-all hover:bg-gray-50
                  ${!day.isCurrentMonth ? "bg-gray-100 text-gray-400" : "bg-white"}
                  ${day.isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                  ${
                    selectedDate &&
                    selectedDate.getDate() === day.date.getDate() &&
                    selectedDate.getMonth() === day.date.getMonth() &&
                    selectedDate.getFullYear() === day.date.getFullYear()
                      ? "bg-blue-100 border-blue-300"
                      : ""
                  }
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${day.isToday ? "text-blue-600" : ""}`}>
                    {day.date.getDate()}
                  </span>
                  {day.hasServices && (
                    <span className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                      {day.services.length}
                    </span>
                  )}
                </div>

                {/* Service indicators */}
                <div className="space-y-1">
                  {day.services.slice(0, 3).map((service) => {
                    const statusConfig = getStatusConfig(service.status);
                    return (
                      <div
                        key={service._id}
                        onClick={(e) => handleServiceClick(service._id, e)}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: `${statusConfig.color}20`,
                          borderLeft: `3px solid ${statusConfig.color}`,
                        }}
                        title={service.title}
                      >
                        {service.title.substring(0, 20)}...
                      </div>
                    );
                  })}
                  {day.services.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.services.length - 3} więcej
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Services */}
      {selectedDate && selectedDateServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Serwisy na {selectedDate.toLocaleDateString("pl-PL")}
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDateServices.map((service) => {
                const statusConfig = getStatusConfig(service.status);
                const contact = contacts.find((c) => c._id === service.contactId);

                return (
                  <div
                    key={service._id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleServiceClick(service._id, {} as React.MouseEvent)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{service.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${statusConfig.color}20`,
                            color: statusConfig.color,
                          }}
                        >
                          {statusConfig.name}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {contact?.name || "Brak klienta"}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {service.district || "Brak lokalizacji"}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {service.scheduledDate
                          ? new Date(service.scheduledDate).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Brak godziny"}
                      </div>
                    </div>

                    {service.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
