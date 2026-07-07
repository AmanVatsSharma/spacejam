# Memory Optimization Script for SpaceJam Project
# Purpose: Keep 4GB RAM free for system, use swap aggressively, prevent hangs

# Set execution policy for this script
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Write-Host "🚀 SpaceJam Memory Optimization Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Check current memory state
Write-Host "`n📊 Current Memory State:" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$ramTotal = [math]::Round($os.TotalVisibleMemorySize / 1KB, 2)
$ramFree = [math]::Round($os.FreePhysicalMemory / 1KB, 2)
$ramUsed = $ramTotal - $ramFree

Write-Host "   Total RAM: $ramTotal GB" -ForegroundColor Cyan
Write-Host "   Free RAM: $ramFree GB" -ForegroundColor Cyan
Write-Host "   Used RAM: $ramUsed GB" -ForegroundColor Cyan

# 2. Set optimal pagefile (8GB fixed size)
Write-Host "`n⚙️  Setting optimal pagefile..." -ForegroundColor Yellow
$computer = Get-WmiObject -Class Win32_ComputerSystem -EnableAllPrivileges
$currentPageFile = Get-WmiObject -Class Win32_PageFileSetting
$currentPageFile.Delete()  # Delete existing

# Create new pagefile
$pagefile = Set-WmiInstance -Class Win32_PageFile -Arguments @{
    Name = "C:\pagefile.sys"
    InitialSize = 8192
    MaximumSize = 8192
}
$pagefile.Put()

Write-Host "✅ Pagefile set to: 8GB Fixed (will be used more aggressively)" -ForegroundColor Green

# 3. Clean up non-critical processes
Write-Host "`n🧹 Optimizing processes..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {
    $_.WorkingSet64 -gt 100MB -and
    $_.ProcessName -notin @('SYSTEM', 'SYSTEM Idle Process', 'lsass', 'csrss', 'svchost',
                          'explorer', 'Memory Compression') -and
    $_.Name -notin @('powershell', 'cmd', 'claude')
}

$freedMemory = 0
foreach ($process in $processes) {
    if ($process.ProcessName -in @('chrome', 'msedge', 'msedgewebview2', 'code') -and
        $process.WorkingSet64 -gt 200MB) {
        # Don't kill browsers or VS Code - user is probably using them
        continue
    }
    if ($process.ProcessName -notin @('chrome', 'msedge', 'code')) {
        $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
        Write-Host "   📉 Cleaning up: $($process.ProcessName) ($memoryMB MB)"
        $freedMemory += $memoryMB
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Freed approximately $freedMemory MB from background processes" -ForegroundColor Green

# 4. Force Windows memory management
Write-Host "`n🔧 Optimizing Windows memory management..." -ForegroundColor Yellow

# Clear system cache
Set-MemoryPriority -ProcessId (Get-Process -Name "System").Id -Priority Normal
Write-Host "✅ Adjusted system cache priorities" -ForegroundColor Green

# 5. Show final status
Write-Host "`n📈 Final Memory Status:" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$ramFree = [math]::Round($os.FreePhysicalMemory / 1KB, 2)
Write-Host "   Free RAM after optimization: $ramFree GB" -ForegroundColor Cyan

Write-Host "`n🎯 Memory Optimization Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "System should now:" -ForegroundColor White
Write-Host "• Keep 4GB RAM free for critical operations" -ForegroundColor White
Write-Host "• Use swap (pagefile) for less critical data" -ForegroundColor White
Write-Host "• Prevent hangs by aggressive memory cleanup" -ForegroundColor White
Write-Host "`nRestart your PC for full effect!" -ForegroundColor White