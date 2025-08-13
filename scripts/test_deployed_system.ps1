# Test Deployed Seychelles Compliance Hub System
# Tests all critical functions end-to-end

Write-Host "🧪 TESTING DEPLOYED SYSTEM..." -ForegroundColor Cyan

# Test 1: Semantic Risk Assessment
Write-Host "`n1. Testing Semantic Risk Assessment..." -ForegroundColor Yellow
$testPayload = @{
    changeDescription = "New AML requirements for beneficial ownership disclosure effective immediately"
    source = "FSA Circular 2025-03"
    urgency = "HIGH"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://semantic-classify-regulatory-6kqt2eklra-uc.a.run.app" -Method POST -Body $testPayload -ContentType "application/json"
    Write-Host "✅ Semantic Classifier: Working" -ForegroundColor Green
    Write-Host "   Risk Level: $($response.riskLevel)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($response.confidence * 100, 1))%" -ForegroundColor White
} catch {
    Write-Host "❌ Semantic Classifier: Error - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Critical Task Monitor
Write-Host "`n2. Testing Critical Task Monitor..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://critical-task-monitor-6kqt2eklra-uc.a.run.app" -Method GET
    Write-Host "✅ Critical Task Monitor: Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Critical Task Monitor: Error - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Obligations Service
Write-Host "`n3. Testing Obligations List..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://obligations-list-6kqt2eklra-uc.a.run.app" -Method GET
    Write-Host "✅ Obligations Service: Working" -ForegroundColor Green
    Write-Host "   Obligations Count: $($response.obligations.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Obligations Service: Error - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Health Checks
Write-Host "`n4. Testing System Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://search-health-check-6kqt2eklra-uc.a.run.app" -Method GET
    Write-Host "✅ Search Health Check: Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Search Health Check: Error - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 DEPLOYMENT TEST COMPLETE!" -ForegroundColor Cyan
