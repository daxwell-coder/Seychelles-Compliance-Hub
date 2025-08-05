$outputFile = "C:\schv1\project_snapshot.txt"

# Define directories and file extensions to exclude to keep the output clean
# --- STRATEGY CHANGE: INCLUSION (WHITELIST) INSTEAD OF EXCLUSION ---
# We will now only include files we know are source code. This is much more reliable.

# 1. Define directories to ALWAYS exclude.
$excludeDirs = @("*node_modules*", "*.git*", "*.terraform*", "*.next*", "*.cache*", "*dist*", "*build*", "*out*")

# 2. Define the file extensions we WANT to include (whitelist).
$includeExtensions = @(
    # Web
    ".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".scss", ".less", ".json", ".md",
    # Config
    ".yml", ".yaml", ".toml", ".xml", ".env",
    # Backend
    ".go", ".py", ".java", ".cs", ".rb", ".php",
    # Shell & Infra
    ".sh", ".ps1", ".tf", ".hcl",
    # Other
    ".txt", ".sql"
)

# 3. Define specific filenames we WANT to include (for files without extensions).
$includeNames = @(
    "Dockerfile",
    "docker-compose.yml",
    ".gitignore",
    ".dockerignore",
    "LICENSE",
    "README.md"
)

# Clear the output file if it already exists
if (Test-Path $outputFile) {
    Clear-Content $outputFile
}

# Get all files recursively and apply the new whitelist logic
$files = Get-ChildItem -Path $rootDir -Recurse -File | Where-Object {
    $filePath = $_.FullName
    $fileExt = $_.Extension.ToLower()
    $fileName = $_.Name

    # First, check if the file is in a directory we must exclude.
    $isInExcludedDir = $false
    foreach ($dirPattern in $excludeDirs) {
        if ($filePath -like $dirPattern) {
            $isInExcludedDir = $true
            break
        }
    }

    # If it's in an excluded directory, immediately discard it.
    if ($isInExcludedDir) {
        return $false
    }

    # Now, check if it's a file we want to include based on extension or name.
    $isIncluded = $false
    if ($includeExtensions -contains $fileExt -or $includeNames -contains $fileName) {
        $isIncluded = $true
    }

    # The condition for Where-Object: keep the file if it is included.
    $isIncluded
}

# Loop through each file and append its path and content to the output file

