<#
Full-Production Run Script for OneShot
====================================
This PowerShell helper spins up the complete pipeline on a single workstation and
waits until the price-gap CSV is produced.  It is **idempotent** – you can rerun
it as many times as you like; each run writes a new timestamped CSV.

Prerequisites: Docker Desktop, PNPM, the repo cloned and `pnpm install` already
run.

USAGE
-----
  powershell -ExecutionPolicy Bypass -File scripts/full_production_run.ps1

The script will:
  1. Launch docker-compose services (Temporal, Postgres, Weaviate).
  2. Optionally import Patriot baseline prices from data\patriot_prices.csv.
  3. Build & start the Scraper, ETL and Report workers.
  4. Kick off a new `main` workflow and stream its progress.
  5. Copy the final CSV path to the clipboard and echo it to the console.
#>
param(
  [switch]$SkipBaselineImport,
  [switch]$Headless,
  [string]$ProxyUrl,
  [string]$ScrapingBeeKey
)

$ErrorActionPreference = 'Stop'

function Log($msg) { Write-Host "[$(Get-Date -f HH:mm:ss)] $msg" }

# ---------------------------------------------------------------------------
# Inline pre-flight: register ScrapingBee key BEFORE proxy strategy executes
# ---------------------------------------------------------------------------
if ($ScrapingBeeKey -and -not $env:SCRAPINGBEE_API_KEY) {
  $env:SCRAPINGBEE_API_KEY = $ScrapingBeeKey
}

# ---------------------------------------------------------------------------
# Proxy set-up: ensure Tor SOCKS5 proxy is running and export env var
# ---------------------------------------------------------------------------

# Decide proxy strategy -------------------------------------------------------
if ($ProxyUrl) {
  Log "Using user-supplied proxy URL: $ProxyUrl"
  $env:HTTP_PROXY_STRING = $ProxyUrl
} elseif ($env:BRIGHTDATA_USER -and $env:BRIGHTDATA_PASS) {
  Log 'Starting Bright Data residential proxy container…'
  docker-compose -f "$PSScriptRoot/../docker-compose.yml" up -d proxy-manager | Out-Null
  # Wait for port 24001
  Log 'Waiting for Bright Data proxy on 24001…'
  for ($i=0; $i -lt 20; $i++) {
    try {
      $c = New-Object System.Net.Sockets.TcpClient
      $c.Connect('localhost',24001); $c.Close(); break
    } catch { Start-Sleep -Milliseconds 500 }
    if ($i -eq 19){ Log 'Bright Data proxy did not become ready.'; exit 1 }
  }
  $env:HTTP_PROXY_STRING = 'http://127.0.0.1:24001'
  Log "HTTP_PROXY_STRING set globally to BrightData gateway $env:HTTP_PROXY_STRING"
} elseif ($env:SCRAPINGBEE_API_KEY) {
  Log 'Using ScrapingBee smart proxy (render_js disabled, premium pool)…'
  $sbParams = $env:SCRAPINGBEE_PARAMS
  if (-not $sbParams) { $sbParams = 'render_js=False&premium_proxy=True' }
  $env:HTTP_PROXY_STRING = "http://$($env:SCRAPINGBEE_API_KEY):$sbParams@proxy.scrapingbee.com:8886"
  Log "HTTP_PROXY_STRING set globally to ScrapingBee gateway (params=$sbParams)"
} else {
  Log 'Starting docker-compose services (proxy, browserless, cache)…'
  docker-compose -f "$PSScriptRoot/../docker-compose.yml" up -d torproxy browserless redis flaresolverr | Out-Null

  # Wait briefly for Tor to be ready (9050 open)
  Log 'Waiting for Tor proxy to expose 9050…'
  $maxTries = 20
  for ($i=0; $i -lt $maxTries; $i++) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $client.Connect('localhost', 9050)
      $client.Close()
      break
    } catch {
      Start-Sleep -Milliseconds 500
    }
    if ($i -eq $maxTries-1) { Log 'Tor proxy did not become ready in time.'; exit 1 }
  }
  $env:HTTP_PROXY_STRING = 'socks5h://127.0.0.1:9050'
}

Log "HTTP_PROXY_STRING set globally to $env:HTTP_PROXY_STRING"

# Quick probe to Sunbelt API ---------------------------------------------------
function Test-SunbeltProxy($proxyStr){
  try {
    Invoke-WebRequest -Uri 'https://api.sunbeltrentals.com/commerce/pricing/v3' -Method Get -Proxy $proxyStr -TimeoutSec 20 -Headers @{Accept='application/json'} -ErrorAction Stop | Out-Null
    return $true
  } catch { return $false }
}

try {
  $testUrl = 'https://api.sunbeltrentals.com/commerce/pricing/v3'
  $test = Invoke-WebRequest -Uri $testUrl -Method Get -Proxy $env:HTTP_PROXY_STRING -TimeoutSec 20 -Headers @{Accept='application/json'} -ErrorAction Stop
  Log "Proxy probe status: $($test.StatusCode)"
} catch {
  Log '⚠️  Proxy probe failed (Sunbelt API still unreachable). Skipping free-proxy fallback.'
}

# 1. infra -------------------------------------------------------------------
Log 'Starting docker-compose services (may already be running)…'
docker-compose -f "$PSScriptRoot/../docker-compose.yml" up -d temporal postgres weaviate | Out-Null

# 2. (re)load Patriot baseline ------------------------------------------------
if (-not $SkipBaselineImport) {
  $baseline = "$PSScriptRoot/../data/patriot_prices.csv"
  if (Test-Path $baseline) {
    Log 'Importing Patriot baseline prices into Postgres…'
    Get-Content -Raw $baseline | docker exec -i one_shot_postgres psql -U patriot -d patriot -c "\copy reference_prices FROM STDIN csv header"
  } else {
    Log "Baseline CSV not found at $baseline; skipping import."
  }
}

# 3. build workers ------------------------------------------------------------
Log 'Building packages (type-checking & emit)…'
& pnpm run --filter "@patriot-rentals/*" build | Out-Null

# Helper to start a worker in its own PowerShell window (non-headless mode)
function Start-Worker($path, $script) {
  $inner = "& { Set-Location -LiteralPath '$path'; `$env:TEMPORAL_ADDRESS='localhost:7233'; Invoke-Expression $script }"
  # Escape single quotes for single-quoted -Command string
  $escaped = $inner -replace "'", "''"
  $args = @('-NoLogo','-NoProfile','-WindowStyle','Minimized','-Command', "'$escaped'")
  Start-Process powershell -ArgumentList $args
}

if ($Headless) {
  Log 'Launching workers as background jobs (headless mode)…'

  $jobs = @()

  function New-WorkerJob($path, [string]$extraEnv='') {
    Start-Job -ArgumentList $path,$extraEnv -ScriptBlock {
      param($p,$envExtra)
      Set-Location $p
      $env:TEMPORAL_ADDRESS='localhost:7233'
      Invoke-Expression $envExtra
      pnpm start
    }
  }

  $jobs += New-WorkerJob "$PSScriptRoot/../packages/scraper" '$env:TEMPORAL_TASK_QUEUE_SCRAPER="patriot-scraper-tq"'
  $jobs += New-WorkerJob "$PSScriptRoot/../packages/etl" '$env:TEMPORAL_TASK_QUEUE_ETL="patriot-etl-tq"'
  $jobs += New-WorkerJob "$PSScriptRoot/../packages/orchestrator" '$env:TEMPORAL_TASK_QUEUE_MAIN="main"'
  $jobs += New-WorkerJob "$PSScriptRoot/../packages/report"

  # Give workers a few seconds to compile & connect
  Start-Sleep -Seconds 15
  Log 'Workers are running in background.'
} else {
  Log 'Launching worker terminals…'
  Start-Worker "$PSScriptRoot/../packages/scraper"  '$env:TEMPORAL_TASK_QUEUE_SCRAPER="patriot-scraper-tq"; pnpm start'
  Start-Worker "$PSScriptRoot/../packages/etl"      'pnpm start'
  Start-Worker "$PSScriptRoot/../packages/orchestrator" 'pnpm start'
  Start-Worker "$PSScriptRoot/../packages/report"   'pnpm start'
}

# 4. Kick off orchestrator -----------------------------------------------------
cd "$PSScriptRoot/../packages/orchestrator"
$env:TEMPORAL_ADDRESS = 'localhost:7233'

$workflowId = "oneshot-$([int](Get-Date -Date (Get-Date).ToUniversalTime() -UFormat %s) * 1000 + (Get-Random -Maximum 999))"
Log "Starting main workflow $workflowId…"

$handle = npx ts-node src/scripts/start-main.ts --workflowId $workflowId 2>&1 | Tee-Object -Variable startOut

# The script prints the result path; grab it
$csvPath = ($startOut | Select-String -Pattern 'Workflow result:' | Select-Object -Last 1).ToString().Split(':')[-1].Trim()

if (-not $csvPath) {
  Log 'Could not locate CSV path in orchestrator output; check worker logs.'
  exit 1
}

Log "✅  Report generated: $csvPath"
Set-Clipboard -Value $csvPath
Log 'Path copied to clipboard.' 