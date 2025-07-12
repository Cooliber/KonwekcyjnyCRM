/**
 * Quote Management Types
 * HVAC Quote Calculator and Management System
 * Features: Multi-category products, dynamic pricing, VAT calculation, PDF export
 */

import type { Id } from "../../convex/_generated/dataModel";

// Quote status types
export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

// Quote priority types
export type QuotePriority = "low" | "normal" | "high" | "urgent";

// HVAC Product Categories
export type ProductCategoryType =
  | "klimatyzacja"
  | "wentylacja"
  | "rekuperacja"
  | "pompy_ciepla"
  | "automatyka"
  | "serwis"
  | "czesci";

// Product option interface
export interface ProductOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
  description?: string;
  category?: string;
}

// Product interface
export interface Product {
  id: string;
  name: string;
  basePrice: number;
  unit: string;
  category: ProductCategoryType;
  description?: string;
  options?: ProductOption[];
  isActive: boolean;
  supplier?: string;
  warrantyMonths?: number;
  leadTime?: number; // days
  minQuantity?: number;
  maxQuantity?: number;
}

// Product category interface
export interface ProductCategory {
  id: ProductCategoryType;
  name: string;
  icon: string;
  description?: string;
  products: Product[];
  isActive: boolean;
  order: number;
}

// Quote item interface
export interface QuoteItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: string[];
  customPrice?: number;
  discount?: number;
  notes?: string;
  totalPrice: number;
}

// Quote calculations interface
export interface QuoteCalculations {
  subtotal: number;
  discountAmount: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  marginAmount?: number;
  marginPercentage?: number;
}

// Quote interface
export interface Quote {
  _id: Id<"quotes">;
  quoteNumber: string; // Auto-generated unique number

  // Client information
  clientId?: Id<"contacts">;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  district?: string; // Warsaw district

  // Quote details
  title: string;
  description?: string;
  status: QuoteStatus;
  priority: QuotePriority;

  // Items and pricing
  items: QuoteItem[];
  calculations: QuoteCalculations;

  // Discounts and additional costs
  globalDiscount: number; // percentage
  additionalCosts: number;

  // Terms and conditions
  validUntil: number;
  paymentTerms: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  notes?: string;

  // Tracking
  createdBy: Id<"users">;
  createdAt: number;
  lastModified: number;
  sentAt?: number;
  viewedAt?: number;
  acceptedAt?: number;
  rejectedAt?: number;

  // Follow-up
  followUpDate?: number;
  reminderSent?: boolean;

  // Conversion tracking
  convertedToJobId?: Id<"jobs">;
  convertedAt?: number;

  // Document management
  pdfUrl?: string;
  attachments?: Id<"_storage">[];

  // Version control
  version: number;
  previousVersionId?: Id<"quotes">;
  isLatestVersion: boolean;
}

// Quote template interface
export interface QuoteTemplate {
  _id: Id<"quoteTemplates">;
  name: string;
  description?: string;
  category: ProductCategoryType;
  items: Omit<QuoteItem, "id" | "totalPrice">[];
  defaultDiscount: number;
  defaultValidityDays: number;
  defaultPaymentTerms: string;
  isActive: boolean;
  createdBy: Id<"users">;
  createdAt: number;
  usageCount: number;
}

// Quote filters interface
export interface QuoteFilters {
  status?: QuoteStatus[];
  priority?: QuotePriority[];
  category?: ProductCategoryType[];
  district?: string[];
  clientId?: Id<"contacts">;
  createdBy?: Id<"users">;
  dateRange?: {
    from: number;
    to: number;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  expiringSoon?: boolean; // quotes expiring in next 7 days
  overdue?: boolean; // quotes past valid date
}

// Quote statistics interface
export interface QuoteStats {
  total: number;
  byStatus: Record<QuoteStatus, number>;
  byPriority: Record<QuotePriority, number>;
  byCategory: Record<ProductCategoryType, number>;
  byDistrict: Record<string, number>;
  totalValue: number;
  averageValue: number;
  conversionRate: number; // percentage of quotes converted to jobs
  avgResponseTime: number; // hours from creation to first view
  expiringSoon: number; // quotes expiring in next 7 days
  overdue: number; // quotes past valid date
}

// Quote activity log interface
export interface QuoteActivity {
  id: string;
  quoteId: Id<"quotes">;
  type:
    | "created"
    | "sent"
    | "viewed"
    | "modified"
    | "accepted"
    | "rejected"
    | "expired"
    | "converted";
  description: string;
  userId?: Id<"users">;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Quote email template interface
export interface QuoteEmailTemplate {
  _id: Id<"quoteEmailTemplates">;
  name: string;
  subject: string;
  body: string; // HTML content
  isDefault: boolean;
  category: "initial" | "reminder" | "follow_up" | "acceptance" | "rejection";
  placeholders: string[]; // Available template placeholders
  createdBy: Id<"users">;
  createdAt: number;
}

// Quote PDF settings interface
export interface QuotePDFSettings {
  companyLogo?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  vatNumber: string;
  bankAccount?: string;
  footerText?: string;
  showPrices: boolean;
  showDiscount: boolean;
  showVAT: boolean;
  showNotes: boolean;
  watermark?: string;
}

// Export utility types
export type QuoteFormData = Omit<
  Quote,
  "_id" | "createdAt" | "lastModified" | "quoteNumber" | "version" | "isLatestVersion"
>;

export type QuoteUpdateData = Partial<
  Pick<
    Quote,
    | "title"
    | "description"
    | "status"
    | "priority"
    | "items"
    | "globalDiscount"
    | "additionalCosts"
    | "validUntil"
    | "paymentTerms"
    | "notes"
  >
>;

export type QuoteItemFormData = Omit<QuoteItem, "id" | "totalPrice">;

// Warsaw district pricing multipliers
export const DISTRICT_PRICING_MULTIPLIERS: Record<string, number> = {
  Śródmieście: 1.15,
  Mokotów: 1.1,
  Żoliborz: 1.1,
  Ochota: 1.05,
  Wola: 1.05,
  "Praga-Południe": 1.0,
  "Praga-Północ": 1.0,
  Ursynów: 1.08,
  Wilanów: 1.12,
  Bemowo: 1.02,
  Bielany: 1.02,
  Targówek: 0.98,
  Ursus: 0.95,
  Włochy: 0.95,
  Wawer: 0.95,
  Wesoła: 0.92,
  Białołęka: 0.95,
  Rembertów: 0.9,
};

// VAT rates
export const VAT_RATES = {
  STANDARD: 0.23, // 23% standard Polish VAT
  REDUCED: 0.08, // 8% reduced rate for some services
  ZERO: 0.0, // 0% for exports
} as const;

// Default quote validity period (days)
export const DEFAULT_QUOTE_VALIDITY_DAYS = 30;

// Quote number prefix
export const QUOTE_NUMBER_PREFIX = "OFF";
