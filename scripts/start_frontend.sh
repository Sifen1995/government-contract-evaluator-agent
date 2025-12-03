#!/bin/bash
cd "$(dirname "$0")/../frontend"

echo "Starting GovAI Frontend..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start frontend
echo "Starting Next.js development server..."
npm run dev
