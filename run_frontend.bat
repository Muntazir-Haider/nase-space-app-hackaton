@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting Mission Sentinel Frontend on http://localhost:5173
echo ====================================================
cd frontend
npm run dev
pause
