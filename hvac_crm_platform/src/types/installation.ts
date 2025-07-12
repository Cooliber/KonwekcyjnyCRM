/**
 * Installation Management Types
 * Based on RRUP documentation for installation status management
 * Features: Configurable statuses, color coding, automatic actions
 */

import { Id } from "../../convex/_generated/dataModel";

// Installation status configuration (inspired by RRUP)
export interface InstallationStatus {
  id: string;
  name: string;
  color: string; // Hex color code
  order: number; // For drag-and-drop ordering
  isActive: boolean;
  requiresDate?: boolean; // Whether this status requires completion date
  automaticActions?: InstallationAction[];
  description?: string;
}

// Automatic actions for installation statuses
export interface InstallationAction {
  id: string;
  type: 'email' | 'sms' | 'task' | 'notification' | 'webhook';
  recipient: 'client' | 'technician' | 'manager' | 'team' | 'custom';
  template: string; // Message template with placeholders
  delay?: number; // Delay in minutes before executing
  conditions?: ActionCondition[];
}

// Conditions for automatic actions
export interface ActionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

// Installation priority levels
export type InstallationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';

// Installation categories
export type InstallationCategory = 
  | 'split_ac' 
  | 'central_ac' 
  | 'heat_pump' 
  | 'ventilation' 
  | 'heating' 
  | 'cooling' 
  | 'maintenance' 
  | 'repair'
  | 'upgrade';

// Main installation interface
export interface Installation {
  _id: Id<"installations">;
  installationNumber: string; // Auto-generated unique number
  contactId: Id<"contacts">;
  jobId?: Id<"jobs">;
  
  // Basic information
  title: string;
  description: string;
  category: InstallationCategory;
  priority: InstallationPriority;
  
  // Status management
  status: string; // References InstallationStatus.id
  statusHistory: StatusHistoryEntry[];
  
  // Scheduling
  scheduledDate?: number;
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
  
  // Equipment and materials
  equipmentList: InstallationEquipment[];
  materialsList: InstallationMaterial[];
  
  // Documentation
  photos: Id<"_storage">[];
  documents: Id<"documents">[];
  notes: string;
  
  // Quality and compliance
  qualityChecklist: QualityCheckItem[];
  certifications: Certification[];
  warrantyInfo?: WarrantyInfo;
  
  // Financial
  estimatedCost: number;
  actualCost?: number;
  vatAmount: number; // 23% Polish VAT
  totalAmount: number;
  
  // Tracking
  createdBy: Id<"users">;
  createdAt: number;
  lastModified: number;
  completedBy?: Id<"users">;
  completedAt?: number;
}

// Status history tracking
export interface StatusHistoryEntry {
  statusId: string;
  statusName: string;
  changedBy: Id<"users">;
  changedAt: number;
  notes?: string;
  automaticAction?: boolean;
}

// Equipment for installation
export interface InstallationEquipment {
  equipmentId: Id<"equipment">;
  name: string;
  model: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warrantyMonths: number;
}

// Materials for installation
export interface InstallationMaterial {
  materialId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; // meters, pieces, kg, etc.
  unitPrice: number;
  totalPrice: number;
}

// Quality control checklist
export interface QualityCheckItem {
  id: string;
  description: string;
  category: 'safety' | 'functionality' | 'aesthetics' | 'compliance';
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: Id<"users">;
  completedAt?: number;
  notes?: string;
  photos?: Id<"_storage">[];
}

// Certifications and compliance
export interface Certification {
  id: string;
  type: 'energy_efficiency' | 'safety' | 'environmental' | 'warranty' | 'compliance';
  name: string;
  issuer: string;
  certificateNumber: string;
  issueDate: number;
  expiryDate?: number;
  documentId?: Id<"documents">;
}

// Warranty information
export interface WarrantyInfo {
  equipmentWarranty: number; // months
  installationWarranty: number; // months
  startDate: number;
  terms: string;
  contactInfo: string;
}

// Installation filters for UI
export interface InstallationFilters {
  status?: string[];
  priority?: InstallationPriority[];
  category?: InstallationCategory[];
  district?: string[];
  assignedTechnician?: Id<"users">[];
  dateRange?: {
    from: number;
    to: number;
  };
  searchQuery?: string;
}

// Installation statistics
export interface InstallationStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<InstallationPriority, number>;
  byCategory: Record<InstallationCategory, number>;
  byDistrict: Record<string, number>;
  avgDuration: number;
  completionRate: number;
  onTimeRate: number;
  customerSatisfaction: number;
}

// Template placeholders for automatic actions
export interface TemplatePlaceholders {
  client_name: string;
  client_email: string;
  client_phone: string;
  installation_number: string;
  installation_title: string;
  installation_address: string;
  installation_date: string;
  technician_name: string;
  team_leader_name: string;
  estimated_duration: string;
  status_name: string;
  company_name: string;
  company_phone: string;
  company_email: string;
}

// Installation dashboard metrics
export interface InstallationMetrics {
  todayInstallations: number;
  weekInstallations: number;
  monthInstallations: number;
  pendingInstallations: number;
  inProgressInstallations: number;
  completedInstallations: number;
  overdueInstallations: number;
  avgInstallationTime: number;
  customerSatisfactionScore: number;
  technicianUtilization: number;
  revenueThisMonth: number;
  profitMargin: number;
}

// Export utility types
export type InstallationFormData = Omit<Installation, '_id' | 'createdAt' | 'lastModified' | 'statusHistory'>;
export type InstallationUpdateData = Partial<Pick<Installation, 
  'title' | 'description' | 'priority' | 'scheduledDate' | 'assignedTechnicians' | 
  'notes' | 'estimatedCost' | 'actualCost' | 'status'
>>;
