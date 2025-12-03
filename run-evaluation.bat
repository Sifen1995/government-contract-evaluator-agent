@echo off
echo ====================================
echo Running AI Evaluation Agent
echo ====================================
echo This will evaluate opportunities using GPT-4
echo.

cd backend

python -c "from agents.evaluation import run_evaluation; print('Starting evaluation...'); run_evaluation(); print('Evaluation completed!')"

echo.
echo Evaluation completed! Check your database for AI scores.
echo.
pause
