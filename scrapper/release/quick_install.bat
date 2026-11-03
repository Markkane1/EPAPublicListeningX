@echo off
title EPA Punjab Social Listening - Quick Installer
echo ============================================================
echo   EPA Punjab Social Listening v1.0.0 - Extension Quick Setup
echo ============================================================
echo.
echo Steps to install in Chrome, Brave, or Edge:
echo.
echo 1. The Extensions page will now open in your browser.
echo 2. Turn ON "Developer mode" in the top-right corner.
echo 3. Click the "Load unpacked" button in the top-left corner.
echo 4. Select the "extension" folder inside this directory:
echo    %~dp0extension
echo.
echo (Alternatively, drag and drop "epa-x-scrapper-v1.0.0.crx" onto the Extensions page)
echo.
echo ============================================================
pause

start chrome.exe chrome://extensions/
explorer.exe "%~dp0"
exit /b 0
