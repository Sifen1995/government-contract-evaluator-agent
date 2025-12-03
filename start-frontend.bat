@echo off
echo ====================================
echo Starting GovAI Frontend
echo ====================================
echo.

cd frontend

echo Installing/Updating dependencies...
call npm install

echo.
echo Starting Next.js development server...
echo Frontend will be available at: http://localhost:3000
echo.
echo Press CTRL+C to stop the server
echo.

call npm run dev
