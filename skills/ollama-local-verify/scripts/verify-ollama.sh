#!/bin/bash
set -e

# PansClaw Ollama Verification Script
# Usage: bash skills/ollama-local-verify/scripts/verify-ollama.sh [model]
# Examples:
#   bash skills/ollama-local-verify/scripts/verify-ollama.sh qwen3-fast:latest
#   bash skills/ollama-local-verify/scripts/verify-ollama.sh qwen3-coder:30b

MODEL="${1:-qwen3-fast:latest}"
PROMPT="${2:-hello, how are you?}"

echo "═══════════════════════════════════════════════════"
echo "PansClaw Ollama Verification"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Model: $MODEL"
echo "Prompt: $PROMPT"
echo ""

# Step 1: Check if gateway is healthy
echo "[1/5] Checking gateway health..."
STATUS=$(docker compose exec -T openclaw-gateway node dist/index.js health 2>&1 || true)
if [[ "$STATUS" == *"healthy"* ]] || [[ "$STATUS" == *"ready"* ]]; then
  echo "✓ Gateway is healthy"
else
  echo "⚠ Gateway response unclear, continuing..."
fi
echo ""

# Step 2: List available models
echo "[2/5] Available Ollama models:"
docker compose exec -T openclaw-gateway node dist/index.js models list 2>/dev/null | grep ollama || echo "(none found)"
echo ""

# Step 3: Direct Ollama API test
echo "[3/5] Testing direct Ollama API (no agent, no tools)..."
RESULT=$(docker compose exec -T openclaw-gateway sh -lc \
  "printf '%s' '{\"model\":\"$MODEL\",\"prompt\":\"$PROMPT\",\"stream\":false,\"options\":{\"num_predict\":32}}' \
   | curl --max-time 120 -sS http://host.docker.internal:11434/api/generate \
   -H 'Content-Type: application/json' -d @- 2>&1" || true)

if echo "$RESULT" | grep -q '"response"'; then
  echo "✓ Direct API call succeeded"
  echo "Sample response (first 200 chars):"
  echo "$RESULT" | grep -o '"response":"[^"]*"' | head -c 200
  echo ""
else
  echo "✗ Direct API call failed or unexpected response"
  echo "Response (first 300 chars): ${RESULT:0:300}"
  echo ""
fi
echo ""

# Step 4: Clean session and try agent path
echo "[4/5] Cleaning session locks..."
docker compose exec -T openclaw-gateway sh -lc 'rm -f /home/node/.openclaw/agents/main/sessions/*.lock' || true
echo "✓ Session locks cleared"
echo ""

# Step 5: Switch model and test agent
echo "[5/5] Switching to $MODEL and testing agent..."
docker compose exec -T openclaw-gateway node dist/index.js config set agents.defaults.model.primary "ollama/$MODEL" > /dev/null 2>&1 || true

AGENT_RESULT=$(docker compose exec -T openclaw-gateway sh -lc \
  "node dist/index.js agent --agent main --message '$PROMPT' --thinking low" 2>&1 || true)

if echo "$AGENT_RESULT" | grep -q "does not support tools"; then
  echo "⚠ Model does not support tools (expected for fast models)"
  echo "  → Use direct Ollama API calls instead"
  echo "  → Or switch to a model/provider that supports tools"
elif echo "$AGENT_RESULT" | grep -iq "error\|fail"; then
  echo "✗ Agent test failed:"
  echo "$AGENT_RESULT" | head -n 5
else
  echo "✓ Agent test completed"
fi
echo ""

echo "═══════════════════════════════════════════════════"
echo "Verification complete!"
echo "═══════════════════════════════════════════════════"
