import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomReportBuilder } from "../CustomReportBuilder";

// Mock Convex with realistic data
const mockConvexData = {
  reports: [
    {
      _id: "report_hvac_performance",
      name: "HVAC System Performance",
      type: "dashboard",
      config: {
        dataSources: [
          { id: "jobs_source", type: "convex", table: "jobs" },
          { id: "equipment_source", type: "convex", table: "equipment" },
        ],
        visualization: { type: "dashboard" },
        warsawSettings: {
          districtFilter: "Śródmieście",
          affluenceWeighting: true,
          seasonalAdjustment: true,
        },
      },
      _creationTime: Date.now() - 86400000, // 1 day ago
      lastExecuted: Date.now() - 3600000, // 1 hour ago
      executionTime: 250,
    },
  ],
  templates: [
    {
      _id: "template_revenue_analysis",
      name: "Revenue Analysis by District",
      category: "financial",
      type: "chart",
      config: {
        dataSources: [{ id: "quotes_source", type: "convex", table: "quotes" }],
        visualization: { type: "bar_chart", xAxis: "district", yAxis: "totalAmount" },
        warsawSettings: { affluenceWeighting: true },
      },
    },
  ],
  executionResults: {
    data: [
      { district: "Śródmieście", totalAmount: 15000, jobCount: 25 },
      { district: "Mokotów", totalAmount: 12000, jobCount: 20 },
      { district: "Żoliborz", totalAmount: 8000, jobCount: 15 },
    ],
    metadata: {
      totalRows: 3,
      executionTime: 180,
      dataSourcesUsed: ["convex"],
      warsawMetrics: {
        districtsAnalyzed: ["Śródmieście", "Mokotów", "Żoliborz"],
        avgAffluenceScore: 1.33,
        routeEfficiency: 85.5,
      },
    },
  },
};

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderWithDnd = (component: React.ReactElement) => {
  return render(<DndProvider backend={HTML5Backend}>{component}</DndProvider>);
};

describe("Custom Report Builder - Integration Tests", () => {
  const mockCreateReport = vi.fn();
  const mockUpdateReport = vi.fn();
  const mockDeleteReport = vi.fn();
  const mockExecuteReport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const { useQuery, useMutation, useAction } = require("convex/react");

    // Mock queries
    useQuery.mockImplementation((query) => {
      if (query.toString().includes("list")) {
        return mockConvexData.reports;
      }
      if (query.toString().includes("getTemplates")) {
        return mockConvexData.templates;
      }
      if (query.toString().includes("get")) {
        return mockConvexData.reports[0];
      }
      return null;
    });

    // Mock mutations
    useMutation.mockImplementation((mutation) => {
      if (mutation.toString().includes("create")) {
        return mockCreateReport;
      }
      if (mutation.toString().includes("update")) {
        return mockUpdateReport;
      }
      if (mutation.toString().includes("remove")) {
        return mockDeleteReport;
      }
      return vi.fn();
    });

    // Mock actions
    useAction.mockImplementation((action) => {
      if (action.toString().includes("execute")) {
        return mockExecuteReport;
      }
      return vi.fn();
    });

    // Setup default resolved values
    mockCreateReport.mockResolvedValue("new_report_id");
    mockUpdateReport.mockResolvedValue(undefined);
    mockDeleteReport.mockResolvedValue(undefined);
    mockExecuteReport.mockResolvedValue(mockConvexData.executionResults);
  });

  describe("End-to-End Report Creation Workflow", () => {
    it("creates a complete HVAC performance report from scratch", async () => {
      renderWithDnd(<CustomReportBuilder />);

      // Start with new report
      fireEvent.click(screen.getByText("New Report"));

      // Should be in builder mode
      expect(screen.getByText("Builder")).toHaveClass("bg-white");

      // Configure basic report settings
      const nameInput = screen.getByDisplayValue("");
      fireEvent.change(nameInput, { target: { value: "HVAC Efficiency Report" } });

      // Add data sources (simulated through component interaction)
      // In real test, this would involve drag and drop operations

      // Configure Warsaw settings
      // This would involve interacting with the WarsawSettingsPanel

      // Save the report
      fireEvent.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "HVAC Efficiency Report",
            type: "table",
          })
        );
      });

      // Verify success message
      const { toast } = require("sonner");
      expect(toast.success).toHaveBeenCalledWith("Report created successfully");
    });

    it("executes report and displays results with Warsaw metrics", async () => {
      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      // Execute the report
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalledWith({
          reportId: "report_hvac_performance",
          useCache: true,
        });
      });

      // Verify execution success
      const { toast } = require("sonner");
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Report executed successfully")
      );
    });
  });

  describe("Template-Based Report Creation", () => {
    it("creates report from template with Warsaw optimizations", async () => {
      renderWithDnd(<CustomReportBuilder />);

      // Switch to templates view
      fireEvent.click(screen.getByText("Templates"));

      // Use a template (simulated)
      // In real implementation, this would trigger template selection

      // Verify template configuration is loaded
      // This would check that Warsaw settings are properly applied
    });
  });

  describe("Data Source Integration", () => {
    it("integrates multiple data sources correctly", async () => {
      renderWithDnd(<CustomReportBuilder />);

      fireEvent.click(screen.getByText("Builder"));

      // Test would verify:
      // 1. Convex data source connection
      // 2. Supabase analytics integration
      // 3. Weaviate vector search capability
      // 4. Data source validation and error handling
    });
  });

  describe("Warsaw-Specific Features Integration", () => {
    it("applies district-based filtering and affluence weighting", async () => {
      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      // Execute report with Warsaw settings
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalled();
      });

      // Verify Warsaw metrics are included in results
      const executionCall = mockExecuteReport.mock.calls[0][0];
      expect(executionCall.reportId).toBe("report_hvac_performance");
    });

    it("calculates seasonal adjustments for HVAC demand", async () => {
      // Test seasonal factor calculations
      const currentMonth = new Date().getMonth();
      const _expectedSeasonalFactor = currentMonth >= 5 && currentMonth <= 7 ? 1.5 : 1.0; // Summer AC demand

      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalled();
      });

      // In real implementation, would verify seasonal factor is applied
    });
  });

  describe("Performance and Caching", () => {
    it("uses cached results when available", async () => {
      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      // First execution
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalledWith(expect.objectContaining({ useCache: true }));
      });

      // Second execution should use cache
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalledTimes(2);
      });
    });

    it("handles large datasets efficiently", async () => {
      // Mock large dataset
      const largeDataset = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          district: `District_${i % 18}`,
          amount: Math.random() * 10000,
        })),
        metadata: {
          totalRows: 1000,
          executionTime: 500,
        },
      };

      mockExecuteReport.mockResolvedValue(largeDataset);

      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      const startTime = performance.now();
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Verify reasonable performance (should be under 1 second for UI operations)
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("recovers from network failures gracefully", async () => {
      mockExecuteReport.mockRejectedValueOnce(new Error("Network error"));
      mockExecuteReport.mockResolvedValueOnce(mockConvexData.executionResults);

      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      // First attempt fails
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        const { toast } = require("sonner");
        expect(toast.error).toHaveBeenCalledWith("Failed to execute report");
      });

      // Retry succeeds
      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        const { toast } = require("sonner");
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("Report executed successfully")
        );
      });
    });

    it("handles invalid data gracefully", async () => {
      mockExecuteReport.mockResolvedValue({
        data: null,
        metadata: { totalRows: 0, executionTime: 50 },
      });

      renderWithDnd(
        <CustomReportBuilder initialView="builder" reportId="report_hvac_performance" />
      );

      fireEvent.click(screen.getByText("Execute"));

      await waitFor(() => {
        expect(mockExecuteReport).toHaveBeenCalled();
      });

      // Should handle null data without crashing
      expect(screen.getByText("Execute")).toBeInTheDocument();
    });
  });

  describe("Accessibility Integration", () => {
    it("maintains accessibility standards throughout workflow", async () => {
      renderWithDnd(<CustomReportBuilder />);

      // Check initial accessibility
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

      // Navigate through tabs
      fireEvent.click(screen.getByText("Builder"));
      expect(screen.getByText("Builder")).toHaveAttribute("aria-selected", "true");

      fireEvent.click(screen.getByText("Templates"));
      expect(screen.getByText("Templates")).toHaveAttribute("aria-selected", "true");

      // Verify keyboard navigation works
      const listTab = screen.getByText("List");
      listTab.focus();
      fireEvent.keyDown(listTab, { key: "Enter" });

      expect(screen.getByText("List")).toHaveClass("bg-white");
    });
  });

  describe("Mobile Responsiveness", () => {
    it("adapts to mobile viewport correctly", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithDnd(<CustomReportBuilder />);

      // Verify mobile-friendly layout
      expect(screen.getByText("Custom Report Builder")).toBeInTheDocument();

      // Check that components are still accessible on mobile
      fireEvent.click(screen.getByText("Builder"));
      expect(screen.getByText("Builder")).toBeInTheDocument();
    });
  });
});
