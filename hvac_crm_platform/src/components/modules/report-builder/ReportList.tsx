import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Share,
  Copy,
  Star,
  StarOff,
  Calendar,
  User,
  BarChart3,
  Table,
  PieChart,
  LineChart,
  Gauge,
  Activity,
  Eye,
  Download
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

interface ReportListProps {
  reports: any[];
  onEdit: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  onExecute: (reportId: string) => void;
}

export function ReportList({ reports, onEdit, onDelete, onExecute }: ReportListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'table': return Table;
      case 'bar_chart': return BarChart3;
      case 'line_chart': return LineChart;
      case 'pie_chart': return PieChart;
      case 'area_chart': return Activity;
      case 'gauge': return Gauge;
      default: return BarChart3;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dashboard': return 'bg-blue-100 text-blue-800';
      case 'table': return 'bg-gray-100 text-gray-800';
      case 'chart': return 'bg-green-100 text-green-800';
      case 'kpi': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports
    .filter(report => {
      const matchesSearch = searchQuery === '' || 
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || report.type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'updated':
          return (b._creationTime || 0) - (a._creationTime || 0);
        default:
          return 0;
      }
    });

  const ReportCard = ({ report }: { report: any }) => {
    const VisualizationIcon = getVisualizationIcon(report.config?.visualization?.type || 'table');
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <VisualizationIcon className="w-5 h-5 text-gray-600" />
              <div>
                <CardTitle className="text-sm font-medium">{report.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${getTypeColor(report.type)}`}>
                    {report.type}
                  </span>
                  {report.isTemplate && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                      Template
                    </span>
                  )}
                  {report.isFavorite && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  )}
                </div>
              </div>
            </div>
            <div className="relative">
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {report.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {report.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(report._creationTime)}
            </div>
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {report.createdBy}
            </div>
          </div>

          {/* Data Sources Preview */}
          {report.config?.dataSources && report.config.dataSources.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Data Sources:</div>
              <div className="flex flex-wrap gap-1">
                {report.config.dataSources.slice(0, 3).map((ds: any, index: number) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                  >
                    {ds.table || ds.type}
                  </span>
                ))}
                {report.config.dataSources.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    +{report.config.dataSources.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Warsaw Settings Indicator */}
          {report.config?.warsawSettings && (
            <div className="mb-3">
              <div className="flex items-center text-xs text-purple-600">
                <Activity className="w-3 h-3 mr-1" />
                Warsaw Intelligence Enabled
              </div>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExecute(report._id)}
              className="flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(report._id)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
            >
              <Share className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(report._id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ReportRow = ({ report }: { report: any }) => {
    const VisualizationIcon = getVisualizationIcon(report.config?.visualization?.type || 'table');
    
    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="p-3">
          <div className="flex items-center space-x-3">
            <VisualizationIcon className="w-4 h-4 text-gray-600" />
            <div>
              <div className="font-medium text-sm">{report.name}</div>
              <div className="text-xs text-gray-500">{report.description}</div>
            </div>
          </div>
        </td>
        <td className="p-3">
          <span className={`text-xs px-2 py-1 rounded ${getTypeColor(report.type)}`}>
            {report.type}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-600">
          {report.config?.dataSources?.length || 0} sources
        </td>
        <td className="p-3 text-xs text-gray-600">
          {formatDate(report._creationTime)}
        </td>
        <td className="p-3 text-xs text-gray-600">
          {report.lastExecuted ? formatDate(report.lastExecuted) : 'Never'}
        </td>
        <td className="p-3">
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={() => onExecute(report._id)}>
              <Play className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(report._id)}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(report._id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="dashboard">Dashboard</option>
            <option value="table">Table</option>
            <option value="chart">Chart</option>
            <option value="kpi">KPI</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="updated">Last Updated</option>
            <option value="name">Name</option>
            <option value="type">Type</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Reports Display */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first report to get started'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sources
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <ReportRow key={report._id} report={report} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
