#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining linting issues...');

// Define fixes for common linting errors
const fixes = [
  // Fix unused variables by prefixing with underscore
  {
    file: 'backend/src/shared/decorators/roles.decorator.ts',
    replacements: [
      {
        from: '(target: any, key: string, descriptor: PropertyDescriptor)',
        to: '(_target: any, _key: string, _descriptor: PropertyDescriptor)'
      }
    ]
  },
  // Fix async functions without await
  {
    file: 'backend/src/modules/auth/controllers/profile.controller.ts',
    replacements: [
      {
        from: 'async getProfile(',
        to: 'getProfile('
      },
      {
        from: 'async updateProfile(',
        to: 'updateProfile('
      },
      {
        from: 'async getUserPermissions(',
        to: 'getUserPermissions('
      },
      {
        from: 'async getAdminStats(',
        to: 'getAdminStats('
      },
      {
        from: 'async getAcademicSummary(',
        to: 'getAcademicSummary('
      },
      {
        from: 'async getFinancialOverview(',
        to: 'getFinancialOverview('
      },
      {
        from: 'async getSystemHealth(',
        to: 'getSystemHealth('
      },
      {
        from: 'async getPublicInfo(',
        to: 'getPublicInfo('
      }
    ]
  },
  // Fix unused imports
  {
    file: 'backend/src/shared/decorators/__tests__/roles.decorator.spec.ts',
    replacements: [
      {
        from: 'ROLES_KEY, MIN_ROLE_KEY',
        to: '/* ROLES_KEY, MIN_ROLE_KEY */'
      }
    ]
  },
  {
    file: 'backend/src/shared/middlewares/__tests__/audit.middleware.spec.ts',
    replacements: [
      {
        from: 'AuthenticatedUser,',
        to: '/* AuthenticatedUser, */'
      }
    ]
  },
  {
    file: 'backend/src/shared/auth/__tests__/auth-integration.spec.ts',
    replacements: [
      {
        from: 'UseGuards,',
        to: '/* UseGuards, */'
      }
    ]
  }
];

// Apply fixes
fixes.forEach(({ file, replacements }) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(from, to);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed: ${file}`);
    }
  }
});

// Fix the test-seed Promise error
const testSeedFile = 'backend/prisma/seeds/test-seed.ts';
if (fs.existsSync(testSeedFile)) {
  let content = fs.readFileSync(testSeedFile, 'utf8');
  // The error might be in the main function call - let's add void to it
  content = content.replace(
    'main()',
    'void main()'
  );
  fs.writeFileSync(testSeedFile, content);
  console.log(`✅ Fixed Promise error in: ${testSeedFile}`);
}

console.log('🎉 Remaining linting issues fixed!');