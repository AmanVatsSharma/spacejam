$nodes = Get-Process node -ErrorAction SilentlyContinue
foreach ($node in $nodes) {
    $conns = Get-NetTCPConnection -OwningProcess $node.Id -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            if ($conn.LocalPort -gt 1000) {
                $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($node.Id)").CommandLine
                Write-Output "PID=$($node.Id) Port=$($conn.LocalPort) CMD=$cmd"
            }
        }
    }
}
