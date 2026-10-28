@echo off
echo ========================================================
echo   EventSphere - Vercel One-Click Production Deployment
echo ========================================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Vercel CLI authentication...
call vercel whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo You are not logged in to Vercel yet.
    echo Logging in now... A browser window will open for you to authenticate.
    echo.
    call vercel login
) else (
    echo Authenticated with Vercel!
)

echo.
echo Step 2: Deploying EventSphere to Vercel Production...
echo.
call vercel --prod

echo.
echo ========================================================
echo Deployment process complete! Copy your live Vercel URL
echo above and send it to your friends to test.
echo ========================================================
pause
