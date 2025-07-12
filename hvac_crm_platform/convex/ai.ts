import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

// AI Service Configuration
interface AiConfig {
  ollamaUrl: string;
  model: string;
  fallbackToMock: boolean;
}

const AI_CONFIG: AiConfig = {
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  model: process.env.AI_MODEL || "llama3.2:3b",
  fallbackToMock: process.env.NODE_ENV === "development",
};

// Mock AI responses for development
const MOCK_RESPONSES = {
  affluenceAnalysis: {
    score: 0.75,
    factors: ["Premium district (Śródmieście)", "High-end equipment request", "Professional language"],
    priceMultiplier: 1.2,
    confidence: 0.8,
  },
  quoteGeneration: {
    basePrice: 8500,
    adjustedPrice: 10200,
    lineItems: [
      { description: "Mitsubishi Electric MSZ-LN35VG Split AC Unit", quantity: 1, unitPrice: 4500, type: "equipment" },
      { description: "Professional Installation", quantity: 1, unitPrice: 2000, type: "labor" },
      { description: "Copper Piping & Insulation", quantity: 1, unitPrice: 800, type: "material" },
      { description: "Electrical Connection", quantity: 1, unitPrice: 600, type: "labor" },
      { description: "Premium District Surcharge", quantity: 1, unitPrice: 1300, type: "adjustment" },
    ],
    reasoning: "Customer in premium Śródmieście district with high-end equipment request. Applied 20% premium pricing based on affluence analysis.",
  },
};

interface OllamaResponse {
  response?: string;
  error?: string;
}

// Ollama API Client
async function callOllama(prompt: string, systemPrompt?: string): Promise<string> {
  if (AI_CONFIG.fallbackToMock) {
    // Return mock response for development
    return JSON.stringify(MOCK_RESPONSES.affluenceAnalysis);
  }

  try {
    const response = await fetch(`${AI_CONFIG.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        prompt: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const result = await response.json() as OllamaResponse;
    if (result.error) {
      throw new Error(`Ollama API error: ${result.error}`);
    }
    if (!result.response) {
      throw new Error('Invalid response format from Ollama API');
    }
    return result.response;
  } catch (_error) {
    console.error("Ollama API call failed:", _error);
    throw new Error("AI service unavailable");
  }
}

// Affluence Analysis Action
interface AffluenceAnalysis {
  score: number;
  factors: string[];
  priceMultiplier: number;
  confidence: number;
}

interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  jobType: string;
  propertySize?: number;
  roomCount?: number;
  budget?: number;
  requirements?: any;
  transcriptionText?: string;
  equipmentRequested?: string;
  [key: string]: any; // Allow additional properties
}

// Rule-based fallback for affluence analysis
function generateRuleBasedAffluence(customerData: CustomerData): AffluenceAnalysis {
  let score = 0.5; // Default middle score
  const factors: string[] = [];
  let priceMultiplier = 1.0;

  // District analysis
  const district = customerData.district?.toLowerCase() || "";
  if (["śródmieście", "wilanów", "mokotów"].some(d => district.includes(d))) {
    score += 0.3;
    priceMultiplier += 0.2;
    factors.push("Premium district location");
  } else if (["żoliborz", "ursynów", "wola"].some(d => district.includes(d))) {
    score += 0.1;
    priceMultiplier += 0.1;
    factors.push("High-end district");
  } else if (["praga", "targówek"].some(d => district.includes(d))) {
    score -= 0.2;
    priceMultiplier -= 0.1;
    factors.push("Budget-conscious area");
  }

  // Equipment analysis
  const equipment = customerData.equipmentRequested?.toLowerCase() || "";
  if (["mitsubishi", "daikin", "fujitsu"].some(brand => equipment.includes(brand))) {
    score += 0.2;
    priceMultiplier += 0.15;
    factors.push("Premium equipment brand preference");
  } else if (["lg", "samsung"].some(brand => equipment.includes(brand))) {
    score += 0.1;
    factors.push("Mid-range equipment preference");
  }

  // Language analysis from transcription
  const text = customerData.transcriptionText?.toLowerCase() || "";
  if (text.includes("budget") || text.includes("cheap") || text.includes("tani")) {
    score -= 0.15;
    priceMultiplier -= 0.05;
    factors.push("Price-sensitive language");
  }
  if (text.includes("quality") || text.includes("premium") || text.includes("best")) {
    score += 0.15;
    priceMultiplier += 0.1;
    factors.push("Quality-focused language");
  }

  // Ensure bounds
  score = Math.max(0, Math.min(1, score));
  priceMultiplier = Math.max(0.8, Math.min(1.5, priceMultiplier));

  return {
    score,
    factors,
    priceMultiplier,
    confidence: 0.7, // Medium confidence for rule-based analysis
  };
}

export const analyzeAffluence = action({
  args: {
    customerData: v.object({
      id: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      district: v.optional(v.string()),
      jobType: v.string(),
      propertySize: v.optional(v.number()),
      requirements: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args: { customerData: CustomerData }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const systemPrompt = `You are an AI assistant specialized in analyzing customer affluence for HVAC services in Warsaw, Poland. 

Analyze the provided customer data and return a JSON response with:
- score: number between 0-1 (0=budget conscious, 1=premium customer)
- factors: array of strings explaining the analysis
- priceMultiplier: number between 0.8-1.5 for pricing adjustment
- confidence: number between 0-1 for analysis confidence

Consider these Warsaw district affluence levels:
- Premium: Śródmieście, Wilanów, Mokotów (south)
- High: Żoliborz, Ursynów, parts of Wola
- Medium: Bemowo, Bielany, Ochota
- Budget: Praga districts, Targówek, outer areas

Language patterns indicating affluence:
- Professional/formal language = higher affluence
- Technical equipment knowledge = higher affluence
- Price sensitivity mentions = lower affluence
- Premium brand preferences = higher affluence

Equipment requests indicating affluence:
- Mitsubishi Electric, Daikin, Fujitsu = premium
- LG, Samsung = mid-range
- Generic/unknown brands = budget

Return only valid JSON, no additional text.`;

    const prompt = `Analyze this customer data for affluence:
Name: ${args.customerData.name || "Not provided"}
Address: ${args.customerData.address || "Not provided"}
District: ${args.customerData.district || "Not provided"}
Phone: ${args.customerData.phone || "Not provided"}
Transcription: ${args.customerData.transcriptionText || "Not provided"}
Equipment Requested: ${args.customerData.equipmentRequested || "Not provided"}`;

    try {
      const aiResponse = await callOllama(prompt, systemPrompt);
      
      if (AI_CONFIG.fallbackToMock) {
        return MOCK_RESPONSES.affluenceAnalysis;
      }

      // Parse AI response
      const analysis = JSON.parse(aiResponse);
      
      // Validate response structure
      if (!analysis.score || !analysis.priceMultiplier) {
        throw new Error("Invalid AI response structure");
      }

      return analysis;
    } catch (error) {
      console.error("Affluence analysis failed:", error);
      
      // Fallback to rule-based analysis
      return generateRuleBasedAffluence(args.customerData);
    }
  },
});

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  type: 'equipment' | 'labor' | 'material' | 'adjustment';
  notes?: string;
}

interface GeneratedQuote {
  basePrice: number;
  adjustedPrice: number;
  lineItems: QuoteLineItem[];
  reasoning: string;
  confidence: number;
}

// Generate Quote with AI
export const generateQuote = action({
  args: {
    customerData: v.object({
      id: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      district: v.optional(v.string()),
      jobType: v.string(),
      propertySize: v.optional(v.number()),
      requirements: v.optional(v.any()),
      transcriptionText: v.optional(v.string()),
      equipmentRequested: v.optional(v.string()),
      roomCount: v.optional(v.number()),
      budget: v.optional(v.number()),
    }),
    affluenceAnalysis: v.object({
      score: v.number(),
      priceMultiplier: v.number(),
      factors: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const systemPrompt = `You are an AI assistant specialized in generating HVAC quotes for Warsaw customers.

Generate a detailed quote with the following structure:
{
  "basePrice": number,        // Base price before adjustments
  "adjustedPrice": number,    // Final price after affluence adjustment
  "lineItems": [              // Array of line items
    {
      "description": string,  // Item description
      "quantity": number,     // Quantity of this item
      "unitPrice": number,    // Price per unit
      "type": string,         // 'equipment', 'labor', 'material', or 'adjustment'
      "notes?": string       // Optional notes
    }
  ],
  "reasoning": string,       // Explanation of pricing decisions
  "confidence": number       // Confidence score (0-1)
}

Base pricing guidelines (PLN):
- Split AC unit (basic): 3000-4000
- Split AC unit (premium): 4500-6500
- Installation labor: 1500-2500
- Materials (piping, etc): 500-1000
- Electrical work: 400-800

Consider these factors:
- Room count: ${args.customerData.roomCount || 1}
- District: ${args.customerData.district || 'Not specified'}
- Job type: ${args.customerData.jobType}
- Affluence score: ${args.affluenceAnalysis?.score || 'N/A'}
- Price multiplier: ${args.affluenceAnalysis?.priceMultiplier || 1.0}

Return only valid JSON, no additional text.`;

    const prompt = `Generate a detailed quote for ${args.customerData.name} in ${args.customerData.district || 'Warsaw'}.

Customer details:
- Address: ${args.customerData.address || 'Not specified'}
- Job type: ${args.customerData.jobType}
- Property size: ${args.customerData.propertySize || 'Not specified'} m²
- Room count: ${args.customerData.roomCount || 'Not specified'}
- Budget: ${args.customerData.budget ? `${args.customerData.budget} PLN` : 'Not specified'}
- Special requirements: ${args.customerData.requirements || 'None'}

Affluence analysis:
- Score: ${args.affluenceAnalysis?.score || 'N/A'}
- Multiplier: ${args.affluenceAnalysis?.priceMultiplier || 1.0}
- Factors: ${args.affluenceAnalysis?.factors?.join(', ') || 'None'}`;

    try {
      const aiResponse = await callOllama(prompt, systemPrompt);
      
      if (AI_CONFIG.fallbackToMock) {
        return MOCK_RESPONSES.quoteGeneration;
      }
      
      // Parse the JSON response
      let quoteData: GeneratedQuote;
      try {
        const parsed = JSON.parse(aiResponse);
        
        // Validate response structure
        if (typeof parsed.basePrice !== 'number' || 
            typeof parsed.adjustedPrice !== 'number' || 
            !Array.isArray(parsed.lineItems) ||
            typeof parsed.reasoning !== 'string' ||
            typeof parsed.confidence !== 'number') {
          throw new Error('Invalid response structure from AI');
        }
        
        // Validate line items
        if (!parsed.lineItems.every((item: any) => 
          typeof item.description === 'string' &&
          typeof item.quantity === 'number' &&
          typeof item.unitPrice === 'number' &&
          ['equipment', 'labor', 'material', 'adjustment'].includes(item.type)
        )) {
          throw new Error('Invalid line items in AI response');
        }
        
        quoteData = parsed as GeneratedQuote;
      } catch (error) {
        console.error("Failed to parse AI response:", error);
        throw new ConvexError({
          statusCode: 500,
          code: 'AI_RESPONSE_ERROR',
          message: 'Failed to process AI response',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      return quoteData;
    } catch (error) {
      console.error("Quote generation failed:", error);

      // Return fallback predictions based on district affluence
      return generateFallbackHotspots(args.customerData.district);
    }
  },
});
// Types for search results
interface SearchResult {
  id: string;
  score: number;
  title: string;
  description: string;
  district?: string;
  serviceType?: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalMatches: number;
  searchMetadata: {
    district?: string;
    serviceType?: string;
    searchedAt: number;
  };
  error?: string;
}

// Internal query to get completed jobs for semantic search
export const getCompletedJobsForSearch = query({
  args: {
    district: v.optional(v.string()),
    serviceType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get completed jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    // Filter by district if specified
    let filteredJobs = jobs;
    if (args.district) {
      const contacts = await Promise.all(
        jobs.map((job: any) => ctx.db.get(job.contactId))
      );
      filteredJobs = jobs.filter((_job: any, index: number) => {
        const contact = contacts[index];
        return contact && 'district' in contact && contact.district === args.district;
      });
    }

    // Filter by service type if specified
    if (args.serviceType) {
      filteredJobs = filteredJobs.filter((job: any) => job.type === args.serviceType);
    }

    return filteredJobs;
  },
});

// Semantic Search for Similar Services
export const searchSimilarServices = action({
  args: {
    query: v.string(),
    district: v.optional(v.string()),
    serviceType: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args): Promise<SearchResponse> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    try {
      // Get historical jobs for semantic search using query
      const filteredJobs = await ctx.runQuery(api.ai.getCompletedJobsForSearch, {
        district: args.district,
        serviceType: args.serviceType
      });

      // Perform semantic similarity analysis
      const results = await performSemanticSearch(
        args.query,
        filteredJobs,
        args.limit || 10
      );

      return {
        results,
        query: args.query,
        totalMatches: results.length,
        searchMetadata: {
          district: args.district,
          serviceType: args.serviceType,
          searchedAt: Date.now()
        }
      };
    } catch (error) {
      console.error("Semantic search failed:", error);
      return {
        results: [],
        query: args.query,
        totalMatches: 0,
        searchMetadata: {
          district: args.district,
          serviceType: args.serviceType,
          searchedAt: Date.now()
        },
        error: "Search temporarily unavailable"
      };
    }
  },
});

// Perform semantic search on jobs with proper typing
async function performSemanticSearch(
  query: string,
  jobs: Array<{
    _id: string;
    title?: string;
    description?: string;
    status?: string;
    district?: string;
    type?: string;
  }>,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    // Simple text-based search implementation
    // In production, this would use a proper semantic search service
    const searchTerms = query.toLowerCase().split(' ');

    const results = jobs
      .map(job => {
        let score = 0;
        const searchableText = [
          job.title || '',
          job.description || '',
          job.status || '',
          job.district || ''
        ].join(' ').toLowerCase();

        // Calculate relevance score
        searchTerms.forEach(term => {
          if (searchableText.includes(term)) {
            score += 1;
          }
        });

        return { ...job, score };
      })
      .filter(job => job.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(job => ({
        id: job._id,
        score: job.score,
        title: job.title || 'Untitled Job',
        description: job.description || 'No description available',
        district: job.district,
        serviceType: job.type
      }));

    return results;
  } catch (error) {
    console.error('Error in performSemanticSearch:', error);
    throw new ConvexError({
      statusCode: 500,
      code: 'SEARCH_ERROR',
      message: 'Failed to perform semantic search',
    });
  }
}

// Types for hotspot predictions
interface ServiceData {
  district?: string;
  seasonality?: string;
  customerAffluence?: number;
  urgency?: string;
  serviceType?: string;
  date?: number;
  [key: string]: any; // Allow additional properties
}

interface HotspotPrediction {
  district: string;
  demandScore: number;
  predictedDemand: number;
  predictedServices: string[];
  serviceTypes: string[];
  confidence: number;
  timeframe: string;
  season: string;
  seasonalFactor: number;
  affluenceFactor: number;
  coordinates: { lat: number; lng: number };
  lastUpdated: number;
}

// Helper functions for hotspot prediction
function getCurrentSeason(): "spring" | "summer" | "autumn" | "winter" {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

async function generateHotspotPredictions(
  serviceData: ServiceData[],
  _timeframe: string,
  season: string,
  district?: string
): Promise<HotspotPrediction[]> {
  const districts = district ? [district] : [
    "Śródmieście", "Wilanów", "Mokotów", "Żoliborz", "Ursynów", "Wola", "Praga-Południe", "Targówek"
  ];

  const predictions: HotspotPrediction[] = [];

  for (const dist of districts) {
    const districtData = serviceData.filter(item => item.district === dist);

    if (districtData.length === 0) continue;

    // Calculate seasonal demand patterns
    const seasonalData = districtData.filter(item => item.seasonality === season);
    const seasonalFactor = seasonalData.length / Math.max(districtData.length, 1);

    // Calculate affluence factor
    const avgAffluence = districtData.reduce((sum, item) => sum + (item.customerAffluence || 0), 0) / districtData.length;

    // Predict demand based on historical patterns
    const urgentServices = districtData.filter(item =>
      item.urgency === "urgent" || item.urgency === "high"
    ).length;
    const demandScore = Math.min(1, (urgentServices / Math.max(districtData.length, 1)) + seasonalFactor * 0.5);

    // Get most common service types
    const serviceTypeCounts = districtData.reduce((acc, item) => {
      const serviceType = item.serviceType || 'unknown';
      acc[serviceType] = (acc[serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServiceTypes = Object.entries(serviceTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    // Calculate center coordinates for district
    const avgLat = districtData.reduce((sum, item) => sum + item.coordinates.lat, 0) / districtData.length;
    const avgLng = districtData.reduce((sum, item) => sum + item.coordinates.lng, 0) / districtData.length;

    predictions.push({
      district: dist,
      demandScore,
      predictedDemand: demandScore,
      predictedServices: topServiceTypes,
      serviceTypes: topServiceTypes,
      confidence: Math.min(0.95, districtData.length / 10),
      timeframe: "month",
      season: getCurrentSeason(),
      seasonalFactor,
      affluenceFactor: avgAffluence,
      coordinates: { lat: avgLat, lng: avgLng },
      lastUpdated: Date.now()
    });
  }

  return predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);
}

interface HotspotCoordinates {
  lat: number;
  lng: number;
}

interface HotspotMetadata {
  totalDataPoints: number;
  analysisTimeframe: string;
  season: string;
  confidence: number;
  generatedAt: number;
  fallback: boolean;
}

interface Hotspot {
  district: string;
  coordinates: HotspotCoordinates;
  predictedDemand: number;
  serviceTypes: string[];
  seasonalFactor: number;
  affluenceFactor: number;
  confidence: number;
  reasoning: string[];
}

interface HotspotResponse {
  hotspots: Hotspot[];
  metadata: HotspotMetadata;
}

function calculateOverallConfidence(hotspots: Hotspot[]): number {
  if (hotspots.length === 0) return 0;
  return hotspots.reduce((sum, hotspot) => sum + hotspot.confidence, 0) / hotspots.length;
}

function generateFallbackHotspots(district?: string): HotspotResponse {
  const fallbackHotspots: Hotspot[] = [
    {
      district: "Śródmieście",
      coordinates: { lat: 52.2297, lng: 21.0122 },
      predictedDemand: 0.8,
      serviceTypes: ["installation", "maintenance"],
      seasonalFactor: 0.7,
      affluenceFactor: 0.9,
      confidence: 0.6,
      reasoning: ["Fallback prediction based on district affluence"]
    },
    {
      district: "Mokotów",
      coordinates: { lat: 52.1936, lng: 21.0212 },
      predictedDemand: 0.7,
      serviceTypes: ["repair", "maintenance"],
      seasonalFactor: 0.6,
      affluenceFactor: 0.8,
      confidence: 0.7,
      reasoning: ["Fallback prediction based on district data"]
    }
  ];

  const filteredHotspots = district 
    ? fallbackHotspots.filter(h => h.district === district)
    : fallbackHotspots;

  return {
    hotspots: filteredHotspots,
    metadata: {
      totalDataPoints: filteredHotspots.length,
      analysisTimeframe: "month",
      season: getCurrentSeason(),
      confidence: calculateOverallConfidence(filteredHotspots),
      generatedAt: Date.now(),
      fallback: true
    }
  };
}
