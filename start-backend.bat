@echo off
echo ====================================
echo Starting GovAI Backend Server
echo ====================================
echo.

cd backend

echo Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo Running database migrations...
python -m alembic upgrade head

echo.
echo Starting FastAPI server...
echo Backend will be available at: http://localhost:8000
echo API Docs will be available at: http://localhost:8000/docs
echo.
echo Press CTRL+C to stop the server
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
