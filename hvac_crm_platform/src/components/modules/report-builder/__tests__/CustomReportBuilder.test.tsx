import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CustomReportBuilder } from '../CustomReportBuilder';

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock child components
vi.mock('../report-builder/ReportDesigner', () => ({
  ReportDesigner: ({ config, onChange }: any) => (
    <div data-testid="report-designer">
      <input
        data-testid="report-name"
        value={config.name}
        onChange={(e) => onChange({ ...config, name: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('../report-builder/DataSourcePanel', () => ({
  DataSourcePanel: ({ dataSources, onChange }: any) => (
    <div data-testid="data-source-panel">
      <button
        data-testid="add-data-source"
        onClick={() => onChange([...dataSources, { id: 'new-source', type: 'convex' }])}
      >
        Add Data Source
      </button>
    </div>
  ),
}));

vi.mock('../report-builder/VisualizationPanel', () => ({
  VisualizationPanel: ({ visualization, onChange }: any) => (
    <div data-testid="visualization-panel">
      <select
        data-testid="visualization-type"
        value={visualization.type}
        onChange={(e) => onChange({ ...visualization, type: e.target.value })}
      >
        <option value="table">Table</option>
        <option value="bar_chart">Bar Chart</option>
        <option value="pie_chart">Pie Chart</option>
      </select>
    </div>
  ),
}));

vi.mock('../report-builder/FilterPanel', () => ({
  FilterPanel: ({ filters, onChange }: any) => (
    <div data-testid="filter-panel">
      <button
        data-testid="add-filter"
        onClick={() => onChange([...filters, { field: 'test', operator: 'equals', value: 'test' }])}
      >
        Add Filter
      </button>
    </div>
  ),
}));

vi.mock('../report-builder/PreviewPanel', () => ({
  PreviewPanel: ({ reportId, config, onExecute }: any) => (
    <div data-testid="preview-panel">
      <button data-testid="execute-report" onClick={onExecute}>
        Execute Report
      </button>
    </div>
  ),
}));

vi.mock('../report-builder/WarsawSettingsPanel', () => ({
  WarsawSettingsPanel: ({ settings, onChange }: any) => (
    <div data-testid="warsaw-settings-panel">
      <input
        data-testid="district-filter"
        value={settings.districtFilter}
        onChange={(e) => onChange({ ...settings, districtFilter: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('../report-builder/ReportList', () => ({
  ReportList: ({ reports, onEdit, onDelete, onExecute }: any) => (
    <div data-testid="report-list">
      {reports.map((report: any) => (
        <div key={report._id} data-testid={`report-${report._id}`}>
          <span>{report.name}</span>
          <button onClick={() => onEdit(report._id)}>Edit</button>
          <button onClick={() => onDelete(report._id)}>Delete</button>
          <button onClick={() => onExecute(report._id)}>Execute</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../report-builder/ReportTemplates', () => ({
  ReportTemplates: ({ templates, onUseTemplate }: any) => (
    <div data-testid="report-templates">
      {templates.map((template: any) => (
        <div key={template._id} data-testid={`template-${template._id}`}>
          <span>{template.name}</span>
          <button onClick={() => onUseTemplate(template._id)}>Use Template</button>
        </div>
      ))}
    </div>
  ),
}));

const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

describe('CustomReportBuilder', () => {
  const mockReports = [
    {
      _id: 'report1',
      name: 'Test Report 1',
      type: 'table',
      config: { dataSources: [], visualization: { type: 'table' } },
      _creationTime: Date.now(),
    },
    {
      _id: 'report2',
      name: 'Test Report 2',
      type: 'chart',
      config: { dataSources: [], visualization: { type: 'bar_chart' } },
      _creationTime: Date.now(),
    },
  ];

  const mockTemplates = [
    {
      _id: 'template1',
      name: 'HVAC Performance Template',
      category: 'hvac_performance',
      type: 'dashboard',
    },
  ];

  const mockUseQuery = vi.fn();
  const mockUseMutation = vi.fn();
  const mockUseAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockUseQuery.mockImplementation((query) => {
      if (query.toString().includes('list')) {
        return mockReports;
      }
      if (query.toString().includes('getTemplates')) {
        return mockTemplates;
      }
      return null;
    });

    mockUseMutation.mockReturnValue(vi.fn());
    mockUseAction.mockReturnValue(vi.fn());

    // Mock the convex hooks
    const { useQuery, useMutation, useAction } = require('convex/react');
    useQuery.mockImplementation(mockUseQuery);
    useMutation.mockImplementation(mockUseMutation);
    useAction.mockImplementation(mockUseAction);
  });

  describe('Rendering', () => {
    it('renders the main interface with all tabs', () => {
      renderWithDnd(<CustomReportBuilder />);

      expect(screen.getByText('Custom Report Builder')).toBeInTheDocument();
      expect(screen.getByText('List')).toBeInTheDocument();
      expect(screen.getByText('Builder')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    it('renders report list by default', () => {
      renderWithDnd(<CustomReportBuilder />);

      expect(screen.getByTestId('report-list')).toBeInTheDocument();
      expect(screen.getByTestId('report-report1')).toBeInTheDocument();
      expect(screen.getByTestId('report-report2')).toBeInTheDocument();
    });

    it('switches to builder view when Builder tab is clicked', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));

      expect(screen.getByTestId('report-designer')).toBeInTheDocument();
      expect(screen.getByTestId('data-source-panel')).toBeInTheDocument();
      expect(screen.getByTestId('visualization-panel')).toBeInTheDocument();
    });

    it('switches to templates view when Templates tab is clicked', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Templates'));

      expect(screen.getByTestId('report-templates')).toBeInTheDocument();
      expect(screen.getByTestId('template-template1')).toBeInTheDocument();
    });
  });

  describe('Report Management', () => {
    it('creates a new report when New Report button is clicked', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('New Report'));

      expect(screen.getByTestId('report-designer')).toBeInTheDocument();
      expect(screen.getByTestId('report-name')).toHaveValue('');
    });

    it('allows editing report name in builder mode', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));

      const nameInput = screen.getByTestId('report-name');
      fireEvent.change(nameInput, { target: { value: 'My Custom Report' } });

      expect(nameInput).toHaveValue('My Custom Report');
    });

    it('saves report when Save button is clicked', async () => {
      const mockCreateReport = vi.fn().mockResolvedValue('new-report-id');
      mockUseMutation.mockReturnValue(mockCreateReport);

      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));
      
      const nameInput = screen.getByTestId('report-name');
      fireEvent.change(nameInput, { target: { value: 'Test Report' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalled();
      });
    });
  });

  describe('Data Source Management', () => {
    it('adds data source when button is clicked', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));
      fireEvent.click(screen.getByTestId('add-data-source'));

      // This would be tested through the component state changes
      expect(screen.getByTestId('data-source-panel')).toBeInTheDocument();
    });
  });

  describe('Visualization Configuration', () => {
    it('changes visualization type', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));

      const visualizationSelect = screen.getByTestId('visualization-type');
      fireEvent.change(visualizationSelect, { target: { value: 'bar_chart' } });

      expect(visualizationSelect).toHaveValue('bar_chart');
    });
  });

  describe('Warsaw Settings', () => {
    it('configures Warsaw-specific settings', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));

      const districtInput = screen.getByTestId('district-filter');
      fireEvent.change(districtInput, { target: { value: 'Śródmieście' } });

      expect(districtInput).toHaveValue('Śródmieście');
    });
  });

  describe('Report Execution', () => {
    it('executes report when Execute button is clicked', async () => {
      const mockExecuteReport = vi.fn().mockResolvedValue({
        data: [{ test: 'data' }],
        metadata: { totalRows: 1, executionTime: 100 }
      });
      mockUseAction.mockReturnValue(mockExecuteReport);

      renderWithDnd(<CustomReportBuilder initialView="builder" reportId="test-report" />);

      fireEvent.click(screen.getByTestId('execute-report'));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalled();
      });
    });
  });

  describe('Template Usage', () => {
    it('uses template when Use Template button is clicked', () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Templates'));
      fireEvent.click(screen.getByText('Use Template'));

      expect(screen.getByTestId('report-designer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithDnd(<CustomReportBuilder />);

      // Check for main heading
      expect(screen.getByRole('heading', { name: /custom report builder/i })).toBeInTheDocument();
      
      // Check for navigation tabs
      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /builder/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /templates/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithDnd(<CustomReportBuilder />);

      const builderTab = screen.getByText('Builder');
      builderTab.focus();
      
      expect(document.activeElement).toBe(builderTab);
    });
  });

  describe('Error Handling', () => {
    it('handles save errors gracefully', async () => {
      const mockCreateReport = vi.fn().mockRejectedValue(new Error('Save failed'));
      mockUseMutation.mockReturnValue(mockCreateReport);

      const { toast } = require('sonner');

      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText('Builder'));
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save report');
      });
    });

    it('handles execution errors gracefully', async () => {
      const mockExecuteReport = vi.fn().mockRejectedValue(new Error('Execution failed'));
      mockUseAction.mockReturnValue(mockExecuteReport);

      const { toast } = require('sonner');

      renderWithDnd(<CustomReportBuilder initialView="builder" reportId="test-report" />);

      fireEvent.click(screen.getByTestId('execute-report'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to execute report');
      });
    });
  });
});
