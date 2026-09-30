@echo off
echo =========================================================================
echo  JalaDrishti AI - Earth Observation Flood Intelligence Platform
echo  Production-Ready Microservices Architecture
echo =========================================================================
echo.
echo [*] Starting Python Geospatial ML Microservice on port 8000...
start "ML Service (FastAPI)" cmd /k "python -m uvicorn main:app --app-dir ml_service --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [*] Starting Node.js Express API Gateway on port 5000...
start "Backend API (Express TS)" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [*] Starting React Leaflet Frontend Dashboard on port 3000...
start "Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

timeout /t 4 /nobreak >nul
echo [*] Auto-opening browser to http://localhost:3000...
start http://localhost:3000

echo.
echo [+] All 3 services launched successfully!
echo  - Frontend: http://localhost:3000
echo  - Backend API: http://localhost:5000/api
echo  - ML Service: http://localhost:8000/docs
echo =========================================================================
pause
