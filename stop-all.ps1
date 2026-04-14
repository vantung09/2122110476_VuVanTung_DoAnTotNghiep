$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ports = @(5173, 8080, 8081, 8082, 8083, 8084, 8761)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($null -eq $connections) {
        Write-Host "[INFO] Port $port -> no listener"
        continue
    }

    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidVal in $pids) {
        Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
        Write-Host "[INFO] Port $port -> killed PID $pidVal"
    }
}

Get-ChildItem -Path (Join-Path $root "microservices") -Recurse -Filter "*-live-*.log" -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path (Join-Path $root "frontend") -Recurse -Filter "*-live-*.log" -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Stop command completed."
