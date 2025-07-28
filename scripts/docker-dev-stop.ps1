# =============================================================================
# School Management System - Docker Development Environment Shutdown
# =============================================================================
# This script stops the Docker development stack with various cleanup options
# Usage: .\scripts\docker-dev-stop.ps1 [--cleanup] [--remove-volumes]
# =============================================================================

param(
    [switch]$Cleanup,
    [switch]$RemoveVolumes,
    [switch]$Help
)

# Display help information
if ($Help) {
    Write-Host "Docker Development Environment Shutdown Script" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\docker-dev-stop.ps1                    Stop services only"
    Write-Host "  .\scripts\docker-dev-stop.ps1 -Cleanup           Stop and remove containers/networks"
    Write-Host "  .\scripts\docker-dev-stop.ps1 -RemoveVolumes     Stop and remove everything including data"
    Write-Host "  .\scripts\docker-dev-stop.ps1 -Help              Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  Default:        Stops containers (data preserved)"
    Write-Host "  -Cleanup:       Removes containers and networks (data preserved)"
    Write-Host "  -RemoveVolumes: Removes everything including database data (⚠️  DESTRUCTIVE)"
    Write-Host ""
    Write-Host "⚠️  WARNING: -RemoveVolumes will delete all database data!" -ForegroundColor Red
    Write-Host ""
    return
}

Write-Host "🐳 School Management System - Docker Development Stack Shutdown" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

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
    Write-Host "   Nothing to stop" -ForegroundColor Yellow
    exit 0
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

# Check if services are running
Write-Host "3. Checking running services..." -ForegroundColor Yellow
try {
    $runningServices = docker-compose ps --services --filter "status=running" 2>$null
    if ($runningServices) {
        Write-Host "   ✅ Found running services: $($runningServices -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  No services are currently running" -ForegroundColor Blue
        exit 0
    }
} catch {
    Write-Host "   ⚠️  Could not check service status" -ForegroundColor Yellow
}

# Determine shutdown method
if ($RemoveVolumes) {
    Write-Host "4. Stopping services and removing volumes..." -ForegroundColor Yellow
    Write-Host "   ⚠️  WARNING: This will delete all database data!" -ForegroundColor Red
    
    # Confirm destructive action
    $confirmation = Read-Host "   Are you sure you want to remove all data? Type 'yes' to confirm"
    if ($confirmation -ne "yes") {
        Write-Host "   ❌ Operation cancelled by user" -ForegroundColor Red
        exit 0
    }
    
    $composeCommand = "docker-compose down -v --remove-orphans"
    $actionDescription = "stopped and removed (including volumes)"
} elseif ($Cleanup) {
    Write-Host "4. Stopping services and cleaning up..." -ForegroundColor Yellow
    $composeCommand = "docker-compose down --remove-orphans"
    $actionDescription = "stopped and removed (data preserved)"
} else {
    Write-Host "4. Stopping services..." -ForegroundColor Yellow
    $composeCommand = "docker-compose stop"
    $actionDescription = "stopped (containers preserved)"
}

# Execute shutdown command
try {
    Write-Host "   Executing: $composeCommand" -ForegroundColor Gray
    Invoke-Expression $composeCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Docker compose command failed"
    }
    Write-Host "   ✅ Services $actionDescription successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to stop services" -ForegroundColor Red
    Write-Host "   Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}

# Additional cleanup if requested
if ($Cleanup -or $RemoveVolumes) {
    Write-Host "5. Cleaning up unused resources..." -ForegroundColor Yellow
    
    # Remove unused networks
    try {
        $unusedNetworks = docker network ls --filter "dangling=true" -q 2>$null
        if ($unusedNetworks) {
            docker network rm $unusedNetworks 2>$null | Out-Null
            Write-Host "   ✅ Removed unused networks" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Could not clean unused networks" -ForegroundColor Yellow
    }
    
    # Remove unused images (only if removing volumes)
    if ($RemoveVolumes) {
        try {
            docker image prune -f 2>$null | Out-Null
            Write-Host "   ✅ Removed unused images" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not clean unused images" -ForegroundColor Yellow
        }
    }
}

# Display final status
Write-Host ""
Write-Host "🎯 Docker Development Environment Shutdown Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

if ($RemoveVolumes) {
    Write-Host "🗑️  Complete Cleanup Performed:" -ForegroundColor Red
    Write-Host "   - All containers stopped and removed" -ForegroundColor White
    Write-Host "   - All volumes and data deleted" -ForegroundColor White
    Write-Host "   - Networks removed" -ForegroundColor White
    Write-Host "   - Unused images cleaned" -ForegroundColor White
    Write-Host ""
    Write-Host "   ⚠️  All database data has been permanently deleted!" -ForegroundColor Red
    Write-Host "   Next startup will create fresh databases" -ForegroundColor Yellow
} elseif ($Cleanup) {
    Write-Host "🧹 Cleanup Performed:" -ForegroundColor Yellow
    Write-Host "   - All containers stopped and removed" -ForegroundColor White
    Write-Host "   - Networks removed" -ForegroundColor White
    Write-Host "   - Data volumes preserved" -ForegroundColor Green
    Write-Host ""
    Write-Host "   ✅ Your database data is safe!" -ForegroundColor Green
} else {
    Write-Host "⏸️  Services Stopped:" -ForegroundColor Blue
    Write-Host "   - All containers stopped" -ForegroundColor White
    Write-Host "   - Containers and data preserved" -ForegroundColor Green
    Write-Host ""
    Write-Host "   ℹ️  Use 'docker-compose start' to resume quickly" -ForegroundColor Blue
    Write-Host "   ℹ️  Use '.\scripts\docker-dev-start.ps1' for full startup" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🛠️  Useful Commands:" -ForegroundColor Cyan
Write-Host "  Start services:      .\scripts\docker-dev-start.ps1" -ForegroundColor White
Write-Host "  Check status:        docker-compose ps" -ForegroundColor White
Write-Host "  View logs:           docker-compose logs" -ForegroundColor White
Write-Host "  Remove everything:   .\scripts\docker-dev-stop.ps1 -RemoveVolumes" -ForegroundColor White
Write-Host ""
Write-Host "Environment shutdown complete! 👋" -ForegroundColor Green 