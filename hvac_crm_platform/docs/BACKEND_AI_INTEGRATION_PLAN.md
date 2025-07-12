# PRP 3: Backend - Convex AI Integration for HVAC Predictions

**name:** "Convex AI Integration - Backend for HVAC Predictive Analytics"

## Purpose

Implement backend AI integration in Convex for HVAC predictive maintenance, processing transcriptions and data for Warsaw-specific insights, replacing manual Outlook analysis.

## Core Principles

- **"Pasja rodzi profesjonalizm"**: Accurate AI predictions for HVAC
- **Convex Optimization**: Use Convex actions for AI calls
- **Polish Expertise**: Factor in Warsaw climate and regulations
- **Scalability**: Handle high-volume transcriptions
- **Security**: Secure AI API keys

## Goal

Create Convex functions for AI-powered HVAC predictions, integrating with transcriptions and jobs data for proactive service recommendations.

## Why

- **Business Value**: Predicts failures, reducing costs by 25% for Fulmark
- **Integration**: Enhances Convex backend with AI for 360-degree profiles
- **Problems Solved**: Automates insights from calls, aiding new accounting

## What

Backend functions for:
- AI analysis of transcriptions
- Predictive maintenance models
- Warsaw district risk scoring
- Integration with new bookkeeping

## Success Criteria

- ✅ Prediction accuracy >85%
- ✅ Response time <500ms
- ✅ Handles 1000+ daily queries
- ✅ Secure API key management
- ✅ Tests for Polish scenarios

## All Needed Context

### Documentation & References

```yaml
- file: convex/ai.ts
  why: Existing AI functions to extend
  
- file: convex/transcriptions.ts
  why: Transcription data source
  
- doc: https://docs.convex.dev/production
  section: AI actions in Convex
  critical: Secure AI integrations
```

### Current Codebase tree

```bash
convex/
├── ai.ts
├── transcriptions.ts
└── jobs.ts
```

### Desired Codebase tree with files to be added

```bash
convex/
├── hvacPredictions.ts   # New AI prediction functions
└── ai.ts                # Enhanced with HVAC models
```

## Known Gotchas & Library Quirks

```typescript
// CRITICAL: Convex actions for async AI calls
// GOTCHA: Rate limits on external AI APIs
```

## Implementation Blueprint

### Data models and structure

```typescript
type Prediction = {
  riskLevel: number;
  recommendations: string[];
  districtFactor: number;
};
```

### List of tasks to be completed

```yaml
Task 1: Create Prediction Functions
CREATE convex/hvacPredictions.ts:
  - ADD: AI action for maintenance predictions

Task 2: Integrate Transcriptions
MODIFY convex/ai.ts:
  - ADD: Processing from transcriptions.ts

Task 3: Add Warsaw Factors
MODIFY convex/hvacPredictions.ts:
  - INCLUDE: District-specific scoring
```

### Per task pseudocode

```typescript
// Task 1: hvacPredictions.ts
export const predictMaintenance = action(async (ctx, { jobId }) => {
  const job = await ctx.db.get(jobId);
  // Call external AI
  return { risk: 0.8 };
});
```

## Validation Loop

### Level 1: Syntax & Style

```bash
npm run lint -- --fix
npm run typecheck
```

### Level 2: Unit Tests

```typescript
describe('predictMaintenance', () => {
  it('returns risk level', async () => {
    // Mock db
  });
});
```

```bash
npm test
```

### Level 3: Integration Test

```bash
convex dev
# Query via Convex console
```

## Final Validation Checklist

- ✅ Tests pass
- ✅ Predictions accurate
- ✅ Secure execution
- ✅ Performance met