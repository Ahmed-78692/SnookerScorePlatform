# Snooker Score Platform - Build & Package Script
# Produces a single folder with the API + Frontend that can be distributed

Write-Host "=== Snooker Score Platform - Building ===" -ForegroundColor Green

$root = $PSScriptRoot
$publishDir = "$root\publish\SnookerScoreServer"

# Clean
if (Test-Path $publishDir) { Remove-Item $publishDir -Recurse -Force }
New-Item -ItemType Directory -Path $publishDir -Force | Out-Null

# Build API as self-contained Windows exe
Write-Host "`n[1/3] Building API..." -ForegroundColor Cyan
dotnet publish "$root\src\SnookerScore.API\SnookerScore.API.csproj" `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -o $publishDir `
    /p:PublishSingleFile=false

# Build Frontend (static export)
Write-Host "`n[2/3] Building Frontend..." -ForegroundColor Cyan
Set-Location "$root\frontend"
$env:NEXT_PUBLIC_API_URL = ""  # Empty = auto-detect (same host)
npx next build
# Export static files (Next.js static export)
# For pages that use dynamic routes, we generate them at request time

# Copy frontend build output to API's wwwroot
$wwwroot = "$publishDir\wwwroot"
if (Test-Path "$root\frontend\out") {
    Copy-Item "$root\frontend\out\*" $wwwroot -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
    Write-Host "  (Frontend needs 'output: export' in next.config for static files)" -ForegroundColor Yellow
}

# Create a launcher batch file
Write-Host "`n[3/3] Creating launcher..." -ForegroundColor Cyan
Set-Content "$publishDir\Start-SnookerScore.bat" @"
@echo off
title Snooker Score Server
echo.
echo  ========================================
echo   Snooker Score Server Starting...
echo  ========================================
echo.

set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://0.0.0.0:5078
set CLOUD_SYNC_API_URL=https://snooker-score-api.onrender.com
set UseInMemoryStorage=false

echo  Server starting on port 5078...
echo.
echo  Open in browser: http://localhost:5078
echo.
echo  ========================================
echo  Press Ctrl+C to stop the server
echo  ========================================
echo.

SnookerScore.API.exe
pause
"@

# Create a README for the package
Set-Content "$publishDir\README.txt" @"
Snooker Score Server
====================

1. Double-click 'Start-SnookerScore.bat' to start the server
2. Open http://localhost:5078 in your browser
3. On your phone, connect to the same WiFi and open:
   http://<your-computer-ip>:5078/scorer

The server will show your IP address in the console.

For YouTube/OBS streaming overlay:
- Cloud overlay: https://snooker-score-platform.vercel.app/overlay/{matchId}
- Local overlay: http://<your-ip>:5078/overlay/{matchId}

Note: You may need to allow the app through Windows Firewall
on first run (Windows will prompt you).
"@

Write-Host "`n=== Build Complete ===" -ForegroundColor Green
Write-Host "Output: $publishDir" -ForegroundColor Yellow
Write-Host "Run 'Start-SnookerScore.bat' to start the server" -ForegroundColor Yellow

Set-Location $root
