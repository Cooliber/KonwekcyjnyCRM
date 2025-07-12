import {
  BarChart3,
  Database,
  Edit3,
  Gauge,
  GripVertical,
  LineChart,
  PieChart,
  Play,
  Plus,
  Settings,
  Table,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import type {
  CalculatedField,
  DataSource,
  ReportDesignerProps,
  VisualizationType,
} from "../../../types/report-builder";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { FieldConfigDialog } from "./FieldConfigDialog";

export function ReportDesigner({ config, onChange, onExecute }: ReportDesignerProps) {
  const [selectedField, setSelectedField] = useState<any>(null);
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  const [{ isOver }, drop] = useDrop({
    accept: ["field", "visualization"],
    drop: (item: any, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;

      handleDropItem(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleDropItem = useCallback(
    (item: any) => {
      if (item.type === "field") {
        // Add field to data sources or calculated fields
        const newDataSource: DataSource = {
          id: `field_${Date.now()}`,
          type: "convex" as const,
          table: item.table,
          field: item.field,
          filters: [],
        };

        onChange({
          ...config,
          config: {
            ...config.config,
            dataSources: [...config.config.dataSources, newDataSource],
          },
        });
      } else if (item.type === "visualization") {
        // Update visualization type
        onChange({
          ...config,
          config: {
            ...config.config,
            visualization: {
              ...config.config.visualization,
              type: item.visualizationType as VisualizationType["type"],
            },
          },
        });
      }
    },
    [config, onChange]
  );

  const handleFieldClick = useCallback((field: any) => {
    setSelectedField(field);
    setShowFieldConfig(true);
  }, []);

  const handleRemoveField = useCallback(
    (fieldId: string) => {
      onChange({
        ...config,
        config: {
          ...config.config,
          dataSources: config.config.dataSources.filter((ds: any) => ds.id !== fieldId),
        },
      });
    },
    [config, onChange]
  );

  const handleUpdateField = useCallback(
    (fieldId: string, updates: any) => {
      onChange({
        ...config,
        config: {
          ...config.config,
          dataSources: config.config.dataSources.map((ds: any) =>
            ds.id === fieldId ? { ...ds, ...updates } : ds
          ),
        },
      });
    },
    [config, onChange]
  );

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case "table":
        return Table;
      case "bar_chart":
        return BarChart3;
      case "line_chart":
        return LineChart;
      case "pie_chart":
        return PieChart;
      case "gauge":
        return Gauge;
      default:
        return BarChart3;
    }
  };

  const VisualizationIcon = getVisualizationIcon(config.config.visualization.type);

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <input
                type="text"
                value={config.name}
                onChange={(e) => onChange({ ...config, name: e.target.value })}
                placeholder="Report Name"
                className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
              <textarea
                value={config.description}
                onChange={(e) => onChange({ ...config, description: e.target.value })}
                placeholder="Report Description"
                className="text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full resize-none"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onExecute}>
                <Play className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Visualization Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <VisualizationIcon className="w-5 h-5 mr-2" />
            Visualization: {config.config.visualization.type.replace("_", " ").toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {(
              [
                { type: "table" as const, icon: Table, label: "Table" },
                { type: "bar_chart" as const, icon: BarChart3, label: "Bar Chart" },
                { type: "line_chart" as const, icon: LineChart, label: "Line Chart" },
                { type: "pie_chart" as const, icon: PieChart, label: "Pie Chart" },
                { type: "gauge" as const, icon: Gauge, label: "Gauge" },
              ] as const
            ).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() =>
                  onChange({
                    ...config,
                    config: {
                      ...config.config,
                      visualization: { ...config.config.visualization, type },
                    },
                  })
                }
                className={`p-3 rounded-lg border-2 transition-colors ${
                  config.config.visualization.type === type
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium">{label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Data Sources ({config.config.dataSources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={drop as any}
            className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-colors ${
              isOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {config.config.dataSources.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">Drop data sources here</p>
                <p className="text-xs">Drag fields from the left panel to add data sources</p>
              </div>
            ) : (
              <div className="space-y-3">
                {config.config.dataSources.map((dataSource: any, _index: number) => (
                  <div
                    key={dataSource.id}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <div>
                        <div className="font-medium text-sm">
                          {dataSource.table}.{dataSource.field || "all"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dataSource.type} • {dataSource.filters?.length || 0} filters
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFieldClick(dataSource)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveField(dataSource.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculated Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Calculated Fields ({config.config.calculatedFields?.length || 0})
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newField: CalculatedField = {
                  name: `calculated_${Date.now()}`,
                  formula: "0",
                  dataType: "number" as const,
                };
                onChange({
                  ...config,
                  config: {
                    ...config.config,
                    calculatedFields: [...(config.config.calculatedFields || []), newField],
                  },
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.config.calculatedFields?.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <Edit3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No calculated fields defined</p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.config.calculatedFields?.map((field: CalculatedField, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                >
                  <div>
                    <div className="font-medium text-sm">{field.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{field.formula}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {field.dataType}
                    </span>
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedFields = config.config.calculatedFields.filter(
                          (_: any, i: number) => i !== index
                        );
                        onChange({
                          ...config,
                          config: { ...config.config, calculatedFields: updatedFields },
                        });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Configuration Dialog */}
      {showFieldConfig && selectedField && (
        <FieldConfigDialog
          field={selectedField}
          onSave={(updates) => {
            handleUpdateField(selectedField.id, updates);
            setShowFieldConfig(false);
            setSelectedField(null);
          }}
          onClose={() => {
            setShowFieldConfig(false);
            setSelectedField(null);
          }}
        />
      )}
    </div>
  );
}
