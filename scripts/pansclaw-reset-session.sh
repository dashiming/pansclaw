#!/bin/bash
# PansClaw 会话管理脚本 - 快速重置会话模型覆盖
# 用法: bash ~/scripts/pansclaw-reset-session.sh [session-id]
#       如果不指定 session-id，默认重置 agent:main:main

STATE_DIR="/Users/dashi/.openclaw-pansclaw"
WORKSPACE="/Users/dashi/Documents/pansclaw"
GATEWAY_PORT=18890
GATEWAY_URL="ws://127.0.0.1:${GATEWAY_PORT}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

RESET_SESSION_ID="${1:-agent:main:main}"

echo -e "${BLUE}PansClaw 会话重置 - 清除会话模型覆盖${NC}"
echo ""

# 检查网关
GATEWAY_PID=$(lsof -ti:${GATEWAY_PORT} 2>/dev/null || echo "")
if [ -z "$GATEWAY_PID" ]; then
  echo -e "${RED}✗ 网关未运行${NC}"
  echo "  启动: bash ~/scripts/pansclaw-startup.sh"
  exit 1
fi
echo -e "${GREEN}✓ 网关运行中${NC}"

# 读取 token
TOKEN=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('$STATE_DIR/openclaw.json','utf8')); process.stdout.write(j?.gateway?.auth?.token||'')" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ 无法读取 token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Token 已读取${NC}"
echo ""

# 获取配置，读取 hash
echo "读取当前配置..."
CONFIG_JSON=$(cd "$WORKSPACE" && node dist/index.js gateway call config.get --url "$GATEWAY_URL" --token "$TOKEN" --json --params '{}' 2>/dev/null)

if [ -z "$CONFIG_JSON" ]; then
  echo -e "${RED}✗ 无法读取配置${NC}"
  exit 1
fi

HASH=$(echo "$CONFIG_JSON" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{process.stdout.write(JSON.parse(s).hash);})")

echo "写入重置命令..."
RAW="{\"sessions\":{\"$RESET_SESSION_ID\":{\"model\":null}}}"

RESULT=$(cd "$WORKSPACE" && node dist/index.js gateway call config.patch \
  --url "$GATEWAY_URL" \
  --token "$TOKEN" \
  --json \
  --params "$(node -e "console.log(JSON.stringify({baseHash:\"$HASH\",raw:$RAW}))")" 2>&1)

if echo "$RESULT" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ 会话 '$RESET_SESSION_ID' 已重置${NC}"
  echo "  模型覆盖已清除，该会话将使用默认模型"
  echo ""
  echo -e "${YELLOW}下一步：${NC}"
  echo "  1. 刷新浏览器 F5"
  echo "  2. 重新选择模型（如果需要）"
else
  echo -e "${RED}✗ 重置失败${NC}"
  echo "$RESULT"
  exit 1
fi

echo ""
