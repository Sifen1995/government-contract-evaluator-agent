@echo off
echo ====================================
echo GovAI Database Setup
echo ====================================
echo.

echo This script will:
echo 1. Create the govai database
echo 2. Enable pgvector extension
echo 3. Run all migrations
echo.
echo Make sure PostgreSQL is running!
echo.
pause

echo.
echo Creating database...
psql -U sifenGovAI -c "DROP DATABASE IF EXISTS \"GovAI\";"
psql -U sifenGovAI -c "CREATE DATABASE \"GovAI\";"

echo.
echo Enabling pgvector extension...
psql -U sifenGovAI -d GovAI -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo.
echo Verifying extension...
psql -U sifenGovAI -d GovAI -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

echo.
echo Running migrations...
cd backend
python -m alembic upgrade head

echo.
echo Verifying tables...
python -c "from app.core.database import engine; from sqlalchemy import inspect; tables = inspect(engine).get_table_names(); print('Tables created:', tables); print('Total tables:', len(tables))"

echo.
echo ====================================
echo Database setup complete!
echo ====================================
echo.
pause
