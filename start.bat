@echo off
title EventSphere Unified Single-Host Platform
echo =====================================================================
echo   Starting EventSphere Unified Server (Frontend + Backend on :8000)
echo =====================================================================
cd /d "%~dp0"
python run.py
pause
