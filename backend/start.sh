#!/bin/bash
set -e

# Ensure script runs from its own directory
cd "$(dirname "$0")"

# Check Python 3.10+
# Try real Python paths before Windows Store stubs
PYTHON=$(command -v python3.12 \
  || ([ -x "/c/Python313/python" ] && echo "/c/Python313/python") \
  || ([ -x "/c/Python312/python" ] && echo "/c/Python312/python") \
  || command -v python3 \
  || command -v python)
if [ -z "$PYTHON" ]; then
  echo "Error: Python not found." >&2
  exit 1
fi

if "$PYTHON" -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"; then
  echo "Using $("$PYTHON" --version)"
else
  echo "Error: Python 3.10+ required. Found: $("$PYTHON" --version)" >&2
  exit 1
fi

# Recreate venv if it doesn't exist or was built with a different Python (e.g. WSL)
VENV_PYTHON=".venv/bin/python"
[ -f ".venv/Scripts/python.exe" ] && VENV_PYTHON=".venv/Scripts/python.exe"

if [ ! -d ".venv" ] || ! "$VENV_PYTHON" --version &>/dev/null; then
  echo "Creating virtual environment..."
  rm -rf .venv
  "$PYTHON" -m venv .venv
fi

# Resolve venv executables (Scripts on Windows native, bin on Unix/Git Bash)
if [ -f ".venv/Scripts/python.exe" ]; then
  VENV_PYTHON=".venv/Scripts/python.exe"
  VENV_UVICORN=".venv/Scripts/uvicorn.exe"
else
  VENV_PYTHON=".venv/bin/python"
  VENV_UVICORN=".venv/bin/uvicorn"
fi

# Install/update dependencies
"$VENV_PYTHON" -m pip install -r requirements.txt -q

# Start server
"$VENV_PYTHON" -m uvicorn main:app --reload --port 8000
