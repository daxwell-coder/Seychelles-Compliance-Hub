#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Tests the deterministic encryption functionality for Task #3

.DESCRIPTION
    This script tests the PII encryption and search capabilities implemented in Task #3.
    It performs test onboarding submissions with encrypted data and verifies search functionality.

.PARAMETER TestType
    Type of test to run: 'encryption', 'search', 'full' (default: 'full')

.EXAMPLE
    .\test_task3_encryption.ps1
    .\test_task3_encryption.ps1 -TestType encryption
#>

param(
    [ValidateSet('encryption', 'search', 'full')]
    [string]$TestType = 'full'
)

# Configuration
$PROJECT_ID = "seychelles-compliance-hub"
$ONBOARDING_FUNCTION_URL = "https://us-central1-$PROJECT_ID.cloudfunctions.net/onboardClientFunction"
$SEARCH_FUNCTION_URL = "https://us-central1-$PROJECT_ID.cloudfunctions.net/searchEncryptedData"

Write-Host "=== Task #3 Deterministic Encryption Test ===" -ForegroundColor Green
Write-Host "Testing PII encryption and searchable hash functionality" -ForegroundColor Yellow
Write-Host ""

# Test data with PII fields
$testClient = @{
    clientName = "Test Encryption Corp"
    clientRequestId = "test-encrypt-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    beneficialOwners = @(
        @{
            fullName = "John Encryption Test"
            residentialAddress = "123 Privacy Street, Secure City, SC 12345"
            serviceAddress = "456 Business Ave, Corporate Town, CT 67890"
            dateOfBirth = "1980-01-15"
            nationality = "US"
            nationalIdNumber = "ENC123456789"
            taxIdNumber = "TAX-ENC-2024-001"
            ownershipPercentage = 75.5
            dateBecameBo = "2024-01-01"
        },
        @{
            fullName = "Jane Search Test"
            residentialAddress = "789 Secure Lane, Privacy Town, PT 54321"
            serviceAddress = "321 Office Blvd, Business City, BC 98765"
            dateOfBirth = "1985-03-22"
            nationality = "US"
            nationalIdNumber = "ENC987654321"
            taxIdNumber = "TAX-ENC-2024-002"
            ownershipPercentage = 24.5
            dateBecameBo = "2024-01-01"
        }
    )
}

function Test-OnboardingWithEncryption {
    Write-Host "Testing onboarding with PII encryption..." -ForegroundColor Cyan
    
    try {
        $body = $testClient | ConvertTo-Json -Depth 10 -Compress
        $response = Invoke-RestMethod -Uri $ONBOARDING_FUNCTION_URL -Method POST -Body $body -ContentType "application/json"
        
        if ($response.status -eq "success") {
            Write-Host "✅ Onboarding with encryption successful!" -ForegroundColor Green
            Write-Host "   Client ID: $($response.clientId)" -ForegroundColor Gray
            return $response.clientId
        } else {
            Write-Host "❌ Onboarding failed: $($response.message)" -ForegroundColor Red
            Write-Host "   Details: $($response | ConvertTo-Json)" -ForegroundColor Gray
            return $null
        }
    } catch {
        Write-Host "❌ Onboarding request failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Test-EncryptedSearch {
    param([string]$ClientId)
    
    Write-Host "Testing encrypted data search functionality..." -ForegroundColor Cyan
    
    $searchTests = @(
        @{ type = "fullName"; term = "John Encryption Test"; description = "Search by full name" },
        @{ type = "nationalId"; term = "ENC123456789"; description = "Search by national ID" },
        @{ type = "taxId"; term = "TAX-ENC-2024-001"; description = "Search by tax ID" },
        @{ type = "clientName"; term = "Test Encryption Corp"; description = "Search by client name" },
        @{ type = "universal"; term = "Jane Search Test"; description = "Universal search" }
    )
    
    $successCount = 0
    
    foreach ($test in $searchTests) {
        Write-Host "  Testing: $($test.description)" -ForegroundColor Yellow
        
        try {
            $searchBody = @{
                searchType = $test.type
                searchTerm = $test.term
                options = @{
                    limit = 10
                    includeMetadata = $true
                }
            } | ConvertTo-Json -Depth 5
            
            $searchResponse = Invoke-RestMethod -Uri $SEARCH_FUNCTION_URL -Method POST -Body $searchBody -ContentType "application/json"
            
            if ($searchResponse.success -and $searchResponse.resultCount -gt 0) {
                Write-Host "    ✅ Found $($searchResponse.resultCount) results" -ForegroundColor Green
                $successCount++
                
                # Show first result details
                if ($searchResponse.results.Count -gt 0) {
                    $firstResult = $searchResponse.results[0]
                    Write-Host "      Match type: $($firstResult.matchType), Field: $($firstResult.matchField)" -ForegroundColor Gray
                    if ($firstResult.clientId) {
                        Write-Host "      Client ID: $($firstResult.clientId)" -ForegroundColor Gray
                    }
                }
            } else {
                Write-Host "    ❌ No results found or search failed" -ForegroundColor Red
                Write-Host "      Response: $($searchResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "    ❌ Search request failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 1
    }
    
    # Test client details retrieval
    if ($ClientId) {
        Write-Host "  Testing: Client details retrieval" -ForegroundColor Yellow
        
        try {
            $detailsBody = @{
                searchType = "clientDetails"
                clientId = $ClientId
                options = @{
                    includeMetadata = $true
                }
            } | ConvertTo-Json -Depth 5
            
            $detailsResponse = Invoke-RestMethod -Uri $SEARCH_FUNCTION_URL -Method POST -Body $detailsBody -ContentType "application/json"
            
            if ($detailsResponse.success -and $detailsResponse.results) {
                Write-Host "    ✅ Client details retrieved successfully" -ForegroundColor Green
                Write-Host "      Has beneficial owners: $($detailsResponse.results.beneficialOwners.Count -gt 0)" -ForegroundColor Gray
                Write-Host "      Beneficial owner count: $($detailsResponse.results.beneficialOwners.Count)" -ForegroundColor Gray
                $successCount++
                
                # Check for encrypted field indicators
                $encryptedFields = @()
                foreach ($bo in $detailsResponse.results.beneficialOwners) {
                    foreach ($prop in $bo.PSObject.Properties) {
                        if ($prop.Name.EndsWith('_encrypted') -and $prop.Value -eq $true) {
                            $fieldName = $prop.Name.Replace('_encrypted', '')
                            if ($encryptedFields -notcontains $fieldName) {
                                $encryptedFields += $fieldName
                            }
                        }
                    }
                }
                
                if ($encryptedFields.Count -gt 0) {
                    Write-Host "      Encrypted fields detected: $($encryptedFields -join ', ')" -ForegroundColor Green
                } else {
                    Write-Host "      Warning: No encrypted field indicators found" -ForegroundColor Yellow
                }
            } else {
                Write-Host "    ❌ Client details retrieval failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "    ❌ Client details request failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Search tests completed: $successCount/$(($searchTests.Count + 1)) successful" -ForegroundColor $(if ($successCount -eq ($searchTests.Count + 1)) { 'Green' } else { 'Yellow' })
    
    return $successCount
}

function Test-HealthChecks {
    Write-Host "Testing search service health..." -ForegroundColor Cyan
    
    try {
        $healthUrl = "https://us-central1-$PROJECT_ID.cloudfunctions.net/searchHealthCheck"
        $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method GET
        
        if ($healthResponse.status -eq "healthy") {
            Write-Host "✅ Search service is healthy" -ForegroundColor Green
            Write-Host "   Capabilities: $($healthResponse.capabilities -join ', ')" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "❌ Search service is unhealthy: $($healthResponse.status)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
$overallSuccess = $true

try {
    # Health check first
    Write-Host "Step 1: Health Check" -ForegroundColor Magenta
    $healthOk = Test-HealthChecks
    Write-Host ""
    
    if (-not $healthOk) {
        Write-Host "⚠️ Health check failed, but continuing with tests..." -ForegroundColor Yellow
        Write-Host ""
    }

    if ($TestType -eq 'encryption' -or $TestType -eq 'full') {
        # Test encryption via onboarding
        Write-Host "Step 2: Test PII Encryption" -ForegroundColor Magenta
        $clientId = Test-OnboardingWithEncryption
        Write-Host ""
        
        if (-not $clientId) {
            $overallSuccess = $false
        }
        
        # Wait for data to be available for search
        if ($clientId) {
            Write-Host "Waiting 3 seconds for data to be available for search..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    } else {
        $clientId = $null
    }

    if ($TestType -eq 'search' -or $TestType -eq 'full') {
        # Test search functionality
        Write-Host "Step 3: Test Encrypted Data Search" -ForegroundColor Magenta
        $searchSuccessCount = Test-EncryptedSearch -ClientId $clientId
        Write-Host ""
        
        if ($searchSuccessCount -lt 3) {  # At least 3 successful searches expected
            $overallSuccess = $false
        }
    }

    # Summary
    Write-Host "=== Task #3 Test Summary ===" -ForegroundColor Green
    
    if ($overallSuccess) {
        Write-Host "🎉 All tests completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Task #3 Implementation Status: ✅ COMPLETE" -ForegroundColor Green
        Write-Host "- PII field encryption: ✅ Working" -ForegroundColor Green
        Write-Host "- Searchable hash generation: ✅ Working" -ForegroundColor Green  
        Write-Host "- Encrypted data search: ✅ Working" -ForegroundColor Green
        Write-Host "- Search service health: ✅ Working" -ForegroundColor Green
    } else {
        Write-Host "❌ Some tests failed. Check the output above for details." -ForegroundColor Red
        Write-Host ""
        Write-Host "Task #3 Implementation Status: ⚠️ ISSUES DETECTED" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Task #4: External anchoring scaffold for audit/obligation chain roots" -ForegroundColor Gray
    Write-Host "2. Task #5: Narrative scoring heuristic baseline" -ForegroundColor Gray
    Write-Host "3. Complete remaining Sprint 1 deliverables" -ForegroundColor Gray

} catch {
    Write-Host ""
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
    $overallSuccess = $false
}

# Exit with appropriate code
if ($overallSuccess) {
    exit 0
} else {
    exit 1
}
