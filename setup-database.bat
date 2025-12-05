@echo off
echo ====================================
echo GovAI Remote Database Setup
echo ====================================
echo.

echo This script will:
echo 1. Enable pgvector extension (if not enabled)
echo 2. Run all migrations to remote database
echo 3. Verify tables were created
echo.
echo Using Remote AWS RDS PostgreSQL:
echo   Host: betehomes-prod.czjyhxu2w9yy.us-east-1.rds.amazonaws.com
echo   Database: sam_gov_dev
echo   User: sam_gov_dev_user
echo.
pause

echo.
echo Enabling pgvector extension on remote database...
set PGPASSWORD=SamGovDev2024Secure
psql -h betehomes-prod.czjyhxu2w9yy.us-east-1.rds.amazonaws.com -U sam_gov_dev_user -d sam_gov_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo.
echo Verifying extension...
psql -h betehomes-prod.czjyhxu2w9yy.us-east-1.rds.amazonaws.com -U sam_gov_dev_user -d sam_gov_dev -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

echo.
echo Running migrations to remote database...
cd backend
python -m alembic upgrade head

echo.
echo Verifying tables...
python -c "from app.core.database import engine; from sqlalchemy import inspect; tables = inspect(engine).get_table_names(); print('Tables created:', tables); print('Total tables:', len(tables))"

echo.
echo ====================================
echo Remote database setup complete!
echo ====================================
echo.
pause
