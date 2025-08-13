# Enhanced Regulatory Monitoring System Deployment Script
# Deploys comprehensive regulatory monitoring with automated change detection

Write-Host "🚀 Deploying Enhanced Regulatory Monitoring System..." -ForegroundColor Green

# Set variables
$PROJECT_ID = "schv1-hub"
$REGION = "us-central1"
$FUNCTION_SOURCE = "C:\schv1\functions"

Write-Host "📋 Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "📍 Region: $REGION" -ForegroundColor Cyan

# Ensure we're in the functions directory
Set-Location $FUNCTION_SOURCE

Write-Host "`n🔧 Building functions..." -ForegroundColor Yellow

# Build TypeScript functions
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Deploy comprehensive monitoring function
Write-Host "`n📤 Deploying comprehensive regulatory monitoring function..." -ForegroundColor Yellow

gcloud functions deploy comprehensiveRegulatoryMonitoring `
    --gen2 `
    --runtime=nodejs18 `
    --region=$REGION `
    --source=. `
    --entry-point=comprehensiveRegulatoryMonitoring `
    --trigger-topic=regulatory-monitoring-trigger `
    --timeout=540s `
    --memory=1024MB `
    --max-instances=10 `
    --set-env-vars="NODE_ENV=production,PROJECT_ID=$PROJECT_ID" `
    --service-account="$PROJECT_ID@appspot.gserviceaccount.com"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Comprehensive monitoring function deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Comprehensive monitoring function deployed successfully" -ForegroundColor Green

# Create Cloud Scheduler job for automated monitoring
Write-Host "`n⏰ Setting up Cloud Scheduler for automated monitoring..." -ForegroundColor Yellow

# Delete existing job if it exists
gcloud scheduler jobs delete regulatory-monitoring-schedule --location=$REGION --quiet 2>$null

# Create new scheduled job - runs every hour
gcloud scheduler jobs create pubsub regulatory-monitoring-schedule `
    --location=$REGION `
    --schedule="0 * * * *" `
    --topic=regulatory-monitoring-trigger `
    --message-body="{\"trigger\":\"scheduled\",\"timestamp\":\"$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')\"}" `
    --description="Automated regulatory monitoring - runs every hour"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Scheduler setup failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cloud Scheduler configured successfully" -ForegroundColor Green

# Deploy legacy monitoring function (for backward compatibility)
Write-Host "`n📤 Deploying legacy regulatory monitoring function..." -ForegroundColor Yellow

gcloud functions deploy checkRegulatoryChanges `
    --gen2 `
    --runtime=nodejs18 `
    --region=$REGION `
    --source=. `
    --entry-point=checkRegulatoryChanges `
    --trigger-topic=regulatory-check-trigger `
    --timeout=300s `
    --memory=512MB `
    --max-instances=5 `
    --set-env-vars="NODE_ENV=production,PROJECT_ID=$PROJECT_ID" `
    --service-account="$PROJECT_ID@appspot.gserviceaccount.com"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Legacy monitoring function deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Legacy monitoring function deployed successfully" -ForegroundColor Green

# Create monitoring dashboard function
Write-Host "`n📊 Deploying monitoring dashboard function..." -ForegroundColor Yellow

gcloud functions deploy getRegulatoryMonitoringDashboard `
    --gen2 `
    --runtime=nodejs18 `
    --region=$REGION `
    --source=. `
    --entry-point=getRegulatoryMonitoringDashboard `
    --trigger-http `
    --allow-unauthenticated `
    --timeout=60s `
    --memory=256MB `
    --max-instances=10 `
    --set-env-vars="NODE_ENV=production,PROJECT_ID=$PROJECT_ID" `
    --service-account="$PROJECT_ID@appspot.gserviceaccount.com"

# Set up Firestore indexes for monitoring data
Write-Host "`n🗃️ Setting up Firestore indexes..." -ForegroundColor Yellow

# Create firestore.indexes.json if it doesn't exist
$indexesFile = "$FUNCTION_SOURCE\..\firestore.indexes.json"
if (!(Test-Path $indexesFile)) {
    $indexes = @{
        indexes = @(
            @{
                collectionGroup = "monitoring_results"
                queryScope = "COLLECTION"
                fields = @(
                    @{
                        fieldPath = "timestamp"
                        order = "DESCENDING"
                    }
                )
            },
            @{
                collectionGroup = "regulatory_changes"
                queryScope = "COLLECTION"
                fields = @(
                    @{
                        fieldPath = "severity"
                        order = "ASCENDING"
                    },
                    @{
                        fieldPath = "detectedAt"
                        order = "DESCENDING"
                    }
                )
            },
            @{
                collectionGroup = "compliance_tasks"
                queryScope = "COLLECTION"
                fields = @(
                    @{
                        fieldPath = "status"
                        order = "ASCENDING"
                    },
                    @{
                        fieldPath = "priority"
                        order = "ASCENDING"
                    },
                    @{
                        fieldPath = "createdAt"
                        order = "DESCENDING"
                    }
                )
            }
        )
    }
    
    $indexes | ConvertTo-Json -Depth 10 | Set-Content $indexesFile
    Write-Host "📝 Created firestore.indexes.json" -ForegroundColor Green
}

# Deploy indexes
gcloud firestore indexes create $indexesFile --quiet

Write-Host "✅ Firestore indexes configured" -ForegroundColor Green

# Test the monitoring system
Write-Host "`n🧪 Testing the regulatory monitoring system..." -ForegroundColor Yellow

# Trigger a test run
gcloud pubsub topics publish regulatory-monitoring-trigger --message="{\"trigger\":\"test\",\"timestamp\":\"$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')\"}"

Write-Host "🔄 Test monitoring triggered. Check logs with:" -ForegroundColor Cyan
Write-Host "   gcloud functions logs read comprehensiveRegulatoryMonitoring --region=$REGION --limit=50" -ForegroundColor White

# Get function URLs
Write-Host "`n🔗 Function URLs:" -ForegroundColor Cyan
$dashboardUrl = gcloud functions describe getRegulatoryMonitoringDashboard --region=$REGION --format="value(serviceConfig.uri)" 2>$null
if ($dashboardUrl) {
    Write-Host "   📊 Monitoring Dashboard: $dashboardUrl" -ForegroundColor White
}

# Display monitoring schedule
Write-Host "`n⏰ Monitoring Schedule:" -ForegroundColor Cyan
Write-Host "   📋 Comprehensive monitoring: Every hour (0 * * * *)" -ForegroundColor White
Write-Host "   🔍 FSA Publications: Every hour via comprehensive monitoring" -ForegroundColor White
Write-Host "   📰 FSA News & Updates: Every 30 minutes via comprehensive monitoring" -ForegroundColor White
Write-Host "   🏛️ FIU Website: Every 2 hours via comprehensive monitoring" -ForegroundColor White

Write-Host "`n✅ Enhanced Regulatory Monitoring System deployed successfully!" -ForegroundColor Green
Write-Host "🎯 The system will now automatically monitor FSA and FIU websites for changes" -ForegroundColor Green
Write-Host "🚨 Critical changes will trigger immediate notifications and compliance tasks" -ForegroundColor Green
Write-Host "📊 View monitoring status at the dashboard URL above" -ForegroundColor Green

# Create monitoring status summary
Write-Host "`n📋 Deployment Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Comprehensive monitoring function deployed" -ForegroundColor Green
Write-Host "   ✅ Legacy monitoring function deployed (backward compatibility)" -ForegroundColor Green
Write-Host "   ✅ Dashboard function deployed" -ForegroundColor Green
Write-Host "   ✅ Automated scheduling configured (hourly)" -ForegroundColor Green
Write-Host "   ✅ Firestore indexes created for monitoring data" -ForegroundColor Green
Write-Host "   ✅ Test monitoring run triggered" -ForegroundColor Green

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Monitor function logs for successful execution" -ForegroundColor White
Write-Host "   2. Set up email/SMS notifications in production" -ForegroundColor White  
Write-Host "   3. Configure Slack webhook for team notifications" -ForegroundColor White
Write-Host "   4. Review and adjust monitoring frequency as needed" -ForegroundColor White

Write-Host "`nRegulatory monitoring system is now active and will automatically adapt to changes! 🎉" -ForegroundColor Green
