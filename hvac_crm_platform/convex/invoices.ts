import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

/**
 * Enhanced Invoice Management System
 * Features: Dynamic pricing with affluence multipliers, PDF export, GDPR compliance
 * Target: 15% revenue boost simulation, Warsaw district optimization
 */

// Warsaw district affluence multipliers for dynamic pricing
const DISTRICT_AFFLUENCE_MULTIPLIERS = {
  'Śródmieście': 1.25,    // Highest affluence - 25% premium
  'Wilanów': 1.20,        // High affluence - 20% premium
  'Mokotów': 1.15,        // High affluence - 15% premium
  'Żoliborz': 1.10,       // Medium-high affluence - 10% premium
  'Ursynów': 1.05,        // Medium affluence - 5% premium
  'Wola': 1.00,           // Base pricing
  'Praga-Południe': 0.95, // Lower affluence - 5% discount
  'Targówek': 0.90,       // Lowest affluence - 10% discount
};

// Service type pricing multipliers
const SERVICE_TYPE_MULTIPLIERS = {
  'emergency': 1.50,      // 50% emergency surcharge
  'installation': 1.00,   // Base pricing
  'maintenance': 0.85,    // 15% discount for maintenance
  'repair': 1.10,         // 10% premium for repairs
  'inspection': 0.75,     // 25% discount for inspections
};

// Get invoices with advanced filtering
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("canceled")
    )),
    contactId: v.optional(v.id("contacts")),
    district: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("invoices");
    
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }
    
    if (args.contactId) {
      query = query.filter(q => q.eq(q.field("contactId"), args.contactId));
    }
    
    if (args.dateFrom !== undefined) {
      query = query.filter(q => q.gte(q.field("issueDate"), args.dateFrom!));
    }

    if (args.dateTo !== undefined) {
      query = query.filter(q => q.lte(q.field("issueDate"), args.dateTo!));
    }

    const invoices = await query
      .order("desc")
      .take(args.limit || 50);

    // Enhance with contact and job data
    const enhancedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const contact = await ctx.db.get(invoice.contactId);
        const job = await ctx.db.get(invoice.jobId);
        
        return {
          ...invoice,
          contact,
          job,
          districtMultiplier: contact?.district ? DISTRICT_AFFLUENCE_MULTIPLIERS[contact.district as keyof typeof DISTRICT_AFFLUENCE_MULTIPLIERS] || 1.0 : 1.0
        };
      })
    );

    // Filter by district if specified
    if (args.district) {
      return enhancedInvoices.filter(invoice => invoice.contact?.district === args.district);
    }

    return enhancedInvoices;
  },
});

// Create invoice with dynamic pricing
export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    jobId: v.id("jobs"),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      taxRate: v.number(),
      equipmentId: v.optional(v.id("equipment"))
    })),
    dueDate: v.optional(v.number()),
    applyDistrictPricing: v.optional(v.boolean()),
    applyServiceTypePricing: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get contact and job data for pricing calculations
    const contact = await ctx.db.get(args.contactId);
    const job = await ctx.db.get(args.jobId);
    
    if (!contact || !job) {
      throw new Error("Contact or job not found");
    }

    // Calculate dynamic pricing
    let pricingMultiplier = 1.0;
    
    // Apply district-based affluence multiplier
    if (args.applyDistrictPricing && contact.district) {
      pricingMultiplier *= DISTRICT_AFFLUENCE_MULTIPLIERS[contact.district as keyof typeof DISTRICT_AFFLUENCE_MULTIPLIERS] || 1.0;
    }

    // Apply service type multiplier
    if (args.applyServiceTypePricing && job.type) {
      pricingMultiplier *= SERVICE_TYPE_MULTIPLIERS[job.type as keyof typeof SERVICE_TYPE_MULTIPLIERS] || 1.0;
    }

    // Apply affluence score multiplier (if available)
    if (contact.affluenceScore && contact.affluenceScore > 7) {
      pricingMultiplier *= 1.1; // 10% premium for high affluence scores
    }

    // Calculate adjusted items with dynamic pricing
    const adjustedItems = args.items.map(item => ({
      ...item,
      unitPrice: Math.round(item.unitPrice * pricingMultiplier * 100) / 100
    }));

    // Calculate totals
    const subtotal = adjustedItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    
    const totalTax = adjustedItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0
    );
    
    const totalAmount = subtotal + totalTax;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(ctx);

    // Calculate route efficiency discount if applicable
    const routeEfficiency = await calculateRouteEfficiency(ctx, job);
    const efficiencyDiscount = routeEfficiency > 0.8 ? totalAmount * 0.05 : 0; // 5% discount for efficient routes

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      contactId: args.contactId,
      jobId: args.jobId,
      issueDate: Date.now(),
      dueDate: args.dueDate || (Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      status: "draft",
      items: adjustedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalAmount: Math.round((totalAmount - efficiencyDiscount) * 100) / 100,
      paymentHistory: [],
      routeEfficiency,
      efficiencyDiscount,
      dataHandling: {
        storageLocation: "EU-Warsaw",
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years for tax compliance
      }
    });

    // Log pricing calculation for analytics
    await ctx.db.insert("integrationLogs", {
      service: "ai_transcription",
      action: "dynamic_pricing_applied",
      status: "success",
      data: JSON.stringify({
        invoiceId,
        originalSubtotal: args.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        adjustedSubtotal: subtotal,
        pricingMultiplier,
        district: contact.district,
        serviceType: job.type,
        affluenceScore: contact.affluenceScore,
        routeEfficiency,
        efficiencyDiscount
      }),
      relatedId: invoiceId
    });

    return invoiceId;
  },
});

// Update invoice status
export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("canceled")
    ),
    paymentAmount: v.optional(v.number()),
    paymentMethod: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");

    const updates: any = { status: args.status };

    // Add payment record if payment is being made
    if (args.status === "paid" && args.paymentAmount && args.paymentMethod) {
      updates.paymentHistory = [
        ...invoice.paymentHistory,
        {
          date: Date.now(),
          amount: args.paymentAmount,
          method: args.paymentMethod
        }
      ];
    }

    await ctx.db.patch(args.id, updates);

    // Trigger workflow automation for status changes
    await ctx.scheduler.runAfter(0, internal.workflows.executeWorkflows, {
      triggerEvent: "INVOICE_STATUS_CHANGE",
      entityId: args.id,
      entityType: "invoice",
      entityData: {
        ...invoice,
        status: args.status,
        paymentAmount: args.paymentAmount
      }
    });

    return args.id;
  },
});

// Generate PDF export data
export const generatePDFData = query({
  args: {
    id: v.id("invoices")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");

    const contact = await ctx.db.get(invoice.contactId);
    const job = await ctx.db.get(invoice.jobId);

    // Get company information (would be from settings in real app)
    const companyInfo = {
      name: "HVAC Solutions Warsaw",
      address: "ul. Marszałkowska 1, 00-001 Warszawa",
      phone: "+48 22 123 4567",
      email: "biuro@hvacsolutions.pl",
      nip: "1234567890",
      regon: "123456789"
    };

    return {
      invoice,
      contact,
      job,
      companyInfo,
      generatedAt: Date.now(),
      // GDPR compliance note
      gdprNote: "Dane osobowe przetwarzane są zgodnie z RODO. Okres przechowywania: 7 lat."
    };
  },
});

// Get revenue analytics with district breakdown
export const getRevenueAnalytics = query({
  args: {
    dateFrom: v.number(),
    dateTo: v.number(),
    groupBy: v.optional(v.union(v.literal("district"), v.literal("month"), v.literal("service_type")))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoices = await ctx.db
      .query("invoices")
      .filter(q => q.and(
        q.gte(q.field("issueDate"), args.dateFrom),
        q.lte(q.field("issueDate"), args.dateTo),
        q.eq(q.field("status"), "paid")
      ))
      .collect();

    // Get contact and job data for grouping
    const enhancedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const contact = await ctx.db.get(invoice.contactId);
        const job = await ctx.db.get(invoice.jobId);
        return { invoice, contact, job };
      })
    );

    let analytics: any = {
      totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      totalInvoices: invoices.length,
      averageInvoiceValue: invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length : 0,
      totalEfficiencyDiscounts: invoices.reduce((sum, inv) => sum + (inv.efficiencyDiscount || 0), 0)
    };

    // Group by district
    if (args.groupBy === "district") {
      analytics.byDistrict = {};
      enhancedInvoices.forEach(({ invoice, contact }) => {
        const district = contact?.district || "Unknown";
        if (!analytics.byDistrict[district]) {
          analytics.byDistrict[district] = {
            revenue: 0,
            count: 0,
            averageValue: 0,
            multiplier: DISTRICT_AFFLUENCE_MULTIPLIERS[district as keyof typeof DISTRICT_AFFLUENCE_MULTIPLIERS] || 1.0
          };
        }
        analytics.byDistrict[district].revenue += invoice.totalAmount;
        analytics.byDistrict[district].count += 1;
        analytics.byDistrict[district].averageValue = 
          analytics.byDistrict[district].revenue / analytics.byDistrict[district].count;
      });
    }

    // Group by service type
    if (args.groupBy === "service_type") {
      analytics.byServiceType = {};
      enhancedInvoices.forEach(({ invoice, job }) => {
        const serviceType = job?.type || "Unknown";
        if (!analytics.byServiceType[serviceType]) {
          analytics.byServiceType[serviceType] = {
            revenue: 0,
            count: 0,
            averageValue: 0,
            multiplier: SERVICE_TYPE_MULTIPLIERS[serviceType as keyof typeof SERVICE_TYPE_MULTIPLIERS] || 1.0
          };
        }
        analytics.byServiceType[serviceType].revenue += invoice.totalAmount;
        analytics.byServiceType[serviceType].count += 1;
        analytics.byServiceType[serviceType].averageValue = 
          analytics.byServiceType[serviceType].revenue / analytics.byServiceType[serviceType].count;
      });
    }

    return analytics;
  },
});

// Helper functions
async function generateInvoiceNumber(ctx: any): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get count of invoices this month
  const monthStart = new Date(year, new Date().getMonth(), 1).getTime();
  const monthEnd = new Date(year, new Date().getMonth() + 1, 0).getTime();
  
  const monthlyInvoices = await ctx.db
    .query("invoices")
    .filter((q: any) => q.and(
      q.gte(q.field("issueDate"), monthStart),
      q.lte(q.field("issueDate"), monthEnd)
    ))
    .collect();
  
  const sequence = String(monthlyInvoices.length + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
}

async function calculateRouteEfficiency(ctx: any, job: any): Promise<number> {
  // Get route data for the job's date and district
  const jobDate = new Date(job.scheduledDate || Date.now()).toISOString().split('T')[0];
  
  const routes = await ctx.db
    .query("optimizedRoutes")
    .filter((q: any) => q.eq(q.field("date"), jobDate))
    .collect();

  // Find route containing this job
  const relevantRoute = routes.find((route: any) =>
    route.points.some((point: any) => point.id === job._id)
  );
  
  return relevantRoute?.efficiency || 0.5; // Default to 50% efficiency
}

// Simulate revenue boost calculation
export const simulateRevenueBoost = query({
  args: {
    dateFrom: v.number(),
    dateTo: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get baseline revenue (without dynamic pricing)
    const baselineRevenue = await calculateBaselineRevenue(ctx, args.dateFrom, args.dateTo);
    
    // Get actual revenue (with dynamic pricing)
    const actualRevenue = await calculateActualRevenue(ctx, args.dateFrom, args.dateTo);
    
    const revenueBoost = ((actualRevenue - baselineRevenue) / baselineRevenue) * 100;
    
    return {
      baselineRevenue,
      actualRevenue,
      revenueBoost: Math.round(revenueBoost * 100) / 100,
      targetBoost: 15, // 15% target
      targetMet: revenueBoost >= 15
    };
  },
});

async function calculateBaselineRevenue(ctx: any, dateFrom: number, dateTo: number): Promise<number> {
  // Get pricing logs to calculate what revenue would have been without dynamic pricing
  const pricingLogs = await ctx.db
    .query("integrationLogs")
    .filter((q: any) => q.and(
      q.eq(q.field("service"), "ai_transcription"),
      q.eq(q.field("action"), "dynamic_pricing_applied"),
      q.gte(q.field("_creationTime"), dateFrom),
      q.lte(q.field("_creationTime"), dateTo)
    ))
    .collect();

  return pricingLogs.reduce((sum: number, log: any) => {
    const data = JSON.parse(log.data || '{}');
    return sum + (data.originalSubtotal || 0);
  }, 0);
}

async function calculateActualRevenue(ctx: any, dateFrom: number, dateTo: number): Promise<number> {
  const invoices = await ctx.db
    .query("invoices")
    .filter((q: any) => q.and(
      q.gte(q.field("issueDate"), dateFrom),
      q.lte(q.field("issueDate"), dateTo),
      q.eq(q.field("status"), "paid")
    ))
    .collect();

  return invoices.reduce((sum: number, invoice: any) => sum + invoice.totalAmount, 0);
}
