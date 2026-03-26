#!/bin/bash
# .claude/setup-worktree.sh
# Se ejecuta automáticamente cuando Claude entra en un worktree nuevo.
# Copia los archivos no rastreados por git desde el repo principal al worktree actual.

# Derivar rutas
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
MAIN=$(cd "$SCRIPT_DIR/.." && pwd)
WORKTREE=$(pwd)

# Archivos a sincronizar (rutas relativas al root del repo)
FILES=(
  "backend/.env"
  "frontend/.env"
  "backend/start.sh"
)

echo "[setup-worktree] Syncing files from main repo to worktree..."
copied=0
for f in "${FILES[@]}"; do
  src="$MAIN/$f"
  dst="$WORKTREE/$f"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    echo "  ✓ $f"
    ((copied++))
  else
    echo "  – $f (not found in main repo, skipping)"
  fi
done
echo "[setup-worktree] Done. Copied $copied file(s)."
