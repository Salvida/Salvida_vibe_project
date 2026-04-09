/**
 * Cross-platform backend launcher.
 * Works in: Windows CMD, PowerShell, Git Bash, WSL, macOS, Linux.
 * Requires only Node.js — no bash, no shell-specific syntax.
 */
import { spawnSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { platform } from 'process';

const ROOT = resolve(import.meta.dirname, '..', 'backend');
const IS_WIN = platform === 'win32';

// ── Locate Python ────────────────────────────────────────────────────────────
function findPython() {
  const candidates = IS_WIN
    ? ['python', 'python3', 'py']
    : ['python3', 'python3.12', 'python3.11', 'python3.10', 'python'];

  for (const cmd of candidates) {
    const result = spawnSync(cmd, ['--version'], { encoding: 'utf8', shell: false });
    if (result.status === 0) {
      const version = result.stdout.trim() || result.stderr.trim();
      const match = version.match(/(\d+)\.(\d+)/);
      if (match && (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))) {
        console.log(`Using ${version}`);
        return cmd;
      }
    }
  }
  console.error('Error: Python 3.10+ not found.');
  process.exit(1);
}

// ── Venv paths ───────────────────────────────────────────────────────────────
function venvPaths() {
  // On Windows (including Git Bash running Windows Python), venv uses Scripts/
  // On Unix/WSL, venv uses bin/
  const winPython = join(ROOT, '.venv', 'Scripts', 'python.exe');
  const unixPython = join(ROOT, '.venv', 'bin', 'python');
  return { winPython, unixPython };
}

function getVenvPython() {
  const { winPython, unixPython } = venvPaths();
  if (existsSync(winPython)) return winPython;
  if (existsSync(unixPython)) {
    // Verify the unix python is actually runnable (not a Linux binary on Windows)
    const check = spawnSync(unixPython, ['--version'], { encoding: 'utf8' });
    if (check.status === 0) return unixPython;
  }
  return null;
}

// ── Create venv if needed ────────────────────────────────────────────────────
function ensureVenv(python) {
  let venvPython = getVenvPython();

  if (!venvPython) {
    console.log('Creating virtual environment...');
    const result = spawnSync(python, ['-m', 'venv', '.venv'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      console.error('Error: failed to create virtual environment.');
      process.exit(1);
    }
    venvPython = getVenvPython();
  }

  if (!venvPython) {
    console.error('Error: virtual environment created but Python not found inside it.');
    process.exit(1);
  }

  return venvPython;
}

// ── Install dependencies ─────────────────────────────────────────────────────
function installDeps(venvPython) {
  console.log('Installing dependencies...');
  const result = spawnSync(venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt', '-q'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error('Error: pip install failed.');
    process.exit(1);
  }
}

// ── Start uvicorn ────────────────────────────────────────────────────────────
function startServer(venvPython) {
  console.log('Starting Salvida backend on http://localhost:8000');
  const server = spawn(
    venvPython,
    ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000', '--host', '0.0.0.0'],
    { cwd: ROOT, stdio: 'inherit' }
  );
  server.on('exit', (code) => process.exit(code ?? 0));
}

// ── Main ─────────────────────────────────────────────────────────────────────
const python = findPython();
const venvPython = ensureVenv(python);
installDeps(venvPython);
startServer(venvPython);
