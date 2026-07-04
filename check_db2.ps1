$env:PGPASSWORD = 'postgres'
$env:Path = "C:\Program Files\PostgreSQL\17\bin;$env:Path"

# Create spacejam database
$result = & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h 127.0.0.1 -c "CREATE DATABASE IF NOT EXISTS spacejam_db;" 2>&1
Write-Output $result

# List tables
$result = & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h 127.0.0.1 -d spacejam_db -c "\dt" 2>&1
Write-Output "=== Tables in spacejam_db ==="
Write-Output $result
