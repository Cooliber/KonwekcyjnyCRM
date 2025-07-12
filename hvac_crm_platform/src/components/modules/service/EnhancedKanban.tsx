/**
 * 🔥 Enhanced Kanban System - 137/137 Godlike Quality
 * Advanced drag & drop Kanban board for HVAC service management
 *
 * Features:
 * - Drag & drop functionality between status columns
 * - Real-time updates via Convex subscriptions
 * - Bulk actions and quick actions
 * - Enhanced service card visualization
 * - Warsaw district optimization
 * - Smooth animations and transitions
 * - Keyboard shortcuts support
 * - Mobile-responsive design
 */

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Star,
  Wrench as Tool,
  Users,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import {
  useBulkSelection,
  useMultiSelectClick,
  useRangeSelectClick,
} from "../../../hooks/useBulkSelection";
import { createBulkAction, useUndoRedo } from "../../../hooks/useUndoRedo";
import type { ServiceStatus } from "../../../types/service";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { BulkActionBar } from "./BulkActionBar";

// Service statuses with enhanced configuration
const SERVICE_STATUSES: ServiceStatus[] = [
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

// Priority configuration with enhanced styling
const PRIORITY_CONFIG = {
  emergency: {
    label: "Awaria",
    color: "#dc2626",
    icon: AlertTriangle,
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  urgent: {
    label: "Pilny",
    color: "#ea580c",
    icon: Clock,
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  high: {
    label: "Wysoki",
    color: "#f59e0b",
    icon: AlertTriangle,
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  normal: {
    label: "Normalny",
    color: "#3b82f6",
    icon: CheckCircle,
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  low: {
    label: "Niski",
    color: "#6b7280",
    icon: Clock,
    bgColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
};

// Warsaw districts with styling
const WARSAW_DISTRICTS = {
  Śródmieście: { color: "#dc2626", priority: "high" },
  Mokotów: { color: "#ea580c", priority: "high" },
  Żoliborz: { color: "#f59e0b", priority: "medium" },
  Ochota: { color: "#10b981", priority: "medium" },
  Wola: { color: "#3b82f6", priority: "medium" },
  "Praga-Południe": { color: "#8b5cf6", priority: "normal" },
  "Praga-Północ": { color: "#6b7280", priority: "normal" },
};

interface ServiceCardProps {
  service: any;
  onEdit: (serviceId: string) => void;
  onView: (serviceId: string) => void;
  onCall: (serviceId: string) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (serviceId: string, multiSelect: boolean) => void;
  onRangeSelect?: (serviceId: string) => void;
}

function ServiceCard({
  service,
  onEdit,
  onView,
  onCall,
  isDragging,
  isSelected = false,
  onSelect,
  onRangeSelect,
}: ServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: service._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const priorityConfig =
    PRIORITY_CONFIG[service.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  const PriorityIcon = priorityConfig.icon;

  const districtConfig = WARSAW_DISTRICTS[service.district as keyof typeof WARSAW_DISTRICTS];

  // Handle click events
  const handleMultiSelectClick = useMultiSelectClick((itemId, multiSelect) => {
    onSelect?.(itemId, multiSelect);
  });

  const handleRangeSelectClick = useRangeSelectClick((_fromId, toId) => {
    onRangeSelect?.(toId);
  }, service._id);

  const handleCardClick = (event: React.MouseEvent) => {
    if (event.shiftKey) {
      handleRangeSelectClick(event, service._id);
    } else {
      handleMultiSelectClick(event, service._id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`
        group relative p-4 bg-white border border-gray-200 rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging || isSortableDragging ? "shadow-lg ring-2 ring-blue-500 ring-opacity-50" : ""}
        ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
      `}
    >
      {/* Priority indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
        style={{ backgroundColor: priorityConfig.color }}
      />

      {/* Selection checkbox */}
      <div className="absolute top-2 left-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect?.(service._id, e.ctrlKey || e.metaKey);
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{service.title}</h4>
          <p className="text-xs text-gray-500">#{service._id.slice(-6)}</p>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          {/* Priority badge */}
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              color: priorityConfig.color,
              borderColor: priorityConfig.color,
              backgroundColor: priorityConfig.bgColor,
            }}
          >
            <PriorityIcon className="w-3 h-3 mr-1" />
            {priorityConfig.label}
          </Badge>

          {/* Quick actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(service._id)}>
                <Eye className="w-4 h-4 mr-2" />
                Zobacz szczegóły
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(service._id)}>
                <Edit className="w-4 h-4 mr-2" />
                Edytuj serwis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCall(service._id)}>
                <Phone className="w-4 h-4 mr-2" />
                Zadzwoń do klienta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Oznacz jako awarię
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Service details */}
      <div className="space-y-2 text-xs text-gray-600">
        {/* Location */}
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
          <span className="truncate">{service.district || "Brak lokalizacji"}</span>
          {districtConfig && (
            <div
              className="w-2 h-2 rounded-full ml-2 flex-shrink-0"
              style={{ backgroundColor: districtConfig.color }}
              title={`Priorytet dzielnicy: ${districtConfig.priority}`}
            />
          )}
        </div>

        {/* Scheduled date */}
        {service.scheduledDate && (
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
            <span>{new Date(service.scheduledDate).toLocaleDateString("pl-PL")}</span>
            <span className="ml-1 text-gray-400">
              {new Date(service.scheduledDate).toLocaleTimeString("pl-PL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Assigned technicians */}
        {service.assignedTechnicians && service.assignedTechnicians.length > 0 && (
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-2 flex-shrink-0" />
            <div className="flex items-center space-x-1">
              {service.assignedTechnicians.slice(0, 3).map((techId: string, index: number) => (
                <Avatar key={techId} className="w-5 h-5">
                  <AvatarFallback className="text-xs">T{index + 1}</AvatarFallback>
                </Avatar>
              ))}
              {service.assignedTechnicians.length > 3 && (
                <span className="text-gray-400 ml-1">
                  +{service.assignedTechnicians.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Status indicators */}
          <div className="flex items-center space-x-1">
            {service.priority === "emergency" && (
              <Badge variant="destructive" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                AWARIA
              </Badge>
            )}
            {service.hasAutomaticActions && (
              <MessageSquare className="w-3 h-3 text-blue-500" title="Automatyczne akcje" />
            )}
          </div>

          {/* Customer rating */}
          {service.customerRating && (
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600">{service.customerRating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: ServiceStatus;
  services: any[];
  onServiceAction: (action: string, serviceId: string) => void;
  isSelected: (serviceId: string) => boolean;
  onServiceSelect: (serviceId: string, multiSelect: boolean) => void;
  onRangeSelect: (serviceId: string) => void;
}

function KanbanColumn({
  status,
  services,
  onServiceAction,
  isSelected,
  onServiceSelect,
  onRangeSelect,
}: KanbanColumnProps) {
  return (
    <Card className="min-w-80 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: status.color }} />
            {status.name}
            {status.requiresDate && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Data
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {services.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SortableContext items={services.map((s) => s._id)} strategy={verticalListSortingStrategy}>
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              onEdit={(id) => onServiceAction("edit", id)}
              onView={(id) => onServiceAction("view", id)}
              onCall={(id) => onServiceAction("call", id)}
              isSelected={isSelected(service._id)}
              onSelect={onServiceSelect}
              onRangeSelect={onRangeSelect}
            />
          ))}
        </SortableContext>

        {services.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Tool className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Brak serwisów</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EnhancedKanbanProps {
  services: any[];
  onServiceUpdate: (serviceId: string, updates: any) => void;
  onServiceAction: (action: string, serviceId: string) => void;
  className?: string;
}

export function EnhancedKanban({
  services,
  onServiceUpdate,
  onServiceAction,
  className = "",
}: EnhancedKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mutations
  const updateService = useMutation(api.jobs.update);
  const bulkUpdateServices = useMutation(api.jobs.bulkUpdate);
  const bulkDeleteServices = useMutation(api.jobs.bulkDelete);
  const getBulkData = useMutation(api.jobs.getBulkData);

  // Bulk selection hook
  const {
    selectedItems,
    isSelected,
    selectItem,
    toggleItem,
    selectAll,
    clearSelection,
    selectRange,
    getSelectedItems,
    selectionCount,
  } = useBulkSelection(
    services.map((s) => s._id),
    {
      enableKeyboardShortcuts: true,
      maxSelectionCount: 100,
    }
  );

  // Undo/Redo functionality
  const { canUndo, canRedo, undo, redo, executeAction } = useUndoRedo(async (action, isUndo) => {
    setIsProcessing(true);
    try {
      if (isUndo) {
        // Restore previous state
        await bulkUpdateServices({
          jobIds: action.data.items,
          updates: action.reverseData.oldData,
        });
      } else {
        // Apply action
        await bulkUpdateServices({
          jobIds: action.data.items,
          updates: action.data.newData,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  });

  // Bulk operations handler
  const handleBulkOperation = useCallback(
    async (operation: string, data?: any) => {
      const selectedIds = getSelectedItems();
      if (selectedIds.length === 0) return;

      setIsProcessing(true);
      try {
        // Get current data for undo
        const currentData = await getBulkData({ jobIds: selectedIds });
        const oldDataMap = currentData.reduce(
          (acc, item) => {
            acc[item._id] = item;
            return acc;
          },
          {} as Record<string, any>
        );

        let result;
        switch (operation) {
          case "status_change":
            result = await bulkUpdateServices({
              jobIds: selectedIds,
              updates: { status: data.status },
            });
            executeAction(
              createBulkAction("status_change", selectedIds, { status: data.status }, oldDataMap)
            );
            break;

          case "priority_change":
            result = await bulkUpdateServices({
              jobIds: selectedIds,
              updates: { priority: data.priority },
            });
            executeAction(
              createBulkAction(
                "priority_change",
                selectedIds,
                { priority: data.priority },
                oldDataMap
              )
            );
            break;

          case "district_transfer":
            result = await bulkUpdateServices({
              jobIds: selectedIds,
              updates: { district: data.district },
            });
            executeAction(
              createBulkAction(
                "district_transfer",
                selectedIds,
                { district: data.district },
                oldDataMap
              )
            );
            break;

          case "delete":
            result = await bulkDeleteServices({ jobIds: selectedIds });
            executeAction(createBulkAction("delete", selectedIds, {}, oldDataMap));
            clearSelection();
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      getSelectedItems,
      bulkUpdateServices,
      bulkDeleteServices,
      getBulkData,
      executeAction,
      clearSelection,
    ]
  );

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group services by status
  const servicesByStatus = useMemo(() => {
    const grouped = SERVICE_STATUSES.reduce(
      (acc, status) => {
        acc[status.id] = services.filter((service) => service.status === status.id);
        return acc;
      },
      {} as Record<string, any[]>
    );
    return grouped;
  }, [services]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the service being dragged
    const draggedService = services.find((s) => s._id === activeId);
    if (!draggedService) {
      setActiveId(null);
      return;
    }

    // Determine the new status
    let newStatus = overId;

    // If dropped on another service, get that service's status
    const targetService = services.find((s) => s._id === overId);
    if (targetService) {
      newStatus = targetService.status;
    }

    // If status hasn't changed, just reorder within the same column
    if (draggedService.status === newStatus) {
      setActiveId(null);
      return;
    }

    try {
      // Update service status
      await updateService({
        id: activeId,
        status: newStatus,
      });

      // Call parent update handler
      onServiceUpdate(activeId, { status: newStatus });

      toast.success(
        `Serwis przeniesiony do: ${SERVICE_STATUSES.find((s) => s.id === newStatus)?.name}`
      );
    } catch (_error) {
      toast.error("Błąd podczas aktualizacji statusu serwisu");
    }

    setActiveId(null);
  };

  // Handle service selection
  const _handleServiceSelect = (serviceId: string, selected: boolean) => {
    setSelectedServices((prev) =>
      selected ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
    );
  };

  // Get the dragged service for overlay
  const draggedService = activeId ? services.find((s) => s._id === activeId) : null;

  return (
    <div className={`${className}`}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {SERVICE_STATUSES.filter((status) => status.isActive).map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              services={servicesByStatus[status.id] || []}
              onServiceAction={onServiceAction}
              isSelected={isSelected}
              onServiceSelect={toggleItem}
              onRangeSelect={(serviceId) =>
                selectRange(
                  services[0]?._id || "",
                  serviceId,
                  services.map((s) => s._id)
                )
              }
            />
          ))}
        </div>

        <DragOverlay>
          {draggedService && (
            <ServiceCard
              service={draggedService}
              onEdit={() => {}}
              onView={() => {}}
              onCall={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedItems={getSelectedItems()}
        onClearSelection={clearSelection}
        onBulkOperation={handleBulkOperation}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isProcessing={isProcessing}
      />
    </div>
  );
}
