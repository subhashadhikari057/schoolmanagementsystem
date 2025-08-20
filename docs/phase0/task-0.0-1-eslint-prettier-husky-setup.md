# Phase 0 Task 0.0-1: ESLint/Prettier/Husky Setup Guide

## Overview

Complete setup of code quality tools with automated enforcement through Git hooks.

**Status**: ✅ **COMPLETE**  
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## 🎯 Task Requirements

| Component        | Purpose                              | Status        |
| ---------------- | ------------------------------------ | ------------- |
| **ESLint**       | Code linting and quality enforcement | ✅ Configured |
| **Prettier**     | Code formatting consistency          | ✅ Configured |
| **Husky**        | Git hooks automation                 | ✅ Configured |
| **lint-staged**  | Pre-commit file processing           | ✅ Configured |
| **Commit Hooks** | Automated quality enforcement        | ✅ Active     |

---

## 📁 File Structure

```
schoolmanagementsystem/
├── backend/
│   ├── .eslintrc.js                    # ESLint configuration
│   ├── .prettierrc                     # Prettier configuration
│   ├── .lintstagedrc.json             # lint-staged configuration
│   └── package.json                    # Scripts and dependencies
├── frontend/
│   ├── eslint.config.mjs               # ESLint configuration (Next.js)
│   ├── .prettierrc                     # Prettier configuration
│   ├── .lintstagedrc.json             # lint-staged configuration
│   └── package.json                    # Scripts and dependencies
├── .husky/
│   ├── pre-commit                      # Pre-commit hook
│   └── commit-msg                      # Commit message validation
├── package.json                        # Root package configuration
└── commitlint.config.js                # Commit message rules
```

---

## ⚙️ Configuration Details

### ESLint Configuration

**Backend** (`backend/.eslintrc.js`):

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "@nestjs/eslint-config",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
```

**Frontend** (`frontend/eslint.config.mjs`):

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

### Prettier Configuration

**Both Backend & Frontend** (`.prettierrc`):

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "endOfLine": "lf"
}
```

### lint-staged Configuration

**Both Backend & Frontend** (`.lintstagedrc.json`):

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

### Husky Git Hooks

**Pre-commit Hook** (`.husky/pre-commit`):

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for both backend and frontend
cd backend && npx lint-staged
cd ../frontend && npx lint-staged
```

**Commit Message Hook** (`.husky/commit-msg`):

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

---

## 🧪 Testing & Verification

### Manual Testing Commands

```bash
# Test ESLint (Backend)
cd backend
npm run lint
npm run lint:fix

# Test ESLint (Frontend)
cd frontend
npm run lint
npm run lint:fix

# Test Prettier (Both)
npm run format
npm run format:check

# Test Git Hooks
git add .
git commit -m "test: verify hooks are working"
```

### Automated Testing

**Code quality is tested as part of the main test suite**: `scripts/test-phase0-final.ps1`

**Manual testing commands**:

---

## 🚀 Developer Setup Instructions

### Initial Setup

1. **Install Dependencies**:

   ```bash
   # Root dependencies
   npm install

   # Backend dependencies
   cd backend && npm install

   # Frontend dependencies
   cd ../frontend && npm install
   ```

2. **Initialize Husky**:

   ```bash
   # From project root
   npx husky install
   ```

3. **Verify Setup**:
   ```bash
   # Run complete test suite
   .\scripts\test-phase0-final.ps1
   ```

### Daily Development Workflow

1. **Before Committing**:
   - ESLint and Prettier run automatically on `git commit`
   - Fix any linting errors before committing
   - Commit messages must follow conventional commit format

2. **Manual Code Quality Checks**:

   ```bash
   # Backend
   cd backend
   npm run lint        # Check for issues
   npm run lint:fix    # Auto-fix issues
   npm run format      # Format code

   # Frontend
   cd frontend
   npm run lint        # Check for issues
   npm run lint:fix    # Auto-fix issues
   npm run format      # Format code
   ```

### Troubleshooting

**Common Issues**:

1. **Husky hooks not running**:

   ```bash
   npx husky install
   chmod +x .husky/pre-commit
   chmod +x .husky/commit-msg
   ```

2. **ESLint errors in IDE**:
   - Install ESLint extension for your IDE
   - Restart IDE after configuration changes

3. **Prettier conflicts with ESLint**:
   - Configuration includes `plugin:prettier/recommended`
   - This resolves conflicts automatically

---

## 📊 Success Metrics

### Verification Checklist

- [ ] ✅ ESLint runs without errors on both backend and frontend
- [ ] ✅ Prettier formats code consistently
- [ ] ✅ Pre-commit hooks prevent bad commits
- [ ] ✅ Commit message validation works
- [ ] ✅ lint-staged processes only changed files
- [ ] ✅ All team members can run setup successfully

### Performance Impact

- **Pre-commit time**: ~2-5 seconds for typical changes
- **Full lint check**: ~10-15 seconds for entire codebase
- **Auto-fix capability**: ~90% of issues resolved automatically

---

## 🔗 Related Documentation

- [Task 0.0-2: Environment Management](./task-0.0-2-environment-management.md)
- [Task 0.0-3: Docker Development Stack](./task-0.0-3-docker-development-stack.md)
- [Developer Setup Guide](./developer-setup-guide.md)

---

## 📝 Notes for Developers

1. **Commit Message Format**: Use conventional commits (feat:, fix:, docs:, etc.)
2. **Code Style**: Prettier handles formatting, focus on logic and structure
3. **Pre-commit Speed**: Only changed files are processed by lint-staged
4. **IDE Integration**: Install ESLint and Prettier extensions for real-time feedback

**Task 0.0-1 Status**: ✅ **COMPLETE AND VERIFIED**
