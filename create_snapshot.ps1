# Define the root directory of your project
$rootDir = "C:\schv1"

# Define the output file path
$outputFile = "C:\schv1\project_snapshot.txt"

# Define directories and file extensions to exclude to keep the output clean
$excludeDirs = @("*node_modules*", "*.git*", "*.terraform*", "*.next*", "*.cache*", "*dist*", "*build*", "*out*", "*public*")
$excludeExtensions = @(".lock", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".gz", ".zip", ".woff", ".woff2", ".eot", ".ttf", ".jar", ".map", ".log", ".DS_Store")

# Clear the output file if it already exists
if (Test-Path $outputFile) {
    Clear-Content $outputFile
}

# Get all files recursively, excluding the specified directories and extensions
$files = Get-ChildItem -Path $rootDir -Recurse -File | Where-Object {
    $filePath = $_.FullName
    $fileExt = $_.Extension.ToLower()

    # Default to keeping the file
    $isExcluded = $false

    # Check if the file path matches any of the excluded directory patterns
    foreach ($dirPattern in $excludeDirs) {
        if ($filePath -like $dirPattern) {
            $isExcluded = $true
            break # Exit loop once a match is found
        }
    }

    # If not excluded by directory, check if the extension is in the exclusion list
    if (-not $isExcluded -and $excludeExtensions -contains $fileExt) {
        $isExcluded = $true
    }

    # The condition for Where-Object: keep the file if it is NOT excluded
    -not $isExcluded
}

# Loop through each file and append its path and content to the output file
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($rootDir.Length)
    "---" | Out-File -FilePath $outputFile -Append -Encoding utf8
    "File: $relativePath" | Out-File -FilePath $outputFile -Append -Encoding utf8
    "---" | Out-File -FilePath $outputFile -Append -Encoding utf8
    Get-Content $file.FullName -ErrorAction SilentlyContinue | Out-File -FilePath $outputFile -Append -Encoding utf8
    "`n" | Out-File -FilePath $outputFile -Append -Encoding utf8
}

# This line will now execute correctly.
Write-Host "✅ Project snapshot created successfully at C:\schv1\project_snapshot.txt" -ForegroundColor Green
