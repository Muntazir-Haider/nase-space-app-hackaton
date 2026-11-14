@echo off
title Mission Sentinel Launcher
cd /d "%~dp0"

echo ====================================================
echo   MISSION SENTINEL - Starting Full Workstation
echo ====================================================
echo.
echo [1/2] Launching Backend API on http://127.0.0.1:8000 ...
start "Mission Sentinel - Backend API" "%~dp0run_backend.bat"

echo Waiting for Backend station to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Launching Frontend Workstation on http://localhost:5173 ...
start "Mission Sentinel - Frontend UI" "%~dp0run_frontend.bat"

echo.
echo ====================================================
echo   Both services are running:
echo   - Backend API:    http://127.0.0.1:8000
echo   - Swagger Docs:   http://127.0.0.1:8000/docs
echo   - Workstation UI: http://localhost:5173
echo ====================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Services are active. You can minimize this window.
pause
