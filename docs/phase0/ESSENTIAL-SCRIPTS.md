# 🚀 Essential Scripts Reference

## Overview
This document lists the **6 ESSENTIAL SCRIPTS** for the School Management System development environment. All redundant scripts have been removed to keep the project clean and maintainable.

---

## 📋 Essential Scripts (6 Total)

### 1. **`setup-new-developer.ps1`** - AUTOMATED SETUP
**Purpose**: Complete automated setup for new developers
**When to use**: First time setup or when onboarding new team members

```powershell
.\scripts\setup-new-developer.ps1
```

**What it does**:
- ✅ Checks prerequisites (Node.js, Docker, Git)
- ✅ Installs all dependencies (root, backend, frontend)
- ✅ Creates and configures `.env` file
- ✅ Initializes Git hooks (ESLint, Prettier, Husky)
- ✅ Starts Docker services
- ✅ Tests database connection
- ✅ Runs verification tests
- ✅ Shows next steps

---

### 2. **`test-phase0-final.ps1`** - MAIN TEST SUITE
**Purpose**: Complete system verification (27 tests)
**When to use**: To verify entire development environment is working

```powershell
.\scripts\test-phase0-final.ps1
```

**What it tests**:
- ✅ Core files and configuration (7 tests)
- ✅ Management scripts (5 tests)
- ✅ VPS database connection (1 test)
- ✅ Backend application structure (7 tests)
- ✅ Documentation (5 tests)
- ✅ Docker configuration (2 tests)

**Expected Result**: `Tests Passed: 27 / 27 (100%)`

---

### 3. **`test-docker-services.ps1`** - DOCKER SERVICES TEST
**Purpose**: Test Docker services specifically
**When to use**: To check if Docker containers are running properly

```powershell
.\scripts\test-docker-services.ps1
```

**What it tests**:
- ✅ Docker availability
- ✅ Docker Compose availability
- ✅ PostgreSQL container status and connection
- ✅ Redis container status and connection
- ✅ MailHog container status and web interface

**Expected Result**: `Services Running: 3 / 3`

---

### 4. **`docker-dev-start.ps1`** - START DEVELOPMENT STACK
**Purpose**: Start all Docker services for development
**When to use**: Beginning of each development session

```powershell
.\scripts\docker-dev-start.ps1
```

**What it does**:
- ✅ Starts PostgreSQL, Redis, and MailHog containers
- ✅ Waits for services to be ready
- ✅ Tests service connectivity
- ✅ Shows service status

---

### 5. **`docker-dev-stop.ps1`** - STOP DEVELOPMENT STACK
**Purpose**: Stop all Docker services
**When to use**: End of development session or when switching projects

```powershell
.\scripts\docker-dev-stop.ps1
```

**What it does**:
- ✅ Stops all Docker containers
- ✅ Preserves data volumes
- ✅ Confirms successful shutdown

---

### 6. **`docker-dev-reset.ps1`** - RESET DEVELOPMENT STACK
**Purpose**: Complete reset of Docker environment
**When to use**: When you need fresh containers or to fix Docker issues

```powershell
.\scripts\docker-dev-reset.ps1
```

**What it does**:
- ✅ Stops and removes all containers
- ✅ Removes all data volumes (⚠️ DATA LOSS)
- ✅ Removes custom networks
- ✅ Rebuilds and starts fresh containers
- ✅ Tests new environment

**⚠️ WARNING**: This removes all database data!

---

## 🎯 Daily Usage Patterns

### **New Developer Setup**:
```powershell
# One command setup
.\scripts\setup-new-developer.ps1
```

### **Daily Development Start**:
```powershell
# Start Docker services
.\scripts\docker-dev-start.ps1

# Start backend (Terminal 1)
cd backend && npm run start:dev

# Start frontend (Terminal 2)  
cd frontend && npm run dev
```

### **Daily Development End**:
```powershell
# Stop backend/frontend: Ctrl+C in terminals
# Stop Docker services
.\scripts\docker-dev-stop.ps1
```

### **Troubleshooting**:
```powershell
# Test everything
.\scripts\test-phase0-final.ps1

# Test Docker specifically
.\scripts\test-docker-services.ps1

# Reset if needed (DANGER: removes data)
.\scripts\docker-dev-reset.ps1
```

---

## 🗑️ Removed Scripts (No Longer Needed)

The following scripts were **REMOVED** because they were redundant:

- ❌ `test-phase0-comprehensive.ps1` - Duplicate of test-phase0-final.ps1
- ❌ `test-phase0-task3-simple.ps1` - Replaced by better tests
- ❌ `diagnose-docker-setup.ps1` - Functionality in test-docker-services.ps1
- ❌ `test-phase0-task2-simple.ps1` - Individual task tests not needed
- ❌ `test-phase0-task2.ps1` - Covered by final test
- ❌ `test-phase0-simple.ps1` - Too basic
- ❌ `test-phase0-task1.ps1` - Covered by final test
- ❌ `test-phase0-task1.bat` - PowerShell is better
- ❌ `test-phase0-task1.sh` - Not needed for Windows

---

## 📊 Script Dependencies

```
setup-new-developer.ps1
├── docker-dev-start.ps1
├── test-docker-services.ps1
└── test-phase0-final.ps1

docker-dev-start.ps1
└── test-docker-services.ps1

docker-dev-reset.ps1
├── docker-dev-start.ps1
└── test-docker-services.ps1
```

---

## 🎉 Benefits of This Cleanup

### **For Developers**:
- ✅ **Less confusion** - Only 6 scripts to remember
- ✅ **Clear purpose** - Each script has a specific role
- ✅ **No duplicates** - No wondering which script to use
- ✅ **Faster onboarding** - Less to learn

### **For Project Maintenance**:
- ✅ **Easier updates** - Fewer files to maintain
- ✅ **Less documentation** - Simpler to document
- ✅ **Cleaner repository** - No redundant files
- ✅ **Better testing** - One comprehensive test suite

---

**💡 Remember**: These 6 scripts are all you need for complete development environment management! 