# 🗄️ Database Management Guide & Best Practices

## 🎯 **Overview**

This guide provides practical examples and best practices for managing the School Management System database hosted on VPS infrastructure. All operations are optimized for remote PostgreSQL database management.

## 🌐 **VPS Database Configuration**

### **Connection Details**

```bash
Host: 95.216.235.115
Port: 5432
Database: schoolmanagement
User: schooladmin
Password: StrongPass123!
SSL: Enabled
```

### **Environment Setup**

```bash
# Primary database connection
DATABASE_URL="postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement?schema=public"

# Test database connection (if separate)
TEST_DATABASE_URL="postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement_test?schema=public"
```

## 📋 **Daily Operations**

### **1. Database Seeding**

**✅ Initial Setup (New Environment):**

```bash
# Full comprehensive seeding
npm run seed:comprehensive

# Check seeding results
npm run migration:utils status
```

**✅ Production Deployment:**

```bash
# Production-safe seeding (system users only)
NODE_ENV=production npm run seed:comprehensive

# Verify production setup
npm test -- --testNamePattern="should verify database is ready"
```

**✅ Development Environment:**

```bash
# Development with test data
NODE_ENV=development npm run seed:comprehensive

# Verify all test users created
npm test -- --testNamePattern="should seed system users successfully"
```

### **2. Migration Management**

**✅ Check Migration Status:**

```bash
# View current migration status
npm run migration:utils status

# Validate migration integrity
npm run migration:utils validate
```

**✅ Apply New Migrations:**

```bash
# Generate new migration
npx prisma migrate dev --name add_new_feature

# Create rollback script (manual)
echo "-- Rollback for add_new_feature" > prisma/migrations/[timestamp]_add_new_feature/rollback.sql

# Validate after migration
npm run migration:utils validate
```

**✅ Rollback Migrations:**

```bash
# Rollback last migration
npm run migration:utils rollback --steps=1 --force

# Rollback to specific migration
npm run migration:utils rollback --target=20250726083043_init_phase1 --force

# Dry run (see what would happen)
npm run migration:utils rollback --steps=1 --dry-run
```

### **3. Backup Operations**

**✅ Create Backups:**

```bash
# Create named backup
npm run migration:utils backup "pre-deployment-$(date +%Y%m%d-%H%M)"

# Create backup before major changes
npm run migration:utils backup "before-schema-update"

# List all backups
npm run migration:utils list-backups
```

**✅ Restore from Backup:**

```bash
# Restore from specific backup
npm run migration:utils restore "path/to/backup-20250131-1430.sql"

# Emergency restore (use latest backup)
LATEST_BACKUP=$(ls -t prisma/backups/*.sql | head -1)
npm run migration:utils restore "$LATEST_BACKUP"
```

**✅ Backup Maintenance:**

```bash
# Clean old backups (keep 10 most recent)
npm run migration:utils clean-backups 10

# Clean old backups (keep 5 most recent)
npm run migration:utils clean-backups 5
```

## 🧪 **Testing & Validation**

### **Comprehensive Database Testing**

**✅ Full Test Suite:**

```bash
# Run all database tests
npm test -- --testPathPattern="database-operations"

# Run with verbose output
npm test -- --testPathPattern="database-operations" --verbose
```

**✅ Specific Test Categories:**

```bash
# VPS connectivity tests
npm test -- --testNamePattern="VPS Database Connectivity"

# Seeding operation tests
npm test -- --testNamePattern="Database Seeding Operations"

# Migration management tests
npm test -- --testNamePattern="Migration Management"

# Performance tests
npm test -- --testNamePattern="Database Performance"
```

**✅ Quick Health Checks:**

```bash
# Test VPS connection
npm test -- --testNamePattern="should connect to VPS PostgreSQL"

# Verify database readiness
npm test -- --testNamePattern="should verify database is ready"

# Check performance
npm test -- --testNamePattern="should measure database response time"
```

### **Manual Verification**

**✅ Database Connection:**

```bash
# Test connection using psql
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "SELECT version();"

# Test connection using Prisma
npx prisma db pull --preview-feature
```

**✅ Schema Validation:**

```bash
# Generate Prisma client
npx prisma generate

# Validate schema against database
npx prisma validate

# View database in browser
npx prisma studio
```

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

**❌ Connection Timeout:**

```bash
# Problem: Connection to VPS database times out
# Solution: Check network connectivity and firewall settings

# Test basic connectivity
ping 95.216.235.115

# Test port connectivity
telnet 95.216.235.115 5432

# Increase timeout in tests
TEST_TIMEOUT=60000 npm test -- --testPathPattern="database-operations"
```

**❌ Migration Conflicts:**

```bash
# Problem: Migration conflicts or failed migrations
# Solution: Reset and reapply migrations

# Check migration status
npm run migration:utils status

# Reset migrations (development only!)
npx prisma migrate reset --force

# Reapply migrations
npx prisma migrate deploy

# Re-seed database
npm run seed:comprehensive
```

**❌ Seeding Failures:**

```bash
# Problem: Seeding fails with duplicate key errors
# Solution: Use skip existing data option

# Skip existing data during seeding
SKIP_EXISTING=true npm run seed:comprehensive

# Or clear and re-seed (development only!)
npx prisma migrate reset --force
npm run seed:comprehensive
```

**❌ Backup/Restore Issues:**

```bash
# Problem: pg_dump/psql not found
# Solution: Install PostgreSQL client tools

# Windows (using Chocolatey)
choco install postgresql

# Or use Docker
docker run --rm postgres:16 pg_dump --help

# Update PATH to include PostgreSQL binaries
export PATH="/c/Program Files/PostgreSQL/16/bin:$PATH"
```

### **Performance Issues**

**❌ Slow Query Performance:**

```bash
# Problem: Database queries are slow
# Solution: Analyze and optimize

# Run performance tests
npm test -- --testNamePattern="Database Performance"

# Check query execution plans
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "EXPLAIN ANALYZE SELECT * FROM \"User\" LIMIT 10;"

# Monitor database performance
npm test -- --testNamePattern="should measure database response time"
```

**❌ Connection Pool Exhaustion:**

```bash
# Problem: Too many database connections
# Solution: Optimize connection usage

# Check active connections
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "SELECT count(*) FROM pg_stat_activity;"

# Restart application to reset connections
# Update Prisma connection pool settings in schema.prisma
```

## 🔒 **Security Best Practices**

### **Credential Management**

**✅ Environment Variables:**

```bash
# Never hardcode credentials
# ❌ Bad
DATABASE_URL="postgresql://user:password@host:5432/db"

# ✅ Good - use environment variables
DATABASE_URL="${DATABASE_URL}"

# Store in .env file (never commit)
echo 'DATABASE_URL="postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement"' >> .env
```

**✅ Connection Security:**

```bash
# Always use SSL connections
DATABASE_URL="postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement?sslmode=require"

# Verify SSL in tests
npm test -- --testNamePattern="should verify database configuration"
```

### **Access Control**

**✅ User Permissions:**

```bash
# Verify database user has appropriate permissions
npm test -- --testNamePattern="should verify database permissions"

# Check user roles in database
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "SELECT rolname, rolsuper, rolcreatedb FROM pg_roles WHERE rolname = 'schooladmin';"
```

**✅ Audit Trail:**

```bash
# Ensure audit logging is working
npm test -- --testNamePattern="should create seed audit log"

# Check recent audit logs
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "SELECT * FROM \"AuditLog\" ORDER BY timestamp DESC LIMIT 10;"
```

## 📊 **Monitoring & Maintenance**

### **Regular Maintenance Tasks**

**✅ Weekly Tasks:**

```bash
# Run comprehensive tests
npm test -- --testPathPattern="database-operations"

# Clean old backups
npm run migration:utils clean-backups 10

# Validate migration integrity
npm run migration:utils validate
```

**✅ Monthly Tasks:**

```bash
# Performance analysis
npm test -- --testNamePattern="Database Performance"

# Database statistics
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC;"

# Create monthly backup
npm run migration:utils backup "monthly-backup-$(date +%Y%m)"
```

### **Performance Monitoring**

**✅ Query Performance:**

```bash
# Monitor slow queries
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"
```

**✅ Connection Monitoring:**

```bash
# Monitor active connections
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "
SELECT
  datname,
  usename,
  application_name,
  state,
  query_start
FROM pg_stat_activity
WHERE state = 'active';"
```

## 🚀 **Advanced Operations**

### **Database Optimization**

**✅ Index Management:**

```bash
# Check index usage
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "
SELECT
  indexrelname as index_name,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;"

# Analyze table statistics
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "ANALYZE;"
```

**✅ Vacuum Operations:**

```bash
# Vacuum analyze (maintenance)
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "VACUUM ANALYZE;"

# Check vacuum statistics
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables;"
```

### **Data Migration**

**✅ Large Data Operations:**

```bash
# Batch data operations for large datasets
# Use transactions and batching for performance

# Example: Batch user updates
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -c "
BEGIN;
UPDATE \"User\" SET \"updatedAt\" = NOW() WHERE \"createdAt\" < NOW() - INTERVAL '1 year';
COMMIT;"
```

**✅ Data Export/Import:**

```bash
# Export specific tables
pg_dump -h 95.216.235.115 -p 5432 -U schooladmin -d schoolmanagement -t "User" --no-password > users_export.sql

# Import data
psql "postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement" -f users_export.sql
```

## 📋 **Quick Reference**

### **Essential Commands**

| Operation              | Command                                               |
| ---------------------- | ----------------------------------------------------- |
| **Seed Database**      | `npm run seed:comprehensive`                          |
| **Migration Status**   | `npm run migration:utils status`                      |
| **Create Backup**      | `npm run migration:utils backup "name"`               |
| **Rollback Migration** | `npm run migration:utils rollback --steps=1 --force`  |
| **Run Tests**          | `npm test -- --testPathPattern="database-operations"` |
| **Validate Schema**    | `npm run migration:utils validate`                    |

### **Environment Variables**

| Variable        | Purpose                         | Example                               |
| --------------- | ------------------------------- | ------------------------------------- |
| `DATABASE_URL`  | Primary database connection     | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV`      | Environment type                | `development`, `production`, `test`   |
| `SKIP_EXISTING` | Skip existing data in seeding   | `true`, `false`                       |
| `TEST_TIMEOUT`  | Test timeout for VPS operations | `30000` (30 seconds)                  |

### **File Locations**

| Component             | Path                                                                     |
| --------------------- | ------------------------------------------------------------------------ |
| **Seeding System**    | `backend/prisma/seeds/comprehensive-seed.ts`                             |
| **Migration Utils**   | `backend/prisma/migrations/migration-utils.ts`                           |
| **Rollback Scripts**  | `backend/prisma/migrations/[migration]/rollback.sql`                     |
| **Integration Tests** | `backend/src/database/__tests__/database-operations.integration.spec.ts` |
| **Backups**           | `backend/prisma/backups/`                                                |

---

**🎉 With this comprehensive database management system, you have robust, secure, and efficient database operations for your VPS-hosted School Management System!**
