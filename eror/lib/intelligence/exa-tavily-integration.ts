/**
 * Exa & Tavily Intelligence Integration for HVAC CRM
 * Provides market intelligence and competitive analysis to enhance AI prophecy system
 */

import { Exa } from 'exa-js';

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
  }>;
  query: string;
  response_time: number;
}

interface MarketIntelligence {
  equipmentTrends: any[];
  competitorAnalysis: any[];
  regulatoryUpdates: any[];
  marketSentiment: any[];
  pricingIntelligence: any[];
  timestamp: string;
}

interface ProphecyEnhancement {
  marketFactors: string[];
  competitiveThreats: string[];
  opportunities: string[];
  riskAssessment: string[];
  confidenceBoost: number;
}

export class ExaTavilyIntelligence {
  private exa: Exa;
  private tavilyApiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 3600000; // 1 hour

  constructor(exaApiKey: string, tavilyApiKey: string) {
    this.exa = new Exa(exaApiKey);
    this.tavilyApiKey = tavilyApiKey;
  }

  /**
   * Comprehensive Market Intelligence Gathering
   */
  async gatherMarketIntelligence(district: string, serviceType: string): Promise<MarketIntelligence> {
    const cacheKey = `market_${district}_${serviceType}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const [equipmentTrends, competitorAnalysis, regulatoryUpdates, marketSentiment, pricingIntelligence] = 
      await Promise.allSettled([
        this.getEquipmentTrends(serviceType),
        this.getCompetitorAnalysis(district),
        this.getRegulatoryUpdates(),
        this.getMarketSentiment(district, serviceType),
        this.getPricingIntelligence(district, serviceType)
      ]);

    const intelligence: MarketIntelligence = {
      equipmentTrends: equipmentTrends.status === 'fulfilled' ? equipmentTrends.value : [],
      competitorAnalysis: competitorAnalysis.status === 'fulfilled' ? competitorAnalysis.value : [],
      regulatoryUpdates: regulatoryUpdates.status === 'fulfilled' ? regulatoryUpdates.value : [],
      marketSentiment: marketSentiment.status === 'fulfilled' ? marketSentiment.value : [],
      pricingIntelligence: pricingIntelligence.status === 'fulfilled' ? pricingIntelligence.value : [],
      timestamp: new Date().toISOString()
    };

    this.setCache(cacheKey, intelligence);
    return intelligence;
  }

  /**
   * Exa-powered Equipment Trends Analysis
   */
  private async getEquipmentTrends(serviceType: string): Promise<any[]> {
    try {
      const searchResults = await this.exa.searchAndContents(
        `HVAC ${serviceType} equipment trends 2024 Poland energy efficiency`,
        {
          type: 'neural',
          useAutoprompt: true,
          numResults: 10,
          text: true,
          highlights: true,
          category: 'company'
        }
      );

      return searchResults.results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.text?.substring(0, 500),
        highlights: result.highlights,
        relevanceScore: result.score,
        category: 'equipment_trends',
        extractedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Exa equipment trends search failed:', error);
      return [];
    }
  }

  /**
   * Tavily-powered Competitor Analysis
   */
  private async getCompetitorAnalysis(district: string): Promise<any[]> {
    try {
      const competitors = ['Bitrix24', 'Reynet CRM', 'ServiceTitan', 'FieldEdge'];
      const results = [];

      for (const competitor of competitors) {
        const response = await this.tavilySearch(
          `${competitor} HVAC CRM features pricing updates 2024 Warsaw ${district}`
        );
        
        results.push({
          competitor,
          insights: response.results.slice(0, 3).map(r => ({
            title: r.title,
            content: r.content.substring(0, 300),
            url: r.url,
            publishedDate: r.published_date,
            relevanceScore: r.score
          })),
          analysisDate: new Date().toISOString()
        });
      }

      return results;
    } catch (error) {
      console.error('Tavily competitor analysis failed:', error);
      return [];
    }
  }

  /**
   * Regulatory Updates Monitoring
   */
  private async getRegulatoryUpdates(): Promise<any[]> {
    try {
      const queries = [
        'Poland HVAC regulations 2024 energy efficiency standards',
        'Warsaw building codes HVAC installation requirements',
        'EU energy efficiency directive HVAC compliance Poland'
      ];

      const results = [];
      for (const query of queries) {
        const response = await this.tavilySearch(query);
        results.push(...response.results.slice(0, 2).map(r => ({
          title: r.title,
          content: r.content.substring(0, 400),
          url: r.url,
          publishedDate: r.published_date,
          category: 'regulatory',
          relevanceScore: r.score
        })));
      }

      return results;
    } catch (error) {
      console.error('Regulatory updates search failed:', error);
      return [];
    }
  }

  /**
   * Market Sentiment Analysis
   */
  private async getMarketSentiment(district: string, serviceType: string): Promise<any[]> {
    try {
      const sentimentQueries = [
        `HVAC ${serviceType} customer reviews Warsaw ${district} 2024`,
        `heating cooling service satisfaction Poland ${district}`,
        `HVAC technician reviews Warsaw customer feedback`
      ];

      const results = [];
      for (const query of sentimentQueries) {
        const response = await this.tavilySearch(query);
        results.push(...response.results.slice(0, 2).map(r => ({
          title: r.title,
          content: r.content.substring(0, 300),
          url: r.url,
          sentiment: this.analyzeSentiment(r.content),
          category: 'market_sentiment',
          relevanceScore: r.score
        })));
      }

      return results;
    } catch (error) {
      console.error('Market sentiment analysis failed:', error);
      return [];
    }
  }

  /**
   * Pricing Intelligence Gathering
   */
  private async getPricingIntelligence(district: string, serviceType: string): Promise<any[]> {
    try {
      const pricingQuery = `HVAC ${serviceType} pricing costs Warsaw ${district} 2024 installation maintenance`;
      
      const exaResults = await this.exa.searchAndContents(pricingQuery, {
        type: 'neural',
        useAutoprompt: true,
        numResults: 5,
        text: true,
        category: 'company'
      });

      const tavilyResults = await this.tavilySearch(pricingQuery);

      return [
        ...exaResults.results.map(r => ({
          source: 'exa',
          title: r.title,
          content: r.text?.substring(0, 400),
          url: r.url,
          priceIndicators: this.extractPriceIndicators(r.text || ''),
          category: 'pricing_intelligence'
        })),
        ...tavilyResults.results.slice(0, 3).map(r => ({
          source: 'tavily',
          title: r.title,
          content: r.content.substring(0, 400),
          url: r.url,
          priceIndicators: this.extractPriceIndicators(r.content),
          category: 'pricing_intelligence'
        }))
      ];
    } catch (error) {
      console.error('Pricing intelligence gathering failed:', error);
      return [];
    }
  }

  /**
   * Enhance AI Prophecy with Market Intelligence
   */
  async enhanceProphecy(
    baseProhecy: any, 
    marketIntelligence: MarketIntelligence
  ): Promise<ProphecyEnhancement> {
    const enhancement: ProphecyEnhancement = {
      marketFactors: [],
      competitiveThreats: [],
      opportunities: [],
      riskAssessment: [],
      confidenceBoost: 0
    };

    // Analyze equipment trends impact
    if (marketIntelligence.equipmentTrends.length > 0) {
      enhancement.marketFactors.push('Latest equipment trends indicate increased demand for energy-efficient solutions');
      enhancement.confidenceBoost += 0.1;
    }

    // Analyze competitive landscape
    const competitorFeatures = marketIntelligence.competitorAnalysis
      .flatMap(c => c.insights)
      .filter(i => i.relevanceScore > 0.7);
    
    if (competitorFeatures.length > 0) {
      enhancement.competitiveThreats.push(`${competitorFeatures.length} competitor updates detected`);
      enhancement.opportunities.push('Market gaps identified for differentiation');
    }

    // Analyze regulatory impact
    if (marketIntelligence.regulatoryUpdates.length > 0) {
      enhancement.marketFactors.push('New regulatory requirements may drive service demand');
      enhancement.confidenceBoost += 0.05;
    }

    // Analyze market sentiment
    const positiveSentiment = marketIntelligence.marketSentiment
      .filter(s => s.sentiment === 'positive').length;
    const totalSentiment = marketIntelligence.marketSentiment.length;
    
    if (totalSentiment > 0) {
      const sentimentRatio = positiveSentiment / totalSentiment;
      if (sentimentRatio > 0.6) {
        enhancement.opportunities.push('Positive market sentiment detected');
        enhancement.confidenceBoost += 0.15;
      } else if (sentimentRatio < 0.4) {
        enhancement.riskAssessment.push('Negative market sentiment requires attention');
        enhancement.confidenceBoost -= 0.1;
      }
    }

    // Analyze pricing intelligence
    const avgPriceIndicators = marketIntelligence.pricingIntelligence
      .flatMap(p => p.priceIndicators)
      .filter(p => p > 0);
    
    if (avgPriceIndicators.length > 0) {
      const avgPrice = avgPriceIndicators.reduce((a, b) => a + b, 0) / avgPriceIndicators.length;
      enhancement.marketFactors.push(`Market pricing average: ${avgPrice.toFixed(0)} PLN`);
    }

    return enhancement;
  }

  /**
   * Utility Methods
   */
  private async tavilySearch(query: string): Promise<TavilyResponse> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tavilyApiKey}`
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
        include_domains: [],
        exclude_domains: ['facebook.com', 'twitter.com', 'instagram.com']
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['excellent', 'great', 'satisfied', 'recommend', 'professional', 'quality'];
    const negativeWords = ['poor', 'terrible', 'disappointed', 'unprofessional', 'expensive', 'delay'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractPriceIndicators(text: string): number[] {
    const priceRegex = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:PLN|zł|złoty|złotych)/gi;
    const matches = text.match(priceRegex);
    
    if (!matches) return [];
    
    return matches.map(match => {
      const numStr = match.replace(/[^\d.,]/g, '').replace(',', '');
      return parseFloat(numStr);
    }).filter(num => !isNaN(num) && num > 0);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Health Check and Monitoring
   */
  async healthCheck(): Promise<{ exa: boolean; tavily: boolean; cache: number }> {
    try {
      // Test Exa connection
      const exaTest = await this.exa.search('test query', { numResults: 1 });
      const exaHealthy = exaTest.results.length >= 0;

      // Test Tavily connection
      const tavilyTest = await this.tavilySearch('test query');
      const tavilyHealthy = tavilyTest.results.length >= 0;

      return {
        exa: exaHealthy,
        tavily: tavilyHealthy,
        cache: this.cache.size
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { exa: false, tavily: false, cache: this.cache.size };
    }
  }
}

// Singleton instance
let intelligenceEngine: ExaTavilyIntelligence | null = null;

export const createIntelligenceEngine = (exaApiKey: string, tavilyApiKey: string): ExaTavilyIntelligence => {
  intelligenceEngine = new ExaTavilyIntelligence(exaApiKey, tavilyApiKey);
  return intelligenceEngine;
};

export const getIntelligenceEngine = (): ExaTavilyIntelligence | null => {
  return intelligenceEngine;
};

// Environment-based initialization
export const initializeIntelligence = (): ExaTavilyIntelligence | null => {
  const exaApiKey = process.env.NEXT_PUBLIC_EXA_API_KEY;
  const tavilyApiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY;
  
  if (!exaApiKey || !tavilyApiKey) {
    console.warn('Exa or Tavily API keys not found. Intelligence features will be limited.');
    return null;
  }
  
  return createIntelligenceEngine(exaApiKey, tavilyApiKey);
};
