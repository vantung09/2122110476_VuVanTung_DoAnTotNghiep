$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
$mavenHome = "C:\maven\apache-maven-3.9.12"
$runStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$runtimeLogDir = Join-Path $root "run-logs"
$mysqlCli = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$defaultDbUrl = "jdbc:mysql://127.0.0.1:3306/tung_zone?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh"
$defaultDbUsername = "root"
$defaultDbPassword = ""

if (!(Test-Path "$javaHome\bin\java.exe")) {
    throw "Java 17 not found at $javaHome"
}

if (!(Test-Path "$mavenHome\bin\mvn.cmd")) {
    throw "Maven not found at $mavenHome"
}

$env:JAVA_HOME = $javaHome
$env:MAVEN_HOME = $mavenHome
$env:Path = "$javaHome\bin;$mavenHome\bin;$env:Path"

# Set DB defaults once for all microservices, can be overridden by env.
if ([string]::IsNullOrWhiteSpace($env:DB_URL)) { $env:DB_URL = $defaultDbUrl }
if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME)) { $env:DB_USERNAME = $defaultDbUsername }
if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = $defaultDbPassword }

if (!(Test-Path $runtimeLogDir)) {
    New-Item -ItemType Directory -Path $runtimeLogDir | Out-Null
}

function Stop-PortListener([int]$Port) {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($null -eq $connections) {
        return
    }
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidVal in $pids) {
        Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
    }
}

function Wait-Port([int]$Port, [string]$Name, [string]$LogPath, [int]$TimeoutSec = 90) {
    for ($i = 0; $i -lt $TimeoutSec; $i++) {
        $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -ne $listener) {
            Write-Host "[OK] $Name listening on $Port (PID $($listener.OwningProcess))"
            return
        }
        Start-Sleep -Seconds 1
    }

    Write-Host "[ERROR] $Name did not start on port $Port"
    if (Test-Path $LogPath) {
        Write-Host "[INFO] Last log lines from $LogPath"
        Get-Content -Path $LogPath -Tail 40
    }
    throw "$Name start failed"
}

function Test-MySqlCredentials([string]$JdbcUrl, [string]$DbUser, [string]$DbPassword) {
    if (!(Test-Path $mysqlCli)) {
        Write-Host "[WARN] mysql.exe not found at $mysqlCli. Skip DB pre-check."
        return
    }

    $match = [regex]::Match($JdbcUrl, "^jdbc:mysql://([^:/]+)(?::(\d+))?/([^?]+)")
    if (!$match.Success) {
        Write-Host "[WARN] Cannot parse DB URL: $JdbcUrl. Skip DB pre-check."
        return
    }

    $dbHost = $match.Groups[1].Value
    $dbPort = if ($match.Groups[2].Success) { [int]$match.Groups[2].Value } else { 3306 }
    $dbName = $match.Groups[3].Value
    $pwdFlag = if ([string]::IsNullOrEmpty($DbPassword)) { "NO" } else { "YES" }

    function Invoke-MySqlCommand([string]$Sql) {
        $argLine = "-h $dbHost -P $dbPort -u $DbUser"
        if (![string]::IsNullOrEmpty($DbPassword)) {
            $argLine += " -p$DbPassword"
        }

        $escapedSql = $Sql.Replace('"', '\"')
        $argLine += " -e `"$escapedSql`""

        $tmpOutInner = [System.IO.Path]::GetTempFileName()
        $tmpErrInner = [System.IO.Path]::GetTempFileName()
        $procInner = Start-Process -FilePath $mysqlCli -ArgumentList $argLine -NoNewWindow -Wait -PassThru -RedirectStandardOutput $tmpOutInner -RedirectStandardError $tmpErrInner
        $code = $procInner.ExitCode
        Remove-Item -Path $tmpOutInner,$tmpErrInner -Force -ErrorAction SilentlyContinue
        return $code
    }

    $exitCode = Invoke-MySqlCommand -Sql "SELECT 1;"

    if ($exitCode -ne 0) {
        Write-Host "[ERROR] MySQL login failed for '$DbUser'@'$dbHost' (using password: $pwdFlag)"
        Write-Host "[ERROR] Set correct DB env vars and run again:"
        Write-Host "        setx DB_URL `"$JdbcUrl`""
        Write-Host "        setx DB_USERNAME `"$DbUser`""
        Write-Host "        setx DB_PASSWORD `"YOUR_REAL_PASSWORD`""
        throw "database login failed"
    }

    $createDbSql = "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    $exitCode2 = Invoke-MySqlCommand -Sql $createDbSql
    if ($exitCode2 -ne 0) {
        Write-Host "[ERROR] Cannot ensure database '$dbName' exists."
        throw "database create/check failed"
    }

    Write-Host "[OK] MySQL login success for '$DbUser'@'${dbHost}:$dbPort/$dbName'"
}

function Start-JavaService([string]$Name, [string]$RelativeDir, [int]$Port) {
    $dir = Join-Path $root $RelativeDir
    $log = Join-Path $runtimeLogDir "$Name-live-$runStamp.log"

    if (!(Test-Path (Join-Path $dir "pom.xml"))) {
        throw "Missing pom.xml in $dir"
    }

    Stop-PortListener -Port $Port
    $cmd = "cd /d `"$dir`" && call mvn spring-boot:run > `"$log`" 2>&1"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden | Out-Null
    Write-Host "[INFO] Starting $Name on $Port..."
    Wait-Port -Port $Port -Name $Name -LogPath $log
}

function Start-Frontend([string]$RelativeDir, [int]$Port) {
    $dir = Join-Path $root $RelativeDir
    $log = Join-Path $runtimeLogDir "frontend-live-$runStamp.log"

    if (!(Test-Path (Join-Path $dir "package.json"))) {
        throw "Missing package.json in $dir"
    }

    Stop-PortListener -Port $Port
    $cmd = "cd /d `"$dir`" && npm run dev > `"$log`" 2>&1"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden | Out-Null
    Write-Host "[INFO] Starting frontend on $Port..."
    Wait-Port -Port $Port -Name "frontend" -LogPath $log
}

Write-Host "[INFO] Java:"
& java -version
Write-Host "[INFO] Maven:"
& mvn -v
Test-MySqlCredentials -JdbcUrl $env:DB_URL -DbUser $env:DB_USERNAME -DbPassword $env:DB_PASSWORD

Start-JavaService -Name "eureka-server" -RelativeDir "microservices\eureka-server" -Port 8761
Start-JavaService -Name "auth-service" -RelativeDir "microservices\auth-service" -Port 8081
Start-JavaService -Name "catalog-service" -RelativeDir "microservices\catalog-service" -Port 8082
Start-JavaService -Name "order-service" -RelativeDir "microservices\order-service" -Port 8083
Start-JavaService -Name "payment-service" -RelativeDir "microservices\payment-service" -Port 8084
Start-JavaService -Name "api-gateway" -RelativeDir "microservices\api-gateway" -Port 8080
Start-Frontend -RelativeDir "frontend" -Port 5173

Write-Host ""
Write-Host "[OK] Started all services."
Write-Host "[URL] Frontend    http://localhost:5173"
Write-Host "[URL] API Gateway http://localhost:8080"
Write-Host "[URL] Eureka      http://localhost:8761"
