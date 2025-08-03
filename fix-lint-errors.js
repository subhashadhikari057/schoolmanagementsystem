#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing common linting errors...');

// Fix unused imports
const filesToFix = [
  'backend/scripts/__tests__/dev-utils.spec.ts',
  'backend/src/database/__tests__/database-operations.integration.spec.ts',
  'backend/src/shared/decorators/__tests__/roles.decorator.spec.ts',
  'backend/src/shared/middlewares/__tests__/audit.middleware.spec.ts',
  'backend/src/shared/utils/log-formatter.util.ts'
];

const fixes = [
  // Remove unused imports
  {
    pattern: /import { execSync, rmSync } from 'child_process';\nimport { join } from 'path';/g,
    replacement: "import { execSync } from 'child_process';"
  },
  {
    pattern: /import { execSync, fs } from 'fs';\nimport { join } from 'path';/g,
    replacement: "import { execSync } from 'child_process';"
  },
  // Fix unused variables by prefixing with underscore
  {
    pattern: /\berror\b(?=\s*[,\)])/g,
    replacement: '_error'
  },
  {
    pattern: /\bcheck\b(?=\s*[,\)])/g,
    replacement: '_check'
  },
  // Fix async functions without await
  {
    pattern: /async (\w+)\s*\([^)]*\)\s*{([^}]*(?!await)[^}]*)}/g,
    replacement: '$1($2) {'
  }
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  }
});

console.log('🎉 Linting fixes applied!');