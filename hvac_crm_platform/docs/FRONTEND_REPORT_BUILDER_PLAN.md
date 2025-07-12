# PRP 2: Frontend - AI-Powered Report Builder UI in Convex

**name:** "AI-Powered Report Builder UI - Convex Frontend for HVAC Insights"

## Purpose

Develop an AI-enhanced report builder frontend in the Convex CRM, with drag-and-drop interface for custom HVAC reports, integrating transcriptions and accounting data, optimized for Warsaw market.

## Core Principles

- **"Pasja rodzi profesjonalizm"**: AI-assisted report generation for HVAC
- **Convex Integration**: Use Convex for real-time data and AI queries
- **Polish Focus**: District-specific reports with VAT
- **UI Excellence**: Drag-and-drop with React DnD
- **Efficiency**: <200ms preview updates

## Goal

Create a React-based report builder UI that allows users to design custom reports with AI suggestions, pulling from Convex data sources for HVAC CRM.

## Why

- **Business Value**: Automates report creation from Outlook emails and transcriptions
- **Integration**: Seamless with existing Convex backend and new accounting
- **Problems Solved**: Manual report generation, data silos, Warsaw compliance

## What

Frontend components for:
- Drag-and-drop report designer
- AI-powered field suggestions
- Real-time data preview
- Warsaw district analytics
- VAT and compliance reporting

## Success Criteria

- ✅ Drag-and-drop functionality working
- ✅ AI suggestions >80% accuracy
- ✅ <200ms preview updates
- ✅ Warsaw district integration
- ✅ Export to PDF/Excel
- ✅ Mobile responsive design

## All Needed Context

### Documentation & References

```yaml
- file: src/components/modules/CustomReportBuilder.tsx
  why: Existing report builder to enhance
  
- file: convex/reports.ts
  why: Backend data source
  
- doc: https://react-dnd.github.io/react-dnd/
  section: Drag and drop implementation
  critical: Performance optimization
```

### Current Codebase tree

```bash
src/components/modules/
├── CustomReportBuilder.tsx
├── AnalyticsModule.tsx
└── report-builder/
    ├── ReportDesigner.tsx
    ├── DataSourcePanel.tsx
    └── PreviewPanel.tsx
```

### Desired Codebase tree with files to be added

```bash
src/components/modules/report-builder/
├── AIFieldSuggestions.tsx    # New AI suggestions component
├── WarsawDistrictPanel.tsx   # New Warsaw-specific panel
└── VATCompliancePanel.tsx    # New VAT reporting panel
```

## Known Gotchas & Library Quirks

```typescript
// CRITICAL: React DnD performance with large datasets
// GOTCHA: Convex real-time updates causing re-renders
// IMPORTANT: Warsaw VAT calculation edge cases
```

## Implementation Blueprint

### Data models and structure

```typescript
type ReportField = {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'district';
  aiSuggested?: boolean;
  warsawSpecific?: boolean;
};

type ReportConfig = {
  fields: ReportField[];
  filters: Filter[];
  groupBy: string[];
  districtAnalysis: boolean;
  vatCompliance: boolean;
};
```

### List of tasks to be completed

```yaml
Task 1: AI Field Suggestions
CREATE src/components/modules/report-builder/AIFieldSuggestions.tsx:
  - ADD: AI-powered field recommendations
  - INTEGRATE: Convex AI queries

Task 2: Warsaw District Panel
CREATE src/components/modules/report-builder/WarsawDistrictPanel.tsx:
  - ADD: District-specific analytics
  - INCLUDE: Affluence scoring

Task 3: VAT Compliance Panel
CREATE src/components/modules/report-builder/VATCompliancePanel.tsx:
  - ADD: Polish VAT calculations
  - ENSURE: Compliance reporting

Task 4: Enhanced Drag-and-Drop
MODIFY src/components/modules/report-builder/ReportDesigner.tsx:
  - IMPROVE: Performance optimization
  - ADD: AI suggestions integration
```

### Per task pseudocode

```typescript
// Task 1: AIFieldSuggestions.tsx
export const AIFieldSuggestions = () => {
  const suggestions = useQuery(api.ai.suggestFields, { context: reportContext });
  
  return (
    <div className="ai-suggestions">
      {suggestions?.map(field => (
        <DraggableField key={field.id} field={field} aiSuggested />
      ))}
    </div>
  );
};

// Task 2: WarsawDistrictPanel.tsx
export const WarsawDistrictPanel = () => {
  const districts = useQuery(api.analytics.getWarsawDistricts);
  
  return (
    <Panel title="Warsaw Districts">
      {districts?.map(district => (
        <DistrictMetric key={district.name} district={district} />
      ))}
    </Panel>
  );
};
```

## Validation Loop

### Level 1: Syntax & Style

```bash
npm run lint -- --fix
npm run typecheck
```

### Level 2: Unit Tests

```typescript
describe('AIFieldSuggestions', () => {
  it('renders AI suggestions', () => {
    render(<AIFieldSuggestions />);
    expect(screen.getByText('AI Suggested')).toBeInTheDocument();
  });
});
```

```bash
npm test
```

### Level 3: Integration Test

```bash
npm run dev
# Test drag-and-drop functionality
# Verify AI suggestions appear
# Check Warsaw district data
```

### Level 4: E2E Test

```typescript
// tests/e2e/report-builder.spec.ts
test('creates custom report with AI suggestions', async ({ page }) => {
  await page.goto('/reports/builder');
  await page.dragAndDrop('[data-testid="ai-field"]', '[data-testid="report-canvas"]');
  await expect(page.locator('[data-testid="preview"]')).toBeVisible();
});
```

## Final Validation Checklist

- ✅ Drag-and-drop working smoothly
- ✅ AI suggestions accurate and helpful
- ✅ Warsaw district data integrated
- ✅ VAT compliance features working
- ✅ Performance targets met (<200ms)
- ✅ Mobile responsive
- ✅ No accessibility issues
- ✅ No performance regressions