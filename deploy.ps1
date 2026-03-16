# Build and deploy script
Write-Host "Building and deploying website..." -ForegroundColor Green

# Build the project
npm run build

# Switch to gh-pages branch
git checkout gh-pages

# Remove old files (keep .git)
Get-ChildItem -Exclude ".git" | Remove-Item -Recurse -Force

# Copy new build files from dist
Copy-Item -Path "..\dist\*" -Destination "." -Recurse -Force

# Commit and push
git add .
git commit -m "Update website - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin gh-pages

# Switch back to master
git checkout master

Write-Host "Deployment complete! Website will update in 1-2 minutes." -ForegroundColor Green