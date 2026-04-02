#!/usr/bin/env bash
set -euo pipefail

# Run from repository root regardless of caller cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f package.json ]]; then
  echo "[startup-check] package.json not found. Run inside pansclaw repository."
  exit 1
fi

STATE_DIR="${OPENCLAW_STATE_DIR:-/tmp/openclaw-help-check}"
export OPENCLAW_STATE_DIR="$STATE_DIR"
mkdir -p "$OPENCLAW_STATE_DIR"

echo "[startup-check] repo: $REPO_ROOT"
echo "[startup-check] state dir: $OPENCLAW_STATE_DIR"

echo "[startup-check] checking command registration..."
pnpm openclaw startup --help >/dev/null

echo "[startup-check] running check-only path..."
pnpm openclaw startup --check-only

echo "[startup-check] verifying source files..."
for f in \
  src/commands/startup.ts \
  src/cli/program/register.maintenance.ts \
  src/cli/program/command-registry.ts

do
  if [[ ! -f "$f" ]]; then
    echo "[startup-check] missing required file: $f"
    exit 1
  fi
done

echo "[startup-check] OK: startup is available and check-only path is healthy."
