import { Calendar, Filter, Hash, Plus, ToggleLeft, Trash2, Type } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface FilterPanelProps {
  filters: any[];
  onChange: (filters: any[]) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [_showAddFilter, setShowAddFilter] = useState(false);

  const filterOperators = [
    { value: "equals", label: "Equals", types: ["string", "number", "date"] },
    { value: "not_equals", label: "Not Equals", types: ["string", "number", "date"] },
    { value: "greater_than", label: "Greater Than", types: ["number", "date"] },
    { value: "less_than", label: "Less Than", types: ["number", "date"] },
    { value: "contains", label: "Contains", types: ["string"] },
    { value: "starts_with", label: "Starts With", types: ["string"] },
    { value: "in", label: "In List", types: ["string", "number"] },
    { value: "between", label: "Between", types: ["number", "date"] },
  ];

  const logicalOperators = [
    { value: "AND", label: "AND" },
    { value: "OR", label: "OR" },
  ];

  const addFilter = () => {
    const newFilter = {
      id: `filter_${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
      logicalOperator: "AND",
    };
    onChange([...filters, newFilter]);
    setShowAddFilter(false);
  };

  const updateFilter = (index: number, updates: any) => {
    const updatedFilters = filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    );
    onChange(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    onChange(updatedFilters);
  };

  const _getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case "string":
        return Type;
      case "number":
        return Hash;
      case "date":
        return Calendar;
      case "boolean":
        return ToggleLeft;
      default:
        return Type;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters ({filters.length})
          </div>
          <Button variant="outline" size="sm" onClick={addFilter}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filters.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No filters applied</p>
            <p className="text-xs text-gray-400">Add filters to refine your data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <div key={filter.id || index} className="border border-gray-200 rounded-lg p-3">
                {/* Logical Operator (except for first filter) */}
                {index > 0 && (
                  <div className="mb-2">
                    <select
                      value={filter.logicalOperator || "AND"}
                      onChange={(e) => updateFilter(index, { logicalOperator: e.target.value })}
                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50"
                    >
                      {logicalOperators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Field Name */}
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Field</label>
                  <input
                    type="text"
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    placeholder="e.g., district, status, amount"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Operator */}
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Operator</label>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    {filterOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Value</label>
                  {filter.operator === "in" ? (
                    <textarea
                      value={Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
                      onChange={(e) =>
                        updateFilter(index, {
                          value: e.target.value.split(",").map((v) => v.trim()),
                        })
                      }
                      placeholder="value1, value2, value3"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  ) : filter.operator === "between" ? (
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={Array.isArray(filter.value) ? filter.value[0] || "" : ""}
                        onChange={(e) =>
                          updateFilter(index, {
                            value: [
                              e.target.value,
                              (Array.isArray(filter.value) ? filter.value[1] : "") || "",
                            ],
                          })
                        }
                        placeholder="Min"
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={Array.isArray(filter.value) ? filter.value[1] || "" : ""}
                        onChange={(e) =>
                          updateFilter(index, {
                            value: [
                              (Array.isArray(filter.value) ? filter.value[0] : "") || "",
                              e.target.value,
                            ],
                          })
                        }
                        placeholder="Max"
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="Enter value"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-1">
                  <Button variant="outline" size="sm" onClick={() => removeFilter(index)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Filter Presets */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Quick Filters</div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const quickFilter = {
                  id: `filter_${Date.now()}`,
                  field: "district",
                  operator: "equals",
                  value: "Śródmieście",
                  logicalOperator: "AND",
                };
                onChange([...filters, quickFilter]);
              }}
              className="text-xs"
            >
              Śródmieście
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const quickFilter = {
                  id: `filter_${Date.now()}`,
                  field: "status",
                  operator: "equals",
                  value: "completed",
                  logicalOperator: "AND",
                };
                onChange([...filters, quickFilter]);
              }}
              className="text-xs"
            >
              Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const quickFilter = {
                  id: `filter_${Date.now()}`,
                  field: "type",
                  operator: "equals",
                  value: "installation",
                  logicalOperator: "AND",
                };
                onChange([...filters, quickFilter]);
              }}
              className="text-xs"
            >
              Installation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const quickFilter = {
                  id: `filter_${Date.now()}`,
                  field: "priority",
                  operator: "equals",
                  value: "urgent",
                  logicalOperator: "AND",
                };
                onChange([...filters, quickFilter]);
              }}
              className="text-xs"
            >
              Urgent
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        {filters.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">Filter Summary</div>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              {filters.map((filter, index) => (
                <span key={index}>
                  {index > 0 && ` ${filter.logicalOperator} `}
                  <span className="font-medium">{filter.field}</span>{" "}
                  <span className="text-gray-500">{filter.operator}</span>{" "}
                  <span className="font-medium">
                    {Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
