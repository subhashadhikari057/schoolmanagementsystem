# =============================================================================
# School Management System - Docker Development Environment Reset
# =============================================================================
# This script completely resets the Docker development environment
# Usage: .\scripts\docker-dev-reset.ps1 [--keep-images]
# =============================================================================

param(
    [switch]$KeepImages,
    [switch]$Help
)

# Display help information
if ($Help) {
    Write-Host "Docker Development Environment Reset Script" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\docker-dev-reset.ps1             Complete reset (removes images)"
    Write-Host "  .\scripts\docker-dev-reset.ps1 -KeepImages Reset but keep downloaded images"
    Write-Host "  .\scripts\docker-dev-reset.ps1 -Help       Show this help message"
    Write-Host ""
    Write-Host "What this script does:" -ForegroundColor Green
    Write-Host "  1. Stops all running containers"
    Write-Host "  2. Removes all containers and networks"
    Write-Host "  3. Removes all volumes (⚠️  deletes all data)"
    Write-Host "  4. Optionally removes downloaded images"
    Write-Host "  5. Restarts the environment with fresh data"
    Write-Host ""
    Write-Host "⚠️  WARNING: This will delete ALL database data!" -ForegroundColor Red
    Write-Host "Use this when you need a completely fresh start." -ForegroundColor Yellow
    Write-Host ""
    return
}

Write-Host "🔄 School Management System - Docker Environment Reset" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will completely reset your development environment!" -ForegroundColor Red
Write-Host "⚠️  ALL database data will be permanently deleted!" -ForegroundColor Red
Write-Host ""

# Confirm destructive action
$confirmation = Read-Host "Are you sure you want to proceed? Type 'RESET' to confirm"
if ($confirmation -ne "RESET") {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting complete environment reset..." -ForegroundColor Yellow

# Check if Docker is running
Write-Host "1. Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker info | Out-Null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon not running"
    }
    Write-Host "   ✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker daemon is not running" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
Write-Host "2. Checking docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "   ✅ docker-compose.yml found" -ForegroundColor Green
} else {
    Write-Host "   ❌ docker-compose.yml not found in current directory" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Stop and remove everything
Write-Host "3. Stopping and removing all containers and volumes..." -ForegroundColor Yellow
try {
    docker-compose down -v --remove-orphans 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Some containers may not have been running" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ All containers and volumes removed" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Error during container removal, continuing..." -ForegroundColor Yellow
}

# Remove SMS-specific containers (in case they exist outside compose)
Write-Host "4. Cleaning up SMS-specific containers..." -ForegroundColor Yellow
$smsContainers = @("sms_postgres", "sms_redis", "sms_mailhog", "sms_pgadmin", "sms_redis_commander")
foreach ($container in $smsContainers) {
    try {
        $exists = docker ps -a --filter "name=$container" --format "{{.Names}}" 2>$null
        if ($exists) {
            docker rm -f $container 2>$null | Out-Null
            Write-Host "   ✅ Removed container: $container" -ForegroundColor Green
        }
    } catch {
        # Ignore errors for non-existent containers
    }
}

# Remove SMS-specific volumes
Write-Host "5. Cleaning up SMS-specific volumes..." -ForegroundColor Yellow
$smsVolumes = @("sms_postgres_data", "sms_redis_data", "sms_pgadmin_data")
foreach ($volume in $smsVolumes) {
    try {
        $exists = docker volume ls --filter "name=$volume" --format "{{.Name}}" 2>$null
        if ($exists) {
            docker volume rm $volume 2>$null | Out-Null
            Write-Host "   ✅ Removed volume: $volume" -ForegroundColor Green
        }
    } catch {
        # Ignore errors for non-existent volumes
    }
}

# Remove SMS network
Write-Host "6. Cleaning up SMS network..." -ForegroundColor Yellow
try {
    $networkExists = docker network ls --filter "name=sms_network" --format "{{.Name}}" 2>$null
    if ($networkExists) {
        docker network rm sms_network 2>$null | Out-Null
        Write-Host "   ✅ Removed network: sms_network" -ForegroundColor Green
    }
} catch {
    # Ignore errors for non-existent network
}

# Optionally remove images
if (-not $KeepImages) {
    Write-Host "7. Removing downloaded images..." -ForegroundColor Yellow
    $smsImages = @("postgres:15-alpine", "redis:7-alpine", "mailhog/mailhog:latest", "dpage/pgadmin4:latest", "rediscommander/redis-commander:latest")
    foreach ($image in $smsImages) {
        try {
            $exists = docker images --filter "reference=$image" --format "{{.Repository}}:{{.Tag}}" 2>$null
            if ($exists) {
                docker rmi $image 2>$null | Out-Null
                Write-Host "   ✅ Removed image: $image" -ForegroundColor Green
            }
        } catch {
            Write-Host "   ⚠️  Could not remove image: $image" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "7. Keeping downloaded images (as requested)..." -ForegroundColor Blue
}

# Clean up any dangling resources
Write-Host "8. Cleaning up dangling resources..." -ForegroundColor Yellow
try {
    # Remove dangling images
    $danglingImages = docker images -f "dangling=true" -q 2>$null
    if ($danglingImages) {
        docker rmi $danglingImages 2>$null | Out-Null
        Write-Host "   ✅ Removed dangling images" -ForegroundColor Green
    }
    
    # Remove unused networks
    docker network prune -f 2>$null | Out-Null
    Write-Host "   ✅ Cleaned unused networks" -ForegroundColor Green
    
    # Remove unused volumes
    docker volume prune -f 2>$null | Out-Null
    Write-Host "   ✅ Cleaned unused volumes" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Some cleanup operations may have failed" -ForegroundColor Yellow
}

# Restart the environment
Write-Host "9. Starting fresh environment..." -ForegroundColor Yellow
try {
    docker-compose up -d 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start services"
    }
    Write-Host "   ✅ Fresh environment started successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to start fresh environment" -ForegroundColor Red
    Write-Host "   You may need to run .\scripts\docker-dev-start.ps1 manually" -ForegroundColor Yellow
}

# Wait for services to be ready
Write-Host "10. Waiting for services to initialize..." -ForegroundColor Yellow
$maxWaitTime = 60
$waitTime = 0
$checkInterval = 5

while ($waitTime -lt $maxWaitTime) {
    $healthyServices = 0
    $totalServices = 3
    
    # Check PostgreSQL
    try {
        docker exec sms_postgres pg_isready -U postgres -d school_management_db 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $healthyServices++ }
    } catch {}
    
    # Check Redis
    try {
        docker exec sms_redis redis-cli ping 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $healthyServices++ }
    } catch {}
    
    # Check MailHog
    try {
        docker exec sms_mailhog echo "ok" 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $healthyServices++ }
    } catch {}
    
    if ($healthyServices -eq $totalServices) {
        Write-Host "   ✅ All services are healthy and ready" -ForegroundColor Green
        break
    }
    
    Write-Host "   ⏳ Services initializing... ($healthyServices/$totalServices ready)" -ForegroundColor Yellow
    Start-Sleep $checkInterval
    $waitTime += $checkInterval
}

if ($waitTime -ge $maxWaitTime) {
    Write-Host "   ⚠️  Services may still be initializing (timeout reached)" -ForegroundColor Yellow
}

# Display completion message
Write-Host ""
Write-Host "🎉 Docker Environment Reset Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ What was done:" -ForegroundColor Cyan
Write-Host "   - Stopped all running containers" -ForegroundColor White
Write-Host "   - Removed all containers and networks" -ForegroundColor White
Write-Host "   - Deleted all volumes and data" -ForegroundColor White
if (-not $KeepImages) {
    Write-Host "   - Removed downloaded images" -ForegroundColor White
} else {
    Write-Host "   - Kept downloaded images for faster restart" -ForegroundColor White
}
Write-Host "   - Started fresh environment" -ForegroundColor White
Write-Host ""
Write-Host "🆕 Fresh Environment Ready:" -ForegroundColor Green
Write-Host "   🗄️  PostgreSQL Database:     localhost:5432" -ForegroundColor White
Write-Host "   🔴 Redis Cache:              localhost:6379" -ForegroundColor White
Write-Host "   📧 MailHog Web Interface:    http://localhost:8025" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your backend/.env file with Docker credentials" -ForegroundColor White
Write-Host "   2. Run database migrations: cd backend && npm run migrate" -ForegroundColor White
Write-Host "   3. Run database seeding: cd backend && npm run seed" -ForegroundColor White
Write-Host "   4. Start your backend server: cd backend && npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "Your development environment is now completely fresh! 🚀" -ForegroundColor Green 