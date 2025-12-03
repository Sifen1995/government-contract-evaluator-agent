#!/bin/bash

echo "========================================="
echo "GovAI Setup Script"
echo "========================================="
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env created. Please edit it with your API keys."
    echo
else
    echo "✓ .env file already exists"
fi

# Backend setup
echo "Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create database
echo "Please ensure PostgreSQL is running and create the database:"
echo "  createdb govai"
echo
read -p "Press Enter once database is created..."

# Run migrations
echo "Running database migrations..."
alembic upgrade head

cd ..

# Frontend setup
echo
echo "Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start PostgreSQL and Redis"
echo "3. Run the application:"
echo "   - Backend: ./scripts/start_backend.sh"
echo "   - Frontend: ./scripts/start_frontend.sh"
echo "   - Workers: ./scripts/start_worker.sh"
echo
echo "Or use Docker: docker-compose up"
echo
