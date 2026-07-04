$ErrorActionPreference = "SilentlyContinue"
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 3
# Kill any process on 3000 and 3001
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
Write-Output "=== Cleared ==="
