param(
  [string]$ApiKey = $env:ONBOARDING_KEY,
  [string]$FunctionUrl = 'https://onboard-client-function-6kqt2eklra-uc.a.run.app',
  [switch]$IncludeRequestId
)

Write-Host "[INFO] Using function URL: $FunctionUrl" -ForegroundColor Cyan
if([string]::IsNullOrWhiteSpace($ApiKey)) {
  Write-Host "[WARN] API key is empty; call will fail if function expects it." -ForegroundColor Yellow
}

$bo = @{
  fullName = 'Alice Example'
  residentialAddress = '1 Ocean Drive'
  serviceAddress = '1 Ocean Drive'
  dateOfBirth = '1990-01-15'
  nationality = 'SC'
  nationalIdNumber = 'SC-1234567'
  taxIdNumber = 'TAX-987654'
  dateBecameBo = '2024-06-01'
}

$payload = [ordered]@{
  clientName = 'Test Client Ltd'
  beneficialOwners = @($bo)
}
if($IncludeRequestId){ $payload.clientRequestId = [guid]::NewGuid().ToString() }

$json = $payload | ConvertTo-Json -Depth 6
Write-Host "[INFO] Request JSON:" -ForegroundColor Cyan
Write-Host $json

try {
  $headers = @{ 'x-api-key' = $ApiKey }
  $resp = Invoke-RestMethod -Method Post -Uri $FunctionUrl -Headers $headers -Body $json -ContentType 'application/json'
  Write-Host "[SUCCESS] Response:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 6
} catch {
  Write-Host "[ERROR] Request failed:" -ForegroundColor Red
  if($_.Exception.Response -and $_.Exception.Response.GetResponseStream()){
    $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    $bodyErr = $reader.ReadToEnd()
    Write-Host $bodyErr
  } else {
    Write-Host $_.Exception.Message
  }
  exit 1
}
