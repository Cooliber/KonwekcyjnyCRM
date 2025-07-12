import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const list = query({
  args: {
    processed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.processed !== undefined) {
      return await ctx.db
        .query("transcriptions")
        .withIndex("by_processed", (q) => q.eq("processed", args.processed!))
        .order("desc")
        .take(50);
    }

    return await ctx.db.query("transcriptions").order("desc").take(50);
  },
});

export const get = query({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transcription = await ctx.db.get(args.id);
    if (!transcription) return null;

    // Get related contact and job if they exist
    let contact = null;
    let job = null;

    if (transcription.contactId) {
      contact = await ctx.db.get(transcription.contactId);
    }

    if (transcription.jobId) {
      job = await ctx.db.get(transcription.jobId);
    }

    return {
      ...transcription,
      contact,
      job,
    };
  },
});

export const create = mutation({
  args: {
    originalText: v.string(),
    audioFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("transcriptions", {
      originalText: args.originalText,
      audioFileId: args.audioFileId,
      extractedData: {}, // Will be filled by AI processing
      confidence: 0,
      processed: false,
      createdBy: userId,
    });
  },
});

export const processWithAI = action({
  args: {
    transcriptionId: v.id("transcriptions"),
  },
  handler: async (ctx, args): Promise<any> => {
    const transcription: any = await ctx.runQuery(api.transcriptions.get, {
      id: args.transcriptionId
    });

    if (!transcription) throw new Error("Transcription not found");

    // Simulate AI processing (in real app, use OpenAI or local LLM)
    const text: string = transcription.originalText.toLowerCase();
    
    const extractedData: any = {
      customerName: extractCustomerName(text),
      phone: extractPhone(text),
      address: extractAddress(text),
      deviceType: extractDeviceType(text),
      deviceCount: extractDeviceCount(text),
      roomCount: extractRoomCount(text),
      budget: extractBudget(text),
      urgency: extractUrgency(text),
      preferredDate: extractPreferredDate(text),
      additionalNotes: extractAdditionalNotes(text),
    };

    // Calculate confidence based on how much data was extracted
    const fieldsExtracted = Object.values(extractedData).filter(v => v !== null && v !== undefined).length;
    const confidence = Math.min(fieldsExtracted / 6, 1); // Max confidence when 6+ fields extracted

    await ctx.runMutation(api.transcriptions.update, {
      id: args.transcriptionId,
      extractedData,
      confidence,
      processed: true,
    });

    // Auto-create contact if enough data is available
    if (extractedData.customerName && (extractedData.phone || extractedData.address)) {
      const contactId: any = await ctx.runMutation(api.contacts.create, {
        name: extractedData.customerName,
        phone: extractedData.phone,
        address: extractedData.address,
        city: "Warsaw",
        type: "lead",
        source: "phone_call",
        transcriptionData: {
          originalText: transcription.originalText,
          extractedData,
        },
        gdprConsent: false,
        marketingConsent: false,
      });

      await ctx.runMutation(api.transcriptions.update, {
        id: args.transcriptionId,
        contactId,
      });

      return { contactId, extractedData, confidence };
    }

    return { extractedData, confidence };
  },
});

export const update = mutation({
  args: {
    id: v.id("transcriptions"),
    extractedData: v.optional(v.object({
      customerName: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      deviceType: v.optional(v.string()),
      deviceCount: v.optional(v.number()),
      roomCount: v.optional(v.number()),
      budget: v.optional(v.number()),
      urgency: v.optional(v.string()),
      preferredDate: v.optional(v.string()),
      additionalNotes: v.optional(v.string())
    })),
    confidence: v.optional(v.number()),
    processed: v.optional(v.boolean()),
    contactId: v.optional(v.id("contacts")),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Helper functions for AI extraction (simplified versions)
function extractCustomerName(text: string): string | undefined {
  const namePatterns = [
    /nazywam się ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+)/i,
    /jestem ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+)/i,
    /moje nazwisko to ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function extractPhone(text: string): string | undefined {
  const phonePattern = /(\+48\s?)?(\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})/;
  const match = text.match(phonePattern);
  return match ? match[0].replace(/\s/g, '') : undefined;
}

function extractAddress(text: string): string | undefined {
  const addressPatterns = [
    /mieszkam na ([^,.]+)/i,
    /adres to ([^,.]+)/i,
    /ulica ([^,.]+)/i,
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function extractDeviceType(text: string): string | undefined {
  if (text.includes('klimatyzacja') || text.includes('klimatyzator')) return 'split_ac';
  if (text.includes('multi split')) return 'multi_split';
  if (text.includes('pompa ciepła')) return 'heat_pump';
  return 'split_ac'; // default
}

function extractDeviceCount(text: string): number | undefined {
  const countPatterns = [
    /(\d+)\s*(jednostk|klimatyzator|urządzen)/i,
    /(jeden|jedna|dwa|trzy|cztery|pięć|sześć)/i,
  ];

  const numberMap: { [key: string]: number } = {
    'jeden': 1, 'jedna': 1, 'dwa': 2, 'trzy': 3, 'cztery': 4, 'pięć': 5, 'sześć': 6
  };

  for (const pattern of countPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1];
      return numberMap[value] || parseInt(value) || undefined;
    }
  }
  return undefined;
}

function extractRoomCount(text: string): number | undefined {
  const roomPattern = /(\d+)\s*(pokój|pokoje|pomieszczen)/i;
  const match = text.match(roomPattern);
  return match ? parseInt(match[1]) : undefined;
}

function extractBudget(text: string): number | undefined {
  const budgetPatterns = [
    /budżet.*?(\d+)\s*(tysięcy|tys|zł)/i,
    /mam.*?(\d+)\s*(tysięcy|tys|zł)/i,
    /do.*?(\d+)\s*(tysięcy|tys|zł)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      return match[2].includes('tys') ? amount * 1000 : amount;
    }
  }
  return undefined;
}

function extractUrgency(text: string): string | undefined {
  if (text.includes('pilne') || text.includes('szybko') || text.includes('natychmiast')) return 'urgent';
  if (text.includes('w tym tygodniu')) return 'high';
  if (text.includes('w przyszłym miesiącu')) return 'low';
  return 'medium';
}

function extractPreferredDate(text: string): string | undefined {
  const datePatterns = [
    /(jutro|pojutrze|w tym tygodniu|w przyszłym tygodniu|w przyszłym miesiącu)/i,
    /(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela)/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

function extractAdditionalNotes(text: string): string | undefined {
  // Extract any additional context or special requirements
  const notePatterns = [
    /dodatkowo ([^.]+)/i,
    /ważne że ([^.]+)/i,
    /proszę pamiętać ([^.]+)/i,
  ];

  for (const pattern of notePatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}
