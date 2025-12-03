@echo off
echo ====================================
echo Running Embedding Generation Agent
echo ====================================
echo This will generate vector embeddings for opportunities
echo.

cd backend

python -c "from agents.embedding_agent import run_embedding_generation; print('Starting embedding generation...'); count = run_embedding_generation(); print(f'Generated {count} embeddings!')"

echo.
echo Embedding generation completed! Check opportunity_embeddings table.
echo.
pause
