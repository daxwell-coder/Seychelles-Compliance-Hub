Set-Location "C:\schv1"
Write-Host "Current directory: $(Get-Location)"
Write-Host "Renaming branch to main..."
git branch -M main
Write-Host "Setting remote URL..."
git remote set-url origin https://github.com/daxwell-coder/schv1.git
Write-Host "Adding all files..."
git add -A
Write-Host "Committing..."
git commit -m "Complete project upload - Seychelles Compliance Hub with all components"
Write-Host "Pushing to GitHub..."
git push -u origin main --force
Write-Host "Upload complete!"
