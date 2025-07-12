PRP 2: Frontend - AI-Powered Report Builder UI in Convex
name: "AI-Powered Report Builder UI - Convex Frontend for HVAC Insights"
description: |

Purpose
Develop an AI-enhanced report builder frontend in the Convex CRM, with drag-and-drop interface for custom HVAC reports, integrating transcriptions and accounting data, optimized for Warsaw market.

Core Principles
"Pasja rodzi profesjonalizm": AI-assisted report generation for HVAC
Convex Integration: Use Convex for real-time data and AI queries
Polish Focus: District-specific reports with VAT
UI Excellence: Drag-and-drop with React DnD
Efficiency: <200ms preview updates
Goal
Create a React-based report builder UI that allows users to design custom reports with AI suggestions, pulling from Convex data sources for HVAC CRM.

Why
Business Value: Automates report creation from Outlook emails and transcriptions
Integration: Enhances Convex frontend with AI for 360-degree client views
Problems Solved: Replaces manual accounting in "Mała księgowość"
What
An interactive builder with:

Drag-and-drop fields from Convex tables
AI suggestions for HVAC metrics
Warsaw district filters
Real-time previews
Export to new accounting formats
Success Criteria
 AI suggestions accuracy >85%
 Drag-and-drop smooth on mobile
 100% VAT in report calculations
 Integration with Convex reports.ts
 Bundle <500KB
All Needed Context
Documentation & References
yaml

Zwiń

Zwiń

Kopiuj
- file: convex/reports.ts
  why: Backend functions for report execution
  
- file: src/components/modules/CustomReportBuilder.tsx
  why: Existing builder to enhance
  
- doc: https://docs.convex.dev/ai
  section: AI integration in Convex
  critical: For prophecy features
Current Codebase tree
bash

Zwiń

Zwiń

Uruchom

Kopiuj
src/
├── components/
│   └── modules/
│       └── CustomReportBuilder.tsx
convex/
└── reports.ts
Desired Codebase tree with files to be added
bash

Zwiń

Zwiń

Uruchom

Kopiuj
src/
└── components/
    └── modules/
        ├── report-builder/
        │   ├── AIDraftPanel.tsx       # AI suggestions
        │   └── DistrictFilter.tsx     # Warsaw filters
        └── CustomReportBuilder.tsx    # Enhanced main
Known Gotchas & Library Quirks
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
// CRITICAL: React DnD requires HTML5 backend
// GOTCHA: Convex AI calls need proper auth
Implementation Blueprint
Data models and structure
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
type ReportConfig = {
  sources: string[];
  aiSuggestions: string[];
  districtFilter: string;
};
List of tasks to be completed
yaml

Zwiń

Zwiń

Kopiuj
Task 1: Add AI Panel
CREATE src/components/modules/report-builder/AIDraftPanel.tsx:
  - INTEGRATE: Convex AI queries

Task 2: Add District Filter
CREATE src/components/modules/report-builder/DistrictFilter.tsx:
  - USE: Warsaw district data

Task 3: Enhance Builder
MODIFY src/components/modules/CustomReportBuilder.tsx:
  - ADD: Drag-and-drop with AI
Per task pseudocode
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
// Task 1: AIDraftPanel
import { useMutation } from 'convex/react';

const AIDraftPanel = () => {
  const suggest = useMutation(api.ai.generateQuote);
  // PATTERN: Call AI on input change
};
Validation Loop
Level 1: Syntax & Style
bash

Zwiń

Zwiń

Uruchom

Kopiuj
npm run lint -- --fix
npm run typecheck
Level 2: Unit Tests
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
describe('AIDraftPanel', () => {
  it('generates suggestions', async () => {
    // Mock Convex mutation
  });
});
bash

Zwiń

Zwiń

Uruchom

Kopiuj
npm test
Level 3: Integration Test
bash

Zwiń

Zwiń

Uruchom

Kopiuj
npm run dev
# Check AI suggestions in browser
Final Validation Checklist
 Tests pass
 AI integrates correctly
 District filters work
 No performance issues