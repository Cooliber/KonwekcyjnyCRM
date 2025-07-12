/**
 * Weaviate Vector Database Client for HVAC Prophecy Hotspots
 * Implements semantic search and AI-powered predictions
 */

// Mock Weaviate client for development (replace with actual Weaviate in production)
export interface WeaviateServiceData {
  id: string;
  district: string;
  serviceType: string;
  equipmentType: string;
  seasonality: string;
  customerAffluence: number;
  urgency: string;
  completionTime: number;
  cost: number;
  satisfaction: number;
  coordinates: { lat: number; lng: number };
  timestamp: number;
  description: string;
  vector?: number[]; // Embedding vector
}

export interface HotspotPrediction {
  district: string;
  coordinates: { lat: number; lng: number };
  predictedDemand: number; // 0-1 scale
  serviceTypes: string[];
  seasonalFactor: number;
  affluenceFactor: number;
  confidence: number;
  reasoning: string[];
}

export interface SemanticSearchResult {
  data: WeaviateServiceData;
  distance: number;
  relevance: number;
}

// Mock historical service data for development
const MOCK_SERVICE_DATA: WeaviateServiceData[] = [
  {
    id: "1",
    district: "Śródmieście",
    serviceType: "installation",
    equipmentType: "split_ac",
    seasonality: "summer",
    customerAffluence: 0.9,
    urgency: "high",
    completionTime: 240,
    cost: 12500,
    satisfaction: 0.95,
    coordinates: { lat: 52.2297, lng: 21.0122 },
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    description: "Premium split AC installation in luxury apartment, high-end customer",
  },
  {
    id: "2",
    district: "Wilanów",
    serviceType: "maintenance",
    equipmentType: "multi_split",
    seasonality: "spring",
    customerAffluence: 0.85,
    urgency: "medium",
    completionTime: 90,
    cost: 800,
    satisfaction: 0.9,
    coordinates: { lat: 52.17, lng: 21.1 },
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    description: "Routine maintenance for multi-split system in villa",
  },
  {
    id: "3",
    district: "Mokotów",
    serviceType: "repair",
    equipmentType: "split_ac",
    seasonality: "summer",
    customerAffluence: 0.75,
    urgency: "urgent",
    completionTime: 120,
    cost: 1500,
    satisfaction: 0.8,
    coordinates: { lat: 52.185, lng: 21.025 },
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    description: "Emergency AC repair during heatwave, office building",
  },
  {
    id: "4",
    district: "Żoliborz",
    serviceType: "installation",
    equipmentType: "heat_pump",
    seasonality: "autumn",
    customerAffluence: 0.7,
    urgency: "medium",
    completionTime: 300,
    cost: 15000,
    satisfaction: 0.92,
    coordinates: { lat: 52.27, lng: 21.0 },
    timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    description: "Heat pump installation in renovated townhouse",
  },
  {
    id: "5",
    district: "Praga-Południe",
    serviceType: "repair",
    equipmentType: "split_ac",
    seasonality: "summer",
    customerAffluence: 0.45,
    urgency: "high",
    completionTime: 90,
    cost: 800,
    satisfaction: 0.85,
    coordinates: { lat: 52.22, lng: 21.07 },
    timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    description: "AC repair in residential apartment, budget-conscious customer",
  },
];

/**
 * Mock Weaviate Client Class
 */
export class WeaviateClient {
  private data: WeaviateServiceData[] = MOCK_SERVICE_DATA;

  /**
   * Initialize connection to Weaviate (mock)
   */
  async connect(): Promise<boolean> {
    // In production: connect to actual Weaviate instance
    console.log("Connected to Weaviate (mock)");
    return true;
  }

  /**
   * Store service data with vector embedding
   */
  async storeServiceData(serviceData: Omit<WeaviateServiceData, "id" | "vector">): Promise<string> {
    const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const vector = this.generateMockEmbedding(serviceData.description);

    const newData: WeaviateServiceData = {
      ...serviceData,
      id,
      vector,
    };

    this.data.push(newData);
    return id;
  }

  /**
   * Semantic search for similar services
   */
  async semanticSearch(
    query: string,
    filters?: {
      district?: string;
      serviceType?: string;
      seasonality?: string;
      minAffluence?: number;
    },
    limit = 10
  ): Promise<SemanticSearchResult[]> {
    const queryVector = this.generateMockEmbedding(query);

    let filteredData = this.data;

    // Apply filters
    if (filters) {
      filteredData = this.data.filter((item) => {
        if (filters.district && item.district !== filters.district) return false;
        if (filters.serviceType && item.serviceType !== filters.serviceType) return false;
        if (filters.seasonality && item.seasonality !== filters.seasonality) return false;
        if (filters.minAffluence && item.customerAffluence < filters.minAffluence) return false;
        return true;
      });
    }

    // Calculate similarity scores
    const results = filteredData.map((item) => {
      const distance = this.calculateVectorDistance(queryVector, item.vector || []);
      const relevance = Math.max(0, 1 - distance);

      return {
        data: item,
        distance,
        relevance,
      };
    });

    // Sort by relevance and limit results
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  /**
   * Predict service hotspots based on historical patterns
   */
  async predictHotspots(
    _timeframe: "week" | "month" | "season" = "month",
    currentSeason: "spring" | "summer" | "autumn" | "winter" = "summer"
  ): Promise<HotspotPrediction[]> {
    const districts = [
      "Śródmieście",
      "Wilanów",
      "Mokotów",
      "Żoliborz",
      "Ursynów",
      "Wola",
      "Praga-Południe",
      "Targówek",
    ];
    const predictions: HotspotPrediction[] = [];

    for (const district of districts) {
      const districtData = this.data.filter((item) => item.district === district);

      if (districtData.length === 0) continue;

      // Calculate seasonal demand patterns
      const seasonalData = districtData.filter((item) => item.seasonality === currentSeason);
      const seasonalFactor = seasonalData.length / Math.max(districtData.length, 1);

      // Calculate affluence factor
      const avgAffluence =
        districtData.reduce((sum, item) => sum + item.customerAffluence, 0) / districtData.length;

      // Predict demand based on historical patterns
      const urgentServices = districtData.filter(
        (item) => item.urgency === "urgent" || item.urgency === "high"
      ).length;
      const demandScore = Math.min(
        1,
        urgentServices / Math.max(districtData.length, 1) + seasonalFactor * 0.5
      );

      // Get most common service types
      const serviceTypeCounts = districtData.reduce(
        (acc, item) => {
          acc[item.serviceType] = (acc[item.serviceType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topServiceTypes = Object.entries(serviceTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      // Calculate center coordinates for district
      const avgLat =
        districtData.reduce((sum, item) => sum + item.coordinates.lat, 0) / districtData.length;
      const avgLng =
        districtData.reduce((sum, item) => sum + item.coordinates.lng, 0) / districtData.length;

      // Generate reasoning
      const reasoning = [
        `Historical data shows ${districtData.length} services in ${district}`,
        `${Math.round(seasonalFactor * 100)}% seasonal demand increase expected`,
        `Average customer affluence: ${Math.round(avgAffluence * 100)}%`,
        `Top services: ${topServiceTypes.join(", ")}`,
      ];

      predictions.push({
        district,
        coordinates: { lat: avgLat, lng: avgLng },
        predictedDemand: demandScore,
        serviceTypes: topServiceTypes,
        seasonalFactor,
        affluenceFactor: avgAffluence,
        confidence: Math.min(0.95, districtData.length / 10), // Higher confidence with more data
        reasoning,
      });
    }

    return predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);
  }

  /**
   * Get service trends and patterns
   */
  async getServiceTrends(district?: string): Promise<{
    totalServices: number;
    avgSatisfaction: number;
    commonIssues: string[];
    seasonalPatterns: Record<string, number>;
    affluenceCorrelation: number;
  }> {
    const relevantData = district
      ? this.data.filter((item) => item.district === district)
      : this.data;

    const totalServices = relevantData.length;
    const avgSatisfaction =
      relevantData.reduce((sum, item) => sum + item.satisfaction, 0) / totalServices;

    // Analyze seasonal patterns
    const seasonalCounts = relevantData.reduce(
      (acc, item) => {
        acc[item.seasonality] = (acc[item.seasonality] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Extract common issues from descriptions
    const commonWords = this.extractCommonWords(relevantData.map((item) => item.description));

    // Calculate affluence correlation with satisfaction
    const affluenceCorrelation = this.calculateCorrelation(
      relevantData.map((item) => item.customerAffluence),
      relevantData.map((item) => item.satisfaction)
    );

    return {
      totalServices,
      avgSatisfaction,
      commonIssues: commonWords.slice(0, 5),
      seasonalPatterns: seasonalCounts,
      affluenceCorrelation,
    };
  }

  /**
   * Generate mock embedding vector (replace with actual embedding in production)
   */
  private generateMockEmbedding(text: string): number[] {
    const vector: number[] = [];
    const words = text.toLowerCase().split(" ");

    // Simple hash-based mock embedding
    for (let i = 0; i < 384; i++) {
      // 384-dimensional vector
      let value = 0;
      for (const word of words) {
        value += (word.charCodeAt(i % word.length) || 0) * (i + 1);
      }
      vector.push(((value % 200) - 100) / 100); // Normalize to [-1, 1]
    }

    return vector;
  }

  /**
   * Calculate cosine distance between vectors
   */
  private calculateVectorDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 1;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return 1 - similarity; // Convert similarity to distance
  }

  /**
   * Extract common words from descriptions
   */
  private extractCommonWords(descriptions: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);

    descriptions.forEach((desc) => {
      const words = desc.toLowerCase().match(/\b\w+\b/g) || [];
      words.forEach((word) => {
        if (!stopWords.has(word) && word.length > 2) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([word]) => word);
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

// Export singleton instance
export const weaviateClient = new WeaviateClient();
