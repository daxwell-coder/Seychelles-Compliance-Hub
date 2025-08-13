<#
Simplified Terraform deployment helper for Windows.

Usage (run in elevated PowerShell the first time):
  powershell -ExecutionPolicy Bypass -File C:\schv1\scripts\terraform_deploy.ps1 -ProjectId seychelles-compliance-hub -CreateServiceAccount

If you already created the service account/key before, rerun without -CreateServiceAccount.

Flags:
  -ProjectId <id>            GCP project id (required).
  -CreateServiceAccount       Create/ensure terraform-admin service account + key.
  -ForceLogin                 Force user browser login even if creds exist.

This script keeps state in C:\gcloud-config and stores the service account key at
 C:\gcloud-config\terraform-admin-key.json (DO NOT COMMIT).
Remove that file after switching to impersonation.
#>

param(
  [Parameter(Mandatory=$true)] [string]$ProjectId,
  [switch]$CreateServiceAccount,
  [switch]$ForceLogin,
  [switch]$SyncDependencies
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red; exit 1 }

$GCLOUD_CONFIG_DIR = 'C:\gcloud-config'
$SA_ID    = 'terraform-admin'
$SA_EMAIL = "$SA_ID@$ProjectId.iam.gserviceaccount.com"
$KEY_PATH = Join-Path $GCLOUD_CONFIG_DIR 'terraform-admin-key.json'
$TF_DIR   = 'C:\schv1\terraform'

# Resolve executables
try { $gcloud = (Get-Command gcloud -ErrorAction Stop).Source } catch { Fail 'gcloud CLI not found in PATH.' }
try { $terraform = (Get-Command terraform -ErrorAction Stop).Source } catch { Fail 'terraform binary not found in PATH.' }

New-Item -ItemType Directory -Path $GCLOUD_CONFIG_DIR -Force | Out-Null
$env:CLOUDSDK_CONFIG = $GCLOUD_CONFIG_DIR

# Optional user login (useful before creating service account)
$needLogin = $ForceLogin -or -not (& $gcloud auth list --format='value(account)')
if($needLogin){
  Info 'Opening browser for user login...'
  & $gcloud auth login --force | Out-Null
}

Info "Setting active project: $ProjectId"
& $gcloud config set project $ProjectId | Out-Null

if($CreateServiceAccount){
  Info 'Ensuring service account exists...'
  $exists = & $gcloud iam service-accounts list --format='value(email)' --filter="email=$SA_EMAIL"
  if(-not $exists){
    Info "Creating service account $SA_EMAIL"
    & $gcloud iam service-accounts create $SA_ID --display-name 'Terraform Admin' | Out-Null
    Info 'Granting temporary roles/owner (tighten later).'
    & $gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SA_EMAIL" --role='roles/owner' | Out-Null
  } else { Info 'Service account already exists.' }

  if(Test-Path $KEY_PATH){ Info 'Removing old key file.'; Remove-Item $KEY_PATH -Force }
  Info 'Creating fresh key file.'
  & $gcloud iam service-accounts keys create $KEY_PATH --iam-account $SA_EMAIL | Out-Null
}

if($SyncDependencies){
  Info 'Synchronizing npm dependencies (functions)' 
  try {
    Push-Location 'C:\schv1\functions'
    if(Test-Path package-lock.json){ Remove-Item package-lock.json -Force }
    npm install | Out-Null
    npm run build | Out-Null
  } finally { Pop-Location }
  Info 'Synchronizing npm dependencies (client-onboarding)'
  try {
    Push-Location 'C:\schv1\services\client-onboarding'
    if(Test-Path package-lock.json){ Remove-Item package-lock.json -Force }
    npm install | Out-Null
    npm run build | Out-Null
  } finally { Pop-Location }
}

if(Test-Path $KEY_PATH){
  $env:GOOGLE_APPLICATION_CREDENTIALS = $KEY_PATH
  Info "Using service account key at $KEY_PATH"
} else {
  Warn 'No service account key found; Terraform will use current user ADC if available.'
}

if(-not (Test-Path $TF_DIR)) { Fail "Terraform directory not found: $TF_DIR" }

Info "Changing directory to $TF_DIR"
Push-Location $TF_DIR
try {
  Info 'Initializing Terraform (reconfigure)'
  & $terraform init -reconfigure

  Info 'Applying Terraform (auto-approve)'
  & $terraform apply -auto-approve -no-color `
    -var="onboarding_api_key=$($env:ONBOARDING_KEY)" `
    -var="metrics_api_key=$($env:METRICS_KEY)"
} finally {
  Pop-Location
}

Info 'Done.'

<#
Next steps after first success:
  1. Grant your user roles/iam.serviceAccountTokenCreator on $SA_EMAIL.
  2. Add impersonate_service_account to provider blocks; delete $KEY_PATH; re-run without -CreateServiceAccount.
  3. Remove roles/owner; replace with least-privilege role set.
#>
