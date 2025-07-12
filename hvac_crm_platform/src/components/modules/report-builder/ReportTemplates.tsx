import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  Copy, 
  Star, 
  Wrench,
  DollarSign,
  Users,
  Package,
  MapPin,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  Activity,
  Calendar,
  Filter,
  Zap
} from 'lucide-react';

interface ReportTemplatesProps {
  templates: any[];
  onUseTemplate: (templateId: string) => void;
}

export function ReportTemplates({ templates, onUseTemplate }: ReportTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templateCategories = [
    { value: 'all', label: 'All Templates', icon: BarChart3 },
    { value: 'hvac_performance', label: 'HVAC Performance', icon: Wrench },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'operational', label: 'Operational', icon: Activity },
    { value: 'customer', label: 'Customer', icon: Users },
    { value: 'equipment', label: 'Equipment', icon: Package },
    { value: 'district_analysis', label: 'District Analysis', icon: MapPin }
  ];

  // Predefined templates for demonstration
  const predefinedTemplates = [
    {
      _id: 'template_hvac_performance',
      name: 'HVAC System Performance Dashboard',
      description: 'Comprehensive overview of HVAC system efficiency, maintenance schedules, and performance metrics across Warsaw districts.',
      category: 'hvac_performance',
      type: 'dashboard',
      icon: Wrench,
      features: ['District-based analysis', 'Seasonal adjustments', 'Efficiency tracking', 'Maintenance alerts'],
      visualization: 'dashboard',
      dataSources: ['jobs', 'equipment', 'contacts'],
      warsawOptimized: true,
      difficulty: 'Beginner',
      estimatedTime: '5 min'
    },
    {
      _id: 'template_revenue_analysis',
      name: 'Revenue Analysis by District',
      description: 'Financial performance analysis with affluence weighting and seasonal factors for Warsaw HVAC market.',
      category: 'financial',
      type: 'chart',
      icon: DollarSign,
      features: ['Affluence weighting', 'Revenue forecasting', 'Profit margins', 'Payment tracking'],
      visualization: 'bar_chart',
      dataSources: ['quotes', 'jobs', 'contacts'],
      warsawOptimized: true,
      difficulty: 'Intermediate',
      estimatedTime: '8 min'
    },
    {
      _id: 'template_customer_insights',
      name: 'Customer Behavior & Satisfaction',
      description: 'Deep dive into customer patterns, satisfaction scores, and retention metrics with AI-powered insights.',
      category: 'customer',
      type: 'dashboard',
      icon: Users,
      features: ['Customer segmentation', 'Satisfaction tracking', 'Retention analysis', 'AI predictions'],
      visualization: 'dashboard',
      dataSources: ['contacts', 'jobs', 'weaviate'],
      warsawOptimized: true,
      difficulty: 'Advanced',
      estimatedTime: '12 min'
    },
    {
      _id: 'template_equipment_efficiency',
      name: 'Equipment Efficiency Tracker',
      description: 'Monitor equipment performance, maintenance costs, and replacement recommendations.',
      category: 'equipment',
      type: 'table',
      icon: Package,
      features: ['Performance metrics', 'Maintenance costs', 'Replacement alerts', 'ROI analysis'],
      visualization: 'table',
      dataSources: ['equipment', 'jobs'],
      warsawOptimized: false,
      difficulty: 'Beginner',
      estimatedTime: '4 min'
    },
    {
      _id: 'template_route_optimization',
      name: 'Route Optimization Analysis',
      description: 'Analyze technician routes, travel times, and efficiency across Warsaw districts.',
      category: 'operational',
      type: 'chart',
      icon: MapPin,
      features: ['Route efficiency', 'Travel time analysis', 'Fuel cost tracking', 'District clustering'],
      visualization: 'line_chart',
      dataSources: ['jobs', 'contacts'],
      warsawOptimized: true,
      difficulty: 'Intermediate',
      estimatedTime: '10 min'
    },
    {
      _id: 'template_seasonal_demand',
      name: 'Seasonal Demand Forecasting',
      description: 'Predict HVAC service demand based on Warsaw weather patterns and historical data.',
      category: 'hvac_performance',
      type: 'chart',
      icon: Calendar,
      features: ['Weather correlation', 'Demand prediction', 'Capacity planning', 'Seasonal pricing'],
      visualization: 'area_chart',
      dataSources: ['jobs', 'weaviate'],
      warsawOptimized: true,
      difficulty: 'Advanced',
      estimatedTime: '15 min'
    },
    {
      _id: 'template_kpi_overview',
      name: 'Executive KPI Dashboard',
      description: 'High-level KPIs for executives including revenue, efficiency, and growth metrics.',
      category: 'financial',
      type: 'kpi',
      icon: TrendingUp,
      features: ['Executive summary', 'Growth metrics', 'Efficiency KPIs', 'Trend analysis'],
      visualization: 'kpi_card',
      dataSources: ['jobs', 'quotes', 'contacts'],
      warsawOptimized: true,
      difficulty: 'Beginner',
      estimatedTime: '3 min'
    }
  ];

  const allTemplates = [...predefinedTemplates, ...templates];

  const filteredTemplates = allTemplates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return Activity;
      case 'bar_chart': return BarChart3;
      case 'line_chart': return LineChart;
      case 'pie_chart': return PieChart;
      case 'area_chart': return Activity;
      case 'gauge': return Gauge;
      case 'kpi_card': return TrendingUp;
      default: return BarChart3;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {templateCategories.map(category => {
          const CategoryIcon = category.icon;
          return (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors whitespace-nowrap ${
                selectedCategory === category.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <CategoryIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const TemplateIcon = template.icon || getVisualizationIcon(template.visualization);
          const VisualizationIcon = getVisualizationIcon(template.visualization);
          
          return (
            <Card key={template._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TemplateIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </span>
                        {template.warsawOptimized && (
                          <div className="flex items-center text-xs text-purple-600">
                            <Zap className="w-3 h-3 mr-1" />
                            Warsaw AI
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500 cursor-pointer" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {template.description}
                </p>

                {/* Features */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Key Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.features?.slice(0, 3).map((feature: string, index: number) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {template.features?.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                        +{template.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Sources */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Data Sources:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.dataSources?.map((source: string, index: number) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visualization Type */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center">
                    <VisualizationIcon className="w-3 h-3 mr-1" />
                    {template.visualization.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {template.estimatedTime}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    onClick={() => onUseTemplate(template._id)}
                    className="flex-1"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Copy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">
            Try selecting a different category or check back later for new templates.
          </p>
        </div>
      )}

      {/* Template Categories Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Warsaw HVAC Intelligence</h4>
              <p className="text-sm text-blue-800">
                Templates marked with "Warsaw AI" include district-specific optimizations, 
                affluence weighting, seasonal adjustments, and route optimization features 
                tailored for the Warsaw HVAC market.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
