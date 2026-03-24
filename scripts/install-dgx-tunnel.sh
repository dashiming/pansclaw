#!/usr/bin/env bash
# install-dgx-tunnel.sh
# 将 DGX SSH 隧道注册为 launchd 常驻服务并立即启动。
# 用法:
#   bash scripts/install-dgx-tunnel.sh          # 安装/重载
#   bash scripts/install-dgx-tunnel.sh unload   # 停止并卸载
#   bash scripts/install-dgx-tunnel.sh status   # 查看状态
set -euo pipefail

LABEL="ai.pansclaw.dgx-tunnel"
AGENTS_DIR="$HOME/Library/LaunchAgents"
TARGET="$AGENTS_DIR/$LABEL.plist"
SRC="$(cd "$(dirname "$0")" && pwd)/dgx-tunnel.plist"
LOGFILE="/tmp/pansclaw-dgx-tunnel.log"

cmd="${1:-install}"

case "$cmd" in
  unload|stop)
    launchctl unload "$TARGET" 2>/dev/null && echo "Stopped and unloaded $LABEL." || echo "$LABEL was not loaded."
    exit 0
    ;;
  status)
    echo "=== launchctl status ==="
    launchctl list "$LABEL" 2>/dev/null || echo "(not loaded)"
    echo ""
    echo "=== last 30 log lines ==="
    [ -f "$LOGFILE" ] && tail -30 "$LOGFILE" || echo "(no log yet)"
    exit 0
    ;;
esac

# --- install / reload ---
mkdir -p "$AGENTS_DIR"
cp "$SRC" "$TARGET"

# Unload first in case it was already registered (ignore errors)
launchctl unload "$TARGET" 2>/dev/null || true

launchctl load -w "$TARGET"
sleep 1

echo "Installed and started $LABEL"
echo "Plist: $TARGET"
echo "Log:   $LOGFILE"
echo ""

# Quick connectivity check
if curl -sf "http://127.0.0.1:18080/v1/models" | python3 -m json.tool > /dev/null 2>&1; then
  echo "✅  Tunnel is UP — endpoint http://127.0.0.1:18080/v1/models reachable"
else
  echo "⏳  Tunnel not yet reachable (ssh handshake may still be in progress)"
  echo "    Re-run: bash scripts/install-dgx-tunnel.sh status"
fi
