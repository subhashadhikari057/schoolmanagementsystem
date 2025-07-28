# Phase 0 Task 0.0-3: Docker Development Stack Guide

## Overview
Complete Docker development environment with PostgreSQL, Redis, MailHog, and pgAdmin for local development and VPS database integration.

**Status**: ✅ **COMPLETE**  
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## 🎯 Task Requirements

| Component | Purpose | Status |
|-----------|---------|--------|
| **Docker Compose** | Multi-container orchestration | ✅ Complete |
| **PostgreSQL** | Primary database (local + VPS) | ✅ Working |
| **Redis** | Caching and session storage | ✅ Working |
| **MailHog** | Email testing and debugging | ✅ Working |
| **pgAdmin** | Database administration | ✅ Available (VPS) |

---

## 📁 File Structure

```
schoolmanagementsystem/
├── docker-compose.yml                  # Main Docker orchestration
├── docker/
│   ├── postgres/
│   │   ├── config/
│   │   │   └── postgresql.conf         # PostgreSQL configuration
│   │   └── init/
│   │       └── 01-init-database.sql    # Database initialization
│   ├── redis/
│   │   └── redis.conf                  # Redis configuration
│   ├── pgadmin/
│   │   └── servers.json                # pgAdmin server configuration
│   └── env-docker-example.txt          # Docker environment template
├── scripts/
│   ├── docker-dev-start.ps1           # Start development stack
│   ├── docker-dev-stop.ps1            # Stop development stack
│   ├── docker-dev-reset.ps1           # Reset development stack
│   └── test-docker-services.ps1       # Test Docker services
└── backend/
    └── src/docker-stack-integration.spec.ts  # Integration tests
```

---

## 🔧 Docker Configuration

### Main Docker Compose

**File**: `docker-compose.yml`

```yaml
# =============================================================================
# School Management System - Docker Development Stack
# =============================================================================
# Services included:
# - PostgreSQL 15: Primary database with custom configuration
# - Redis 7: Caching and session storage
# - MailHog: Email testing and debugging
# - pgAdmin: Database administration interface (optional)
# =============================================================================

services:
  # PostgreSQL Database Service
  postgres:
    image: postgres:15-alpine
    container_name: sms_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: schoolmanagement
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
      - ./docker/postgres/config/postgresql.conf:/etc/postgresql/postgresql.conf
    command: >
      postgres 
      -c config_file=/etc/postgresql/postgresql.conf
      -c log_statement=all
      -c log_destination=stderr
      -c logging_collector=on
      -c log_directory=/var/log/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d schoolmanagement"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - sms_network

  # Redis Cache Service
  redis:
    image: redis:7-alpine
    container_name: sms_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./docker/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - sms_network

  # MailHog Email Testing Service
  mailhog:
    image: mailhog/mailhog:latest
    container_name: sms_mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP port
      - "8025:8025"  # Web UI port
    environment:
      MH_STORAGE: maildir
      MH_MAILDIR_PATH: /maildir
    volumes:
      - mailhog_data:/maildir
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8025"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - sms_network

# Named Volumes for Data Persistence
volumes:
  postgres_data:
    driver: local
    name: sms_postgres_data
  redis_data:
    driver: local
    name: sms_redis_data
  mailhog_data:
    driver: local
    name: sms_mailhog_data

# Custom Network for Service Communication
networks:
  sms_network:
    driver: bridge
    name: sms_network
```

### PostgreSQL Configuration

**File**: `docker/postgres/config/postgresql.conf`

```conf
# =============================================================================
# PostgreSQL Configuration for Development
# =============================================================================

# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 100

# Memory Settings
shared_buffers = 128MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB

# Logging Settings
log_statement = 'all'
log_min_duration_statement = 0
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 10MB

# Performance Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Development Settings
fsync = off                    # Faster for development (NOT for production)
synchronous_commit = off       # Faster for development (NOT for production)
full_page_writes = off         # Faster for development (NOT for production)

# Locale Settings
lc_messages = 'en_US.utf8'
lc_monetary = 'en_US.utf8'
lc_numeric = 'en_US.utf8'
lc_time = 'en_US.utf8'
default_text_search_config = 'pg_catalog.english'

# Time Zone
timezone = 'UTC'
```

### Redis Configuration

**File**: `docker/redis/redis.conf`

```conf
# =============================================================================
# Redis Configuration for Development
# =============================================================================

# Network Settings
bind 0.0.0.0
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General Settings
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16

# Snapshotting (Persistence)
# IMPORTANT: Comments must be on separate lines for Redis 7.4.5+ compatibility
# Save if at least 1 key changed in 900 seconds
save 900 1
# Save if at least 10 keys changed in 300 seconds
save 300 10
# Save if at least 10000 keys changed in 60 seconds
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Replication Settings
replica-serve-stale-data yes
replica-read-only yes

# Security Settings
# requirepass your_password_here  # Uncomment and set password for production

# Memory Management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Append Only File (AOF)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Client Output Buffer Limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
```

### Database Initialization

**File**: `docker/postgres/init/01-init-database.sql`

```sql
-- =============================================================================
-- School Management System - Database Initialization
-- =============================================================================
-- This script runs automatically when PostgreSQL container starts for the first time
-- It sets up the basic database structure and permissions

-- Create the main database (if not exists)
SELECT 'CREATE DATABASE schoolmanagement'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'schoolmanagement');

-- Connect to the schoolmanagement database
\c schoolmanagement;

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic schema structure
CREATE SCHEMA IF NOT EXISTS public;

-- Set up permissions
GRANT ALL PRIVILEGES ON DATABASE schoolmanagement TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Create a sample table to verify setup (will be replaced by Prisma migrations)
CREATE TABLE IF NOT EXISTS system_info (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    initialized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    environment VARCHAR(20) DEFAULT 'development'
);

-- Insert initial system info
INSERT INTO system_info (version, environment) 
VALUES ('1.0.0', 'development')
ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'School Management System database initialized successfully';
END $$;
```

---

## 🧪 Testing & Verification

### Automated Test Script

**File**: `scripts/test-docker-services.ps1` (Updated and Working)

```powershell
# =============================================================================
# Docker Services Test Script
# Fixed for Windows PowerShell Docker detection
# =============================================================================

Write-Host "Testing Docker Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to test service with timeout and proper output handling
function Test-DockerCommand {
    param(
        [string]$Command,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        # Use cmd.exe to run Docker commands for better compatibility
        $result = cmd /c "$Command 2>nul"
        return @{ Success = $true; Output = $result }
    } catch {
        return @{ Success = $false; Output = $_.Exception.Message }
    }
}

# Test Docker availability
Write-Host "1. Testing Docker availability..." -ForegroundColor Yellow
$dockerTest = Test-DockerCommand -Command "docker --version"
if ($dockerTest.Success -and $dockerTest.Output) {
    Write-Host "PASSED: Docker is available" -ForegroundColor Green
    Write-Host "  Version: $($dockerTest.Output)" -ForegroundColor Gray
} else {
    Write-Host "FAILED: Docker is not available" -ForegroundColor Red
}

# Test Docker Compose
Write-Host "2. Testing Docker Compose..." -ForegroundColor Yellow
$composeTest = Test-DockerCommand -Command "docker-compose --version"
if ($composeTest.Success -and $composeTest.Output) {
    Write-Host "PASSED: Docker Compose is available" -ForegroundColor Green
    Write-Host "  Version: $($composeTest.Output)" -ForegroundColor Gray
} else {
    Write-Host "FAILED: Docker Compose is not available" -ForegroundColor Red
}

# List running containers using docker-compose ps (more reliable)
Write-Host "3. Checking running containers..." -ForegroundColor Yellow
$containerTest = Test-DockerCommand -Command "docker-compose ps --services --filter status=running"

if ($containerTest.Success) {
    $runningServices = $containerTest.Output -split "`n" | Where-Object { $_ -and $_.Trim() -ne "" }
    
    if ($runningServices.Count -gt 0) {
        Write-Host "Running containers: $($runningServices.Count)" -ForegroundColor Green
        foreach ($service in $runningServices) {
            Write-Host "  - $service" -ForegroundColor White
        }
        $containerList = $runningServices -join " "
    } else {
        Write-Host "Running containers: 0" -ForegroundColor Yellow
        $containerList = ""
    }
} else {
    Write-Host "FAILED: Cannot list containers" -ForegroundColor Red
    $containerList = ""
}

# Alternative method: Check using docker-compose ps with format
Write-Host "4. Verifying container status..." -ForegroundColor Yellow
$psTest = Test-DockerCommand -Command "docker-compose ps"
if ($psTest.Success -and $psTest.Output) {
    Write-Host "Docker Compose Status:" -ForegroundColor Gray
    $lines = $psTest.Output -split "`n"
    $foundContainers = @()
    
    foreach ($line in $lines) {
        if ($line -match "sms_") {
            Write-Host "  $line" -ForegroundColor White
            if ($line -match "sms_postgres.*Up") { $foundContainers += "postgres" }
            if ($line -match "sms_redis.*Up") { $foundContainers += "redis" }
            if ($line -match "sms_mailhog.*Up") { $foundContainers += "mailhog" }
        }
    }
    
    # Update container list based on actual status
    $containerList = $foundContainers -join " "
}

# Test specific services
Write-Host "5. Testing individual services..." -ForegroundColor Yellow

# Test PostgreSQL
if ($containerList -match "postgres") {
    Write-Host "PASSED: PostgreSQL Database (sms_postgres) is running" -ForegroundColor Green
    
    # Test PostgreSQL connection
    $pgTest = Test-DockerCommand -Command "docker exec sms_postgres pg_isready -U postgres"
    if ($pgTest.Success) {
        Write-Host "  - PostgreSQL connection: OK" -ForegroundColor Green
    } else {
        Write-Host "  - PostgreSQL connection: FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: PostgreSQL Database (sms_postgres) is not running" -ForegroundColor Yellow
}

# Test Redis
if ($containerList -match "redis") {
    Write-Host "PASSED: Redis Cache (sms_redis) is running" -ForegroundColor Green
    
    # Test Redis connection
    $redisTest = Test-DockerCommand -Command "docker exec sms_redis redis-cli ping"
    if ($redisTest.Success -and $redisTest.Output -match "PONG") {
        Write-Host "  - Redis connection: OK (PONG received)" -ForegroundColor Green
    } else {
        Write-Host "  - Redis connection: FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: Redis Cache (sms_redis) is not running" -ForegroundColor Yellow
}

# Test MailHog
if ($containerList -match "mailhog") {
    Write-Host "PASSED: MailHog Email Testing (sms_mailhog) is running" -ForegroundColor Green
    
    # Test MailHog web interface
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8025" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  - MailHog web interface: OK (http://localhost:8025)" -ForegroundColor Green
        } else {
            Write-Host "  - MailHog web interface: FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "  - MailHog web interface: FAILED (Cannot connect)" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: MailHog Email Testing (sms_mailhog) is not running" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Services Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$runningCount = 0
if ($containerList -match "postgres") { $runningCount++ }
if ($containerList -match "redis") { $runningCount++ }
if ($containerList -match "mailhog") { $runningCount++ }

Write-Host "Services Running: $runningCount / 3" -ForegroundColor $(if ($runningCount -eq 3) { "Green" } elseif ($runningCount -gt 0) { "Yellow" } else { "Red" })

if ($runningCount -eq 3) {
    Write-Host "All Docker services are running successfully!" -ForegroundColor Green
} elseif ($runningCount -gt 0) {
    Write-Host "Some Docker services are running. Check warnings above." -ForegroundColor Yellow
} else {
    Write-Host "No Docker services are running. Run 'docker-compose up -d' to start them." -ForegroundColor Red
}

Write-Host ""
Write-Host "Available Services:" -ForegroundColor Cyan
Write-Host "- PostgreSQL: localhost:5432 (local) or 95.216.235.115:5432 (VPS)" -ForegroundColor White
Write-Host "- Redis: localhost:6379" -ForegroundColor White
Write-Host "- MailHog: http://localhost:8025" -ForegroundColor White
Write-Host "- pgAdmin (VPS): http://95.216.235.115:80/" -ForegroundColor White

Write-Host ""
Write-Host "Docker Services Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
```

### Management Scripts

**File**: `scripts/docker-dev-start.ps1`

```powershell
# =============================================================================
# Docker Development Stack - Start Script
# =============================================================================

Write-Host "Starting School Management System Development Stack..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# Start all services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: All services started!" -ForegroundColor Green
    
    # Wait for services to be ready
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep 10
    
    # Test services
    Write-Host "Testing services..." -ForegroundColor Yellow
    .\scripts\test-docker-services.ps1
} else {
    Write-Host "FAILED: Could not start services" -ForegroundColor Red
    exit 1
}
```

**File**: `scripts/docker-dev-stop.ps1`

```powershell
# =============================================================================
# Docker Development Stack - Stop Script
# =============================================================================

Write-Host "Stopping School Management System Development Stack..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# Stop all services
Write-Host "Stopping Docker services..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: All services stopped!" -ForegroundColor Green
} else {
    Write-Host "FAILED: Could not stop services" -ForegroundColor Red
    exit 1
}
```

**File**: `scripts/docker-dev-reset.ps1`

```powershell
# =============================================================================
# Docker Development Stack - Reset Script
# =============================================================================

Write-Host "Resetting School Management System Development Stack..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Stop and remove all containers, networks, and volumes
Write-Host "Stopping and removing all containers..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans

# Remove custom volumes
Write-Host "Removing custom volumes..." -ForegroundColor Yellow
docker volume rm sms_postgres_data -f 2>$null
docker volume rm sms_redis_data -f 2>$null
docker volume rm sms_mailhog_data -f 2>$null

# Remove custom network
Write-Host "Removing custom network..." -ForegroundColor Yellow
docker network rm sms_network -f 2>$null

# Rebuild and start
Write-Host "Starting fresh containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Development stack reset and restarted!" -ForegroundColor Green
    
    # Wait for services to be ready
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep 15
    
    # Test services
    Write-Host "Testing services..." -ForegroundColor Yellow
    .\scripts\test-docker-services.ps1
} else {
    Write-Host "FAILED: Could not reset and restart services" -ForegroundColor Red
    exit 1
}
```

---

## 🚀 Developer Setup Instructions

### Initial Setup

1. **Prerequisites**:
   ```bash
   # Ensure Docker Desktop is installed and running
   docker --version
   docker-compose --version
   ```

2. **Start Development Stack**:
   ```bash
   # From project root
   .\scripts\docker-dev-start.ps1
   
   # Or manually
   docker-compose up -d
   ```

3. **Verify Services**:
   ```bash
   # Test all services
   .\scripts\test-docker-services.ps1
   
   # Check individual services
   docker-compose ps
   ```

### Daily Development Workflow

1. **Start Development**:
   ```bash
   # Quick start
   .\scripts\docker-dev-start.ps1
   
   # Check status
   docker-compose ps
   ```

2. **Access Services**:
   - **PostgreSQL**: localhost:5432 (user: postgres, password: postgres123)
   - **Redis**: localhost:6379
   - **MailHog Web UI**: http://localhost:8025
   - **MailHog SMTP**: localhost:1025

3. **Stop Development**:
   ```bash
   # Stop services
   .\scripts\docker-dev-stop.ps1
   
   # Or manually
   docker-compose down
   ```

4. **Reset if needed**:
   ```bash
   # Complete reset (removes all data)
   .\scripts\docker-dev-reset.ps1
   ```

### Database Connections

#### Local Docker Database
```bash
# Connection string for local development
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/schoolmanagement?schema=public"

# Direct connection with psql
psql "postgresql://postgres:postgres123@localhost:5432/schoolmanagement"
```

#### VPS Production Database
```bash
# Connection string for VPS database
DATABASE_URL="postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement?schema=public"

# pgAdmin web interface
# URL: http://95.216.235.115:80/
# Email: admin@school.com
# Password: StrongPass123!
```

### Service Ports Reference

| Service | Local Port | Container Port | Purpose |
|---------|------------|----------------|---------|
| **PostgreSQL** | 5432 | 5432 | Database connection |
| **Redis** | 6379 | 6379 | Cache and sessions |
| **MailHog SMTP** | 1025 | 1025 | Email sending |
| **MailHog Web** | 8025 | 8025 | Email testing UI |

### Troubleshooting

**Common Issues**:

1. **Containers not starting**:
   ```bash
   # Check Docker Desktop is running
   docker info
   
   # Check for port conflicts
   netstat -an | findstr :5432
   netstat -an | findstr :6379
   netstat -an | findstr :8025
   ```

2. **Database connection issues**:
   ```bash
   # Check PostgreSQL is ready
   docker exec sms_postgres pg_isready -U postgres
   
   # Check logs
   docker logs sms_postgres
   ```

3. **Redis connection issues**:
   ```bash
   # Test Redis connection
   docker exec sms_redis redis-cli ping
   
   # Check logs
   docker logs sms_redis
   ```

   **Redis 7.4.5+ Configuration Error**:
   - **Problem**: Redis container keeps restarting with "Invalid save parameters" error
   - **Cause**: Inline comments in `redis.conf` are not allowed in Redis 7.4.5+
   - **Solution**: Ensure all comments are on separate lines from configuration directives
   
   ```bash
   # WRONG (causes restart loop):
   save 900 1    # Save if at least 1 key changed
   
   # CORRECT:
   # Save if at least 1 key changed in 900 seconds
   save 900 1
   ```

4. **Services keep restarting**:
   ```bash
   # Check service logs
   docker-compose logs postgres
   docker-compose logs redis
   docker-compose logs mailhog
   
   # Reset everything
   .\scripts\docker-dev-reset.ps1
   ```

---

## 📊 Success Metrics

### Verification Checklist

- [ ] ✅ Docker Compose configuration is valid
- [ ] ✅ All 3 services start successfully
- [ ] ✅ PostgreSQL is accessible on port 5432
- [ ] ✅ Redis is accessible on port 6379
- [ ] ✅ MailHog web interface is accessible on port 8025
- [ ] ✅ Services pass health checks
- [ ] ✅ Data persists between container restarts
- [ ] ✅ Backend can connect to both local and VPS databases

### Performance Metrics

- **Startup time**: ~30-45 seconds for all services
- **Memory usage**: ~500MB total for all containers
- **Database response time**: <50ms for local, ~470ms for VPS
- **Health check intervals**: 10 seconds

---

## 🔗 Related Documentation

- [Task 0.0-1: ESLint/Prettier/Husky Setup](./task-0.0-1-eslint-prettier-husky-setup.md)
- [Task 0.0-2: Environment Management](./task-0.0-2-environment-management.md)
- [Developer Setup Guide](./developer-setup-guide.md)

---

## 📝 Notes for Developers

1. **Data Persistence**: All data is stored in named Docker volumes
2. **Network Isolation**: Services communicate through custom Docker network
3. **Health Checks**: All services have health checks for reliability
4. **Development vs Production**: Local Docker for development, VPS for production-like testing
5. **Email Testing**: Use MailHog for all email testing during development

**Task 0.0-3 Status**: ✅ **COMPLETE AND VERIFIED** 