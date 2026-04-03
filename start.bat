@echo off
echo ========================================
echo Starting RedImVi - Media Compression Platform
echo ========================================
echo.

REM Kill any process on port 5000
echo Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process %%a on port 5000
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill any process on port 3000
echo Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a on port 3000
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

REM Start the backend server
echo.
echo [1/2] Starting Backend Server (PostgreSQL)...
start "RedImVi Server" cmd /k "cd /d %~dp0server && npm start"

REM Wait a few seconds for server to initialize
timeout /t 4 /nobreak >nul

REM Start the frontend client
echo [2/2] Starting Frontend Client...
start "RedImVi Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================
echo RedImVi is starting!
echo ========================================
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo Database: PostgreSQL (Render)
echo.
echo Two new windows have opened:
echo - RedImVi Server (Backend)
echo - RedImVi Client (Frontend)
echo.
echo Press any key to exit this window...
pause >nul
