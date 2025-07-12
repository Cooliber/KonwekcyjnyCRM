import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

// Type definitions for Weaviate optimization
type DistrictName =
  | "Śródmieście"
  | "Wilanów"
  | "Mokotów"
  | "Żoliborz"
  | "Ursynów"
  | "Wola"
  | "Praga-Południe"
  | "Targówek";
type SearchType = "messages" | "jobs" | "contacts" | "equipment" | "knowledge";

interface DistrictWeights {
  [key: string]: number;
  Śródmieście: number;
  Wilanów: number;
  Mokotów: number;
  Żoliborz: number;
  Ursynów: number;
  Wola: number;
  "Praga-Południe": number;
  Targówek: number;
}

interface SearchResult {
  id: string;
  score: number;
  data: any;
  metadata?: {
    district?: string;
    type?: string;
    timestamp?: number;
  };
}

interface VectorSearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number;
  cacheHit: boolean;
}

interface BatchSearchOperation {
  query: string;
  type: SearchType;
  district?: string;
  limit?: number;
}

interface BatchSearchResult {
  searchResults: VectorSearchResponse[];
  totalOperations: number;
  totalTime: number;
  cacheHitRate: number;
}

// Weaviate optimization configuration for enhanced performance
const WEAVIATE_CONFIG = {
  // Vector search caching
  VECTOR_CACHE_TTL: 300000, // 5 minutes for vector search results
  EMBEDDING_CACHE_TTL: 3600000, // 1 hour for embeddings

  // Search optimization
  MAX_RESULTS: 50,
  SIMILARITY_THRESHOLD: 0.7,

  // Warsaw district-specific optimization
  DISTRICT_WEIGHTS: {
    Śródmieście: 1.5,
    Wilanów: 1.4,
    Mokotów: 1.3,
    Żoliborz: 1.2,
    Ursynów: 1.1,
    Wola: 1.0,
    "Praga-Południe": 0.9,
    Targówek: 0.8,
  } as DistrictWeights,

  // Cache keys
  VECTOR_SEARCH_KEY: (query: string, filters: any) =>
    `vector_search_${query}_${JSON.stringify(filters)}`,
  EMBEDDING_KEY: (text: string) => `embedding_${text}`,
  DISTRICT_SEARCH_KEY: (district: string, type: string) => `district_search_${district}_${type}`,
};

// Vector search cache
const vectorCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Optimized vector search with caching and district weighting
export const optimizedVectorSearchPublic = action({
  args: {
    query: v.string(),
    type: v.union(
      v.literal("messages"),
      v.literal("jobs"),
      v.literal("contacts"),
      v.literal("equipment"),
      v.literal("knowledge")
    ),
    district: v.optional(v.string()),
    limit: v.optional(v.number()),
    filters: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const cacheKey = WEAVIATE_CONFIG.VECTOR_SEARCH_KEY(args.query, {
      type: args.type,
      district: args.district,
      filters: args.filters,
    });

    // Check cache first
    const cachedResult = getCachedVectorData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Get embedding for the query
      const embedding = await getOptimizedEmbedding(args.query);

      // Perform vector search with district optimization
      const searchResults = await performWeaviateSearch({
        embedding,
        type: args.type,
        district: args.district,
        limit: args.limit || WEAVIATE_CONFIG.MAX_RESULTS,
        filters: args.filters,
      });

      // Apply district weighting
      const weightedResults = applyDistrictWeighting(searchResults, args.district);

      // Cache the results
      setCachedVectorData(cacheKey, weightedResults, WEAVIATE_CONFIG.VECTOR_CACHE_TTL);

      return weightedResults;
    } catch (_error) {
      console.error("Vector search failed:", error);
      throw new Error("Vector search optimization failed");
    }
  },
});

// Optimized embedding generation with caching
export const getOptimizedEmbedding = async (text: string): Promise<number[]> => {
  const cacheKey = WEAVIATE_CONFIG.EMBEDDING_KEY(text);

  // Check embedding cache
  const cachedEmbedding = getCachedVectorData(cacheKey);
  if (cachedEmbedding && Array.isArray(cachedEmbedding)) {
    return cachedEmbedding as number[];
  }

  try {
    // Generate embedding using Weaviate's text2vec module
    const response = await fetch(`${process.env.WEAVIATE_URL}/v1/objects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify({
        class: "TextEmbedding",
        properties: {
          text: text,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Weaviate embedding failed: ${response.statusText}`);
    }

    const result = await response.json();
    const embedding = result.vector || [];

    // Cache the embedding
    setCachedVectorData(cacheKey, embedding, WEAVIATE_CONFIG.EMBEDDING_CACHE_TTL);

    return embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    // Fallback to simple text processing
    return generateFallbackEmbedding(text);
  }
};

// District-specific search optimization
export const searchByDistrict = action({
  args: {
    district: v.string(),
    searchType: v.union(
      v.literal("similar_jobs"),
      v.literal("equipment_history"),
      v.literal("service_patterns"),
      v.literal("client_preferences")
    ),
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<VectorSearchResponse> => {
    const cacheKey = WEAVIATE_CONFIG.DISTRICT_SEARCH_KEY(args.district, args.searchType);

    // Check cache
    const cachedResult = getCachedVectorData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const searchQuery = buildDistrictSearchQuery(args.district, args.searchType, args.context);
      const results: VectorSearchResponse = await ctx.runAction(
        internal.weaviateOptimization.optimizedVectorSearchInternal,
        {
          query: searchQuery,
          type: getSearchTypeMapping(args.searchType),
          district: args.district,
          limit: args.limit,
        }
      );

      // Cache district-specific results
      setCachedVectorData(cacheKey, results, WEAVIATE_CONFIG.VECTOR_CACHE_TTL);

      return results;
    } catch (error) {
      console.error("District search failed:", error);
      return {
        results: [],
        totalCount: 0,
        searchTime: 0,
        cacheHit: false,
      };
    }
  },
});

// Batch vector operations for performance
export const batchVectorOperations = action({
  args: {
    operations: v.array(
      v.object({
        type: v.union(v.literal("search"), v.literal("embed"), v.literal("update")),
        data: v.any(),
      })
    ),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<BatchSearchResult> => {
    const startTime = Date.now();

    // Group operations by type for batch processing
    const searchOps = args.operations.filter((op) => op.type === "search");
    const embedOps = args.operations.filter((op) => op.type === "embed");
    const updateOps = args.operations.filter((op) => op.type === "update");

    // Process searches in batch
    let searchResults: VectorSearchResponse[] = [];
    if (searchOps.length > 0) {
      searchResults = await Promise.all(
        searchOps.map(
          (op): Promise<VectorSearchResponse> =>
            ctx.runAction(internal.weaviateOptimization.optimizedVectorSearchInternal, {
              ...op.data,
              district: args.district,
            })
        )
      );
    }

    // Process embeddings in batch (for now, just count them)
    let _embeddingCount = 0;
    if (embedOps.length > 0) {
      _embeddingCount = embedOps.length;
      // Embedding processing would go here
    }

    // Process updates in batch (for now, just count them)
    let _updateCount = 0;
    if (updateOps.length > 0) {
      _updateCount = updateOps.length;
      // Update processing would go here
    }

    const totalTime = Date.now() - startTime;
    const totalOperations = searchOps.length + embedOps.length + updateOps.length;
    const cacheHits = searchResults.filter((result) => result.cacheHit).length;

    return {
      searchResults,
      totalOperations,
      totalTime,
      cacheHitRate: totalOperations > 0 ? cacheHits / totalOperations : 0,
    };
  },
});

// Internal optimized vector search
export const optimizedVectorSearchInternal = internalAction({
  args: {
    query: v.string(),
    type: v.string(),
    district: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<VectorSearchResponse> => {
    // Mock implementation for now
    return {
      results: [
        {
          id: "mock-result",
          score: 0.85,
          data: { query: args.query, type: args.type },
        },
      ],
      totalCount: 1,
      searchTime: 100,
      cacheHit: false,
    };
  },
});

// Helper functions
function getCachedVectorData(cacheKey: string): VectorSearchResponse | null {
  const cached = vectorCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.timestamp + cached.ttl) {
    vectorCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedVectorData(cacheKey: string, data: VectorSearchResponse, ttl: number): void {
  vectorCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });

  // Cleanup old entries
  if (vectorCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of vectorCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        vectorCache.delete(key);
      }
    }
  }
}

async function performWeaviateSearch(params: {
  embedding: number[];
  type: string;
  district?: string;
  limit: number;
  filters?: any;
}): Promise<any[]> {
  try {
    const whereFilter = buildWeaviateFilter(params.type, params.district, params.filters);

    const response = await fetch(`${process.env.WEAVIATE_URL}/v1/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          {
            Get {
              ${params.type}(
                nearVector: {
                  vector: [${params.embedding.join(",")}]
                  certainty: ${WEAVIATE_CONFIG.SIMILARITY_THRESHOLD}
                }
                limit: ${params.limit}
                ${whereFilter ? `where: ${JSON.stringify(whereFilter)}` : ""}
              ) {
                _additional {
                  certainty
                  distance
                }
                content
                district
                timestamp
                metadata
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Weaviate search failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data?.Get?.[params.type] || [];
  } catch (error) {
    console.error("Weaviate search error:", error);
    return [];
  }
}

function applyDistrictWeighting(results: any[], district?: string): VectorSearchResponse {
  if (!(district && WEAVIATE_CONFIG.DISTRICT_WEIGHTS[district])) {
    return {
      results: results.map((r) => ({ id: r.id || "unknown", score: r.score || 0, data: r })),
      totalCount: results.length,
      searchTime: 0,
      cacheHit: false,
    };
  }

  const weight = WEAVIATE_CONFIG.DISTRICT_WEIGHTS[district];

  const weightedResults = results
    .map((result) => ({
      ...result,
      _additional: {
        ...result._additional,
        weightedCertainty: result._additional?.certainty * weight || 0,
        districtWeight: weight,
      },
    }))
    .sort(
      (a, b) => (b._additional?.weightedCertainty || 0) - (a._additional?.weightedCertainty || 0)
    );

  return {
    results: weightedResults.map((r) => ({
      id: r.id || "unknown",
      score: r._additional?.weightedCertainty || 0,
      data: r,
    })),
    totalCount: weightedResults.length,
    searchTime: 0,
    cacheHit: false,
  };
}

function buildWeaviateFilter(_type: string, district?: string, filters?: any): any {
  const conditions = [];

  if (district) {
    conditions.push({
      path: ["district"],
      operator: "Equal",
      valueText: district,
    });
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      conditions.push({
        path: [key],
        operator: "Equal",
        valueText: value,
      });
    });
  }

  return conditions.length > 0
    ? {
        operator: "And",
        operands: conditions,
      }
    : null;
}

function buildDistrictSearchQuery(district: string, searchType: string, context?: string): string {
  const baseQueries = {
    similar_jobs: `HVAC jobs in ${district} similar to ${context || "maintenance"}`,
    equipment_history: `Equipment service history in ${district} district`,
    service_patterns: `Service patterns and trends in ${district}`,
    client_preferences: `Client preferences and requirements in ${district}`,
  };

  return baseQueries[searchType as keyof typeof baseQueries] || `Search in ${district}`;
}

function getSearchTypeMapping(searchType: string): SearchType {
  const mapping: Record<string, SearchType> = {
    similar_jobs: "jobs",
    equipment_history: "equipment",
    service_patterns: "jobs",
    client_preferences: "contacts",
  };

  return mapping[searchType] || "knowledge";
}

function generateFallbackEmbedding(text: string): number[] {
  // Simple fallback embedding generation
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // Standard embedding size

  words.forEach((word, index) => {
    const hash = word.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    embedding[index % 384] = (hash % 100) / 100;
  });

  return embedding;
}

async function _batchUpdateWeaviate(operations: any[]): Promise<any[]> {
  // Implement batch update operations for Weaviate
  return operations.map((op) => ({ success: true, operation: op.type }));
}
