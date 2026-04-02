#!/bin/bash
# PansClaw 启动脚本 - 固定流程，避免状态漂移
# 用法: bash ~/scripts/pansclaw-startup.sh

set -e

# ============ 配置 ============
STATE_DIR="/Users/dashi/.openclaw-pansclaw"
WORKSPACE="/Users/dashi/Documents/pansclaw"
GATEWAY_PORT=18890
GATEWAY_URL="ws://127.0.0.1:${GATEWAY_PORT}"
GATEWAY_LOG="/tmp/pansclaw-gateway.log"

# ANSI 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         PansClaw 启动脚本 v1.0 - Fixed State Flow        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 验证前置条件
echo -e "${YELLOW}[1/5] 验证前置条件...${NC}"

if [ ! -d "$WORKSPACE" ]; then
  echo -e "${RED}✗ 仓库目录不存在: $WORKSPACE${NC}"
  exit 1
fi
echo -e "${GREEN}✓ 仓库存在${NC}"

if [ ! -d "$STATE_DIR" ]; then
  echo -e "${RED}✗ 状态目录不存在: $STATE_DIR${NC}"
  echo "  请先运行: mkdir -p $STATE_DIR"
  exit 1
fi
echo -e "${GREEN}✓ 状态目录固定在: $STATE_DIR${NC}"

# 2. 停止旧网关进程
echo ""
echo -e "${YELLOW}[2/5] 停止旧网关进程...${NC}"

OLD_PID=$(lsof -ti:${GATEWAY_PORT} 2>/dev/null || echo "")
if [ -n "$OLD_PID" ]; then
  kill -9 "$OLD_PID" 2>/dev/null || true
  sleep 1
  echo -e "${GREEN}✓ 已关闭旧网关 (PID: $OLD_PID)${NC}"
else
  echo -e "${GREEN}✓ 无旧进程${NC}"
fi

# 3. 启动新网关
echo ""
echo -e "${YELLOW}[3/5] 启动网关...${NC}"

cd "$WORKSPACE"
export OPENCLAW_STATE_DIR="$STATE_DIR"

# 使用 nohup 在后台启动，避免启动脚本退出时网关也退出
nohup pnpm openclaw gateway run --bind loopback --port ${GATEWAY_PORT} --force > "$GATEWAY_LOG" 2>&1 &
GATEWAY_PID=$!
echo -e "${GREEN}✓ 网关进程 PID: $GATEWAY_PID${NC}"

# 等待网关启动
echo "  等待网关启动..."
MAX_WAIT=30
WAIT_COUNT=0
until lsof -ti:${GATEWAY_PORT} >/dev/null 2>&1 || [ $WAIT_COUNT -ge $MAX_WAIT ]; do
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT+1))
  printf "."
done
echo ""

if ! lsof -ti:${GATEWAY_PORT} >/dev/null 2>&1; then
  echo -e "${RED}✗ 网关启动失败${NC}"
  echo "  日志: tail -n 50 $GATEWAY_LOG"
  tail -n 20 "$GATEWAY_LOG"
  exit 1
fi
echo -e "${GREEN}✓ 网关已启动 (port ${GATEWAY_PORT})${NC}"

# 4. 验证网关和获取配置
echo ""
echo -e "${YELLOW}[4/5] 验证网关配置...${NC}"

# 读取 token
if [ ! -f "$STATE_DIR/openclaw.json" ]; then
  echo -e "${RED}✗ 状态文件不存在: $STATE_DIR/openclaw.json${NC}"
  exit 1
fi

TOKEN=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('$STATE_DIR/openclaw.json','utf8')); process.stdout.write(j?.gateway?.auth?.token||'')" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ 无法读取网关 token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Token 已加载${NC}"
echo "  Token: ${TOKEN:0:16}...${TOKEN: -8}"

# 获取当前配置
CONFIG_JSON=$(node dist/index.js gateway call config.get --url "$GATEWAY_URL" --token "$TOKEN" --json --params '{}' 2>/dev/null || echo "{}")

DEFAULT_MODEL=$(echo "$CONFIG_JSON" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(j.config?.agents?.defaults?.model?.primary||'(未设置)');}catch(e){process.stdout.write('(读取失败)');}});" 2>/dev/null || echo "(失败)")

echo -e "${GREEN}✓ 默认模型: $DEFAULT_MODEL${NC}"

# 5. 显示状态总结
echo ""
echo -e "${YELLOW}[5/5] 状态总结${NC}"
echo ""
echo -e "  ${GREEN}✓ 网关${NC}        运行在 ${BLUE}http://127.0.0.1:${GATEWAY_PORT}${NC}"
echo -e "  ${GREEN}✓ 状态目录${NC}    ${BLUE}$STATE_DIR${NC}"
echo -e "  ${GREEN}✓ 默认模型${NC}    ${BLUE}$DEFAULT_MODEL${NC}"
echo -e "  ${GREEN}✓ Token${NC}      已验证"
echo ""

# 显示后续步骤
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}启动成功！下一步：${NC}"
echo ""
echo "  1️⃣  用固定浏览器 profile 打开："
echo "     ${BLUE}http://127.0.0.1:${GATEWAY_PORT}${NC}"
echo ""
echo "  2️⃣  Control UI Settings → 粘贴 token（若提示 unauthorized）："
echo "     ${BLUE}${TOKEN:0:20}...${NC}"
echo ""
echo "  3️⃣  设置页只保留一个标签页，避免并发写冲突"
echo ""
echo "  4️⃣  模型选择前先查看可用模型列表，使用真实 ID"
echo ""
echo "  5️⃣  当前会话若显示旧模型，开新会话或刷新页面"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "💡 查看网关日志: ${BLUE}tail -f $GATEWAY_LOG${NC}"
echo -e "💡 诊断系统状态: ${BLUE}bash ~/scripts/pansclaw-doctor.sh${NC}"
echo ""
