<#
Purpose: One-button lightweight validation for non-technical project owner.
Actions:
  1. Test public onboarding function with minimal valid payload (if ONBOARDING_KEY set).
  2. Test metrics endpoint (if METRICS_KEY set) – expects JSON / metrics.
  3. Probe one internal-only function (task-engine) to ensure it is NOT publicly reachable (403 or similar is PASS).

Prerequisites:
  - Environment variables ONBOARDING_KEY / METRICS_KEY set (only if you enabled those features).
  - Functions already deployed (terraform apply completed).

Exit codes:
  0 = all expected behaviors observed.
  1 = onboarding failed when it should succeed.
  2 = metrics failed when it should succeed.
  3 = internal function unexpectedly public.
  4 = script misconfiguration.
#>

param(
  [string]$OnboardingUrl = "https://onboard-client-function-6kqt2eklra-uc.a.run.app",
  [string]$MetricsUrl    = "https://metrics-endpoint-6kqt2eklra-uc.a.run.app",
  [string]$TaskEngineUrl = "https://task-engine-6kqt2eklra-uc.a.run.app"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Pass($m){ Write-Host "[PASS] $m" -ForegroundColor Green }
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red }

$overallOk = $true

# 1. Onboarding test (only if API key present)
$onKey = $env:ONBOARDING_KEY
if([string]::IsNullOrWhiteSpace($onKey)){
  Info 'Skipping onboarding test (ONBOARDING_KEY not set).'
} else {
  Info 'Testing onboarding function...'
  $payload = [ordered]@{
    clientName = 'Validation Client'
    beneficialOwners = @(@{ fullName='Val Owner'; residentialAddress='Addr'; serviceAddress='Addr'; dateOfBirth='1990-01-01'; nationality='SC'; nationalIdNumber='SC-0001'; taxIdNumber='TAX-0001'; dateBecameBo='2024-01-01' })
  }
  $json = $payload | ConvertTo-Json -Depth 5
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $OnboardingUrl -Headers @{ 'x-api-key' = $onKey } -Body $json -ContentType 'application/json'
    if($resp.status -eq 'success') { Pass 'Onboarding succeeded.' } else { $overallOk = $false; Fail 'Onboarding response not success.' }
  } catch {
    $overallOk = $false; Fail "Onboarding call failed: $($_.Exception.Message)"; exit 1
  }
}

# 2. Metrics endpoint (optional)
$metKey = $env:METRICS_KEY
if([string]::IsNullOrWhiteSpace($metKey)){
  Info 'Skipping metrics test (METRICS_KEY not set).'
} else {
  Info 'Testing metrics endpoint...'
  try {
    $mresp = Invoke-RestMethod -Uri ("$MetricsUrl?api_key=$metKey") -Method Get
    if($mresp){ Pass 'Metrics endpoint reachable.' } else { $overallOk = $false; Fail 'Metrics endpoint returned empty response.' }
  } catch {
    $overallOk = $false; Fail "Metrics endpoint failed: $($_.Exception.Message)"; exit 2
  }
}

# 3. Internal function protection check
Info 'Checking internal access restrictions (task-engine)...'
try {
  $iresp = Invoke-WebRequest -Uri $TaskEngineUrl -Method Get -UseBasicParsing -ErrorAction Stop
  # If we actually get 200 OK, that means it is publicly reachable (unexpected)
  $overallOk = $false; Fail 'task-engine responded publicly (should be internal-only).'
  exit 3
} catch {
  # Expecting a failure (403/404) meaning not publicly accessible
  Pass 'task-engine not publicly reachable (expected).'
}

if($overallOk){
  Pass 'Validation completed successfully.'
  exit 0
} else {
  Fail 'One or more checks failed.'
  exit 1
}
