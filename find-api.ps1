$nodes = Get-Process node -ErrorAction SilentlyContinue
foreach ($node in $nodes) {
    $conns = Get-NetTCPConnection -OwningProcess $node.Id -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        if ($conn.LocalPort -eq 3100 -or $conn.LocalPort -eq 4000) {
            Write-Output "PID=$($node.Id) Port=$($conn.LocalPort)"
        }
    }
}
