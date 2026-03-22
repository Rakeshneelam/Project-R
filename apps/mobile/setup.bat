@echo off
echo ============================================
echo    BondBridge Mobile - Clean Install + Start
echo ============================================
echo.
cd /d "%~dp0"

echo [1/3] Removing old node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo      Done.
) else (
    echo      node_modules not found, skipping.
)

echo.
echo [2/3] Installing dependencies (legacy peer deps)...
npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo [3/3] Installing web support packages...
npm install react-native-web@0.19.13 react-dom @expo/metro-runtime --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo WARNING: web packages install had issues, trying to start anyway...
)

echo.
echo ============================================
echo   Starting BondBridge on web (localhost:8081)
echo ============================================
npx expo start --web

pause
