#!/bin/bash
# .claude/setup-worktree.sh
# Copia los archivos no rastreados por git desde el repo principal a todos los worktrees.
# Funciona tanto llamado manualmente como desde el hook PostToolUse:EnterWorktree.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
MAIN=$(cd "$SCRIPT_DIR/.." && pwd)

FILES=(
  "backend/.env"
  "frontend/.env"
  "backend/start.sh"
)

# Obtener todos los worktrees registrados (excluyendo el repo principal)
# Normalizar MAIN para comparar sin importar separadores Windows/Unix
MAIN_NORM=$(echo "$MAIN" | tr '\\' '/' | sed 's|^/\([a-z]\)/|\U\1:/|')

mapfile -t WORKTREES < <(
  git -C "$MAIN" worktree list --porcelain \
    | grep "^worktree " \
    | awk '{print $2}'
)

if [ ${#WORKTREES[@]} -eq 0 ]; then
  echo "[setup-worktree] No worktrees found."
  exit 0
fi

for WORKTREE in "${WORKTREES[@]}"; do
  # Normalizar path del worktree para comparar
  WT_NORM=$(echo "$WORKTREE" | tr '\\' '/')
  MAIN_WT_NORM=$(echo "$MAIN_NORM" | tr '\\' '/')

  # Saltar el repo principal (comparación normalizada)
  if [ "$WT_NORM" = "$MAIN_WT_NORM" ]; then
    continue
  fi

  # Saltar worktrees cuya carpeta ya no existe
  if [ ! -d "$WORKTREE" ]; then
    echo "[setup-worktree] ⚠ Skipping $WORKTREE (directory not found)"
    continue
  fi

  echo "[setup-worktree] → $WORKTREE"
  copied=0
  for f in "${FILES[@]}"; do
    src="$MAIN/$f"
    dst="$WORKTREE/$f"
    if [ -f "$src" ]; then
      cp "$src" "$dst" && echo "  ✓ $f" && ((copied++))
    else
      echo "  – $f (not found in main repo, skipping)"
    fi
  done
  echo "  Copied $copied file(s)."
done
