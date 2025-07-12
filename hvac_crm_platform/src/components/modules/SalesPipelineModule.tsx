import { useQuery } from "convex/react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Brain,
  DollarSign,
  Eye,
  MapPin,
  Plus,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { formatCurrency, formatDate, getStatusColor } from "../../lib/utils";
import type { WarsawDistrict } from "../../types/hvac";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Progress } from "../ui/progress";

interface Deal {
  _id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  contactId: string;
  assignedTo?: string;
  expectedCloseDate?: number;
  lastActivity?: number;
  priority: "low" | "medium" | "high" | "urgent";
  source: string;
  notes?: string;
  createdAt: number;

  // AI-powered enhancements
  aiScore?: number; // 0-100 AI confidence score
  aiInsights?: {
    closureProbability: number;
    recommendedActions: string[];
    riskFactors: string[];
    opportunityFactors: string[];
    nextBestAction: string;
    timeToClose: number; // estimated days
  };

  // Warsaw district optimization
  district?: WarsawDistrict;
  districtMetrics?: {
    affluenceScore: number; // 1-10 scale
    competitionLevel: "low" | "medium" | "high";
    marketDemand: number; // 0-100 scale
    averageDealSize: number;
    conversionRate: number;
    seasonalFactor: number; // 0.5-2.0 multiplier
  };

  // Enhanced tracking
  activities?: Array<{
    type: "call" | "email" | "meeting" | "proposal" | "follow-up";
    date: number;
    outcome: "positive" | "neutral" | "negative";
    notes: string;
  }>;

  // HVAC-specific data
  hvacDetails?: {
    serviceType: "installation" | "repair" | "maintenance" | "consultation";
    equipmentType: string;
    urgency: "immediate" | "within_week" | "within_month" | "planning";
    buildingType: "residential" | "commercial" | "industrial";
    squareMeters?: number;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  order: number;
  aiOptimized?: boolean; // Whether AI recommendations are applied
  warsawOptimized?: boolean; // Whether Warsaw-specific optimizations are applied
}

// AI Scoring Algorithm for HVAC deals
const calculateAIScore = (deal: Deal): number => {
  let score = 50; // Base score

  // Value-based scoring (0-25 points)
  if (deal.value > 50000) score += 25;
  else if (deal.value > 25000) score += 15;
  else if (deal.value > 10000) score += 10;
  else if (deal.value > 5000) score += 5;

  // Stage-based scoring (0-20 points)
  const stageScores: Record<string, number> = {
    lead: 5,
    qualified: 10,
    proposal: 15,
    negotiation: 18,
    closing: 20,
  };
  score += stageScores[deal.stage.toLowerCase()] || 0;

  // Activity recency (0-15 points)
  if (deal.lastActivity) {
    const daysSinceActivity = (Date.now() - deal.lastActivity) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 1) score += 15;
    else if (daysSinceActivity < 3) score += 10;
    else if (daysSinceActivity < 7) score += 5;
    else if (daysSinceActivity > 30) score -= 10;
  }

  // Priority-based scoring (0-10 points)
  const priorityScores = { urgent: 10, high: 7, medium: 4, low: 1 };
  score += priorityScores[deal.priority];

  // Warsaw district optimization (0-15 points)
  if (deal.district && deal.districtMetrics) {
    score += deal.districtMetrics.affluenceScore * 1.5; // Max 15 points
    score += deal.districtMetrics.marketDemand * 0.1; // Max 10 points
    score *= deal.districtMetrics.seasonalFactor; // Seasonal adjustment
  }

  // HVAC-specific factors (0-15 points)
  if (deal.hvacDetails) {
    if (deal.hvacDetails.urgency === "immediate") score += 15;
    else if (deal.hvacDetails.urgency === "within_week") score += 10;
    else if (deal.hvacDetails.urgency === "within_month") score += 5;

    if (deal.hvacDetails.buildingType === "commercial") score += 5;
    else if (deal.hvacDetails.buildingType === "industrial") score += 8;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
};

// Generate AI insights for deals
const generateAIInsights = (deal: Deal): Deal["aiInsights"] => {
  const score = deal.aiScore || calculateAIScore(deal);

  const insights: Deal["aiInsights"] = {
    closureProbability: score,
    recommendedActions: [],
    riskFactors: [],
    opportunityFactors: [],
    nextBestAction: "",
    timeToClose: 30, // Default 30 days
  };

  // Generate recommendations based on score and deal characteristics
  if (score > 80) {
    insights.recommendedActions.push("Prioritize immediate follow-up");
    insights.recommendedActions.push("Prepare contract documentation");
    insights.nextBestAction = "Schedule closing meeting";
    insights.timeToClose = 7;
  } else if (score > 60) {
    insights.recommendedActions.push("Send detailed proposal");
    insights.recommendedActions.push("Address any concerns");
    insights.nextBestAction = "Follow up on proposal";
    insights.timeToClose = 14;
  } else if (score > 40) {
    insights.recommendedActions.push("Nurture relationship");
    insights.recommendedActions.push("Provide additional information");
    insights.nextBestAction = "Schedule consultation";
    insights.timeToClose = 30;
  } else {
    insights.recommendedActions.push("Re-qualify lead");
    insights.recommendedActions.push("Understand budget constraints");
    insights.nextBestAction = "Discovery call";
    insights.timeToClose = 60;
  }

  // Risk factors
  if (deal.lastActivity && Date.now() - deal.lastActivity > 7 * 24 * 60 * 60 * 1000) {
    insights.riskFactors.push("No recent activity");
  }
  if (deal.value < 5000) {
    insights.riskFactors.push("Low deal value");
  }
  if (deal.district && deal.districtMetrics?.competitionLevel === "high") {
    insights.riskFactors.push("High competition in district");
  }

  // Opportunity factors
  if (deal.hvacDetails?.urgency === "immediate") {
    insights.opportunityFactors.push("Urgent customer need");
  }
  if (deal.district && deal.districtMetrics?.affluenceScore > 7) {
    insights.opportunityFactors.push("High-affluence district");
  }
  if (deal.value > 25000) {
    insights.opportunityFactors.push("High-value opportunity");
  }

  return insights;
};

// Warsaw district data for optimization
const WARSAW_DISTRICT_DATA: Record<WarsawDistrict, Deal["districtMetrics"]> = {
  Śródmieście: {
    affluenceScore: 9,
    competitionLevel: "high",
    marketDemand: 85,
    averageDealSize: 35000,
    conversionRate: 0.25,
    seasonalFactor: 1.1,
  },
  Wilanów: {
    affluenceScore: 10,
    competitionLevel: "medium",
    marketDemand: 90,
    averageDealSize: 45000,
    conversionRate: 0.35,
    seasonalFactor: 1.2,
  },
  Mokotów: {
    affluenceScore: 8,
    competitionLevel: "medium",
    marketDemand: 80,
    averageDealSize: 28000,
    conversionRate: 0.3,
    seasonalFactor: 1.0,
  },
  Żoliborz: {
    affluenceScore: 7,
    competitionLevel: "medium",
    marketDemand: 75,
    averageDealSize: 22000,
    conversionRate: 0.28,
    seasonalFactor: 0.9,
  },
  Ursynów: {
    affluenceScore: 7,
    competitionLevel: "low",
    marketDemand: 70,
    averageDealSize: 20000,
    conversionRate: 0.32,
    seasonalFactor: 1.0,
  },
  Wola: {
    affluenceScore: 6,
    competitionLevel: "high",
    marketDemand: 65,
    averageDealSize: 18000,
    conversionRate: 0.22,
    seasonalFactor: 0.8,
  },
  "Praga-Południe": {
    affluenceScore: 5,
    competitionLevel: "medium",
    marketDemand: 60,
    averageDealSize: 15000,
    conversionRate: 0.25,
    seasonalFactor: 0.9,
  },
  Targówek: {
    affluenceScore: 4,
    competitionLevel: "low",
    marketDemand: 55,
    averageDealSize: 12000,
    conversionRate: 0.3,
    seasonalFactor: 0.8,
  },
  Ochota: {
    affluenceScore: 6,
    competitionLevel: "medium",
    marketDemand: 68,
    averageDealSize: 19000,
    conversionRate: 0.26,
    seasonalFactor: 0.9,
  },
  "Praga-Północ": {
    affluenceScore: 5,
    competitionLevel: "low",
    marketDemand: 58,
    averageDealSize: 14000,
    conversionRate: 0.28,
    seasonalFactor: 0.8,
  },
  Bemowo: {
    affluenceScore: 6,
    competitionLevel: "low",
    marketDemand: 62,
    averageDealSize: 17000,
    conversionRate: 0.29,
    seasonalFactor: 0.9,
  },
  Bielany: {
    affluenceScore: 6,
    competitionLevel: "medium",
    marketDemand: 64,
    averageDealSize: 18000,
    conversionRate: 0.27,
    seasonalFactor: 0.9,
  },
  Białołęka: {
    affluenceScore: 5,
    competitionLevel: "low",
    marketDemand: 56,
    averageDealSize: 13000,
    conversionRate: 0.31,
    seasonalFactor: 0.8,
  },
  Rembertów: {
    affluenceScore: 4,
    competitionLevel: "low",
    marketDemand: 50,
    averageDealSize: 11000,
    conversionRate: 0.33,
    seasonalFactor: 0.7,
  },
  Wesoła: {
    affluenceScore: 5,
    competitionLevel: "low",
    marketDemand: 52,
    averageDealSize: 12000,
    conversionRate: 0.32,
    seasonalFactor: 0.8,
  },
  Włochy: {
    affluenceScore: 5,
    competitionLevel: "medium",
    marketDemand: 59,
    averageDealSize: 15000,
    conversionRate: 0.26,
    seasonalFactor: 0.8,
  },
  Ursus: {
    affluenceScore: 4,
    competitionLevel: "low",
    marketDemand: 48,
    averageDealSize: 10000,
    conversionRate: 0.34,
    seasonalFactor: 0.7,
  },
};

const DEFAULT_STAGES: PipelineStage[] = [
  { id: "lead", name: "Lead", color: "#6b7280", probability: 10, order: 1 },
  { id: "qualified", name: "Qualified", color: "#3b82f6", probability: 25, order: 2 },
  { id: "proposal", name: "Proposal", color: "#f59e0b", probability: 50, order: 3 },
  { id: "negotiation", name: "Negotiation", color: "#8b5cf6", probability: 75, order: 4 },
  { id: "closed_won", name: "Closed Won", color: "#10b981", probability: 100, order: 5 },
  { id: "closed_lost", name: "Closed Lost", color: "#ef4444", probability: 0, order: 6 },
];

export function SalesPipelineModule() {
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<WarsawDistrict | "all">("all");
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "forecast" | "ai-insights">(
    "kanban"
  );
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [warsawOptimization, setWarsawOptimization] = useState(true);
  const [_showAIInsights, _setShowAIInsights] = useState(false);

  // Mock data - replace with actual Convex queries
  const deals = useQuery(api.quotes.list, {}) || [];
  const contacts = useQuery(api.contacts.list, {}) || [];

  // Transform quotes to deals format with AI enhancements
  const transformedDeals: Deal[] = useMemo(() => {
    return deals.map((quote) => {
      // Get contact for district information
      const contact = contacts.find((c) => c._id === quote.contactId);
      const district = (contact?.address?.district as WarsawDistrict) || "Śródmieście";

      const baseDeal: Deal = {
        _id: quote._id,
        title: quote.title,
        value: quote.totalAmount || 0,
        stage:
          quote.status === "accepted"
            ? "closed_won"
            : quote.status === "rejected"
              ? "closed_lost"
              : quote.status === "sent"
                ? "proposal"
                : "lead",
        probability: quote.status === "accepted" ? 100 : quote.status === "rejected" ? 0 : 50,
        contactId: quote.contactId,
        expectedCloseDate: quote.validUntil,
        priority: "medium" as const,
        source: "website",
        createdAt: quote._creationTime,
        district,
        districtMetrics: WARSAW_DISTRICT_DATA[district],
        hvacDetails: {
          serviceType: "installation",
          equipmentType: "Split AC",
          urgency: "within_month",
          buildingType: "residential",
        },
      };

      // Add AI scoring if enabled
      if (aiEnabled) {
        baseDeal.aiScore = calculateAIScore(baseDeal);
        baseDeal.aiInsights = generateAIInsights(baseDeal);
      }

      return baseDeal;
    });
  }, [deals, contacts, aiEnabled]);

  // Enhanced filtering with AI and Warsaw optimization
  const filteredDeals = useMemo(() => {
    let filtered = transformedDeals;

    if (selectedStage !== "all") {
      filtered = filtered.filter((deal) => deal.stage === selectedStage);
    }

    if (selectedDistrict !== "all") {
      filtered = filtered.filter((deal) => deal.district === selectedDistrict);
    }

    // Sort by AI score if enabled
    if (aiEnabled) {
      filtered = filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    }

    return filtered;
  }, [transformedDeals, selectedStage, selectedDistrict, aiEnabled]);

  // Enhanced pipeline analytics with AI insights
  const pipelineStats = useMemo(() => {
    const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = filteredDeals.reduce(
      (sum, deal) => sum + (deal.value * deal.probability) / 100,
      0
    );
    const avgDealSize = totalValue / filteredDeals.length || 0;
    const conversionRate =
      (filteredDeals.filter((d) => d.stage === "closed_won").length / filteredDeals.length) * 100 ||
      0;

    // AI-enhanced metrics
    const avgAIScore = aiEnabled
      ? filteredDeals.reduce((sum, deal) => sum + (deal.aiScore || 0), 0) / filteredDeals.length ||
        0
      : 0;

    const highPotentialDeals = filteredDeals.filter((deal) => (deal.aiScore || 0) > 70).length;
    const atRiskDeals = filteredDeals.filter(
      (deal) => deal.aiInsights?.riskFactors && deal.aiInsights.riskFactors.length > 0
    ).length;

    // Warsaw district insights
    const districtPerformance = warsawOptimization
      ? Object.keys(WARSAW_DISTRICT_DATA)
          .map((district) => {
            const districtDeals = filteredDeals.filter((deal) => deal.district === district);
            const districtValue = districtDeals.reduce((sum, deal) => sum + deal.value, 0);
            const districtConversion =
              (districtDeals.filter((d) => d.stage === "closed_won").length /
                districtDeals.length) *
                100 || 0;

            return {
              district: district as WarsawDistrict,
              dealCount: districtDeals.length,
              totalValue: districtValue,
              conversionRate: districtConversion,
              avgAIScore:
                districtDeals.reduce((sum, deal) => sum + (deal.aiScore || 0), 0) /
                  districtDeals.length || 0,
            };
          })
          .filter((d) => d.dealCount > 0)
      : [];

    // Forecasting with AI
    const forecastData = aiEnabled
      ? {
          nextMonthRevenue: filteredDeals
            .filter((deal) => deal.aiInsights && deal.aiInsights.timeToClose <= 30)
            .reduce(
              (sum, deal) => sum + (deal.value * deal.aiInsights?.closureProbability) / 100,
              0
            ),
          quarterRevenue: filteredDeals
            .filter((deal) => deal.aiInsights && deal.aiInsights.timeToClose <= 90)
            .reduce(
              (sum, deal) => sum + (deal.value * deal.aiInsights?.closureProbability) / 100,
              0
            ),
          confidenceLevel: avgAIScore > 70 ? "high" : avgAIScore > 50 ? "medium" : "low",
        }
      : null;

    return {
      totalValue,
      weightedValue,
      avgDealSize,
      conversionRate,
      totalDeals: filteredDeals.length,
      wonDeals: filteredDeals.filter((d) => d.stage === "closed_won").length,
      // AI metrics
      avgAIScore,
      highPotentialDeals,
      atRiskDeals,
      // Warsaw metrics
      districtPerformance,
      // Forecasting
      forecastData,
    };
  }, [filteredDeals, aiEnabled, warsawOptimization]);

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {DEFAULT_STAGES.map((stage) => {
        const stageDeals = filteredDeals.filter((deal) => deal.stage === stage.id);
        const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
        const avgAIScore = aiEnabled
          ? stageDeals.reduce((sum, deal) => sum + (deal.aiScore || 0), 0) / stageDeals.length || 0
          : 0;

        return (
          <Card key={stage.id} className="min-h-[500px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: stage.color }}>
                  {stage.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {aiEnabled && avgAIScore > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      {avgAIScore.toFixed(0)}
                    </Badge>
                  )}
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">{formatCurrency(stageValue)}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stageDeals.map((deal) => (
                <div
                  key={deal._id}
                  className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{deal.title}</h4>
                    <div className="flex items-center gap-1">
                      {aiEnabled && deal.aiScore && (
                        <Badge
                          variant={
                            deal.aiScore > 70
                              ? "default"
                              : deal.aiScore > 50
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          <Brain className="w-3 h-3 mr-1" />
                          {deal.aiScore}
                        </Badge>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(deal.priority)}`}
                      >
                        {deal.priority}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-green-600 mb-2">
                    {formatCurrency(deal.value)}
                  </div>

                  {/* Warsaw District Info */}
                  {warsawOptimization && deal.district && (
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{deal.district}</span>
                      {deal.districtMetrics && (
                        <Badge variant="outline" className="text-xs">
                          Affluence: {deal.districtMetrics.affluenceScore}/10
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* AI Insights Preview */}
                  {aiEnabled && deal.aiInsights && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">
                        <Zap className="w-3 h-3 inline mr-1" />
                        Next: {deal.aiInsights.nextBestAction}
                      </div>
                      {deal.aiInsights.riskFactors.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            {deal.aiInsights.riskFactors.length} risk factor(s)
                          </span>
                        </div>
                      )}
                      {deal.aiInsights.opportunityFactors.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">
                            {deal.aiInsights.opportunityFactors.length} opportunity(s)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{deal.probability}% probability</span>
                    {deal.expectedCloseDate && <span>{formatDate(deal.expectedCloseDate)}</span>}
                  </div>

                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${deal.probability}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>

                  {/* AI Score Progress Bar */}
                  {aiEnabled && deal.aiScore && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">AI Confidence</span>
                        <span className="font-medium">{deal.aiScore}%</span>
                      </div>
                      <Progress value={deal.aiScore} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderAIInsightsView = () => (
    <div className="space-y-6">
      {/* AI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Avg AI Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.avgAIScore?.toFixed(0) || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Pipeline confidence</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              High Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.highPotentialDeals || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Deals {">"}70% score</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.atRiskDeals || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Deals with risks</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Next Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipelineStats.forecastData?.nextMonthRevenue || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Predicted revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Warsaw District Performance */}
      {warsawOptimization && pipelineStats.districtPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Warsaw District Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pipelineStats.districtPerformance.map((district) => (
                <div key={district.district} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{district.district}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Deals:</span>
                      <span className="font-medium">{district.dealCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span className="font-medium">{formatCurrency(district.totalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion:</span>
                      <span className="font-medium">{district.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Score:</span>
                      <span className="font-medium">{district.avgAIScore.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Deals by AI Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Top AI-Scored Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDeals
              .filter((deal) => deal.aiScore && deal.aiScore > 60)
              .slice(0, 5)
              .map((deal) => (
                <div
                  key={deal._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{deal.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{formatCurrency(deal.value)}</span>
                      {deal.district && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {deal.district}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">
                      <Brain className="w-3 h-3 mr-1" />
                      {deal.aiScore}
                    </Badge>
                    {deal.aiInsights && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info(`Next action: ${deal.aiInsights?.nextBestAction}`);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Insights
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderForecastView = () => (
    <div className="space-y-6">
      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipelineStats.totalValue)}</div>
            <div className="text-xs text-gray-500 mt-1">Total in pipeline</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Weighted Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipelineStats.weightedValue)}</div>
            <div className="text-xs text-gray-500 mt-1">Probability adjusted</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipelineStats.avgDealSize)}</div>
            <div className="text-xs text-gray-500 mt-1">Per deal average</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Conversion rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEFAULT_STAGES.filter((s) => s.id !== "closed_lost").map((stage) => {
              const stageDeals = transformedDeals.filter((deal) => deal.stage === stage.id);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
              const percentage = (stageValue / pipelineStats.totalValue) * 100 || 0;

              return (
                <div key={stage.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-sm text-gray-500">({stageDeals.length} deals)</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(stageValue)}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header with AI and Warsaw Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Sales Pipeline
              {aiEnabled && (
                <Badge variant="secondary" className="ml-3">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
              {warsawOptimization && (
                <Badge variant="outline" className="ml-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  Warsaw Optimized
                </Badge>
              )}
            </h1>
            <p className="text-gray-600">
              AI-powered deal management with Warsaw district optimization
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* AI Toggle */}
            <Button
              variant={aiEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAiEnabled(!aiEnabled)}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Insights
            </Button>

            {/* Warsaw Optimization Toggle */}
            <Button
              variant={warsawOptimization ? "default" : "outline"}
              size="sm"
              onClick={() => setWarsawOptimization(!warsawOptimization)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Warsaw
            </Button>

            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["kanban", "forecast", "ai-insights"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {mode === "kanban"
                    ? "Pipeline"
                    : mode === "forecast"
                      ? "Forecast"
                      : "AI Insights"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Stages</option>
            {DEFAULT_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>

          {/* Warsaw District Filter */}
          {warsawOptimization && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value as WarsawDistrict | "all")}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Districts</option>
              {Object.keys(WARSAW_DISTRICT_DATA).map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          )}

          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "week" | "month" | "quarter")}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipelineStats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">{pipelineStats.wonDeals} won this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipelineStats.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === "kanban" && renderKanbanView()}
      {viewMode === "forecast" && renderForecastView()}
      {viewMode === "ai-insights" && renderAIInsightsView()}

      {/* Add Deal Dialog */}
      <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">Deal creation form coming soon...</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
