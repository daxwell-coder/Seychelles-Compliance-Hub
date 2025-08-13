@echo off
cd /d C:\schv1
echo Switching to main branch and pushing...
git branch -M main
git remote set-url origin https://github.com/daxwell-coder/schv1.git
git push -u origin main --force
echo Upload complete!
