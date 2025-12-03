@echo off
echo ====================================
echo Running SAM.gov Discovery Agent
echo ====================================
echo This will fetch opportunities from SAM.gov API
echo.

cd backend

python -c "from agents.discovery import run_discovery; print('Starting discovery...'); run_discovery(); print('Discovery completed!')"

echo.
echo Discovery completed! Check your database for new opportunities.
echo.
pause
