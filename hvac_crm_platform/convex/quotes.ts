import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let quotes;
    if (args.status) {
      quotes = await ctx.db
        .query("quotes")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .take(100);
    } else if (args.contactId) {
      quotes = await ctx.db
        .query("quotes")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId!))
        .order("desc")
        .take(100);
    } else {
      quotes = await ctx.db.query("quotes").order("desc").take(100);
    }

    // Add contact information
    return await Promise.all(
      quotes.map(async (quote) => {
        const contact = await ctx.db.get(quote.contactId);
        return { ...quote, contact };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const quote = await ctx.db.get(args.id);
    if (!quote) return null;

    const contact = await ctx.db.get(quote.contactId);

    // Get dynamic link URL if exists
    let dynamicLinkUrl = null;
    if (quote.dynamicLink) {
      dynamicLinkUrl = `${process.env.SITE_URL}/quote/${quote.dynamicLink}`;
    }

    return {
      ...quote,
      contact,
      dynamicLinkUrl,
    };
  },
});

export const getByDynamicLink = query({
  args: { link: v.string() },
  handler: async (ctx, args) => {
    const quote = await ctx.db
      .query("quotes")
      .filter((q) => q.eq(q.field("dynamicLink"), args.link))
      .first();

    if (!quote) return null;

    const contact = await ctx.db.get(quote.contactId);

    // Note: This is a query function, so we can't modify data here
    // The view count increment should be done in a separate mutation

    return {
      ...quote,
      contact,
    };
  },
});

export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    jobId: v.optional(v.id("jobs")),
    title: v.string(),
    description: v.string(),
    validUntil: v.number(),
    proposals: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        lineItems: v.array(
          v.object({
            description: v.string(),
            quantity: v.number(),
            unitPrice: v.number(),
            total: v.number(),
            type: v.union(v.literal("labor"), v.literal("material"), v.literal("equipment")),
          })
        ),
        subtotal: v.number(),
        tax: v.optional(v.number()),
        total: v.number(),
        recommended: v.boolean(),
      })
    ),
    terms: v.optional(v.string()),
    aiGenerated: v.optional(v.boolean()),
    transcriptionSource: v.optional(v.id("transcriptions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate quote number
    const quoteCount = await ctx.db.query("quotes").collect();
    const quoteNumber = `Q${String(quoteCount.length + 1).padStart(4, "0")}`;

    // Generate dynamic link
    const dynamicLink = Math.random().toString(36).substring(2, 15);

    const quoteId = await ctx.db.insert("quotes", {
      ...args,
      quoteNumber,
      status: "draft",
      dynamicLink,
      linkViews: 0,
      clientInteractions: [],
      createdBy: userId,
    });

    return { quoteId, dynamicLink };
  },
});

export const generateFromTranscription = mutation({
  args: {
    transcriptionId: v.id("transcriptions"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transcription = await ctx.db.get(args.transcriptionId);
    if (!transcription) throw new Error("Transcription not found");

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const extractedData = transcription.extractedData;

    // Generate AI-based proposals
    const proposals = [];

    // Basic proposal
    const basicCost = (extractedData.deviceCount || 1) * 2500; // Base price per unit
    proposals.push({
      id: "basic",
      title: "Basic Installation",
      description: "Standard installation with basic equipment",
      lineItems: [
        {
          description: `Split AC Unit Installation (${extractedData.deviceCount || 1} units)`,
          quantity: extractedData.deviceCount || 1,
          unitPrice: 2000,
          total: (extractedData.deviceCount || 1) * 2000,
          type: "equipment" as const,
        },
        {
          description: "Installation Labor",
          quantity: extractedData.deviceCount || 1,
          unitPrice: 500,
          total: (extractedData.deviceCount || 1) * 500,
          type: "labor" as const,
        },
      ],
      subtotal: basicCost,
      tax: basicCost * 0.23, // 23% VAT in Poland
      total: basicCost * 1.23,
      recommended: false,
    });

    // Premium proposal
    const premiumCost = (extractedData.deviceCount || 1) * 3500;
    proposals.push({
      id: "premium",
      title: "Premium Installation",
      description: "High-efficiency units with extended warranty",
      lineItems: [
        {
          description: `Premium Split AC Unit (${extractedData.deviceCount || 1} units)`,
          quantity: extractedData.deviceCount || 1,
          unitPrice: 2800,
          total: (extractedData.deviceCount || 1) * 2800,
          type: "equipment" as const,
        },
        {
          description: "Professional Installation",
          quantity: extractedData.deviceCount || 1,
          unitPrice: 700,
          total: (extractedData.deviceCount || 1) * 700,
          type: "labor" as const,
        },
      ],
      subtotal: premiumCost,
      tax: premiumCost * 0.23,
      total: premiumCost * 1.23,
      recommended: true,
    });

    // VIP proposal (if affluence score is high)
    if (contact.affluenceScore && contact.affluenceScore > 7) {
      const vipCost = (extractedData.deviceCount || 1) * 5000;
      proposals.push({
        id: "vip",
        title: "VIP Package",
        description: "Top-tier equipment with premium service",
        lineItems: [
          {
            description: `VIP Split AC Unit with Smart Controls (${extractedData.deviceCount || 1} units)`,
            quantity: extractedData.deviceCount || 1,
            unitPrice: 4000,
            total: (extractedData.deviceCount || 1) * 4000,
            type: "equipment" as const,
          },
          {
            description: "VIP Installation & Setup",
            quantity: extractedData.deviceCount || 1,
            unitPrice: 1000,
            total: (extractedData.deviceCount || 1) * 1000,
            type: "labor" as const,
          },
        ],
        subtotal: vipCost,
        tax: vipCost * 0.23,
        total: vipCost * 1.23,
        recommended: false,
      });
    }

    const quoteCount = await ctx.db.query("quotes").collect();
    const quoteNumber = `Q${String(quoteCount.length + 1).padStart(4, "0")}`;
    const dynamicLink = Math.random().toString(36).substring(2, 15);

    const quoteId = await ctx.db.insert("quotes", {
      quoteNumber,
      contactId: args.contactId,
      title: `HVAC Installation Quote - ${contact.name}`,
      description: `Quote generated from phone consultation`,
      status: "draft",
      validUntil: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
      proposals,
      dynamicLink,
      linkViews: 0,
      clientInteractions: [],
      aiGenerated: true,
      transcriptionSource: args.transcriptionId,
      createdBy: userId,
    });

    return { quoteId, dynamicLink };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("quotes"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const quote = await ctx.db.get(args.id);
    if (!quote) throw new Error("Quote not found");

    await ctx.db.patch(args.id, { status: args.status });

    // Create notifications for status changes
    if (args.status === "accepted") {
      await ctx.db.insert("notifications", {
        userId,
        title: "Quote Accepted!",
        message: `Quote ${quote.quoteNumber} has been accepted`,
        type: "quote_accepted",
        priority: "high",
        read: false,
        relatedId: args.id,
      });

      // Update contact status
      await ctx.db.patch(quote.contactId, {
        status: "won",
      });
    }
  },
});

export const acceptProposal = mutation({
  args: {
    quoteId: v.id("quotes"),
    proposalId: v.string(),
    signatureData: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) throw new Error("Quote not found");

    const updates: any = {
      status: "accepted",
      clientInteractions: [
        ...(quote.clientInteractions || []),
        {
          timestamp: Date.now(),
          action: "accepted",
          proposalId: args.proposalId,
        },
      ],
    };

    if (args.signatureData) {
      updates.digitalSignature = {
        signedAt: Date.now(),
        signatureData: args.signatureData,
        ipAddress: args.ipAddress || "",
      };
    }

    await ctx.db.patch(args.quoteId, updates);

    // Create job from accepted quote
    const selectedProposal = quote.proposals.find((p) => p.id === args.proposalId);
    if (selectedProposal && quote.jobId) {
      await ctx.db.patch(quote.jobId, {
        status: "approved",
        totalCost: selectedProposal.total,
      });
    }

    return { success: true };
  },
});

export const trackInteraction = mutation({
  args: {
    dynamicLink: v.string(),
    action: v.string(),
    proposalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db
      .query("quotes")
      .filter((q) => q.eq(q.field("dynamicLink"), args.dynamicLink))
      .first();

    if (!quote) return;

    const currentInteractions = quote.clientInteractions || [];
    const newInteraction = {
      timestamp: Date.now(),
      action: args.action,
      proposalId: args.proposalId,
    };

    await ctx.db.patch(quote._id, {
      clientInteractions: [...currentInteractions, newInteraction],
    });

    // Update status based on action
    if (args.action === "viewed" && quote.status === "sent") {
      await ctx.db.patch(quote._id, { status: "viewed" });
    }
  },
});
