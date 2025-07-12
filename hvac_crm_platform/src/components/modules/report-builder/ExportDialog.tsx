import { useAction } from "convex/react";
import { AlertCircle, CheckCircle, Download, FileText, Loader2, Table, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Button } from "../../ui/button";

interface ExportDialogProps {
  reportId: string | null;
  onClose: () => void;
}

export function ExportDialog({ reportId, onClose }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [scheduleExport, setScheduleExport] = useState(false);

  const exportReport = useAction(api.reports.exportReport);

  const exportFormats = [
    {
      format: "pdf" as const,
      icon: FileText,
      label: "PDF Report",
      description: "Professional report with charts and formatting",
      features: ["Charts & visualizations", "Professional layout", "Print-ready format"],
    },
    {
      format: "excel" as const,
      icon: Table,
      label: "Excel Spreadsheet",
      description: "Data in Excel format for further analysis",
      features: ["Raw data access", "Pivot table ready", "Formula support"],
    },
    {
      format: "csv" as const,
      icon: Table,
      label: "CSV Data",
      description: "Simple comma-separated values file",
      features: ["Universal compatibility", "Lightweight format", "Easy import"],
    },
  ];

  const handleExport = async () => {
    if (!reportId) {
      toast.error("No report selected");
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportReport({
        reportId: reportId as any,
        format: selectedFormat,
        parameters: {
          includeCharts,
          includeData,
          timestamp: new Date().toISOString(),
        },
      });

      // In a real implementation, this would trigger a download
      // For now, we'll show a success message
      toast.success(`Report exported successfully as ${selectedFormat.toUpperCase()}`);

      // Simulate file download
      const blob = new Blob([result], {
        type: selectedFormat === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hvac-report-${Date.now()}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      toast.error("Export failed");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Report</h2>
            <p className="text-sm text-gray-600">
              Choose format and options for your report export
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
            <div className="grid grid-cols-1 gap-3">
              {exportFormats.map(({ format, icon: Icon, label, description, features }) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedFormat === format
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon
                      className={`w-5 h-5 mt-0.5 ${
                        selectedFormat === format ? "text-blue-600" : "text-gray-600"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-600 mt-1">{description}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {features.map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedFormat === format && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeData}
                  onChange={(e) => setIncludeData(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium">Include Data</div>
                  <div className="text-xs text-gray-600">
                    Export the raw data used in the report
                  </div>
                </div>
              </label>

              {selectedFormat === "pdf" && (
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium">Include Charts</div>
                    <div className="text-xs text-gray-600">
                      Include visualizations and charts in the PDF
                    </div>
                  </div>
                </label>
              )}

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={scheduleExport}
                  onChange={(e) => setScheduleExport(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium">Schedule Regular Export</div>
                  <div className="text-xs text-gray-600">
                    Set up automatic exports for this report
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Warsaw Intelligence Notice */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 text-sm">
                  Warsaw Intelligence Included
                </h4>
                <p className="text-sm text-purple-800 mt-1">
                  This export will include Warsaw-specific analytics such as district affluence
                  scores, seasonal adjustments, and route optimization data.
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Options */}
          {scheduleExport && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 text-sm mb-3">Schedule Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Frequency</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Time</label>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Email Recipients
                </label>
                <input
                  type="email"
                  placeholder="email@example.com, another@example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Export will include current data and Warsaw intelligence features
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting || !reportId}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
