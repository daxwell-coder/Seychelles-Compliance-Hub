# Test Auto Task Creation System
# Tests the complete pipeline from regulatory change detection to automated task creation

param(
    [string]$ProjectId = "seychelles-compliance-hub",
    [string]$Region = "us-central1"
)

Write-Host "🧪 Testing Auto Task Creation System" -ForegroundColor Cyan
Write-Host "Project: $ProjectId" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow

# Test 1: Check deployed functions
Write-Host "`n1. Checking deployed functions..." -ForegroundColor Green
$functions = @("regulatoryClassifier", "autoTaskCreator", "taskSLAMonitor")

foreach ($func in $functions) {
    try {
        $result = gcloud functions describe $func --region=$Region --project=$ProjectId --format="value(status)" 2>$null
        if ($result -eq "ACTIVE") {
            Write-Host "  ✅ $func is ACTIVE" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $func status: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ $func not found or error" -ForegroundColor Red
    }
}

# Test 2: Check Pub/Sub topics
Write-Host "`n2. Checking Pub/Sub topics..." -ForegroundColor Green
$topics = @("regulatory-impact-classified", "task-sla-check", "regulatory-change-ingested")

foreach ($topic in $topics) {
    try {
        $result = gcloud pubsub topics describe $topic --project=$ProjectId 2>$null
        if ($?) {
            Write-Host "  ✅ Topic '$topic' exists" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Topic '$topic' missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error checking topic '$topic'" -ForegroundColor Red
    }
}

# Test 3: Check Cloud Scheduler job
Write-Host "`n3. Checking Cloud Scheduler..." -ForegroundColor Green
try {
    $result = gcloud scheduler jobs describe sla-monitor-hourly --location=$Region --project=$ProjectId --format="value(state)" 2>$null
    if ($result -eq "ENABLED") {
        Write-Host "  ✅ SLA monitor scheduler is ENABLED" -ForegroundColor Green
    } else {
        Write-Host "  ❌ SLA monitor scheduler state: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ SLA monitor scheduler not found" -ForegroundColor Red
}

# Test 4: Simulate regulatory change to trigger auto task creation
Write-Host "`n4. Testing end-to-end workflow..." -ForegroundColor Green

# Get the regulatory classifier function URL
try {
    $functionUrl = gcloud functions describe regulatoryClassifier --region=$Region --project=$ProjectId --format="value(httpsTrigger.url)" 2>$null
    
    if ($functionUrl) {
        Write-Host "  Function URL: $functionUrl" -ForegroundColor Yellow
        
        # Create test payload that should trigger CRITICAL priority task creation
        $testPayload = @{
            sourceUrl = "https://fsa.sc/test-critical-change"
            jurisdiction = "Seychelles"
            content = @"
CRITICAL: New AML reporting requirements effective immediately. All licensed entities must implement enhanced customer due diligence procedures within 48 hours. Non-compliance will result in immediate license suspension. This supersedes all previous AML guidelines and requires immediate board-level attention.
"@
            contentHash = "test-critical-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json -Depth 3
        
        Write-Host "  📤 Sending test regulatory change..." -ForegroundColor Yellow
        
        # Send test request
        try {
            $response = Invoke-RestMethod -Uri $functionUrl -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 30
            Write-Host "  ✅ Regulatory classifier responded successfully" -ForegroundColor Green
            Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        } catch {
            Write-Host "  ❌ Error calling regulatory classifier: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Wait for processing
        Write-Host "  ⏱️  Waiting 10 seconds for event processing..." -ForegroundColor Yellow
        Start-Sleep 10
        
        Write-Host "  ✅ Test completed. Check Firestore 'tasks' collection for auto-created tasks." -ForegroundColor Green
        Write-Host "  ✅ Check Cloud Functions logs for detailed execution traces." -ForegroundColor Green
        
    } else {
        Write-Host "  ❌ Could not get regulatory classifier function URL" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error in end-to-end test: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Manual SLA check trigger
Write-Host "`n5. Testing SLA monitoring..." -ForegroundColor Green
try {
    $result = gcloud pubsub topics publish task-sla-check --message='{"trigger":"manual-test"}' --project=$ProjectId
    Write-Host "  ✅ SLA monitor triggered manually" -ForegroundColor Green
    Write-Host "  Check Cloud Functions logs for taskSLAMonitor execution" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Error triggering SLA monitor: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Auto Task Creation System Test Complete!" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "- Check Cloud Functions logs: gcloud functions logs read [function-name] --region=$Region" -ForegroundColor Gray
Write-Host "- Monitor Firestore 'tasks' collection for auto-created tasks" -ForegroundColor Gray
Write-Host "- Verify SLA monitoring creates escalation tasks" -ForegroundColor Gray
Write-Host "- Review event logs in 'events' collection" -ForegroundColor Gray
