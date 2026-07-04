Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,2)}}, Path
