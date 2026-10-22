@echo off
title JalaDrishti AI - Permanent Live Starter
cd /d "%~dp0"

echo ============================================================
echo   JALADRISHTI AI - Launching Background Live Services
echo ============================================================
echo Starting Backend (:5000), Frontend (:3001), ML Service (:8000)...

wscript "%~dp0scripts\start_live.vbs"

echo.
echo [OK] Services are running permanently in the background.
echo [OK] Auto-restart supervisor is active.
echo [OK] You may safely close this terminal.
echo.
echo   - App URL:    http://localhost:3001
echo   - API URL:    http://localhost:5000/health
echo   - ML API:     http://localhost:8000/docs
echo.
echo To check status: run status_live.bat (or npm run status)
echo To stop services: run stop_live.bat (or npm run stop)
echo ============================================================
ping 127.0.0.1 -n 3 >nul
