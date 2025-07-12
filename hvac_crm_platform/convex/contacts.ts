import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("lead"), v.literal("customer"), v.literal("vip"))),
    status: v.optional(v.string()),
    district: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.search) {
      return await ctx.db
        .query("contacts")
        .withSearchIndex("search_contacts", (q) =>
          q.search("name", args.search!).eq("type", args.type || "lead")
        )
        .collect();
    }

    let contacts: any;
    if (args.type) {
      contacts = await ctx.db
        .query("contacts")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(100);
    } else {
      contacts = await ctx.db.query("contacts").order("desc").take(100);
    }

    return contacts.filter(
      (contact: any) =>
        (!args.status || contact.status === args.status) &&
        (!args.district || contact.district === args.district)
    );
  },
});

export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.id);
    if (!contact) return null;

    // Get related jobs and quotes
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_contact", (q) => q.eq("contactId", args.id))
      .collect();

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_contact", (q) => q.eq("contactId", args.id))
      .collect();

    const installations = await ctx.db
      .query("installations")
      .filter((q) => q.eq(q.field("contactId"), args.id))
      .collect();

    return {
      ...contact,
      jobs,
      quotes,
      installations,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    district: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    type: v.union(v.literal("lead"), v.literal("customer"), v.literal("vip")),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    transcriptionData: v.optional(
      v.object({
        originalText: v.string(),
        extractedData: v.object({
          deviceCount: v.optional(v.number()),
          roomCount: v.optional(v.number()),
          budget: v.optional(v.number()),
          urgency: v.optional(v.string()),
          preferredDate: v.optional(v.string()),
        }),
      })
    ),
    gdprConsent: v.boolean(),
    marketingConsent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate data completion link
    const dataCompletionLink = `${process.env.SITE_URL}/complete-profile/${Math.random().toString(36).substring(7)}`;

    return await ctx.db.insert("contacts", {
      ...args,
      status: "new",
      createdBy: userId,
      dataCompletionLink,
      lastContactDate: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    district: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("contacted"),
        v.literal("qualified"),
        v.literal("proposal_sent"),
        v.literal("negotiation"),
        v.literal("won"),
        v.literal("lost")
      )
    ),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    affluenceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      lastContactDate: Date.now(),
    });
  },
});

export const updateFromTranscription = mutation({
  args: {
    transcriptionId: v.id("transcriptions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transcription = await ctx.db.get(args.transcriptionId);
    if (!transcription) throw new Error("Transcription not found");

    const extractedData = transcription.extractedData;

    // Check if contact already exists
    let contactId = transcription.contactId;

    if (!contactId && extractedData.customerName) {
      // Create new contact from transcription
      contactId = await ctx.db.insert("contacts", {
        name: extractedData.customerName,
        phone: extractedData.phone,
        address: extractedData.address,
        city: "Warsaw", // Default for HVAC business
        type: "lead",
        status: "new",
        source: "phone_call",
        transcriptionData: {
          originalText: transcription.originalText,
          extractedData: extractedData,
        },
        gdprConsent: false, // Will need to be confirmed
        marketingConsent: false,
        createdBy: userId,
        lastContactDate: Date.now(),
      });

      // Update transcription with contact ID
      await ctx.db.patch(args.transcriptionId, { contactId });
    }

    return contactId;
  },
});

export const getByDistrict = query({
  args: { district: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("contacts")
      .withIndex("by_district", (q) => q.eq("district", args.district))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});

// Enhanced contact creation with automatic geocoding
export const createWithGeocoding = action({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    district: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    type: v.union(v.literal("lead"), v.literal("customer"), v.literal("vip")),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    gdprConsent: v.boolean(),
    marketingConsent: v.boolean(),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let coordinates: { lat: number; lng: number } | undefined;
    let detectedDistrict = args.district;

    // Auto-geocoding for Warsaw addresses
    if (args.address && args.city.toLowerCase().includes("warsaw")) {
      try {
        // Parse address and detect district
        const addressComponents = parseWarsawAddress(args.address);

        if (!detectedDistrict && addressComponents.district) {
          detectedDistrict = addressComponents.district;
        }

        // Generate coordinates
        coordinates = generateCoordinatesForAddress(args.address);

        // Validate coordinates are within Warsaw
        if (coordinates && !isWithinWarsaw(coordinates.lat, coordinates.lng)) {
          coordinates = undefined;
        }
      } catch (error) {
        console.warn("Geocoding failed:", error);
        // Continue without coordinates
      }
    }

    // Create contact with enhanced data
    const contactId: any = await ctx.runMutation(api.contacts.create, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      address: args.address,
      city: args.city,
      district: detectedDistrict,
      zipCode: args.zipCode,
      coordinates,
      type: args.type,
      source: args.source,
      notes: args.notes,
      gdprConsent: args.gdprConsent,
      marketingConsent: args.marketingConsent,
    });

    return contactId;
  },
});

// Utility functions for geocoding (server-side implementations)
function parseWarsawAddress(address: string): {
  district?: string;
  street?: string;
  zipCode?: string;
} {
  if (!address) return {};

  const components: any = {};

  // Extract zip code
  const zipMatch = address.match(/(\d{2}-\d{3})/);
  if (zipMatch) {
    components.zipCode = zipMatch[1];
  }

  // Extract district using pattern matching
  const districts = [
    "Śródmieście",
    "Wilanów",
    "Mokotów",
    "Żoliborz",
    "Ursynów",
    "Wola",
    "Bemowo",
    "Bielany",
    "Ochota",
    "Praga-Południe",
    "Praga-Północ",
    "Targówek",
    "Białołęka",
    "Rembertów",
    "Wawer",
    "Wesoła",
    "Włochy",
  ];

  for (const district of districts) {
    if (address.toLowerCase().includes(district.toLowerCase())) {
      components.district = district;
      break;
    }
  }

  return components;
}

function generateCoordinatesForAddress(address: string): { lat: number; lng: number } | undefined {
  const components = parseWarsawAddress(address);

  // District centers with small random offset
  const districtCenters: Record<string, { lat: number; lng: number }> = {
    Śródmieście: { lat: 52.2297, lng: 21.0122 },
    Wilanów: { lat: 52.17, lng: 21.1 },
    Mokotów: { lat: 52.185, lng: 21.025 },
    Żoliborz: { lat: 52.27, lng: 21.0 },
    Ursynów: { lat: 52.15, lng: 21.06 },
    Wola: { lat: 52.23, lng: 20.98 },
    "Praga-Południe": { lat: 52.22, lng: 21.07 },
    Targówek: { lat: 52.29, lng: 21.065 },
  };

  if (components.district && districtCenters[components.district]) {
    const center = districtCenters[components.district];
    return {
      lat: center.lat + (Math.random() - 0.5) * 0.01,
      lng: center.lng + (Math.random() - 0.5) * 0.01,
    };
  }

  // Default to Warsaw center with offset
  return {
    lat: 52.2297 + (Math.random() - 0.5) * 0.02,
    lng: 21.0122 + (Math.random() - 0.5) * 0.02,
  };
}

function isWithinWarsaw(lat: number, lng: number): boolean {
  return lat >= 52.1 && lat <= 52.37 && lng >= 20.85 && lng <= 21.27;
}

// Search contacts by text query
export const searchContacts = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contacts = await ctx.db
      .query("contacts")
      .withSearchIndex("search_contacts", (q) => q.search("name", args.query))
      .take(args.limit || 20);

    return contacts;
  },
});

// Search contacts by NIP (Polish tax number)
export const searchByNIP = query({
  args: {
    nip: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Clean NIP format (remove dashes and spaces)
    const cleanNIP = args.nip.replace(/[-\s]/g, "");

    const contacts = await ctx.db
      .query("contacts")
      .filter((q) => {
        // Search in company field for NIP
        return q.or(
          q.eq(q.field("company"), args.nip),
          q.eq(q.field("company"), cleanNIP),
          // Also search in notes field where NIP might be stored
          q.and(
            q.neq(q.field("notes"), undefined),
            q.or(q.gte(q.field("notes"), args.nip), q.gte(q.field("notes"), cleanNIP))
          )
        );
      })
      .take(10);

    return contacts;
  },
});
