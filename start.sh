#!/usr/bin/env bash
set -e

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "=========================================="
echo " Starting Receipts Application"
echo "=========================================="

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed or not in your PATH."
  echo "Please install Node.js (v18 or higher recommended) from https://nodejs.org/"
  exit 1
fi

# 2. Check for npm
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in your PATH."
  echo "Please ensure npm is installed alongside Node.js."
  exit 1
fi

echo "✓ Node $(node -v) detected"
echo "✓ npm $(npm -v) detected"

# 3. Check for .env.local
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✓ Created .env.local"
    echo "  NOTE: Don't forget to configure NEBIUS_API_KEY in .env.local for AI extraction."
  else
    echo "Warning: Neither .env.local nor .env.example was found."
  fi
fi

# 4. Check dependencies (node_modules)
if [ ! -d "node_modules" ]; then
  echo "Dependencies not found. Running npm install..."
  npm install
  echo "✓ Dependencies installed successfully."
fi

# 5. Start the development server
echo "------------------------------------------"
echo "Receipts will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server."
echo "------------------------------------------"

exec npm run dev
