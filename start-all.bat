@echo off
echo ========================================
echo Starting SwiftSplit - All Services
echo ========================================

echo.
echo [1/4] Starting Databases (Docker)...
docker-compose up -d
timeout /t 5

echo.
echo [2/4] Starting Backend Server...
start "SwiftSplit Backend" cmd /k "cd backend && npm run dev"
timeout /t 3

echo.
echo [3/4] Starting AI Modules Server...
start "SwiftSplit AI Modules" cmd /k "cd ai-modules && npm run dev"
timeout /t 3

echo.
echo [4/4] Starting Frontend...
start "SwiftSplit Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services starting!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo AI Modules: http://localhost:3001
echo ========================================
echo.
pause
