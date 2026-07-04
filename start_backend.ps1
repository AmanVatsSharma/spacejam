$ErrorActionPreference = "SilentlyContinue"
# Kill existing node processes for our apps
Write-Output "Stopping existing Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Start API (Port 3001)
Write-Output "Starting API (Port 3001)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\spacejam'; npm run start:api" -WindowStyle Hidden

Start-Sleep -Seconds 5

# Start Frontend (Port 3000)
Write-Output "Starting Frontend (Port 3000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ASUS TUF A15\Desktop\DevOPS\Workspace\spacejam'; npm run start:web" -WindowStyle Hidden

Start-Sleep -Seconds 8

# Check ports
Write-Output "`n=== Port Status ==="
Get-NetTCPConnection -LocalPort 3000,3001 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess
