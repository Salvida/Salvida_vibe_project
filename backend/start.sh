#!/bin/bash
set -e

# Create venv only if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python -m venv .venv
fi

# Activate
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt -q

# Start server
uvicorn main:app --reload --port 8000
