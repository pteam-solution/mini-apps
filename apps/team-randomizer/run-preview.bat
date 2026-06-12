@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing packages...
  npm install
)

npm run build
npm run preview
pause
