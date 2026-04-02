#!/bin/bash
# PansClaw 模型查询脚本 - 显示所有可用的真实模型 ID
# 用法: bash ~/scripts/pansclaw-models.sh [provider]

STATE_DIR="/Users/dashi/.openclaw-pansclaw"
WORKSPACE="/Users/dashi/Documents/pansclaw"
GATEWAY_PORT=18890
GATEWAY_URL="ws://127.0.0.1:${GATEWAY_PORT}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

FILTER_PROVIDER="${1:-}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           PansClaw 模型查询 - 显示真实可用模型            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查网关
GATEWAY_PID=$(lsof -ti:${GATEWAY_PORT} 2>/dev/null || echo "")
if [ -z "$GATEWAY_PID" ]; then
  echo -e "${RED}✗ 网关未运行${NC}"
  echo "  启动: bash ~/scripts/pansclaw-startup.sh"
  exit 1
fi

# 读取 token
TOKEN=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('$STATE_DIR/openclaw.json','utf8')); process.stdout.write(j?.gateway?.auth?.token||'')" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ 无法读取 token${NC}"
  exit 1
fi

echo "正在查询配置中的提供商..."
echo ""

# 读取配置
CONFIG=$(cd "$WORKSPACE" && node dist/index.js gateway call config.get --url "$GATEWAY_URL" --token "$TOKEN" --json --params '{}' 2>/dev/null)

# 提取所有提供商名称
PROVIDERS=$(echo "$CONFIG" | node -e "
let s = '';
process.stdin.on('data', d => s += d);
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(s);
    const providers = j.config?.models?.providers || {};
    const names = Object.keys(providers).sort();
    console.log(names.join('\\n'));
  } catch(e) {}
});
" 2>/dev/null)

if [ -z "$PROVIDERS" ]; then
  echo -e "${RED}✗ 无法读取提供商列表${NC}"
  exit 1
fi

# 如果指定了提供商，只显示该提供商
if [ -n "$FILTER_PROVIDER" ]; then
  PROVIDERS=$(echo "$PROVIDERS" | grep "^$FILTER_PROVIDER$")
  if [ -z "$PROVIDERS" ]; then
    echo -e "${RED}✗ 提供商 '$FILTER_PROVIDER' 不存在${NC}"
    echo ""
    echo "可用的提供商:"
    echo "$PROVIDERS" | while read -r p; do
      echo "  • $p"
    done
    exit 1
  fi
fi

# 显示每个提供商的模型
FOUND_ANY=0

echo "$PROVIDERS" | while read -r PROVIDER; do
  [ -z "$PROVIDER" ] && continue
  
  FOUND_ANY=1
  
  MODELS=$(echo "$CONFIG" | node -e "
let s = '';
process.stdin.on('data', d => s += d);
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(s);
    const provider = j.config?.models?.providers?.['$PROVIDER'];
    if (!provider || !provider.models) {
      console.log('');
      return;
    }
    const modelList = provider.models;
    if (Array.isArray(modelList)) {
      modelList.forEach(m => console.log(m.id || m.name || m));
    } else {
      Object.keys(modelList).forEach(k => console.log(k));
    }
  } catch(e) {}
});
" 2>/dev/null)

  # 计数
  MODEL_COUNT=$(echo "$MODELS" | grep -c . || echo "0")
  
  if [ "$MODEL_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}提供商: ${BLUE}$PROVIDER${NC} (${GREEN}$MODEL_COUNT${NC} 个模型)"
    while read -r MODEL; do
      [ -z "$MODEL" ] && continue
      echo -e "  ${GRAY}→${NC} ${BLUE}$PROVIDER/$MODEL${NC}"
    done <<< "$MODELS"
  else
    echo -e "${YELLOW}提供商: ${BLUE}$PROVIDER${NC} (无模型或未配置)"
  fi
  echo ""
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}使用建议：${NC}"
echo ""
echo "  • 在 UI 模型选择框中，只用上面显示的 ID（provider/model 格式）"
echo "  • 不要用自定义别名（如 'claude middle'）"
echo "  • 若要查询特定提供商，使用: bash ~/scripts/pansclaw-models.sh vllm"
echo ""
