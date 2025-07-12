/**
 * Service Management Types
 * Based on RRUP documentation for service status management
 * Features: Configurable statuses, automatic actions, priorities, categories
 */

import type { Id } from "../../convex/_generated/dataModel";

// Service status configuration (inspired by RRUP)
export interface ServiceStatus {
  id: string;
  name: string;
  color: string; // Hex color code
  order: number; // For drag-and-drop ordering
  isActive: boolean;
  requiresDate: boolean; // Whether this status requires completion date
  automaticActions: ServiceAction[];
  calculatorIds?: string[]; // Associated calculators (RRUP feature)
  description?: string;
}

// Service automatic actions
export interface ServiceAction {
  id: string;
  type: "email" | "sms" | "task" | "notification" | "webhook";
  recipient: "client" | "technician" | "manager" | "team" | "custom";
  recipientEmail?: string; // For custom recipients
  template: string; // Message template with {{placeholders}}
  delay?: number; // Delay in minutes before executing
  conditions?: ServiceActionCondition[];
}

// Conditions for service actions
export interface ServiceActionCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: any;
}

// Service priority levels (RRUP-inspired)
export type ServicePriority = "low" | "normal" | "high" | "urgent" | "emergency";

// Service categories (RRUP-inspired)
export type ServiceCategory =
  | "preventive_maintenance"
  | "corrective_maintenance"
  | "emergency_repair"
  | "warranty_service"
  | "inspection"
  | "cleaning"
  | "filter_replacement"
  | "refrigerant_service"
  | "electrical_service"
  | "mechanical_service"
  | "diagnostic"
  | "upgrade"
  | "seasonal_service";

// Service types
export type ServiceType = "scheduled" | "emergency" | "warranty" | "contract" | "one_time";

// Main service interface
export interface Service {
  _id: Id<"services">;
  serviceNumber: string; // Auto-generated unique number
  contactId: Id<"contacts">;
  installationId?: Id<"installations">;
  contractId?: Id<"contracts">;

  // Basic information
  title: string;
  description: string;
  category: ServiceCategory;
  type: ServiceType;
  priority: ServicePriority;

  // Status management (RRUP-inspired)
  status: string; // References ServiceStatus.id
  statusHistory: ServiceStatusHistoryEntry[];

  // Scheduling
  requestedDate?: number;
  scheduledDate?: number;
  requiredCompletionDate?: number; // RRUP feature
  estimatedDuration: number; // in minutes
  actualStartDate?: number;
  actualEndDate?: number;

  // Location and technician
  address: string;
  district: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  assignedTechnicians: Id<"users">[];
  teamLeader?: Id<"users">;

  // Service details
  symptoms: string;
  diagnosis?: string;
  workPerformed?: string;
  partsUsed: ServicePart[];
  materialsUsed: ServiceMaterial[];

  // Equipment information
  equipmentDetails: ServiceEquipment[];

  // Documentation
  photos: Id<"_storage">[];
  documents: Id<"documents">[];
  beforePhotos: Id<"_storage">[];
  afterPhotos: Id<"_storage">[];
  notes: string;
  technicianNotes?: string;

  // Quality and compliance
  serviceChecklist: ServiceCheckItem[];
  customerSignature?: Id<"_storage">;
  customerFeedback?: CustomerFeedback;

  // Financial
  estimatedCost: number;
  actualCost?: number;
  partsTotal: number;
  laborTotal: number;
  vatAmount: number; // 23% Polish VAT
  totalAmount: number;

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: number;
  nextServiceDue?: number;
  warrantyExtended?: boolean;

  // Tracking
  createdBy: Id<"users">;
  createdAt: number;
  lastModified: number;
  completedBy?: Id<"users">;
  completedAt?: number;
}

// Service status history tracking
export interface ServiceStatusHistoryEntry {
  statusId: string;
  statusName: string;
  changedBy: Id<"users">;
  changedAt: number;
  notes?: string;
  automaticAction?: boolean;
  actionType?: string;
}

// Parts used in service
export interface ServicePart {
  partId: string;
  name: string;
  partNumber: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warrantyMonths?: number;
  supplier?: string;
}

// Materials used in service
export interface ServiceMaterial {
  materialId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; // liters, meters, pieces, etc.
  unitPrice: number;
  totalPrice: number;
}

// Equipment being serviced
export interface ServiceEquipment {
  equipmentId?: Id<"equipment">;
  type: string;
  brand: string;
  model: string;
  serialNumber?: string;
  installationDate?: number;
  lastServiceDate?: number;
  warrantyStatus: "active" | "expired" | "extended";
  condition: "excellent" | "good" | "fair" | "poor" | "critical";
}

// Service checklist items
export interface ServiceCheckItem {
  id: string;
  description: string;
  category: "safety" | "functionality" | "performance" | "compliance" | "cleaning";
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: Id<"users">;
  completedAt?: number;
  notes?: string;
  photos?: Id<"_storage">[];
  measurements?: ServiceMeasurement[];
}

// Service measurements
export interface ServiceMeasurement {
  parameter: string;
  value: number;
  unit: string;
  normalRange?: {
    min: number;
    max: number;
  };
  isWithinRange: boolean;
}

// Customer feedback
export interface CustomerFeedback {
  rating: number; // 1-5 scale
  comments?: string;
  wouldRecommend: boolean;
  technicianRating: number;
  responseTimeRating: number;
  qualityRating: number;
  submittedAt: number;
}

// Service filters for UI
export interface ServiceFilters {
  status?: string[];
  priority?: ServicePriority[];
  category?: ServiceCategory[];
  type?: ServiceType[];
  district?: string[];
  assignedTechnician?: Id<"users">[];
  dateRange?: {
    from: number;
    to: number;
  };
  searchQuery?: string;
  overdueOnly?: boolean;
  followUpRequired?: boolean;
}

// Service statistics
export interface ServiceStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<ServicePriority, number>;
  byCategory: Record<ServiceCategory, number>;
  byType: Record<ServiceType, number>;
  byDistrict: Record<string, number>;
  avgResponseTime: number;
  avgCompletionTime: number;
  firstTimeFixRate: number;
  customerSatisfactionAvg: number;
  overdueCount: number;
}

// Template placeholders for automatic actions (RRUP-inspired)
export interface ServiceTemplatePlaceholders {
  klient_imie: string;
  klient_nazwisko: string;
  klient_email: string;
  klient_telefon: string;
  serwis_numer: string;
  serwis_tytul: string;
  serwis_adres: string;
  serwis_data: string;
  serwis_czas: string;
  technik_imie: string;
  technik_nazwisko: string;
  status_nazwa: string;
  priorytet: string;
  kategoria: string;
  firma_nazwa: string;
  firma_telefon: string;
  firma_email: string;
  koszt_szacowany: string;
  koszt_rzeczywisty: string;
}

// Service dashboard metrics
export interface ServiceMetrics {
  todayServices: number;
  weekServices: number;
  monthServices: number;
  pendingServices: number;
  inProgressServices: number;
  completedServices: number;
  overdueServices: number;
  emergencyServices: number;
  avgResponseTime: number; // in hours
  avgCompletionTime: number; // in hours
  firstTimeFixRate: number; // percentage
  customerSatisfactionScore: number;
  technicianUtilization: number;
  revenueThisMonth: number;
  profitMargin: number;
  repeatCustomerRate: number;
}

// Service contract information
export interface ServiceContract {
  id: string;
  contactId: Id<"contacts">;
  type: "annual" | "bi_annual" | "quarterly" | "monthly";
  startDate: number;
  endDate: number;
  servicesIncluded: number;
  servicesUsed: number;
  value: number;
  isActive: boolean;
  autoRenewal: boolean;
}

// Export utility types
export type ServiceFormData = Omit<Service, "_id" | "createdAt" | "lastModified" | "statusHistory">;
export type ServiceUpdateData = Partial<
  Pick<
    Service,
    | "title"
    | "description"
    | "priority"
    | "scheduledDate"
    | "assignedTechnicians"
    | "notes"
    | "estimatedCost"
    | "actualCost"
    | "status"
    | "workPerformed"
    | "diagnosis"
  >
>;
