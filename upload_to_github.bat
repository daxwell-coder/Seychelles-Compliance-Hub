@echo off
cd /d C:\schv1
echo Current directory: %CD%
echo.
echo Checking git status...
git status
echo.
echo Adding all files...
git add -A
echo.
echo Committing changes...
git commit -m "Complete Seychelles Compliance Hub upload - All project files"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Upload complete!
pause
