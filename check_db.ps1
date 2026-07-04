$env:PGPASSWORD = 'postgres'
$env:Path = "C:\Program Files\PostgreSQL\17\bin;$env:Path"
$env:Path = "C:\Program Files\Redis;$env:Path;$env:Path"
$result = & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h 127.0.0.1 -c "\l" 2>&1
Write-Output "=== DATABASES ==="
Write-Output $result
Write-Output "=== USERS ==="
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h 127.0.0.1 -c "\du" 2>&1
