@echo off
setlocal enabledelayedexpansion
title JalaDrishti AI - Service Controller
cd /d "%~dp0"

set "ACTION=%~1"
if not "%ACTION%"=="" goto handle_action

:menu
cls
echo ============================================================
echo           JALADRISHTI AI - SERVICE CONTROLLER
echo ============================================================
echo   [1] Start Live Services  (Permanent Background)
echo   [2] Check Live Status    (Health ^& Ports)
echo   [3] Stop Live Services   (Clean Shutdown)
echo   [4] Dev Foreground Mode  (View Console Logs)
echo   [5] Exit
echo ============================================================
set /p CHOICE="Select an option [1-5]: "

if "%CHOICE%"=="1" goto do_start
if "%CHOICE%"=="2" goto do_status
if "%CHOICE%"=="3" goto do_stop
if "%CHOICE%"=="4" goto do_dev
if "%CHOICE%"=="5" exit /b 0
goto menu

:handle_action
if /i "%ACTION%"=="start" goto do_start
if /i "%ACTION%"=="status" goto do_status
if /i "%ACTION%"=="stop" goto do_stop
if /i "%ACTION%"=="restart" goto do_restart
if /i "%ACTION%"=="dev" goto do_dev
echo [!] Unknown option "%ACTION%". Usage: live.bat [start^|status^|stop^|restart^|dev]
exit /b 1

:do_start
echo.
echo ============================================================
echo   JALADRISHTI AI - Launching Background Live Services
echo ============================================================
echo Starting Backend (:5000), Frontend (:3001), ML Service (:8000)...
wscript "%~dp0scripts\start_live.vbs"
echo.
echo [OK] Services are running permanently in the background.
echo [OK] Auto-restart supervisor is active.
echo.
echo   - App URL:    http://localhost:3001
echo   - API URL:    http://localhost:5000/health
echo   - ML API:     http://localhost:8000/docs
echo ============================================================
if "%~1"=="" pause
exit /b 0

:do_status
echo.
node scripts\status.mjs
echo.
if "%~1"=="" pause
exit /b 0

:do_stop
echo.
node scripts\stop.mjs
echo.
if "%~1"=="" pause
exit /b 0

:do_restart
echo [*] Restarting JalaDrishti AI Live Services...
node scripts\stop.mjs
timeout /t 2 /nobreak >nul
wscript "%~dp0scripts\start_live.vbs"
echo [OK] Services restarted in background.
if "%~1"=="" pause
exit /b 0

:do_dev
echo [*] Starting JalaDrishti AI in foreground dev mode...
node scripts\runner.mjs
exit /b 0
