PRP 4: Backend - Convex Bookkeeping Integration for HVAC CRM
name: "Convex Bookkeeping Integration - Backend Replacement for 'Mała Księgowość'"
description: |

Purpose
Develop backend functions in Convex to replace "Mała księgowość Rzeczpospolitej" with integrated accounting for HVAC CRM, handling invoices, VAT, and payments with Polish compliance.

Core Principles
"Pasja rodzi profesjonalizm": Accurate financial processing for HVAC
Convex Scalability: Use Convex for secure, real-time bookkeeping
Polish Compliance: Full VAT and regulation support
Automation: Link with transcriptions and jobs
Efficiency: Fast queries for reports
Goal
Implement Convex mutations and queries for bookkeeping, integrating with jobs and contacts for automated HVAC financial workflows.

Why
Business Value: Streamlines accounting for Fulmark's 20+ years of operations
Integration: Connects Convex data for 360-degree client financial views
Problems Solved: Automates from Outlook/transcriptions to invoices
What
Backend for:

Invoice generation with VAT
Payment tracking
Compliance reports
Integration with new AI insights
Success Criteria
 100% VAT accuracy
 <200ms query times
 Handles 500+ daily transactions
 Secure data handling
 Tests for Polish scenarios
All Needed Context
Documentation & References
yaml

Zwiń

Zwiń

Kopiuj
- file: convex/invoices.ts
  why: Existing invoice functions to extend
  
- file: convex/jobs.ts
  why: Link jobs to payments
  
- doc: https://www.gov.pl/web/finanse/vat
  section: Polish VAT rules
  critical: For accurate calculations
Current Codebase tree
bash

Zwiń

Zwiń

Uruchom

Kopiuj
convex/
├── invoices.ts
├── jobs.ts
└── contacts.ts
Desired Codebase tree with files to be added
bash

Zwiń

Zwiń

Uruchom

Kopiuj
convex/
├── bookkeeping.ts     # New accounting functions
└── invoices.ts        # Enhanced with payments
Known Gotchas & Library Quirks
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
// CRITICAL: Convex mutations for atomic updates
// GOTCHA: Handle currency precision for PLN
Implementation Blueprint
Data models and structure
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
type Invoice = {
  amount: number;
  vat: number;
  status: 'paid' | 'pending';
};
List of tasks to be completed
yaml

Zwiń

Zwiń

Kopiuj
Task 1: Create Bookkeeping Functions
CREATE convex/bookkeeping.ts:
  - ADD: Payment processing mutation

Task 2: Enhance Invoices
MODIFY convex/invoices.ts:
  - ADD: VAT calculations for Polish rates

Task 3: Integrate with Jobs
MODIFY convex/bookkeeping.ts:
  - LINK: Auto-invoice from job completion
Per task pseudocode
typescript

Zwiń

Zwiń

Uruchom

Kopiuj
// Task 1: bookkeeping.ts
export const processPayment = mutation(async (ctx, { invoiceId, amount }) => {
  // Update invoice status
});
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
describe('processPayment', () => {
  it('updates status', async () => {
    // Mock mutation
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
convex dev
# Test mutation in console
Final Validation Checklist
 Tests pass
 VAT correct
 Integrations work
 Secure and efficient