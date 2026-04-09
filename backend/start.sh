#!/bin/bash

# Ensure script runs from its own directory
cd "$(dirname "$0")"

# ── Python detection ──────────────────────────────────────────────────────────
PYTHON=$(command -v python3.12 2>/dev/null \
  || command -v python3.13 2>/dev/null \
  || command -v python3 2>/dev/null \
  || command -v python 2>/dev/null)

if [ -z "$PYTHON" ]; then
  echo "Error: Python not found." >&2
  exit 1
fi

if ! "$PYTHON" -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" 2>/dev/null; then
  echo "Error: Python 3.10+ required. Found: $("$PYTHON" --version 2>&1)" >&2
  exit 1
fi

echo "Using $("$PYTHON" --version 2>&1)"

# ── Detect platform ───────────────────────────────────────────────────────────
# Git Bash (MINGW/MSYS) and native Windows both need Scripts/python.exe
if [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* || -n "$WINDIR" ]]; then
  IS_WINDOWS=true
else
  IS_WINDOWS=false
fi

# ── Virtual environment ───────────────────────────────────────────────────────
if $IS_WINDOWS; then
  # On Windows: venv must have Scripts/python.exe
  # A Linux-built venv (with bin/ only) won't work – delete and recreate
  if [ ! -f ".venv/Scripts/python.exe" ]; then
    echo "Creating virtual environment (Windows)..."
    rm -rf .venv
    "$PYTHON" -m venv .venv || { echo "Error: failed to create venv" >&2; exit 1; }
  fi
  VENV_PYTHON=".venv/Scripts/python.exe"
else
  # On Unix/WSL: venv must have bin/python
  if [ ! -f ".venv/bin/python" ] || ! ".venv/bin/python" --version &>/dev/null; then
    echo "Creating virtual environment..."
    rm -rf .venv
    "$PYTHON" -m venv .venv || { echo "Error: failed to create venv" >&2; exit 1; }
  fi
  VENV_PYTHON=".venv/bin/python"
fi

# ── Dependencies ──────────────────────────────────────────────────────────────
echo "Installing dependencies..."
"$VENV_PYTHON" -m pip install -r requirements.txt -q \
  || { echo "Error: pip install failed" >&2; exit 1; }

# ── Start server ──────────────────────────────────────────────────────────────
echo "Starting Salvida backend on http://localhost:8000"
"$VENV_PYTHON" -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
