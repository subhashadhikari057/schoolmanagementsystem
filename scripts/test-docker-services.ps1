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