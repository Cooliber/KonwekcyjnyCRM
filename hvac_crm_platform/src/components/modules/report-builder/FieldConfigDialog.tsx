import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { 
  X, 
  Database, 
  Filter, 
  Settings,
  Plus,
  Trash2,
  Type,
  Hash,
  Calendar,
  ToggleLeft
} from 'lucide-react';

interface FieldConfigDialogProps {
  field: any;
  onSave: (updates: any) => void;
  onClose: () => void;
}

export function FieldConfigDialog({ field, onSave, onClose }: FieldConfigDialogProps) {
  const [config, setConfig] = useState({
    table: field.table || '',
    field: field.field || '',
    alias: field.alias || '',
    dataType: field.dataType || 'string',
    filters: field.filters || [],
    aggregation: field.aggregation || '',
    sortOrder: field.sortOrder || '',
    ...field
  });

  const dataTypes = [
    { value: 'string', label: 'Text', icon: Type },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'boolean', label: 'Boolean', icon: ToggleLeft }
  ];

  const aggregationTypes = [
    { value: '', label: 'None' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'distinct', label: 'Distinct Count' }
  ];

  const sortOptions = [
    { value: '', label: 'No sorting' },
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ];

  const handleSave = () => {
    onSave(config);
  };

  const addFilter = () => {
    const newFilter = {
      operator: 'equals',
      value: '',
      logicalOperator: 'AND'
    };
    setConfig({
      ...config,
      filters: [...config.filters, newFilter]
    });
  };

  const updateFilter = (index: number, updates: any) => {
    const updatedFilters = config.filters.map((filter: any, i: number) => 
      i === index ? { ...filter, ...updates } : filter
    );
    setConfig({ ...config, filters: updatedFilters });
  };

  const removeFilter = (index: number) => {
    const updatedFilters = config.filters.filter((_: any, i: number) => i !== index);
    setConfig({ ...config, filters: updatedFilters });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configure Field</h2>
            <p className="text-sm text-gray-600">Customize field settings and filters</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Basic Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Table
              </label>
              <input
                type="text"
                value={config.table}
                onChange={(e) => setConfig({ ...config, table: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Field
              </label>
              <input
                type="text"
                value={config.field}
                onChange={(e) => setConfig({ ...config, field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Display Name (Alias)
            </label>
            <input
              type="text"
              value={config.alias}
              onChange={(e) => setConfig({ ...config, alias: e.target.value })}
              placeholder="Optional display name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Data Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Data Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dataTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setConfig({ ...config, dataType: value })}
                  className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${
                    config.dataType === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aggregation and Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Aggregation
              </label>
              <select
                value={config.aggregation}
                onChange={(e) => setConfig({ ...config, aggregation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {aggregationTypes.map(agg => (
                  <option key={agg.value} value={agg.value}>
                    {agg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Sort Order
              </label>
              <select
                value={config.sortOrder}
                onChange={(e) => setConfig({ ...config, sortOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(sort => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Field Filters
              </label>
              <Button variant="outline" size="sm" onClick={addFilter}>
                <Plus className="w-3 h-3 mr-1" />
                Add Filter
              </Button>
            </div>
            
            {config.filters.length === 0 ? (
              <div className="text-center text-gray-500 py-4 border border-gray-200 rounded-md">
                <Filter className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No filters applied</p>
              </div>
            ) : (
              <div className="space-y-2">
                {config.filters.map((filter: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, { operator: e.target.value })}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="contains">Contains</option>
                        <option value="starts_with">Starts With</option>
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Value"
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFilter(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {index < config.filters.length - 1 && (
                      <select
                        value={filter.logicalOperator || 'AND'}
                        onChange={(e) => updateFilter(index, { logicalOperator: e.target.value })}
                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Settings className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
