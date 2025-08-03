# 🛠️ Development Utilities - School Management System

A comprehensive suite of development utilities for efficient database management, log analysis, and development workflow automation.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Development Manager](#development-manager)
- [Database Management](#database-management)
- [Log Management](#log-management)
- [Development Workflow](#development-workflow)
- [Testing Utilities](#testing-utilities)
- [Code Quality Tools](#code-quality-tools)
- [System Maintenance](#system-maintenance)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Development Utilities provide a unified interface for common development tasks:

- **Database Management**: Reset, seed, migrate, backup, and restore operations
- **Log Analysis**: Format, analyze, and monitor application logs
- **Development Workflow**: Start/stop services, run tests, manage dependencies
- **Code Quality**: Linting, formatting, and validation tools
- **System Maintenance**: Cache cleanup, build artifact management

## 🚀 Quick Start

### Using the Development Manager (Recommended)

```powershell
# Database operations
.\scripts\dev-manager.ps1 db reset-and-seed comprehensive
.\scripts\dev-manager.ps1 db backup production-backup

# Log analysis
.\scripts\dev-manager.ps1 logs analyze backend/logs/application.log
.\scripts\dev-manager.ps1 logs tail backend/logs/application.log 100

# Development workflow
.\scripts\dev-manager.ps1 dev start
.\scripts\dev-manager.ps1 test all

# System maintenance
.\scripts\dev-manager.ps1 clean cache
```

### Using NPM Scripts (Alternative)

```bash
# Database operations
npm run db:reset-and-seed
npm run db:backup

# Log operations
npm run logs:analyze
npm run logs:tail

# Development workflow
npm run dev:start
npm run test:all
```

## 🎮 Development Manager

The Development Manager (`scripts/dev-manager.ps1`) is the central command-line interface for all development utilities.

### Command Structure

```powershell
.\scripts\dev-manager.ps1 <command> <subcommand> [options...]
```

### Available Commands

| Command | Description | Examples |
|---------|-------------|----------|
| `db` | Database management | `db reset`, `db seed comprehensive` |
| `logs` | Log management and analysis | `logs analyze`, `logs tail` |
| `dev` | Development workflow | `dev start`, `dev status` |
| `test` | Test execution | `test all`, `test integration` |
| `lint` | Code quality | `lint fix`, `lint check` |
| `clean` | System cleanup | `clean cache`, `clean all` |

### Getting Help

```powershell
# General help
.\scripts\dev-manager.ps1 help

# Command-specific help
.\scripts\dev-manager.ps1 db help
.\scripts\dev-manager.ps1 logs help
```

## 🗄️ Database Management

### Reset Operations

```powershell
# Reset database schema only
.\scripts\dev-manager.ps1 db reset

# Reset and seed with comprehensive data
.\scripts\dev-manager.ps1 db reset-and-seed comprehensive

# Reset and seed with test data
.\scripts\dev-manager.ps1 db reset-and-seed test

# Complete fresh setup (with confirmation)
.\scripts\dev-manager.ps1 db fresh
```

### Seeding Operations

```powershell
# Comprehensive seed (production-like data)
.\scripts\dev-manager.ps1 db seed comprehensive

# Basic seed (minimal data)
.\scripts\dev-manager.ps1 db seed basic

# Test seed (lightweight test data)
.\scripts\dev-manager.ps1 db seed test
```

### Backup and Restore

```powershell
# Create backup with auto-generated name
.\scripts\dev-manager.ps1 db backup

# Create backup with custom name
.\scripts\dev-manager.ps1 db backup my-feature-backup

# Check database status
.\scripts\dev-manager.ps1 db status
```

### Advanced Database Operations

```typescript
// Using the DatabaseManager class directly
import { DatabaseManager, DevLogger } from './scripts/dev-utils';

const logger = new DevLogger();
const dbManager = new DatabaseManager(logger);

// Reset and seed programmatically
await dbManager.resetAndSeed('comprehensive');

// Create backup
const backupName = await dbManager.backup('feature-branch-backup');
```

## 📊 Log Management

### Log Analysis

```powershell
# Analyze log file and show statistics
.\scripts\dev-manager.ps1 logs analyze backend/logs/application.log

# Format and display logs with colors
.\scripts\dev-manager.ps1 logs format backend/logs/application.log

# Tail logs in real-time
.\scripts\dev-manager.ps1 logs tail backend/logs/application.log 50

# Watch logs continuously
.\scripts\dev-manager.ps1 logs watch backend/logs/application.log
```

### Log Formatting Features

The log formatter provides advanced parsing and analysis:

- **Multi-format Support**: JSON logs and standard text logs
- **Color-coded Output**: Different colors for log levels
- **Metadata Display**: Trace IDs, user IDs, duration metrics
- **Performance Analysis**: Slow query detection, error rate calculation
- **Export Capabilities**: JSON, CSV, and TXT formats

### Using Log Formatter Programmatically

```typescript
import { LogFormatter } from './src/shared/utils/log-formatter.util';

// Parse log file
const entries = LogFormatter.parseLogFile('logs/application.log');

// Analyze logs
const analytics = LogFormatter.analyzeLog(entries);

// Generate report
const report = LogFormatter.generateReport(analytics);
console.log(report);

// Filter logs
const errorLogs = LogFormatter.filterLogs(entries, {
  level: ['ERROR'],
  timeRange: {
    start: new Date('2023-01-01'),
    end: new Date('2023-01-02')
  }
});

// Export filtered logs
LogFormatter.exportLogs(errorLogs, 'json', 'error-logs.json');
```

### Log Cleanup

```powershell
# Clear specific log file (with confirmation)
.\scripts\dev-manager.ps1 logs clear backend/logs/application.log

# Clean all log files
.\scripts\dev-manager.ps1 clean logs
```

## ⚡ Development Workflow

### Environment Management

```powershell
# Start development environment
.\scripts\dev-manager.ps1 dev start

# Stop development environment
.\scripts\dev-manager.ps1 dev stop

# Restart development environment
.\scripts\dev-manager.ps1 dev restart

# Check environment status
.\scripts\dev-manager.ps1 dev status
```

### Complete Setup

```powershell
# Run complete development setup
.\scripts\dev-manager.ps1 dev setup

# Update all dependencies
.\scripts\dev-manager.ps1 dev update
```

### What `dev start` Does

1. **Starts Docker Services**: PostgreSQL, Redis, MailHog
2. **Waits for Services**: Ensures all services are ready
3. **Tests Connectivity**: Verifies database and cache connections
4. **Shows Status**: Displays service URLs and next steps

### Manual Server Startup

After running `dev start`, manually start the application servers:

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 🧪 Testing Utilities

### Test Execution

```powershell
# Run all tests (backend, frontend, shared-types)
.\scripts\dev-manager.ps1 test all

# Run backend tests only
.\scripts\dev-manager.ps1 test backend

# Run specific test types
.\scripts\dev-manager.ps1 test backend unit
.\scripts\dev-manager.ps1 test backend integration
.\scripts\dev-manager.ps1 test backend e2e

# Run with coverage
.\scripts\dev-manager.ps1 test coverage

# Run in watch mode
.\scripts\dev-manager.ps1 test watch
```

### Test Categories

| Test Type | Description | Command |
|-----------|-------------|---------|
| **Unit** | Individual component tests | `test backend unit` |
| **Integration** | Component interaction tests | `test backend integration` |
| **E2E** | End-to-end workflow tests | `test backend e2e` |
| **Frontend** | React component tests | `test frontend` |
| **Shared** | Shared types validation | `test shared` |

## ✨ Code Quality Tools

### Linting and Formatting

```powershell
# Check code quality issues
.\scripts\dev-manager.ps1 lint check

# Fix code quality issues automatically
.\scripts\dev-manager.ps1 lint fix

# Format code with Prettier
.\scripts\dev-manager.ps1 lint format
```

### What Gets Checked

- **ESLint Rules**: TypeScript best practices, security patterns
- **Prettier Formatting**: Consistent code style
- **Import Organization**: Proper import ordering
- **Type Safety**: Strict TypeScript validation

## 🧹 System Maintenance

### Cache Management

```powershell
# Clean and reinstall all dependencies
.\scripts\dev-manager.ps1 clean cache

# Clean only log files
.\scripts\dev-manager.ps1 clean logs

# Clean build artifacts
.\scripts\dev-manager.ps1 clean build

# Complete system cleanup (with confirmation)
.\scripts\dev-manager.ps1 clean all
```

### Docker Cleanup

```powershell
# Reset Docker environment (removes all data)
.\scripts\dev-manager.ps1 clean docker
```

**⚠️ Warning**: Docker cleanup removes all database data and requires confirmation.

## 🔧 Advanced Usage

### Custom Log Analysis

```typescript
import { LogFormatter, ParsedLogEntry } from './src/shared/utils/log-formatter.util';

// Custom log filtering
const customFilter = (entries: ParsedLogEntry[]) => {
  return LogFormatter.filterLogs(entries, {
    level: ['ERROR', 'WARN'],
    searchTerm: 'database',
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    }
  });
};

// Performance analysis
const performanceAnalysis = (entries: ParsedLogEntry[]) => {
  const analytics = LogFormatter.analyzeLog(entries);
  
  console.log(`Average Response Time: ${analytics.performanceMetrics.averageResponseTime}ms`);
  console.log(`Error Rate: ${analytics.performanceMetrics.errorRate}%`);
  
  if (analytics.performanceMetrics.slowQueries.length > 0) {
    console.log('Top 5 Slowest Operations:');
    analytics.performanceMetrics.slowQueries.slice(0, 5).forEach((query, index) => {
      console.log(`${index + 1}. ${query.duration}ms - ${query.message}`);
    });
  }
};
```

### Programmatic Database Operations

```typescript
import { DatabaseManager, DevLogger } from './scripts/dev-utils';

const logger = new DevLogger('custom.log');
const dbManager = new DatabaseManager(logger);

// Custom workflow
async function customDatabaseWorkflow() {
  try {
    // Create backup before changes
    const backupName = await dbManager.backup('before-feature-update');
    logger.success('WORKFLOW', `Backup created: ${backupName}`);
    
    // Reset and apply new schema
    await dbManager.reset();
    
    // Seed with test data for development
    await dbManager.seed('test');
    
    logger.success('WORKFLOW', 'Database workflow completed successfully');
  } catch (error) {
    logger.error('WORKFLOW', `Workflow failed: ${error.message}`);
    throw error;
  }
}
```

### Custom Development Scripts

```typescript
// Create custom development utilities
import { DevLogger } from './scripts/dev-utils';

const logger = new DevLogger('custom-script.log');

async function customTask() {
  logger.section('Custom Development Task');
  
  try {
    logger.info('CUSTOM', 'Starting custom task...');
    
    // Your custom logic here
    
    logger.success('CUSTOM', 'Custom task completed successfully');
  } catch (error) {
    logger.error('CUSTOM', `Custom task failed: ${error.message}`);
    throw error;
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Errors

```powershell
# Check Docker services
.\scripts\dev-manager.ps1 dev status

# Restart Docker services
.\scripts\dev-manager.ps1 dev restart

# Check database status
.\scripts\dev-manager.ps1 db status
```

#### Permission Errors

```powershell
# Run PowerShell as Administrator
# Or check file permissions in project directory
```

#### Dependency Issues

```powershell
# Clean and reinstall dependencies
.\scripts\dev-manager.ps1 clean cache
```

#### Log File Issues

```powershell
# Check if log file exists
.\scripts\dev-manager.ps1 logs analyze backend/logs/application.log

# Clear corrupted log files
.\scripts\dev-manager.ps1 logs clear backend/logs/application.log
```

### Debug Mode

Enable debug logging for detailed output:

```typescript
// In your custom scripts
const logger = new DevLogger('debug.log', true);
logger.debug('DEBUG', 'Detailed debug information');
```

### Getting Help

```powershell
# General help
.\scripts\dev-manager.ps1 help

# Command-specific help
.\scripts\dev-manager.ps1 <command> help

# Show available options
.\scripts\dev-manager.ps1 db help
.\scripts\dev-manager.ps1 logs help
.\scripts\dev-manager.ps1 dev help
```

## 📚 Integration with Existing Workflow

### Git Hooks Integration

The development utilities integrate with existing Git hooks:

```bash
# Pre-commit hook runs
npm run lint:fix
npm run test:quick

# Pre-push hook runs
npm run test:all
```

### CI/CD Integration

```yaml
# Example GitHub Actions integration
- name: Run Tests
  run: |
    .\scripts\dev-manager.ps1 test all
    
- name: Check Code Quality
  run: |
    .\scripts\dev-manager.ps1 lint check
```

### IDE Integration

Most utilities can be run from VS Code tasks:

```json
{
  "label": "Reset and Seed Database",
  "type": "shell",
  "command": ".\\scripts\\dev-manager.ps1",
  "args": ["db", "reset-and-seed", "comprehensive"]
}
```

## 🎯 Best Practices

### Daily Development Workflow

```powershell
# Morning setup
.\scripts\dev-manager.ps1 dev start
.\scripts\dev-manager.ps1 test all

# During development
.\scripts\dev-manager.ps1 db reset-and-seed test  # When needed
.\scripts\dev-manager.ps1 logs tail backend/logs/application.log  # For debugging

# Before committing
.\scripts\dev-manager.ps1 lint fix
.\scripts\dev-manager.ps1 test all

# End of day
.\scripts\dev-manager.ps1 dev stop
```

### Database Management Best Practices

1. **Always backup before major changes**
2. **Use test seeds for development**
3. **Use comprehensive seeds for integration testing**
4. **Monitor database status regularly**

### Log Management Best Practices

1. **Analyze logs regularly for performance issues**
2. **Clear old logs periodically**
3. **Use structured logging in application code**
4. **Monitor error rates and patterns**

---

## 📞 Support

For issues or questions about the development utilities:

1. Check the troubleshooting section above
2. Run the help commands for specific guidance
3. Check the test files for usage examples
4. Review the source code in `backend/scripts/dev-utils.ts`

The development utilities are designed to make your development workflow more efficient and reliable. Use them regularly to maintain a healthy development environment!