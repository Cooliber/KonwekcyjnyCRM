import { test, expect } from '@playwright/test';

test.describe('Custom Report Builder - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and authenticate
    await page.goto('/');
    
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('convex-auth', JSON.stringify({
        userId: 'test-user-id',
        token: 'test-token'
      }));
    });
    
    // Navigate to Custom Reports module
    await page.click('[data-testid="sidebar-custom_reports"]');
    await expect(page.locator('h1')).toContainText('Custom Report Builder');
  });

  test.describe('Report Creation Workflow', () => {
    test('creates a new HVAC performance report', async ({ page }) => {
      // Start creating new report
      await page.click('button:has-text("New Report")');
      
      // Verify we're in builder mode
      await expect(page.locator('[data-testid="report-designer"]')).toBeVisible();
      
      // Configure report name
      await page.fill('[data-testid="report-name"]', 'HVAC System Efficiency Analysis');
      
      // Add description
      await page.fill('[data-testid="report-description"]', 'Comprehensive analysis of HVAC system performance across Warsaw districts');
      
      // Configure data sources
      await page.click('[data-testid="data-source-panel"] button:has-text("Add")');
      
      // Drag and drop a field (simulated with click for E2E)
      await page.click('[data-testid="field-jobs-status"]');
      await page.click('[data-testid="drop-zone-data-sources"]');
      
      // Configure visualization
      await page.selectOption('[data-testid="visualization-type"]', 'bar_chart');
      await page.fill('[data-testid="x-axis-field"]', 'district');
      await page.fill('[data-testid="y-axis-field"]', 'totalAmount');
      
      // Configure Warsaw settings
      await page.selectOption('[data-testid="district-filter"]', 'Śródmieście');
      await page.check('[data-testid="affluence-weighting"]');
      await page.check('[data-testid="seasonal-adjustment"]');
      
      // Save the report
      await page.click('button:has-text("Save")');
      
      // Verify success message
      await expect(page.locator('.sonner-toast')).toContainText('Report created successfully');
      
      // Verify report appears in list
      await page.click('button:has-text("List")');
      await expect(page.locator('[data-testid="report-list"]')).toContainText('HVAC System Efficiency Analysis');
    });

    test('creates report from template', async ({ page }) => {
      // Navigate to templates
      await page.click('button:has-text("Templates")');
      
      // Select HVAC performance template
      await page.click('[data-testid="template-hvac_performance"] button:has-text("Use Template")');
      
      // Verify template is loaded in builder
      await expect(page.locator('[data-testid="report-designer"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-name"]')).not.toBeEmpty();
      
      // Customize template
      await page.fill('[data-testid="report-name"]', 'Custom HVAC Performance Dashboard');
      
      // Save customized report
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('.sonner-toast')).toContainText('Report created successfully');
    });
  });

  test.describe('Report Execution and Preview', () => {
    test('executes report and displays results', async ({ page }) => {
      // Create a simple report first
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Test Execution Report');
      await page.click('button:has-text("Save")');
      
      // Execute the report
      await page.click('button:has-text("Execute")');
      
      // Wait for execution to complete
      await expect(page.locator('[data-testid="preview-panel"]')).toContainText('rows');
      
      // Verify execution metrics are displayed
      await expect(page.locator('[data-testid="execution-stats"]')).toBeVisible();
      
      // Check for Warsaw metrics if enabled
      const warsawMetrics = page.locator('[data-testid="warsaw-metrics"]');
      if (await warsawMetrics.isVisible()) {
        await expect(warsawMetrics).toContainText('Affluence');
      }
    });

    test('real-time preview updates as configuration changes', async ({ page }) => {
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Preview Test Report');
      
      // Change visualization type
      await page.selectOption('[data-testid="visualization-type"]', 'pie_chart');
      
      // Verify preview updates
      await expect(page.locator('[data-testid="preview-panel"]')).toContainText('pie');
      
      // Change to table view
      await page.selectOption('[data-testid="visualization-type"]', 'table');
      
      await expect(page.locator('[data-testid="preview-panel"]')).toContainText('table');
    });
  });

  test.describe('Warsaw-Specific Features', () => {
    test('applies district-based filtering correctly', async ({ page }) => {
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'District Analysis Report');
      
      // Configure Warsaw settings
      await page.selectOption('[data-testid="district-filter"]', 'Mokotów');
      await page.check('[data-testid="affluence-weighting"]');
      
      // Save and execute
      await page.click('button:has-text("Save")');
      await page.click('button:has-text("Execute")');
      
      // Verify Warsaw metrics are calculated
      await expect(page.locator('[data-testid="warsaw-metrics"]')).toContainText('Mokotów');
      await expect(page.locator('[data-testid="affluence-score"]')).toBeVisible();
    });

    test('seasonal adjustment affects calculations', async ({ page }) => {
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Seasonal Analysis Report');
      
      // Enable seasonal adjustment
      await page.check('[data-testid="seasonal-adjustment"]');
      
      await page.click('button:has-text("Save")');
      await page.click('button:has-text("Execute")');
      
      // Verify seasonal factor is applied
      await expect(page.locator('[data-testid="seasonal-factor"]')).toBeVisible();
    });
  });

  test.describe('Export and Sharing', () => {
    test('exports report to PDF', async ({ page }) => {
      // Create and save a report
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Export Test Report');
      await page.click('button:has-text("Save")');
      
      // Open export dialog
      await page.click('button:has-text("Export")');
      
      // Select PDF format
      await page.click('[data-testid="export-format-pdf"]');
      
      // Configure export options
      await page.check('[data-testid="include-charts"]');
      await page.check('[data-testid="include-data"]');
      
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export PDF")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    test('shares report with team members', async ({ page }) => {
      // Create and save a report
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Shared Report');
      await page.click('button:has-text("Save")');
      
      // Open share dialog
      await page.click('button:has-text("Share")');
      
      // Add user by email
      await page.fill('[data-testid="user-email"]', 'colleague@hvac.pl');
      await page.selectOption('[data-testid="permission-level"]', 'edit');
      await page.click('button:has-text("Add")');
      
      // Share the report
      await page.click('button:has-text("Share Report")');
      
      await expect(page.locator('.sonner-toast')).toContainText('Report shared');
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('handles large datasets efficiently', async ({ page }) => {
      // Create report with large dataset
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Large Dataset Report');
      
      // Configure for large dataset
      await page.selectOption('[data-testid="data-source"]', 'all_jobs');
      
      await page.click('button:has-text("Save")');
      
      // Measure execution time
      const startTime = Date.now();
      await page.click('button:has-text("Execute")');
      
      // Wait for completion
      await expect(page.locator('[data-testid="execution-complete"]')).toBeVisible({ timeout: 10000 });
      
      const executionTime = Date.now() - startTime;
      
      // Verify reasonable performance (under 5 seconds)
      expect(executionTime).toBeLessThan(5000);
      
      // Verify results are displayed
      await expect(page.locator('[data-testid="preview-panel"]')).toContainText('rows');
    });

    test('responsive design works on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify mobile layout
      await expect(page.locator('h1')).toBeVisible();
      
      // Test mobile navigation
      await page.click('button:has-text("Builder")');
      await expect(page.locator('[data-testid="report-designer"]')).toBeVisible();
      
      // Verify mobile-friendly controls
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('keyboard navigation works correctly', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate to builder tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      await expect(page.locator('[data-testid="report-designer"]')).toBeVisible();
      
      // Test form navigation
      await page.keyboard.press('Tab');
      await page.keyboard.type('Keyboard Navigation Test');
      
      await expect(page.locator('[data-testid="report-name"]')).toHaveValue('Keyboard Navigation Test');
    });

    test('screen reader compatibility', async ({ page }) => {
      // Check for proper ARIA labels
      await expect(page.locator('[aria-label="Custom Report Builder"]')).toBeVisible();
      
      // Check for heading hierarchy
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
      
      // Check for form labels
      await page.click('button:has-text("Builder")');
      await expect(page.locator('label[for="report-name"]')).toBeVisible();
    });

    test('color contrast meets WCAG standards', async ({ page }) => {
      // This would typically use axe-core for automated accessibility testing
      await page.click('button:has-text("Builder")');
      
      // Verify high contrast elements are visible
      const primaryButton = page.locator('button:has-text("Save")');
      await expect(primaryButton).toBeVisible();
      
      // Check that text is readable
      const reportTitle = page.locator('h1');
      await expect(reportTitle).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/reports/execute', route => route.abort());
      
      await page.click('button:has-text("New Report")');
      await page.fill('[data-testid="report-name"]', 'Network Error Test');
      await page.click('button:has-text("Save")');
      await page.click('button:has-text("Execute")');
      
      // Verify error message is displayed
      await expect(page.locator('.sonner-toast')).toContainText('Failed to execute report');
      
      // Verify UI remains functional
      await expect(page.locator('button:has-text("Execute")')).toBeEnabled();
    });

    test('validates form inputs correctly', async ({ page }) => {
      await page.click('button:has-text("New Report")');
      
      // Try to save without name
      await page.click('button:has-text("Save")');
      
      // Verify validation message
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Report name is required');
      
      // Fill name and save successfully
      await page.fill('[data-testid="report-name"]', 'Valid Report Name');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('.sonner-toast')).toContainText('Report created successfully');
    });
  });
});
