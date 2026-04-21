@echo off

cd /d "%~dp0"

:: Start backend
start "Backend" cmd /k "rtvenv\Scripts\activate && uvicorn backend.main:app --reload --port 8001"

:: Start frontend
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Resume Tool is starting...
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8001
echo.
pause