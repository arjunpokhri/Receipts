@echo off
setlocal enabledelayedexpansion

:: Navigate to script directory
cd /d "%~dp0"

echo ==========================================
echo  Starting Receipts Application
echo ==========================================

:: 1. Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js ^(v18 or higher recommended^) from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check for npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in your PATH.
    echo Please ensure npm is installed alongside Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] Node !NODE_VER! detected
echo [OK] npm !NPM_VER! detected

:: 3. Check for .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        echo Creating .env.local from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [OK] Created .env.local
        echo   NOTE: Don't forget to configure NEBIUS_API_KEY in .env.local for AI extraction.
    ) else (
        echo Warning: Neither .env.local nor .env.example was found.
    )
)

:: 4. Check dependencies (node_modules)
if not exist "node_modules" (
    echo Dependencies not found. Running npm install...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo Error: npm install failed.
        pause
        exit /b !ERRORLEVEL!
    )
    echo [OK] Dependencies installed successfully.
)

:: 5. Start the development server
echo ------------------------------------------
echo Receipts will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server.
echo ------------------------------------------

call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo Server process ended with code %ERRORLEVEL%.
    pause
)
