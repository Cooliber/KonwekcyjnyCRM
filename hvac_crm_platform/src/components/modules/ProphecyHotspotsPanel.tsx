import { useAction } from "convex/react";
import {
  AlertTriangle,
  Brain,
  DollarSign,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

interface HotspotPrediction {
  district: string;
  coordinates: { lat: number; lng: number };
  predictedDemand: number;
  serviceTypes: string[];
  seasonalFactor: number;
  affluenceFactor: number;
  confidence: number;
  reasoning: string[];
}

interface ProphecyHotspotsPanelProps {
  onHotspotsGenerated: (hotspots: HotspotPrediction[]) => void;
  selectedDistrict?: string;
}

export function ProphecyHotspotsPanel({
  onHotspotsGenerated,
  selectedDistrict,
}: ProphecyHotspotsPanelProps) {
  const [hotspots, setHotspots] = useState<HotspotPrediction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "season">("month");
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter">("summer");
  const [metadata, setMetadata] = useState<any>(null);

  const predictHotspots = useAction(api.ai.predictServiceHotspots);

  const handleGenerateHotspots = async () => {
    setIsGenerating(true);
    try {
      const result = await predictHotspots({
        timeframe,
        season,
        district: selectedDistrict,
      });

      setHotspots(result.hotspots);
      setMetadata(result.metadata);
      onHotspotsGenerated(result.hotspots);

      toast.success(`🔮 Prophecy complete! Found ${result.hotspots.length} service hotspots`);
    } catch (error) {
      console.error("Hotspot prediction failed:", error);
      toast.error("Failed to generate prophecy predictions");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate hotspots on component mount
  useEffect(() => {
    handleGenerateHotspots();
  }, [handleGenerateHotspots]);

  const getDemandColor = (demand: number) => {
    if (demand >= 0.8) return "text-red-600 bg-red-100";
    if (demand >= 0.6) return "text-orange-600 bg-orange-100";
    if (demand >= 0.4) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getDemandLabel = (demand: number) => {
    if (demand >= 0.8) return "Very High";
    if (demand >= 0.6) return "High";
    if (demand >= 0.4) return "Medium";
    return "Low";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Prophecy of Data</h3>
            <p className="text-sm text-gray-600">AI-powered service hotspot predictions</p>
          </div>
        </div>

        <button
          onClick={handleGenerateHotspots}
          disabled={isGenerating}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${
              isGenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }
          `}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Prophecy...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Refresh Prophecy</span>
            </>
          )}
        </button>
      </div>

      {/* Prediction Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prediction Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="week">Next Week</option>
            <option value="month">Next Month</option>
            <option value="season">Next Season</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season Context</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="autumn">Autumn</option>
            <option value="winter">Winter</option>
          </select>
        </div>
      </div>

      {/* Metadata Summary */}
      {metadata && (
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-purple-600 font-medium">Data Points</p>
              <p className="text-purple-900 font-semibold">{metadata.totalDataPoints}</p>
            </div>
            <div>
              <p className="text-purple-600 font-medium">Confidence</p>
              <p className={`font-semibold ${getConfidenceColor(metadata.confidence)}`}>
                {Math.round(metadata.confidence * 100)}%
              </p>
            </div>
            <div>
              <p className="text-purple-600 font-medium">Season</p>
              <p className="text-purple-900 font-semibold capitalize">{metadata.season}</p>
            </div>
            <div>
              <p className="text-purple-600 font-medium">Timeframe</p>
              <p className="text-purple-900 font-semibold capitalize">
                {metadata.analysisTimeframe}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hotspot Predictions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
          <Target className="w-4 h-4 text-purple-600" />
          <span>Predicted Service Hotspots</span>
        </h4>

        {hotspots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No hotspot predictions available</p>
            <p className="text-sm">Generate prophecy to see AI predictions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hotspots.map((hotspot, _index) => (
              <div key={hotspot.district} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <h5 className="font-medium text-gray-900">{hotspot.district}</h5>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(hotspot.predictedDemand)}`}
                    >
                      {getDemandLabel(hotspot.predictedDemand)} Demand
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(hotspot.predictedDemand * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(hotspot.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Seasonal:</span>
                    <span className="font-medium">{Math.round(hotspot.seasonalFactor * 100)}%</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Affluence:</span>
                    <span className="font-medium">
                      {Math.round(hotspot.affluenceFactor * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-600">Services:</span>
                    <span className="font-medium">
                      {hotspot.serviceTypes.slice(0, 2).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">AI Reasoning:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {hotspot.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start space-x-1">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Recommendations */}
      {hotspots.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900 mb-1">Recommended Actions</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pre-position technicians in high-demand districts</li>
                <li>• Stock equipment for predicted service types</li>
                <li>• Prepare targeted marketing for affluent areas</li>
                <li>• Schedule preventive maintenance in hotspot zones</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
