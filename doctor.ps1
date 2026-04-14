$ErrorActionPreference = "Continue"

Write-Host "===== ENV ====="
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "MAVEN_HOME=$env:MAVEN_HOME"
Write-Host ""

Write-Host "===== JAVA ====="
$javaPaths = & where.exe java 2>$null
if ($javaPaths) {
    $javaPaths | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "java not found in PATH"
}
& java -version 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host ""

Write-Host "===== MAVEN ====="
$mvnPaths = & where.exe mvn 2>$null
if ($mvnPaths) {
    $mvnPaths | ForEach-Object { Write-Host $_ }
    & mvn -v 2>&1 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "mvn not found in PATH"
}
Write-Host ""

Write-Host "===== LISTEN PORTS ====="
$ports = @(3306, 3307, 5173, 8080, 8081, 8082, 8083, 8084)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($null -eq $connections) {
        Write-Host "Port $port -> no listener"
        continue
    }

    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidVal in $pids) {
        Write-Host "Port $port -> PID $pidVal"
    }
}

Write-Host ""
Write-Host "===== DONE ====="
