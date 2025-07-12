/**
 * @fileoverview Advanced Sales Pipeline Board Component
 * @description Drag-and-drop Kanban board with AI-powered deal scoring and ACI-MCP integration
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  User, 
  MapPin,
  Zap,
  Brain,
  Target,
  MoreVertical,
  Plus,
  Filter,
  Search,
  Settings,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { cn } from '../../../utils';
import { GOTUN_COLORS, GOTUN_ANIMATIONS, GOTUN_SHADOWS } from '../../constants';
import type { Deal, PipelineStage, DealScoringResult } from '../../../types';

interface AdvancedPipelineBoardProps {
  stages: PipelineStage[];
  deals: Deal[];
  onDealMove: (dealId: string, targetStageId: string) => Promise<void>;
  onDealUpdate: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onStageUpdate: (stageId: string, updates: Partial<PipelineStage>) => Promise<void>;
  className?: string;
  enableAIScoring?: boolean;
  enableRealTimeUpdates?: boolean;
  enableWarsawOptimization?: boolean;
}

interface DealCardProps {
  deal: Deal;
  scoring?: DealScoringResult;
  onUpdate: (updates: Partial<Deal>) => void;
  isDragging?: boolean;
}

interface StageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealMove: (dealId: string, targetStageId: string) => Promise<void>;
  onDealUpdate: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onStageUpdate: (updates: Partial<PipelineStage>) => Promise<void>;
  enableAIScoring: boolean;
}

const DealCard: React.FC<DealCardProps> = ({ deal, scoring, onUpdate, isDragging }) => {
  const [{ opacity }, drag] = useDrag(() => ({
    type: 'deal',
    item: { id: deal.id, type: 'deal' },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1,
    }),
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return GOTUN_COLORS.success[500];
    if (score >= 60) return GOTUN_COLORS.warning[500];
    if (score >= 40) return GOTUN_COLORS.accent[500];
    return GOTUN_COLORS.error[500];
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getDistrictColor = (district: string) => {
    const districtColors = GOTUN_COLORS.warsaw;
    return districtColors[district as keyof typeof districtColors] || GOTUN_COLORS.neutral[400];
  };

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, boxShadow: GOTUN_SHADOWS.lg }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-4 cursor-move",
        "hover:border-primary-300 transition-all duration-200",
        "shadow-sm hover:shadow-md",
        isDragging && "rotate-2 shadow-xl"
      )}
      style={{ opacity }}
    >
      {/* Deal Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
            {deal.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2">
            {deal.description}
          </p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          {getPriorityIcon(deal.priority)}
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Deal Value */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">
            {new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0
            }).format(deal.value)}
          </span>
        </div>
        {scoring && (
          <div className="flex items-center space-x-1">
            <Brain className="w-3 h-3" style={{ color: getScoreColor(scoring.score) }} />
            <span 
              className="text-xs font-medium"
              style={{ color: getScoreColor(scoring.score) }}
            >
              {scoring.score}%
            </span>
          </div>
        )}
      </div>

      {/* Deal Metadata */}
      <div className="space-y-2">
        {/* Customer & Location */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span className="truncate">{deal.customerName}</span>
          </div>
          {deal.district && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span 
                className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: getDistrictColor(deal.district) }}
              >
                {deal.district}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(deal.expectedCloseDate).toLocaleDateString('pl-PL')}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{deal.daysInStage}d</span>
          </div>
        </div>

        {/* AI Insights */}
        {scoring && scoring.insights && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center space-x-1 mb-1">
              <Zap className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">AI Insight</span>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">
              {scoring.insights[0]?.message}
            </p>
          </div>
        )}

        {/* Equipment Tags */}
        {deal.equipmentTypes && deal.equipmentTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {deal.equipmentTypes.slice(0, 2).map((equipment) => (
              <span
                key={equipment}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {equipment}
              </span>
            ))}
            {deal.equipmentTypes.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                +{deal.equipmentTypes.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {scoring && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Win Probability</span>
            <span className="text-xs font-medium" style={{ color: getScoreColor(scoring.score) }}>
              {scoring.score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ backgroundColor: getScoreColor(scoring.score) }}
              initial={{ width: 0 }}
              animate={{ width: `${scoring.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  deals,
  onDealMove,
  onDealUpdate,
  onStageUpdate,
  enableAIScoring
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'deal',
    drop: (item: { id: string; type: string }) => {
      if (item.type === 'deal') {
        onDealMove(item.id, stage.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const stageDeals = deals.filter(deal => deal.stageId === stage.id);
  const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
  const averageScore = enableAIScoring 
    ? stageDeals.reduce((sum, deal) => sum + (deal.aiScore || 0), 0) / stageDeals.length || 0
    : 0;

  return (
    <div
      ref={drop}
      className={cn(
        "flex flex-col bg-gray-50 rounded-lg p-4 min-h-[600px] w-80",
        "border-2 border-dashed border-transparent transition-all duration-200",
        isOver && canDrop && "border-primary-300 bg-primary-50",
        isOver && !canDrop && "border-red-300 bg-red-50"
      )}
    >
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {stageDeals.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-gray-200 rounded">
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-200 rounded">
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stage Metrics */}
      <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Value</p>
            <p className="font-semibold text-sm text-gray-900">
              {new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'PLN',
                minimumFractionDigits: 0
              }).format(totalValue)}
            </p>
          </div>
          {enableAIScoring && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg. Score</p>
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-blue-600" />
                <p className="font-semibold text-sm text-blue-600">
                  {averageScore.toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Win Rate: {stage.probability}%</span>
            <span>Avg. Days: {stage.averageDaysInStage || 0}</span>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <AnimatePresence>
          {stageDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              scoring={deal.aiScoring}
              onUpdate={(updates) => onDealUpdate(deal.id, updates)}
            />
          ))}
        </AnimatePresence>
        
        {stageDeals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Target className="w-8 h-8 mb-2" />
            <p className="text-sm">No deals in this stage</p>
            <button className="mt-2 text-xs text-primary-600 hover:text-primary-700">
              Add Deal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdvancedPipelineBoard: React.FC<AdvancedPipelineBoardProps> = ({
  stages,
  deals,
  onDealMove,
  onDealUpdate,
  onStageUpdate,
  className,
  enableAIScoring = true,
  enableRealTimeUpdates = true,
  enableWarsawOptimization = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter deals based on search and filters
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           deal.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilters = selectedFilters.length === 0 || 
                            selectedFilters.some(filter => 
                              deal.equipmentTypes?.includes(filter) ||
                              deal.district === filter ||
                              deal.priority === filter
                            );
      
      return matchesSearch && matchesFilters;
    });
  }, [deals, searchTerm, selectedFilters]);

  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = filteredDeals.reduce((sum, deal) => {
      const stage = stages.find(s => s.id === deal.stageId);
      return sum + (deal.value * (stage?.probability || 0) / 100);
    }, 0);
    const averageScore = enableAIScoring 
      ? filteredDeals.reduce((sum, deal) => sum + (deal.aiScore || 0), 0) / filteredDeals.length || 0
      : 0;

    return {
      totalValue,
      weightedValue,
      averageScore,
      totalDeals: filteredDeals.length
    };
  }, [filteredDeals, stages, enableAIScoring]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("flex flex-col h-full bg-gray-50", className)}>
        {/* Pipeline Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
              <p className="text-gray-600 mt-1">
                AI-powered deal management with Warsaw optimization
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg",
                  "hover:bg-primary-700 transition-colors duration-200",
                  isRefreshing && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Pipeline Metrics */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Pipeline</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                      minimumFractionDigits: 0
                    }).format(pipelineMetrics.totalValue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Weighted Value</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                      minimumFractionDigits: 0
                    }).format(pipelineMetrics.weightedValue)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Deals</p>
                  <p className="text-2xl font-bold">{pipelineMetrics.totalDeals}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            {enableAIScoring && (
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">AI Score</p>
                    <p className="text-2xl font-bold">{pipelineMetrics.averageScore.toFixed(0)}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals, customers, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Pipeline Board */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex space-x-6 min-w-max">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={filteredDeals}
                onDealMove={onDealMove}
                onDealUpdate={onDealUpdate}
                onStageUpdate={(updates) => onStageUpdate(stage.id, updates)}
                enableAIScoring={enableAIScoring}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
