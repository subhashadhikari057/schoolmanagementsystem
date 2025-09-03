import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Base recommended rules for modern JavaScript
  js.configs.recommended,

  // TypeScript & Prettier compatibility
  ...compat.extends('plugin:@typescript-eslint/recommended', 'prettier'),

  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'prisma/client/**',
      'generate-jwt-keys.js',
      'generate-password-hash.js',
      'check-classes.js',
      'check-data.js',
      'check-database.js',
      'check-recent-calendar.js',
      'update-working-days.js',
      'test-eventscope-logic.js',
      'test-eventscope.js',
      'commitlint.config.cjs',
      '**/*.spec.ts',
      '**/*.test.ts',
    ],
  },

  // TypeScript-specific overrides
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
    },
  },
];
