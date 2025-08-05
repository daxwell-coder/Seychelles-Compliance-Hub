# Define the root directory of your project
$rootDir = "C:\schv1"

# Define the output file path
$outputFile = "C:\schv1\project_snapshot.txt"

# Define directories and file extensions to exclude to keep the output clean
$excludeDirs = @("*node_modules*", "*.git*", "*.terraform*")
$excludeExtensions = @("*.lock", "*.png", "*.jpg", "*.ico", "*.svg")

# Clear the output file if it already exists
if (Test-Path $outputFile) {
    Clear-Content $outputFile
}

# Get all files recursively, excluding the specified directories and extensions
$files = Get-ChildItem -Path $rootDir -Recurse -File -Exclude $excludeDirs | Where-Object { $excludeExtensions -notcontains $_.Extension }

# Loop through each file and append its path and content to the output file
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($rootDir.Length)
    "---" | Out-File -FilePath $outputFile -Append -Encoding utf8
    "File: $relativePath" | Out-File -FilePath $outputFile -Append -Encoding utf8
    "---" | Out-File -FilePath $outputFile -Append -Encoding utf8
    Get-Content $file.FullName | Out-File -FilePath $outputFile -Append -Encoding utf8
    "`n" | Out-File -FilePath $outputFile -Append -Encoding utf8
}

# This line will now execute correctly.
Write-Host "? Project snapshot created successfully at C:\schv1\project_snapshot.txt" -ForegroundColor Green
