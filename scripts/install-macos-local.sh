#!/usr/bin/env bash
set -euo pipefail

# One-click local installer for macOS users.
# Usage:
#   bash scripts/install-macos-local.sh
#   OPENCLAW_GATEWAY_PORT=18889 bash scripts/install-macos-local.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

NODE_MIN_MAJOR=22
NODE_MIN_MINOR=16
OPENCLAW_GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18889}"
OPENCLAW_GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-loopback}"

info() { echo -e "${CYAN}==>${NC} $*"; }
ok() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*" >&2; }

require_macos() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    err "This script is for macOS only."
    exit 1
  fi
}

ensure_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    ok "Homebrew detected"
    return
  fi

  info "Homebrew not found, installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi

  if ! command -v brew >/dev/null 2>&1; then
    err "Homebrew installation failed."
    exit 1
  fi

  ok "Homebrew installed"
}

node_version_ok() {
  local major minor
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  minor="$(node -p 'process.versions.node.split(".")[1]' 2>/dev/null || echo 0)"

  if (( major > NODE_MIN_MAJOR )); then
    return 0
  fi
  if (( major == NODE_MIN_MAJOR && minor >= NODE_MIN_MINOR )); then
    return 0
  fi
  return 1
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && node_version_ok; then
    ok "Node $(node -v) detected"
    return
  fi

  info "Installing Node.js 24 via Homebrew..."
  brew install node@24 >/dev/null
  brew link --overwrite --force node@24 >/dev/null

  if ! command -v node >/dev/null 2>&1 || ! node_version_ok; then
    err "Node.js 22.16+ is required, install/upgrade failed."
    exit 1
  fi

  ok "Node $(node -v) ready"
}

ensure_token() {
  local config_path="$HOME/.openclaw/openclaw.json"
  if [[ -n "${OPENCLAW_GATEWAY_TOKEN:-}" ]]; then
    return
  fi

  if [[ -f "$config_path" ]]; then
    OPENCLAW_GATEWAY_TOKEN="$(node -e '
      const fs=require("fs");
      try {
        const cfg=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
        const t=cfg?.gateway?.auth?.token;
        if (typeof t === "string" && t.trim()) process.stdout.write(t.trim());
      } catch {}
    ' "$config_path")"
  fi

  if [[ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]]; then
    if command -v openssl >/dev/null 2>&1; then
      OPENCLAW_GATEWAY_TOKEN="$(openssl rand -hex 24)"
    else
      OPENCLAW_GATEWAY_TOKEN="$(node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("hex"))')"
    fi
  fi

  export OPENCLAW_GATEWAY_TOKEN
}

install_pansclaw() {
  info "Installing/Updating pansclaw globally..."
  export SHARP_IGNORE_GLOBAL_LIBVIPS=1
  npm install -g pansclaw@latest
  ok "pansclaw installed"
}

resolve_cli() {
  if command -v pansclaw >/dev/null 2>&1; then
    echo "pansclaw"
    return
  fi
  if command -v openclaw >/dev/null 2>&1; then
    echo "openclaw"
    return
  fi
  err "pansclaw command not found after installation."
  exit 1
}

run_onboard() {
  local cli="$1"
  info "Running non-interactive local onboarding..."
  "$cli" onboard \
    --accept-risk \
    --non-interactive \
    --mode local \
    --flow quickstart \
    --auth-choice skip \
    --gateway-auth token \
    --gateway-token "$OPENCLAW_GATEWAY_TOKEN" \
    --gateway-bind "$OPENCLAW_GATEWAY_BIND" \
    --gateway-port "$OPENCLAW_GATEWAY_PORT" \
    --skip-channels \
    --skip-skills \
    --skip-search \
    --skip-ui \
    --skip-health \
    --install-daemon >/tmp/pansclaw-onboard.log 2>&1 || {
      warn "Non-interactive onboarding failed, falling back to interactive mode..."
      "$cli" onboard --install-daemon
    }
  ok "Onboarding completed"
}

check_gateway() {
  local health_url="http://127.0.0.1:${OPENCLAW_GATEWAY_PORT}/healthz"
  if curl -fsS "$health_url" >/dev/null 2>&1; then
    ok "Gateway is healthy at ${health_url}"
  else
    warn "Gateway health check failed now. You can run: pansclaw gateway status --deep"
  fi
}

main() {
  require_macos
  ensure_homebrew
  ensure_node
  ensure_token
  install_pansclaw

  local cli
  cli="$(resolve_cli)"
  run_onboard "$cli"
  check_gateway

  cat <<EOF

Done. Next steps:
1) Open dashboard: http://127.0.0.1:${OPENCLAW_GATEWAY_PORT}
2) Login token: ${OPENCLAW_GATEWAY_TOKEN}
3) Configure your model API key in Settings -> Models
4) Useful commands:
   - ${cli} gateway status --deep
   - ${cli} dashboard
EOF
}

main "$@"
