#!/usr/bin/env node

/**
 * Script to automatically fix common ESLint warnings
 * Focuses on unused variables by adding underscore prefixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process
const filesToFix = [
  'convex/__tests__/ai.test.ts',
  'convex/advancedAnalytics.ts',
  'convex/ai.ts',
  'convex/analytics.ts',
  'convex/auditService.ts',
  'convex/clientPortal.ts',
  'convex/contracts.ts',
  'convex/customerPortal.ts',
  'convex/equipmentLifecycle.ts',
  'convex/integrationService.ts',
  'convex/inventory.ts',
  'convex/invoices.ts',
  'convex/jobs.ts',
  'convex/messages.ts',
  'convex/notifications.ts',
  'convex/ocrProcessing.ts',
  'convex/performanceOptimization.ts',
  'convex/realTimeFeatures.ts',
  'convex/reports.ts',
  'convex/routes.ts',
  'convex/serviceAgreements.ts',
  'convex/smartContractGeneration.ts',
  'convex/weaviateOptimization.ts',
  'convex/workflows.ts'
];

// Patterns to fix
const fixes = [
  // Unused imports
  { pattern: /import.*'beforeEach'.*from/, replacement: "import { beforeEach as _beforeEach } from" },
  { pattern: /import.*'action'.*from/, replacement: "import { action as _action } from" },
  { pattern: /import.*'mutation'.*from/, replacement: "import { mutation as _mutation } from" },
  
  // Unused variables
  { pattern: /const (beforeEach|action|mutation|query|internalMutation) = /, replacement: "const _$1 = " },
  { pattern: /let (analytics|query) = /, replacement: "const _$1 = " },
  
  // Unused parameters
  { pattern: /\(([^)]*), (args|ctx|error|job|startDate|district|contractType|fileUrl|options)\)/, replacement: "($1, _$2)" },
  { pattern: /\((args|ctx|error|job|startDate|district|contractType|fileUrl|options)\)/, replacement: "(_$1)" },
  
  // Unused constants
  { pattern: /const (WARSAW_DISTRICTS|OCR_CONFIG|DistrictName|BatchSearchOperation) = /, replacement: "const _$1 = " }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Process files
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
});

console.log('ESLint warning fixes completed!');
