#!/bin/bash
set -e

# Ensure script runs from its own directory
cd "$(dirname "$0")"

# Check Python 3.12+
PYTHON=$(command -v python3.12 || command -v python3 || command -v python)
if [ -z "$PYTHON" ]; then
  echo "Error: Python not found." >&2
  exit 1
fi

VERSION=$("$PYTHON" -c "import sys; print(sys.version_info[:2])")
if "$PYTHON" -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"; then
  echo "Using $($PYTHON --version)"
else
  echo "Error: Python 3.10+ required. Found: $($PYTHON --version)" >&2
  exit 1
fi

# Create venv only if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  "$PYTHON" -m venv .venv
fi

# Activate
source .venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt -q

# Start server
uvicorn main:app --reload --port 8000
