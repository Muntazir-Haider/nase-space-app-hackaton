@echo off
echo ====================================================
echo Running Mission Sentinel Automated Test Suite
echo ====================================================
python -m pytest tests/ -v
pause
