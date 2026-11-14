@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting Mission Sentinel Backend on http://127.0.0.1:8000
echo Swagger API Docs: http://127.0.0.1:8000/docs
echo ====================================================
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
