import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Plus, 
  Save, 
  Play, 
  Download, 
  Share, 
  Settings,
  Database,
  BarChart3,
  Table,
  PieChart,
  LineChart,
  Gauge,
  Filter,
  Calculator,
  MapPin,
  Brain,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff
} from 'lucide-react';
import { toast } from 'sonner';
import { ReportDesigner } from './report-builder/ReportDesigner';
import { DataSourcePanel } from './report-builder/DataSourcePanel';
import { VisualizationPanel } from './report-builder/VisualizationPanel';
import { FilterPanel } from './report-builder/FilterPanel';
import { PreviewPanel } from './report-builder/PreviewPanel';
import { WarsawSettingsPanel } from './report-builder/WarsawSettingsPanel';
import { ReportTemplates } from './report-builder/ReportTemplates';
import { ReportList } from './report-builder/ReportList';
import { ExportDialog } from './report-builder/ExportDialog';
import { ShareDialog } from './report-builder/ShareDialog';

interface CustomReportBuilderProps {
  initialView?: 'list' | 'builder' | 'templates';
  reportId?: string;
}

export function CustomReportBuilder({ 
  initialView = 'list',
  reportId 
}: CustomReportBuilderProps) {
  const [activeView, setActiveView] = useState(initialView);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reportId || null);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [reportConfig, setReportConfig] = useState<any>({
    name: '',
    description: '',
    type: 'table',
    config: {
      dataSources: [],
      visualization: {
        type: 'table',
        xAxis: '',
        yAxis: '',
        groupBy: '',
        aggregation: 'count',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      },
      calculatedFields: [],
      warsawSettings: {
        districtFilter: '',
        affluenceWeighting: false,
        seasonalAdjustment: false,
        routeOptimization: false
      }
    },
    category: '',
    tags: [],
    isPublic: false
  });

  // Queries
  const reports = useQuery(api.reports.list, {});
  const templates = useQuery(api.reports.getTemplates, {});
  const currentReport = selectedReportId 
    ? useQuery(api.reports.get, { id: selectedReportId as any })
    : null;

  // Mutations
  const createReport = useMutation(api.reports.create);
  const updateReport = useMutation(api.reports.update);
  const deleteReport = useMutation(api.reports.remove);
  const executeReport = useAction(api.reports.execute);
  const shareReport = useMutation(api.reports.shareReport);

  // Load report when selected
  useEffect(() => {
    if (currentReport) {
      setReportConfig({
        name: currentReport.name,
        description: currentReport.description || '',
        type: currentReport.type,
        config: currentReport.config,
        category: currentReport.category || '',
        tags: currentReport.tags || [],
        isPublic: currentReport.isPublic
      });
    }
  }, [currentReport]);

  const handleSaveReport = useCallback(async () => {
    try {
      if (selectedReportId) {
        await updateReport({
          id: selectedReportId as any,
          name: reportConfig.name,
          description: reportConfig.description,
          config: reportConfig.config,
          category: reportConfig.category,
          tags: reportConfig.tags,
          isPublic: reportConfig.isPublic
        });
        toast.success('Report updated successfully');
      } else {
        const newReportId = await createReport({
          name: reportConfig.name || 'Untitled Report',
          description: reportConfig.description,
          type: reportConfig.type,
          config: reportConfig.config,
          category: reportConfig.category,
          tags: reportConfig.tags,
          isPublic: reportConfig.isPublic
        });
        setSelectedReportId(newReportId);
        toast.success('Report created successfully');
      }
    } catch (error) {
      toast.error('Failed to save report');
      console.error('Save error:', error);
    }
  }, [selectedReportId, reportConfig, createReport, updateReport]);

  const handleExecuteReport = useCallback(async () => {
    if (!selectedReportId) {
      toast.error('Please save the report first');
      return;
    }

    try {
      const result = await executeReport({
        reportId: selectedReportId as any,
        useCache: true
      });
      toast.success(`Report executed successfully (${result.metadata.totalRows} rows)`);
      return result;
    } catch (error) {
      toast.error('Failed to execute report');
      console.error('Execution error:', error);
    }
  }, [selectedReportId, executeReport]);

  const handleDeleteReport = useCallback(async (reportId: string) => {
    try {
      await deleteReport({ id: reportId as any });
      if (selectedReportId === reportId) {
        setSelectedReportId(null);
        setActiveView('list');
      }
      toast.success('Report deleted successfully');
    } catch (error) {
      toast.error('Failed to delete report');
    }
  }, [deleteReport, selectedReportId]);

  const handleNewReport = useCallback(() => {
    setSelectedReportId(null);
    setReportConfig({
      name: '',
      description: '',
      type: 'table',
      config: {
        dataSources: [],
        visualization: {
          type: 'table',
          xAxis: '',
          yAxis: '',
          groupBy: '',
          aggregation: 'count',
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        },
        calculatedFields: [],
        warsawSettings: {
          districtFilter: '',
          affluenceWeighting: false,
          seasonalAdjustment: false,
          routeOptimization: false
        }
      },
      category: '',
      tags: [],
      isPublic: false
    });
    setActiveView('builder');
    setIsBuilderMode(true);
  }, []);

  const handleEditReport = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    setActiveView('builder');
    setIsBuilderMode(true);
  }, []);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
        <p className="text-gray-600">Create powerful reports with drag-and-drop interface</p>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['list', 'builder', 'templates'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === view
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view === 'list' && <Table className="w-4 h-4 mr-1 inline" />}
              {view === 'builder' && <BarChart3 className="w-4 h-4 mr-1 inline" />}
              {view === 'templates' && <Copy className="w-4 h-4 mr-1 inline" />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        {activeView === 'list' && (
          <Button onClick={handleNewReport}>
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        )}
        {activeView === 'builder' && (
          <>
            <Button variant="outline" onClick={handleSaveReport}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleExecuteReport}>
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {renderHeader()}

        {activeView === 'list' && (
          <ReportList
            reports={reports || []}
            onEdit={handleEditReport}
            onDelete={handleDeleteReport}
            onExecute={handleExecuteReport}
          />
        )}

        {activeView === 'templates' && (
          <ReportTemplates
            templates={templates || []}
            onUseTemplate={(templateId) => {
              setSelectedReportId(templateId);
              setActiveView('builder');
              setIsBuilderMode(true);
            }}
          />
        )}

        {activeView === 'builder' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Configuration Panels */}
            <div className="col-span-3 space-y-4">
              <DataSourcePanel
                dataSources={reportConfig.config.dataSources}
                onChange={(dataSources) => 
                  setReportConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, dataSources }
                  }))
                }
              />
              
              <VisualizationPanel
                visualization={reportConfig.config.visualization}
                onChange={(visualization) =>
                  setReportConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, visualization }
                  }))
                }
              />

              <FilterPanel
                filters={reportConfig.config.filters || []}
                onChange={(filters) =>
                  setReportConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, filters }
                  }))
                }
              />

              <WarsawSettingsPanel
                settings={reportConfig.config.warsawSettings}
                onChange={(warsawSettings) =>
                  setReportConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, warsawSettings }
                  }))
                }
              />
            </div>

            {/* Main Content - Report Designer */}
            <div className="col-span-6">
              <ReportDesigner
                config={reportConfig}
                onChange={setReportConfig}
                onExecute={handleExecuteReport}
              />
            </div>

            {/* Right Sidebar - Preview */}
            <div className="col-span-3">
              <PreviewPanel
                reportId={selectedReportId}
                config={reportConfig.config}
                onExecute={handleExecuteReport}
              />
            </div>
          </div>
        )}

        {/* Dialogs */}
        {showExportDialog && (
          <ExportDialog
            reportId={selectedReportId}
            onClose={() => setShowExportDialog(false)}
          />
        )}

        {showShareDialog && (
          <ShareDialog
            reportId={selectedReportId}
            onClose={() => setShowShareDialog(false)}
            onShare={shareReport}
          />
        )}
      </div>
    </DndProvider>
  );
}
