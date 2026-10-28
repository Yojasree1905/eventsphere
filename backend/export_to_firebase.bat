@echo off
echo ========================================================
echo   EventSphere - Sync All Tables to Cloud Firestore
echo ========================================================
echo.

cd /d "%~dp0"

if not exist serviceAccountKey.json (
    echo [!] Missing serviceAccountKey.json in this directory!
    echo.
    echo Please follow these quick steps:
    echo 1. Open https://console.firebase.google.com
    echo 2. Click your project -> Project Settings (gear icon) -> Service accounts tab.
    echo 3. Click 'Generate new private key' and download the JSON file.
    echo 4. Rename it to 'serviceAccountKey.json' and place it in:
    echo    %CD%
    echo 5. Re-run this file!
    echo.
    pause
    exit /b 1
)

echo [*] Found serviceAccountKey.json!
echo [*] Uploading all tables to your Firebase Console...
echo.

python migrate_to_firestore.py

echo.
echo ========================================================
echo Done! Open https://console.firebase.google.com to view
echo your live Firestore database tables.
echo ========================================================
pause
