import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  Database, 
  Table, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Users,
  Wrench,
  Package,
  FileText,
  MapPin,
  Brain,
  Cloud,
  HardDrive
} from 'lucide-react';

interface DataSourcePanelProps {
  dataSources: any[];
  onChange: (dataSources: any[]) => void;
}

interface DraggableFieldProps {
  table: string;
  field: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
}

function DraggableField({ table, field, type, icon: Icon }: DraggableFieldProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { type: 'field', table, field, dataType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`flex items-center space-x-2 p-2 rounded cursor-move transition-colors ${
        isDragging 
          ? 'opacity-50 bg-blue-100' 
          : 'hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium">{field}</span>
      <span className="text-xs text-gray-400 ml-auto">{type}</span>
    </div>
  );
}

export function DataSourcePanel({ dataSources, onChange }: DataSourcePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set(['convex']));
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const dataSourceTypes = [
    {
      id: 'convex',
      name: 'Convex Database',
      icon: Database,
      color: 'text-blue-600',
      tables: [
        {
          name: 'contacts',
          icon: Users,
          fields: [
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'phone', type: 'string' },
            { name: 'company', type: 'string' },
            { name: 'district', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'createdAt', type: 'date' },
            { name: 'lastContactDate', type: 'date' }
          ]
        },
        {
          name: 'jobs',
          icon: Wrench,
          fields: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'priority', type: 'string' },
            { name: 'scheduledDate', type: 'date' },
            { name: 'estimatedHours', type: 'number' },
            { name: 'actualHours', type: 'number' },
            { name: 'totalCost', type: 'number' }
          ]
        },
        {
          name: 'equipment',
          icon: Package,
          fields: [
            { name: 'name', type: 'string' },
            { name: 'brand', type: 'string' },
            { name: 'model', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'minStock', type: 'number' },
            { name: 'purchasePrice', type: 'number' },
            { name: 'sellPrice', type: 'number' }
          ]
        },
        {
          name: 'quotes',
          icon: FileText,
          fields: [
            { name: 'quoteNumber', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'subtotal', type: 'number' },
            { name: 'totalTax', type: 'number' },
            { name: 'totalAmount', type: 'number' },
            { name: 'validUntil', type: 'date' }
          ]
        }
      ]
    },
    {
      id: 'supabase',
      name: 'Supabase Analytics',
      icon: Cloud,
      color: 'text-green-600',
      tables: [
        {
          name: 'file_analytics',
          icon: FileText,
          fields: [
            { name: 'file_name', type: 'string' },
            { name: 'file_size', type: 'number' },
            { name: 'download_count', type: 'number' },
            { name: 'upload_date', type: 'date' }
          ]
        },
        {
          name: 'user_sessions',
          icon: Users,
          fields: [
            { name: 'session_id', type: 'string' },
            { name: 'user_id', type: 'string' },
            { name: 'duration', type: 'number' },
            { name: 'page_views', type: 'number' }
          ]
        }
      ]
    },
    {
      id: 'weaviate',
      name: 'Weaviate Vector DB',
      icon: Brain,
      color: 'text-purple-600',
      tables: [
        {
          name: 'service_predictions',
          icon: Brain,
          fields: [
            { name: 'district', type: 'string' },
            { name: 'service_type', type: 'string' },
            { name: 'confidence', type: 'number' },
            { name: 'predicted_demand', type: 'number' },
            { name: 'seasonal_factor', type: 'number' }
          ]
        },
        {
          name: 'customer_insights',
          icon: Users,
          fields: [
            { name: 'customer_segment', type: 'string' },
            { name: 'affluence_score', type: 'number' },
            { name: 'lifetime_value', type: 'number' },
            { name: 'churn_probability', type: 'number' }
          ]
        }
      ]
    }
  ];

  const toggleSource = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const toggleTable = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  const filteredSources = dataSourceTypes.map(source => ({
    ...source,
    tables: source.tables.map(table => ({
      ...table,
      fields: table.fields.filter(field =>
        searchQuery === '' ||
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(table => table.fields.length > 0)
  })).filter(source => source.tables.length > 0);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Data Sources
        </CardTitle>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {filteredSources.map(source => {
            const isExpanded = expandedSources.has(source.id);
            const SourceIcon = source.icon;
            
            return (
              <div key={source.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleSource(source.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <SourceIcon className={`w-4 h-4 ${source.color}`} />
                    <span className="font-medium text-sm">{source.name}</span>
                    <span className="text-xs text-gray-500">
                      ({source.tables.length} tables)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="pl-4 pb-2">
                    {source.tables.map(table => {
                      const tableId = `${source.id}.${table.name}`;
                      const isTableExpanded = expandedTables.has(tableId);
                      const TableIcon = table.icon;
                      
                      return (
                        <div key={table.name} className="mb-2">
                          <button
                            onClick={() => toggleTable(tableId)}
                            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <TableIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-sm">{table.name}</span>
                              <span className="text-xs text-gray-400">
                                ({table.fields.length} fields)
                              </span>
                            </div>
                            {isTableExpanded ? (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                          
                          {isTableExpanded && (
                            <div className="pl-6 space-y-1">
                              {table.fields.map(field => (
                                <DraggableField
                                  key={field.name}
                                  table={table.name}
                                  field={field.name}
                                  type={field.type}
                                  icon={TableIcon}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
