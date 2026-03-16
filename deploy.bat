@echo off
echo Building and deploying website...

REM Build the project
call npm run build

REM Switch to gh-pages branch
git checkout gh-pages

REM Remove old files (keep .git)
for /f "delims=" %%i in ('dir /b /a-d * 2^>nul ^| findstr /v /c:".git"') do del "%%i"
for /d %%i in (*) do if not "%%i"==".git" rd /s /q "%%i"

REM Copy new build files
xcopy "..\dist\*" "." /E /I /H /Y

REM Commit and push
git add .
git commit -m "Update website - %date% %time%"
git push origin gh-pages

REM Switch back to master
git checkout master

echo Deployment complete! Website will update in 1-2 minutes.