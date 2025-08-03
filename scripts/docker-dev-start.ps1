# =============================================================================
# School Management System - Docker Development Environment Startup
# =============================================================================
# This script starts the complete Docker development stack
# Usage: .\scripts\docker-dev-start.ps1 [--with-admin-tools]
# =============================================================================

param(
    [switch]$WithAdminTools,
    [switch]$Help
)

# Display help information
if ($Help) {
    Write-Host "Docker Development Environment Startup Script" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\docker-dev-start.ps1                 Start core services only"
    Write-Host "  .\scripts\docker-dev-start.ps1 -WithAdminTools Start with pgAdmin and Redis Commander"
    Write-Host "  .\scripts\docker-dev-start.ps1 -Help           Show this help message"
    Write-Host ""
    Write-Host "Core Services:" -ForegroundColor Green
    Write-Host "  - PostgreSQL (localhost:5432)"
    Write-Host "  - Redis (localhost:6379)"
    Write-Host "  - MailHog Web (http://localhost:8025)"
    Write-Host "  - MailHog SMTP (localhost:1025)"
    Write-Host ""
    Write-Host "Admin Tools (with -WithAdminTools):" -ForegroundColor Green
    Write-Host "  - pgAdmin (http://localhost:5050)"
    Write-Host "  - Redis Commander (http://localhost:8081)"
    Write-Host ""
    return
}

Write-Host "🐳 School Management System - Docker Development Stack" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# Check if Docker is installed and running
Write-Host "1. Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "   ✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "2. Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker info | Out-Null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon not running"
    }
    Write-Host "   ✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker daemon is not running" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
Write-Host "3. Checking docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "   ✅ docker-compose.yml found" -ForegroundColor Green
} else {
    Write-Host "   ❌ docker-compose.yml not found in current directory" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Determine which services to start
$composeCommand = "docker-compose up -d"
if ($WithAdminTools) {
    $composeCommand += " --profile admin-tools"
    Write-Host "4. Starting Docker services (with admin tools)..." -ForegroundColor Yellow
} else {
    Write-Host "4. Starting Docker services (core only)..." -ForegroundColor Yellow
}

# Start the services
try {
    Write-Host "   Executing: $composeCommand" -ForegroundColor Gray
    Invoke-Expression $composeCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Docker compose failed"
    }
    Write-Host "   ✅ Docker services started successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to start Docker services" -ForegroundColor Red
    Write-Host "   Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}

# Wait for services to be healthy
Write-Host "5. Waiting for services to be ready..." -ForegroundColor Yellow
$maxWaitTime = 60  # seconds
$waitTime = 0
$checkInterval = 5

while ($waitTime -lt $maxWaitTime) {
    $healthyServices = 0
    $totalServices = 3  # postgres, redis, mailhog
    
    # Check PostgreSQL
    try {
        docker exec sms_postgres pg_isready -U postgres -d school_management_db | Out-Null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $healthyServices++
        }
    } catch {}
    
    # Check Redis
    try {
        docker exec sms_redis redis-cli ping | Out-Null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $healthyServices++
        }
    } catch {}
    
    # Check MailHog (simple container check)
    try {
        docker exec sms_mailhog echo "ok" | Out-Null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $healthyServices++
        }
    } catch {}
    
    if ($healthyServices -eq $totalServices) {
        Write-Host "   ✅ All services are healthy and ready" -ForegroundColor Green
        break
    }
    
    Write-Host "   ⏳ Services starting... ($healthyServices/$totalServices ready)" -ForegroundColor Yellow
    Start-Sleep $checkInterval
    $waitTime += $checkInterval
}

if ($waitTime -ge $maxWaitTime) {
    Write-Host "   ⚠️  Services may still be starting (timeout reached)" -ForegroundColor Yellow
    Write-Host "   Check service status with: docker-compose ps" -ForegroundColor Gray
}

# Display service information
Write-Host ""
Write-Host "🎉 Docker Development Environment Started!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Access Information:" -ForegroundColor Cyan
Write-Host "  🗄️  PostgreSQL Database:     localhost:5432" -ForegroundColor White
Write-Host "      Username: postgres" -ForegroundColor Gray
Write-Host "      Password: postgres_dev_password" -ForegroundColor Gray
Write-Host "      Database: school_management_db" -ForegroundColor Gray
Write-Host ""
Write-Host "  🔴 Redis Cache:              localhost:6379" -ForegroundColor White
Write-Host "      No authentication required" -ForegroundColor Gray
Write-Host ""
Write-Host "  📧 MailHog Web Interface:    http://localhost:8025" -ForegroundColor White
Write-Host "  📧 MailHog SMTP Server:      localhost:1025" -ForegroundColor White
Write-Host ""

if ($WithAdminTools) {
    Write-Host "🔧 Admin Tools:" -ForegroundColor Cyan
    Write-Host "  🐘 pgAdmin:                  http://localhost:5050" -ForegroundColor White
    Write-Host "      Email: admin@schoolsystem.local" -ForegroundColor Gray
    Write-Host "      Password: admin_dev_password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  📊 Redis Commander:          http://localhost:8081" -ForegroundColor White
    Write-Host "      Username: admin" -ForegroundColor Gray
    Write-Host "      Password: admin_dev_password" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "🛠️  Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:           docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop services:       docker-compose down" -ForegroundColor White
Write-Host "  Restart services:    docker-compose restart" -ForegroundColor White
Write-Host "  Check status:        docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Copy docker/.env.docker.example to backend/.env" -ForegroundColor White
Write-Host "  2. Update DATABASE_URL in backend/.env to use Docker credentials" -ForegroundColor White
Write-Host "  3. Run backend migrations: cd backend && npm run migrate" -ForegroundColor White
Write-Host "  4. Start your backend server: cd backend && npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green 