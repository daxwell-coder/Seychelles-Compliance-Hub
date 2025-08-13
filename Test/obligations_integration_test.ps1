param(
  [string]$ProjectId,
  [string]$LoadUrl,
  [string]$ListUrl
)

Write-Host "[INFO] Invoking load function..."
$token = gcloud auth print-identity-token
$headers = @{ Authorization = "Bearer $token" }

try {
  # POST to load (no body required; adjust if future payload needed)
  $loadResp = Invoke-RestMethod -Method Post -Uri $LoadUrl -Headers $headers -ErrorAction Stop
  Write-Host "Load Response:`n$(ConvertTo-Json $loadResp -Depth 6)"
} catch {
  Write-Host "[FAIL] Load function invocation failed: $_"; exit 1
}

Start-Sleep -Seconds 3
Write-Host "[INFO] Listing obligations..."
try {
  $listResp = Invoke-RestMethod -Method Get -Uri ($ListUrl + '?applies_to=IBC') -Headers $headers -ErrorAction Stop
  Write-Host "List Response:`n$(ConvertTo-Json $listResp -Depth 6)"
  if (-not $listResp.count -or $listResp.count -lt 1) { throw "No obligations returned" }
  Write-Host "[PASS] Obligations listed: $($listResp.count)"
} catch {
  Write-Host "[FAIL] Listing failed: $_"; exit 1
}
