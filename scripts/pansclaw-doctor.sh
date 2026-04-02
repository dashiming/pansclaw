#!/bin/bash
# PansClaw 诊断脚本 - 检查系统状态和潜在问题
# 用法: bash ~/scripts/pansclaw-doctor.sh

# ============ 配置 ============
STATE_DIR="/Users/dashi/.openclaw-pansclaw"
WORKSPACE="/Users/dashi/Documents/pansclaw"
GATEWAY_PORT=18890
GATEWAY_URL="ws://127.0.0.1:${GATEWAY_PORT}"

# ANSI 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

# 条件输出函数
pass() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}ℹ${NC} $1"; }

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            PansClaw 诊断工具 v1.0 - Health Check         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ========== 检查 1: 环境 ==========
echo -e "${YELLOW}[检查 1/7] 环境配置${NC}"

if [ "$OPENCLAW_STATE_DIR" = "$STATE_DIR" ]; then
  pass "OPENCLAW_STATE_DIR 已正确设置: $OPENCLAW_STATE_DIR"
else
  if [ -z "$OPENCLAW_STATE_DIR" ]; then
    fail "OPENCLAW_STATE_DIR 未设置，应该是: $STATE_DIR"
    warn "  运行: source ~/.zshrc"
  else
    fail "OPENCLAW_STATE_DIR 设置不对"
    warn "  当前: $OPENCLAW_STATE_DIR"
    warn "  应该: $STATE_DIR"
  fi
fi

if [ -d "$STATE_DIR" ]; then
  pass "状态目录存在: $STATE_DIR"
else
  fail "状态目录不存在: $STATE_DIR"
fi

# ========== 检查 2: 网关运行 ==========
echo ""
echo -e "${YELLOW}[检查 2/7] 网关运行状态${NC}"

GATEWAY_PID=$(lsof -ti:${GATEWAY_PORT} 2>/dev/null || echo "")

if [ -n "$GATEWAY_PID" ]; then
  pass "网关运行中 (PID: $GATEWAY_PID, Port: ${GATEWAY_PORT})"
else
  fail "网关未运行 (Port: ${GATEWAY_PORT})"
  warn "  启动: bash ~/scripts/pansclaw-startup.sh"
fi

# ========== 检查 3: Token 验证 ==========
echo ""
echo -e "${YELLOW}[检查 3/7] Token 验证${NC}"

if [ ! -f "$STATE_DIR/openclaw.json" ]; then
  fail "状态文件丢失: $STATE_DIR/openclaw.json"
else
  pass "状态文件存在"
  
  TOKEN=$(node -e "const fs=require('fs'); try{const j=JSON.parse(fs.readFileSync('$STATE_DIR/openclaw.json','utf8')); process.stdout.write(j?.gateway?.auth?.token||'');}catch(e){}" 2>/dev/null || echo "")
  
  if [ -z "$TOKEN" ]; then
    fail "无法从文件读取 Token"
  else
    pass "Token 已加载: ${TOKEN:0:16}...${TOKEN: -8}"
    info "这是网关的验证 token，Control UI 需要相同的 token"
  fi
fi

# ========== 检查 4: 配置状态 ==========
echo ""
echo -e "${YELLOW}[检查 4/7] 配置状态${NC}"

if [ -z "$TOKEN" ] || [ -z "$GATEWAY_PID" ]; then
  fail "无法验证配置（网关或 Token 缺失）"
else
  CONFIG_RESP=$(cd "$WORKSPACE" && node dist/index.js gateway call config.get --url "$GATEWAY_URL" --token "$TOKEN" --json --params '{}' 2>/dev/null || echo "{}")
  
  DEFAULT_MODEL=$(echo "$CONFIG_RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(j.config?.agents?.defaults?.model?.primary||'');} catch(e){}})" 2>/dev/null || echo "")
  
  if [ -z "$DEFAULT_MODEL" ]; then
    warn "未设置默认模型"
    info "  建议设置一个有效的模型 ID（例如: vllm/claude-sonnet-4-5）"
  else
    pass "默认模型: $DEFAULT_MODEL"
  fi
fi

# ========== 检查 5: 会话状态 ==========
echo ""
echo -e "${YELLOW}[检查 5/7] 会话状态${NC}"

if [ -f "$STATE_DIR/sessions.json" ]; then
  pass "会话文件存在"
  
  SESSION_COUNT=$(node -e "const fs=require('fs'); try{const d=JSON.parse(fs.readFileSync('$STATE_DIR/sessions.json','utf8')); process.stdout.write(Object.keys(d).length.toString());} catch(e){process.stdout.write('0');}" 2>/dev/null || echo "0")
  
  if [ "$SESSION_COUNT" -gt 0 ]; then
    info "活跃会话数: $SESSION_COUNT"
    info "  若会话显示旧模型，开新会话或在该会话执行: sessions.patch model=null"
  else
    info "无活跃会话（干净状态）"
  fi
else
  info "会话文件不存在（干净状态）"
fi

# ========== 检查 6: 浏览器状态 ==========
echo ""
echo -e "${YELLOW}[检查 6/7] 浏览器数据${NC}"

if [ -d "$HOME/Library/Application Support/Google/Chrome/Default" ]; then
  info "检测到 Chrome，建议："
  warn "  使用专用浏览器 profile 访问 http://127.0.0.1:${GATEWAY_PORT}"
  warn "  避免定期清缓存，以保持 token 在 localStorage 中"
else
  info "请使用固定浏览器 profile，避免清缓存/无痕模式"
fi

# ========== 检查 7: 模型可用性 ==========
echo ""
echo -e "${YELLOW}[检查 7/7] 模型检查${NC}"

# 从配置里读取 vllm provider 的 baseUrl
if [ -z "$OPENCLAW_STATE_DIR" ]; then
  warn "无法检查 vllm 模型（OPENCLAW_STATE_DIR 未设置）"
else
  VLLM_BASE=$(node -e "const fs=require('fs'); try{const cfg=JSON.parse(fs.readFileSync('$STATE_DIR/openclaw.json','utf8')); const url=cfg?.models?.providers?.vllm?.baseUrl||''; process.stdout.write(url);} catch(e){}" 2>/dev/null || echo "")
  
  if [ -z "$VLLM_BASE" ]; then
    warn "vllm 提供商未配置"
    info "  若使用 vllm，请先在网关配置中添加"
  else
    pass "vllm baseUrl: $VLLM_BASE"
    info "  检查可用模型: curl $VLLM_BASE/models"
  fi
fi

# ========== 总结 ==========
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}诊断完成${NC}"
echo ""

# 建议输出
echo -e "${YELLOW}预防建议：${NC}"
echo ""
echo "  1️⃣  确保 ~/.zshrc 包含: export OPENCLAW_STATE_DIR=\"$STATE_DIR\""
echo ""
echo "  2️⃣  每次启动用固定脚本:"
echo "     ${BLUE}bash ~/scripts/pansclaw-startup.sh${NC}"
echo ""
echo "  3️⃣  设置页面:"
echo "     • 同一时间只保留一个 Control UI 标签页"
echo "     • 改配置前先刷新（F5）"
echo ""
echo "  4️⃣  模型选择:"
echo "     • 只用真实 ID（查询 /v1/models 接口）"
echo "     • 不要用自定义别名（如 'claude middle'）"
echo ""
echo "  5️⃣  会话管理:"
echo "     • 默认模型改完后，用新会话或执行 sessions.patch model=null"
echo ""
echo "  6️⃣  浏览器:"
echo "     • 固定 profile 访问 http://127.0.0.1:${GATEWAY_PORT}"
echo "     • 不清这个站点的 localStorage"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
