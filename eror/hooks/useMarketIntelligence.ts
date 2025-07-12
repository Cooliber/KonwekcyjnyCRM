/**
 * React Hook for Market Intelligence Integration
 * Provides real-time market data and competitive analysis for HVAC CRM
 */

import { useState, useEffect, useCallback } from 'react';
import { getIntelligenceEngine, initializeIntelligence } from '../lib/intelligence/exa-tavily-integration';

interface MarketIntelligenceState {
  data: any | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

interface CompetitorAlert {
  competitor: string;
  type: 'feature_update' | 'pricing_change' | 'market_expansion';
  description: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface MarketTrend {
  category: 'equipment' | 'pricing' | 'regulation' | 'sentiment';
  trend: string;
  confidence: number;
  impact: string;
  timeframe: string;
}

export const useMarketIntelligence = (district?: string, serviceType?: string) => {
  const [state, setState] = useState<MarketIntelligenceState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [competitorAlerts, setCompetitorAlerts] = useState<CompetitorAlert[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize intelligence engine
  useEffect(() => {
    const engine = initializeIntelligence();
    if (engine) {
      setIsInitialized(true);
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Intelligence engine not available - API keys missing' 
      }));
    }
  }, []);

  // Fetch market intelligence
  const fetchMarketIntelligence = useCallback(async (
    targetDistrict?: string, 
    targetServiceType?: string
  ) => {
    if (!isInitialized) return;

    const engine = getIntelligenceEngine();
    if (!engine) {
      setState(prev => ({ ...prev, error: 'Intelligence engine not available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const intelligence = await engine.gatherMarketIntelligence(
        targetDistrict || district || 'Śródmieście',
        targetServiceType || serviceType || 'installation'
      );

      setState({
        data: intelligence,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });

      // Process competitor alerts
      const alerts = processCompetitorAlerts(intelligence.competitorAnalysis);
      setCompetitorAlerts(alerts);

      // Process market trends
      const trends = processMarketTrends(intelligence);
      setMarketTrends(trends);

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market intelligence'
      }));
    }
  }, [district, serviceType, isInitialized]);

  // Auto-refresh market intelligence
  useEffect(() => {
    if (isInitialized && district && serviceType) {
      fetchMarketIntelligence();
      
      // Set up periodic refresh (every 30 minutes)
      const interval = setInterval(() => {
        fetchMarketIntelligence();
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [fetchMarketIntelligence, district, serviceType, isInitialized]);

  // Enhance prophecy with market intelligence
  const enhanceProphecy = useCallback(async (baseProphecy: any) => {
    if (!state.data || !isInitialized) return baseProphecy;

    const engine = getIntelligenceEngine();
    if (!engine) return baseProphecy;

    try {
      const enhancement = await engine.enhanceProphecy(baseProphecy, state.data);
      return {
        ...baseProphecy,
        marketEnhancement: enhancement,
        confidenceScore: Math.min(1.0, baseProphecy.confidence + enhancement.confidenceBoost),
        enhancedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to enhance prophecy:', error);
      return baseProphecy;
    }
  }, [state.data, isInitialized]);

  // Get competitive positioning
  const getCompetitivePositioning = useCallback(() => {
    if (!state.data?.competitorAnalysis) return null;

    const competitors = state.data.competitorAnalysis;
    const positioning = {
      strengths: [
        'AI-powered prophecy system (unique)',
        'Warsaw-specific optimization',
        'Real-time technician tracking',
        'Localhost development capability'
      ],
      threats: competitors.flatMap((c: any) => 
        c.insights
          .filter((i: any) => i.relevanceScore > 0.7)
          .map((i: any) => `${c.competitor}: ${i.title}`)
      ).slice(0, 5),
      opportunities: [
        'HVAC industry specialization vs generic CRM',
        'Mobile-first approach for field technicians',
        'AI-driven predictive maintenance',
        'District-based route optimization'
      ],
      marketGaps: identifyMarketGaps(competitors)
    };

    return positioning;
  }, [state.data]);

  // Get pricing intelligence summary
  const getPricingIntelligence = useCallback(() => {
    if (!state.data?.pricingIntelligence) return null;

    const pricing = state.data.pricingIntelligence;
    const priceIndicators = pricing.flatMap((p: any) => p.priceIndicators).filter((p: number) => p > 0);
    
    if (priceIndicators.length === 0) return null;

    const avgPrice = priceIndicators.reduce((a: number, b: number) => a + b, 0) / priceIndicators.length;
    const minPrice = Math.min(...priceIndicators);
    const maxPrice = Math.max(...priceIndicators);

    return {
      averagePrice: Math.round(avgPrice),
      priceRange: { min: Math.round(minPrice), max: Math.round(maxPrice) },
      sampleSize: priceIndicators.length,
      recommendations: generatePricingRecommendations(avgPrice, district || 'Śródmieście')
    };
  }, [state.data, district]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchMarketIntelligence();
  }, [fetchMarketIntelligence]);

  // Health check
  const checkHealth = useCallback(async () => {
    if (!isInitialized) return { status: 'not_initialized' };

    const engine = getIntelligenceEngine();
    if (!engine) return { status: 'engine_unavailable' };

    try {
      const health = await engine.healthCheck();
      return { status: 'healthy', details: health };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [isInitialized]);

  return {
    // State
    ...state,
    competitorAlerts,
    marketTrends,
    isInitialized,

    // Actions
    refresh,
    enhanceProphecy,
    checkHealth,

    // Computed values
    competitivePositioning: getCompetitivePositioning(),
    pricingIntelligence: getPricingIntelligence(),

    // Utilities
    hasData: !!state.data,
    isStale: state.lastUpdated ? 
      Date.now() - new Date(state.lastUpdated).getTime() > 30 * 60 * 1000 : true
  };
};

// Helper functions
function processCompetitorAlerts(competitorAnalysis: any[]): CompetitorAlert[] {
  if (!competitorAnalysis) return [];

  return competitorAnalysis.flatMap(competitor => 
    competitor.insights
      .filter((insight: any) => insight.relevanceScore > 0.6)
      .map((insight: any) => ({
        competitor: competitor.competitor,
        type: determineAlertType(insight.title, insight.content),
        description: insight.title,
        impact: calculateImpact(insight.relevanceScore),
        timestamp: insight.publishedDate || new Date().toISOString()
      }))
  ).slice(0, 10); // Limit to 10 most relevant alerts
}

function processMarketTrends(intelligence: any): MarketTrend[] {
  const trends: MarketTrend[] = [];

  // Equipment trends
  if (intelligence.equipmentTrends?.length > 0) {
    trends.push({
      category: 'equipment',
      trend: 'Energy-efficient HVAC systems gaining popularity',
      confidence: 0.8,
      impact: 'Increased demand for modern installations',
      timeframe: '2024-2025'
    });
  }

  // Pricing trends
  if (intelligence.pricingIntelligence?.length > 0) {
    trends.push({
      category: 'pricing',
      trend: 'Service pricing stabilizing in Warsaw market',
      confidence: 0.7,
      impact: 'Competitive pricing opportunities',
      timeframe: 'Q1-Q2 2024'
    });
  }

  // Regulatory trends
  if (intelligence.regulatoryUpdates?.length > 0) {
    trends.push({
      category: 'regulation',
      trend: 'New EU energy efficiency standards',
      confidence: 0.9,
      impact: 'Compliance requirements driving service demand',
      timeframe: '2024-2026'
    });
  }

  return trends;
}

function determineAlertType(title: string, content: string): CompetitorAlert['type'] {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('feature') || text.includes('update') || text.includes('new')) {
    return 'feature_update';
  }
  if (text.includes('price') || text.includes('cost') || text.includes('pricing')) {
    return 'pricing_change';
  }
  if (text.includes('expansion') || text.includes('market') || text.includes('launch')) {
    return 'market_expansion';
  }
  
  return 'feature_update';
}

function calculateImpact(relevanceScore: number): CompetitorAlert['impact'] {
  if (relevanceScore > 0.8) return 'high';
  if (relevanceScore > 0.6) return 'medium';
  return 'low';
}

function identifyMarketGaps(competitors: any[]): string[] {
  const gaps = [
    'AI-powered predictive maintenance',
    'Real-time technician location tracking',
    'District-specific route optimization',
    'Localhost development capabilities',
    'HVAC-specific workflow automation'
  ];

  // Filter out gaps that competitors might have
  return gaps.filter(gap => {
    const hasGap = competitors.some(c => 
      c.insights.some((i: any) => 
        i.content.toLowerCase().includes(gap.toLowerCase().split(' ')[0])
      )
    );
    return !hasGap;
  });
}

function generatePricingRecommendations(avgPrice: number, district: string): string[] {
  const recommendations = [];
  
  const districtMultipliers: Record<string, number> = {
    'Śródmieście': 1.5,
    'Wilanów': 1.4,
    'Mokotów': 1.3,
    'Żoliborz': 1.2,
    'Ursynów': 1.1,
    'Wola': 1.0,
    'Praga-Południe': 0.9,
    'Targówek': 0.8
  };

  const multiplier = districtMultipliers[district] || 1.0;
  const recommendedPrice = Math.round(avgPrice * multiplier);

  recommendations.push(`Recommended pricing for ${district}: ${recommendedPrice} PLN`);
  
  if (multiplier > 1.2) {
    recommendations.push('Premium pricing justified by district affluence');
  } else if (multiplier < 0.9) {
    recommendations.push('Competitive pricing strategy recommended');
  }

  recommendations.push('Consider seasonal adjustments for heating/cooling demand');
  
  return recommendations;
}
