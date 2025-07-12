import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Route,
  Brain,
  TrendingUp,
  Thermometer,
  Navigation,
  Star,
  Info
} from 'lucide-react';


interface WarsawDistrict {
  value: string;
  label: string;
  affluence?: number;
}

interface WarsawSettings {
  districtFilter?: string;
  affluenceWeighting?: boolean;
  seasonalAdjustment?: boolean;
  routeOptimization?: boolean;
}

interface WarsawSettingsPanelProps {
  settings: WarsawSettings;
  onChange: (settings: WarsawSettings) => void;
}

export function WarsawSettingsPanel({ settings, onChange }: WarsawSettingsPanelProps) {
  const warsawDistricts: WarsawDistrict[] = [
    { value: '', label: 'All Districts' },
    { value: 'Śródmieście', label: 'Śródmieście', affluence: 1.5 },
    { value: 'Mokotów', label: 'Mokotów', affluence: 1.3 },
    { value: 'Żoliborz', label: 'Żoliborz', affluence: 1.2 },
    { value: 'Ochota', label: 'Ochota', affluence: 1.1 },
    { value: 'Wola', label: 'Wola', affluence: 1.0 },
    { value: 'Praga-Północ', label: 'Praga-Północ', affluence: 0.9 },
    { value: 'Praga-Południe', label: 'Praga-Południe', affluence: 0.8 },
    { value: 'Targówek', label: 'Targówek', affluence: 0.8 },
    { value: 'Bemowo', label: 'Bemowo', affluence: 0.9 },
    { value: 'Ursynów', label: 'Ursynów', affluence: 1.2 },
    { value: 'Wilanów', label: 'Wilanów', affluence: 1.4 },
    { value: 'Białołęka', label: 'Białołęka', affluence: 0.9 },
    { value: 'Bielany', label: 'Bielany', affluence: 1.0 },
    { value: 'Włochy', label: 'Włochy', affluence: 0.9 },
    { value: 'Ursus', label: 'Ursus', affluence: 0.8 },
    { value: 'Wawer', label: 'Wawer', affluence: 0.9 },
    { value: 'Wesola', label: 'Wesola', affluence: 0.8 },
    { value: 'Rembertów', label: 'Rembertów', affluence: 0.8 }
  ];

  const handleSettingChange = (field: string, value: any) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  const getAffluenceColor = (affluence: number) => {
    if (affluence >= 1.3) return 'text-green-600';
    if (affluence >= 1.1) return 'text-blue-600';
    if (affluence >= 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAffluenceLabel = (affluence: number) => {
    if (affluence >= 1.3) return 'High';
    if (affluence >= 1.1) return 'Above Average';
    if (affluence >= 0.9) return 'Average';
    return 'Below Average';
  };

  const selectedDistrict = warsawDistricts.find(d => d.value === settings.districtFilter);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Warsaw HVAC Intelligence
        </CardTitle>
        <p className="text-xs text-gray-600">
          Leverage Warsaw-specific data for enhanced insights
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* District Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            District Filter
          </label>
          <select
            value={settings.districtFilter || ''}
            onChange={(e) => handleSettingChange('districtFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {warsawDistricts.map(district => (
              <option key={district.value} value={district.value}>
                {district.label}
                {district.affluence && ` (${district.affluence}x)`}
              </option>
            ))}
          </select>
          
          {selectedDistrict && selectedDistrict.affluence && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Affluence Multiplier:</span>
                <span className={`font-medium ${getAffluenceColor(selectedDistrict.affluence)}`}>
                  {selectedDistrict.affluence}x ({getAffluenceLabel(selectedDistrict.affluence)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Affluence Weighting */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.affluenceWeighting || false}
              onChange={(e) => handleSettingChange('affluenceWeighting', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-green-600" />
              <span className="text-sm font-medium">Affluence Weighting</span>
            </div>
          </label>
          <p className="text-xs text-gray-600 ml-6 mt-1">
            Apply district-based affluence multipliers to financial metrics
          </p>
          
          {settings.affluenceWeighting && (
            <div className="ml-6 mt-2 p-2 bg-green-50 rounded-md">
              <div className="text-xs text-green-800">
                <div className="font-medium mb-1">Affluence Multipliers:</div>
                <div className="space-y-1">
                  <div>• Śródmieście: 1.5x (Premium pricing)</div>
                  <div>• Mokotów/Wilanów: 1.3-1.4x (High-end)</div>
                  <div>• Praga districts: 0.8-0.9x (Budget-friendly)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seasonal Adjustment */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.seasonalAdjustment || false}
              onChange={(e) => handleSettingChange('seasonalAdjustment', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-orange-600" />
              <span className="text-sm font-medium">Seasonal Adjustment</span>
            </div>
          </label>
          <p className="text-xs text-gray-600 ml-6 mt-1">
            Apply Warsaw climate-based seasonal factors to demand predictions
          </p>
          
          {settings.seasonalAdjustment && (
            <div className="ml-6 mt-2 p-2 bg-orange-50 rounded-md">
              <div className="text-xs text-orange-800">
                <div className="font-medium mb-1">Seasonal Factors:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>• Winter: 1.4x (Heating)</div>
                  <div>• Summer: 1.5x (AC peak)</div>
                  <div>• Spring: 0.9x (Mild)</div>
                  <div>• Autumn: 1.2x (Prep)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Route Optimization */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.routeOptimization || false}
              onChange={(e) => handleSettingChange('routeOptimization', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center">
              <Route className="w-4 h-4 mr-1 text-purple-600" />
              <span className="text-sm font-medium">Route Optimization</span>
            </div>
          </label>
          <p className="text-xs text-gray-600 ml-6 mt-1">
            Include route efficiency metrics and travel time analysis
          </p>
          
          {settings.routeOptimization && (
            <div className="ml-6 mt-2 p-2 bg-purple-50 rounded-md">
              <div className="text-xs text-purple-800">
                <div className="font-medium mb-1">Route Metrics:</div>
                <div className="space-y-1">
                  <div>• Average travel time between jobs</div>
                  <div>• District clustering efficiency</div>
                  <div>• Fuel cost optimization</div>
                  <div>• Traffic pattern analysis</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Prophecy Integration */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-1 text-purple-600" />
              <span className="text-sm font-medium">AI Prophecy Features</span>
            </div>
            <Button variant="outline" size="sm">
              <Info className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-2 text-purple-600" />
                <span className="text-xs font-medium">Demand Prediction</span>
              </div>
              <span className="text-xs text-purple-600">90% accuracy</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
              <div className="flex items-center">
                <Navigation className="w-3 h-3 mr-2 text-blue-600" />
                <span className="text-xs font-medium">Route Intelligence</span>
              </div>
              <span className="text-xs text-blue-600">20% efficiency</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-2 text-green-600" />
                <span className="text-xs font-medium">Customer Insights</span>
              </div>
              <span className="text-xs text-green-600">15% revenue</span>
            </div>
          </div>
        </div>

        {/* Performance Impact */}
        {(settings.affluenceWeighting || settings.seasonalAdjustment || settings.routeOptimization) && (
          <div className="pt-3 border-t border-gray-200">
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="flex items-center mb-2">
                <Thermometer className="w-4 h-4 mr-1 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Performance Impact</span>
              </div>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• Enhanced data processing: +50-100ms</div>
                <div>• Warsaw-specific calculations: +25ms</div>
                <div>• AI prophecy integration: +200ms</div>
                <div className="font-medium pt-1">
                  Total estimated impact: +275-325ms
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
