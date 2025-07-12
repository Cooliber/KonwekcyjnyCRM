/**
 * @fileoverview Warsaw District Analytics Map Component
 * @description Interactive map with district-specific HVAC analytics and AI prophecy insights
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Circle } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  Brain,
  Target,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Filter,
  Search,
  Download,
  RefreshCw,
  Maximize2,
  BarChart3,
  PieChart,
  Activity,
  X
} from 'lucide-react';
import { cn } from '../../../utils';
import { GOTUN_COLORS, GOTUN_WARSAW } from '../../constants';
import type { WarsawDistrict, DistrictAnalytics, HVACDemandData, ProphecyInsight } from '../../../types';

interface WarsawDistrictMapProps {
  districtData: Record<WarsawDistrict, DistrictAnalytics>;
  demandData: HVACDemandData[];
  prophecyInsights: ProphecyInsight[];
  onDistrictSelect: (district: WarsawDistrict) => void;
  selectedDistrict?: WarsawDistrict;
  className?: string;
  enableHeatmap?: boolean;
  enableProphecy?: boolean;
  enableRealTime?: boolean;
}

interface DistrictInfoPanelProps {
  district: WarsawDistrict;
  analytics: DistrictAnalytics;
  insights: ProphecyInsight[];
  onClose: () => void;
}

interface HeatmapLegendProps {
  metric: 'affluence' | 'demand' | 'competition' | 'opportunity';
  values: number[];
}

const DistrictInfoPanel: React.FC<DistrictInfoPanelProps> = ({
  district,
  analytics,
  insights,
  onClose
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return GOTUN_COLORS.success[500];
    if (score >= 60) return GOTUN_COLORS.warning[500];
    if (score >= 40) return GOTUN_COLORS.accent[500];
    return GOTUN_COLORS.error[500];
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[1000] max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      {/* Panel Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{district}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: GOTUN_COLORS.warsaw[district as keyof typeof GOTUN_COLORS.warsaw] }}
          />
          <span className="text-sm text-gray-600">Warsaw District</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {analytics.affluenceChange > 0 ? '+' : ''}{analytics.affluenceChange}%
              </span>
            </div>
            <p className="text-sm text-blue-600 mb-1">Affluence Score</p>
            <p className="text-2xl font-bold text-blue-900">{analytics.affluenceScore}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {analytics.demandChange > 0 ? '+' : ''}{analytics.demandChange}%
              </span>
            </div>
            <p className="text-sm text-green-600 mb-1">HVAC Demand</p>
            <p className="text-2xl font-bold text-green-900">{analytics.demandIndex.toFixed(1)}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">
                {analytics.competitionChange > 0 ? '+' : ''}{analytics.competitionChange}%
              </span>
            </div>
            <p className="text-sm text-purple-600 mb-1">Competition</p>
            <p className="text-2xl font-bold text-purple-900">{analytics.competitionDensity.toFixed(1)}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">
                {analytics.opportunityChange > 0 ? '+' : ''}{analytics.opportunityChange}%
              </span>
            </div>
            <p className="text-sm text-orange-600 mb-1">Opportunity</p>
            <p className="text-2xl font-bold text-orange-900">{analytics.opportunityScore}</p>
          </div>
        </div>
      </div>

      {/* Seasonal Demand */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Demand</h3>
        <div className="space-y-3">
          {analytics.seasonalDemand.map((season) => (
            <div key={season.season} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  {season.season === 'spring' && <Wind className="w-4 h-4 text-green-600" />}
                  {season.season === 'summer' && <Thermometer className="w-4 h-4 text-red-600" />}
                  {season.season === 'autumn' && <Wind className="w-4 h-4 text-orange-600" />}
                  {season.season === 'winter' && <Droplets className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {season.season}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${season.multiplier * 50}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {season.multiplier.toFixed(1)}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Prophecy Insights */}
      {insights.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Prophecy</h3>
          </div>
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border-l-4",
                  insight.type === 'opportunity' && "bg-green-50 border-green-400",
                  insight.type === 'warning' && "bg-yellow-50 border-yellow-400",
                  insight.type === 'prediction' && "bg-blue-50 border-blue-400"
                )}
              >
                <div className="flex items-start space-x-2">
                  {insight.type === 'opportunity' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                  {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                  {insight.type === 'prediction' && <Info className="w-4 h-4 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {insight.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Confidence: {insight.confidence}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(insight.timestamp).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Distribution */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Distribution</h3>
        <div className="space-y-2">
          {analytics.equipmentDistribution.map((equipment) => (
            <div key={equipment.type} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">
                {equipment.type.replace('_', ' ')}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${equipment.percentage}%`,
                      backgroundColor: GOTUN_COLORS.hvac[equipment.type as keyof typeof GOTUN_COLORS.hvac]
                    }}
                  />
                </div>
                <span className="text-sm text-gray-900 w-8">
                  {equipment.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const HeatmapLegend: React.FC<HeatmapLegendProps> = ({ metric, values }) => {
  const getMetricInfo = () => {
    switch (metric) {
      case 'affluence':
        return { label: 'Affluence Score', color: GOTUN_COLORS.primary[500] };
      case 'demand':
        return { label: 'HVAC Demand', color: GOTUN_COLORS.success[500] };
      case 'competition':
        return { label: 'Competition Density', color: GOTUN_COLORS.warning[500] };
      case 'opportunity':
        return { label: 'Opportunity Score', color: GOTUN_COLORS.accent[500] };
      default:
        return { label: 'Unknown', color: GOTUN_COLORS.neutral[500] };
    }
  };

  const { label, color } = getMetricInfo();
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[1000]">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{label}</h4>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">{min}</span>
        <div className="w-20 h-3 rounded-full bg-gradient-to-r from-gray-200" style={{ 
          background: `linear-gradient(to right, ${color}20, ${color})`
        }} />
        <span className="text-xs text-gray-600">{max}</span>
      </div>
    </div>
  );
};

export const WarsawDistrictMap: React.FC<WarsawDistrictMapProps> = ({
  districtData,
  demandData,
  prophecyInsights,
  onDistrictSelect,
  selectedDistrict,
  className,
  enableHeatmap = true,
  enableProphecy = true,
  enableRealTime = true
}) => {
  const [mapMode, setMapMode] = useState<'affluence' | 'demand' | 'competition' | 'opportunity'>('affluence');
  const [showHeatmap, setShowHeatmap] = useState(enableHeatmap);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Warsaw center coordinates
  const warsawCenter: [number, number] = [GOTUN_WARSAW.center.lat, GOTUN_WARSAW.center.lng];

  // Get district color based on selected metric
  const getDistrictColor = useCallback((district: WarsawDistrict) => {
    const analytics = districtData[district];
    if (!analytics) return GOTUN_COLORS.neutral[300];

    let value: number;
    switch (mapMode) {
      case 'affluence':
        value = analytics.affluenceScore;
        break;
      case 'demand':
        value = analytics.demandIndex;
        break;
      case 'competition':
        value = analytics.competitionDensity;
        break;
      case 'opportunity':
        value = analytics.opportunityScore;
        break;
      default:
        value = 50;
    }

    // Normalize value to 0-1 range and apply color
    const normalized = Math.min(Math.max(value / 100, 0), 1);
    const baseColor = mapMode === 'affluence' ? GOTUN_COLORS.primary[500] :
                     mapMode === 'demand' ? GOTUN_COLORS.success[500] :
                     mapMode === 'competition' ? GOTUN_COLORS.warning[500] :
                     GOTUN_COLORS.accent[500];
    
    return `${baseColor}${Math.floor(normalized * 255).toString(16).padStart(2, '0')}`;
  }, [districtData, mapMode]);

  // Filter districts based on search
  const filteredDistricts = useMemo(() => {
    return GOTUN_WARSAW.districts.filter(district =>
      district.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Get metric values for legend
  const metricValues = useMemo(() => {
    return Object.values(districtData).map(analytics => {
      switch (mapMode) {
        case 'affluence': return analytics.affluenceScore;
        case 'demand': return analytics.demandIndex;
        case 'competition': return analytics.competitionDensity;
        case 'opportunity': return analytics.opportunityScore;
        default: return 0;
      }
    });
  }, [districtData, mapMode]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleDistrictClick = useCallback((district: WarsawDistrict) => {
    onDistrictSelect(district);
  }, [onDistrictSelect]);

  return (
    <div className={cn("relative h-full bg-gray-50 rounded-lg overflow-hidden", className)}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search districts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Map Mode Selector */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Map Mode</h4>
          <div className="space-y-1">
            {[
              { key: 'affluence', label: 'Affluence', icon: DollarSign },
              { key: 'demand', label: 'HVAC Demand', icon: Target },
              { key: 'competition', label: 'Competition', icon: Users },
              { key: 'opportunity', label: 'Opportunity', icon: Zap }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMapMode(key as any)}
                className={cn(
                  "w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  mapMode === key
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors",
                showHeatmap
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        center={warsawCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* District Markers */}
        {filteredDistricts.map((district) => {
          const analytics = districtData[district];
          if (!analytics) return null;

          return (
            <Circle
              key={district}
              center={[analytics.coordinates.lat, analytics.coordinates.lng]}
              radius={analytics.demandIndex * 500}
              fillColor={getDistrictColor(district)}
              fillOpacity={showHeatmap ? 0.6 : 0.3}
              stroke={selectedDistrict === district}
              color={selectedDistrict === district ? GOTUN_COLORS.primary[700] : 'transparent'}
              weight={3}
              eventHandlers={{
                click: () => handleDistrictClick(district)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 mb-2">{district}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Affluence:</span>
                      <span className="font-medium">{analytics.affluenceScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demand:</span>
                      <span className="font-medium">{analytics.demandIndex.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Competition:</span>
                      <span className="font-medium">{analytics.competitionDensity.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {/* Heatmap Legend */}
      {showHeatmap && (
        <HeatmapLegend metric={mapMode} values={metricValues} />
      )}

      {/* District Info Panel */}
      <AnimatePresence>
        {selectedDistrict && districtData[selectedDistrict] && (
          <DistrictInfoPanel
            district={selectedDistrict}
            analytics={districtData[selectedDistrict]}
            insights={prophecyInsights.filter(insight => insight.district === selectedDistrict)}
            onClose={() => onDistrictSelect(undefined as any)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
