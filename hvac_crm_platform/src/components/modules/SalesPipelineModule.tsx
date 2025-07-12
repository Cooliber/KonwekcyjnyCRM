import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users, 
  Calendar,
  Plus,
  Filter,
  BarChart3,
  PieChart,
  ArrowRight,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, getStatusColor, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  notes?: string;
  createdAt: number;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  order: number;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'lead', name: 'Lead', color: '#6b7280', probability: 10, order: 1 },
  { id: 'qualified', name: 'Qualified', color: '#3b82f6', probability: 25, order: 2 },
  { id: 'proposal', name: 'Proposal', color: '#f59e0b', probability: 50, order: 3 },
  { id: 'negotiation', name: 'Negotiation', color: '#8b5cf6', probability: 75, order: 4 },
  { id: 'closed_won', name: 'Closed Won', color: '#10b981', probability: 100, order: 5 },
  { id: 'closed_lost', name: 'Closed Lost', color: '#ef4444', probability: 0, order: 6 },
];

export function SalesPipelineModule() {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'forecast'>('kanban');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Mock data - replace with actual Convex queries
  const deals = useQuery(api.quotes.list, {}) || [];
  const contacts = useQuery(api.contacts.list, {}) || [];

  // Transform quotes to deals format
  const transformedDeals: Deal[] = deals.map(quote => ({
    _id: quote._id,
    title: quote.title,
    value: quote.totalAmount || 0,
    stage: quote.status === 'accepted' ? 'closed_won' : 
           quote.status === 'rejected' ? 'closed_lost' :
           quote.status === 'sent' ? 'proposal' : 'lead',
    probability: quote.status === 'accepted' ? 100 : 
                quote.status === 'rejected' ? 0 : 50,
    contactId: quote.contactId,
    expectedCloseDate: quote.validUntil,
    priority: 'medium' as const,
    source: 'website',
    createdAt: quote._creationTime,
  }));

  // Pipeline analytics
  const pipelineStats = React.useMemo(() => {
    const totalValue = transformedDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = transformedDeals.reduce((sum, deal) => 
      sum + (deal.value * deal.probability / 100), 0);
    const avgDealSize = totalValue / transformedDeals.length || 0;
    const conversionRate = transformedDeals.filter(d => d.stage === 'closed_won').length / 
                          transformedDeals.length * 100 || 0;

    return {
      totalValue,
      weightedValue,
      avgDealSize,
      conversionRate,
      totalDeals: transformedDeals.length,
      wonDeals: transformedDeals.filter(d => d.stage === 'closed_won').length,
    };
  }, [transformedDeals]);

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {DEFAULT_STAGES.map(stage => {
        const stageDeals = transformedDeals.filter(deal => deal.stage === stage.id);
        const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

        return (
          <Card key={stage.id} className="min-h-[500px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: stage.color }}>
                  {stage.name}
                </CardTitle>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {stageDeals.length}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {formatCurrency(stageValue)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stageDeals.map(deal => (
                <div
                  key={deal._id}
                  className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{deal.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(deal.priority)}`}>
                      {deal.priority}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-green-600 mb-2">
                    {formatCurrency(deal.value)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{deal.probability}% probability</span>
                    {deal.expectedCloseDate && (
                      <span>{formatDate(deal.expectedCloseDate)}</span>
                    )}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{ 
                        width: `${deal.probability}%`,
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
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
            {DEFAULT_STAGES.filter(s => s.id !== 'closed_lost').map(stage => {
              const stageDeals = transformedDeals.filter(deal => deal.stage === stage.id);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Manage deals and forecast revenue</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['kanban', 'forecast'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'kanban' ? 'Pipeline' : 'Forecast'}
              </button>
            ))}
          </div>
          <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Deal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Deal</DialogTitle>
              </DialogHeader>
              <div className="text-center py-8 text-gray-500">
                Deal creation form coming soon...
              </div>
            </DialogContent>
          </Dialog>
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
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              {pipelineStats.wonDeals} won this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipelineStats.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' && renderKanbanView()}
      {viewMode === 'forecast' && renderForecastView()}
    </div>
  );
}
