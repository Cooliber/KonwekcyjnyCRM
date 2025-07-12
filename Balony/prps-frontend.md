RP 1: Frontend - Real-Time HVAC Dashboard Enhancement in Convex
name: "Real-Time HVAC Dashboard Enhancement - Convex Frontend Optimization for Warsaw HVAC CRM"
description: |

Purpose
Enhance the frontend HVAC dashboard in the Convex-based CRM platform with real-time monitoring, Warsaw district-specific visualizations, and seamless integration for technicians, maintaining bundle size under 4.7MB while ensuring real-time data sync via Convex queries.

Core Principles
"Pasja rodzi profesjonalizm": Professional-grade HVAC visualizations with Polish market focus
Convex-First Integration: Leverage Convex real-time subscriptions for live updates
Polish Market Expertise: Include district-based analytics and VAT compliance
Performance Priority: Optimize for <300ms response times and mobile use
Technician-Friendly: Responsive design for field workers in Warsaw
Goal
Build an enhanced React-based HVAC dashboard component that provides real-time system metrics, energy analytics, and Warsaw compliance reporting, fully integrated with Convex backend for live data synchronization.

Why
Business Value: Reduces diagnostic time by 40% for Fulmark technicians in Warsaw districts
Integration: Enhances Convex CRM frontend with HVAC-specific insights from Outlook emails and transcriptions
Problems Solved: Automates real-time monitoring, replacing manual checks in "Mała księgowość Rzeczpospolitej"
What
A responsive dashboard featuring:

Real-time HVAC metrics via Convex subscriptions
Warsaw district heatmaps with affluence correlation
Energy efficiency charts with Polish VAT calculations
Predictive alerts from AI transcriptions
Export to new accounting system formats
Success Criteria
 Real-time updates <2s via Convex
 Bundle contribution <800KB
 100% Polish VAT accuracy in visuals
 Mobile usability score >95%
 Integration with Convex queries for 3+ data sources
All Needed Context
Documentation & References
yaml

Zwiń

Zwiń

Kopiuj
# MUST READ
- url: https://docs.convex.dev/dashboard
  why: Convex dashboard patterns for real-time frontend integration
  
- file: convex/jobs.ts
  why: Job data queries for HVAC metrics
  
- file: convex/analytics.ts
  why: Analytics functions for district-based insights
  
- doc: https://www.gov.pl/web/klimat/efektywnosc-energetyczna
  section: Polish energy regulations
  critical: VAT and compliance in analytics
Current Codebase tree
bash

Zwiń

Zwiń

Uruchom

Kopiuj
convex/
├── analytics.ts
├── contacts.ts
├── conversationChannels.ts
├── jobs.ts
└── reports.ts
src/
├── components/
│   └── modules/
│       └── BusinessIntelligenceDashboard.tsx
└── App.tsx
Desired Codebase tree with files to be added
bash

Zwiń

Zwiń

Uruchom

Kopiuj
src/
├── components/
│   └── modules/
│       ├── HVACDashboard.tsx          # Enhanced dashboard component
│       ├── RealTimeMetrics.tsx        # Live Convex subscription component
│       ├── WarsawHeatmap.tsx          # District visualization
│       └── EnergyAnalyticsChart.tsx   # Chart with VAT calculations
└── hooks/
    └── useConvexRealTime.ts           # Custom hook for subscriptions
Known Gotchas & Library Quirks
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
// CRITICAL: Convex subscriptions require proper cleanup in useEffect
// GOTCHA: React.StrictMode can cause double subscriptions
// CRITICAL: Use Convex React client for queries, avoid direct fetch
Implementation Blueprint
Data models and structure
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
type HVACMetrics = {
  district: string;
  energyEfficiency: number;
  vatAmount: number;
  realTimeStatus: 'optimal' | 'warning' | 'critical';
};

type WarsawDistrictData = {
  affluenceScore: number;
  serviceDemand: number;
};
List of tasks to be completed
yaml

Zwiń

Zwiń

Kopiuj
Task 1: Create Real-Time Hook
CREATE src/hooks/useConvexRealTime.ts:
  - PATTERN: Use Convex useQuery and subscriptions
  - INTEGRATE: With jobs.ts and analytics.ts

Task 2: Enhance Dashboard Component
MODIFY src/components/modules/BusinessIntelligenceDashboard.tsx:
  - ADD: Real-time metrics section
  - OPTIMIZE: Lazy load charts

Task 3: Add Warsaw-Specific Visuals
CREATE src/components/modules/WarsawHeatmap.tsx:
  - USE: Convex data for district mapping
  - INCLUDE: Affluence correlation

Task 4: Implement Energy Chart
CREATE src/components/modules/EnergyAnalyticsChart.tsx:
  - CALCULATE: Polish VAT in real-time
  - VISUALIZE: Using Recharts or similar
Per task pseudocode
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
// Task 1: useConvexRealTime
import { useQuery } from 'convex/react';
import api from 'convex/api';

export const useConvexRealTime = (district: string) => {
  const metrics = useQuery(api.analytics.getPerformanceMetrics, { district });
  // PATTERN: Subscribe for updates
  useSubscription(api.analytics.subscribeToUpdates, { district });
  return metrics;
};
Validation Loop
Level 1: Syntax & Style
bash

Zwiń

Zwiń

Uruchom

Kopiuj
# Run in project root
npm run lint -- --fix
npm run typecheck
Level 2: Unit Tests
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
describe('HVACDashboard', () => {
  it('renders real-time metrics', () => {
    render(<HVACDashboard />);
    expect(screen.getByText('Śródmieście Metrics')).toBeInTheDocument();
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
# Run dev server
npm run dev

# Manual: Check dashboard updates in browser
Final Validation Checklist
 Tests pass
 No lint errors
 Real-time sync works
 Bundle size checked
 Mobile responsive