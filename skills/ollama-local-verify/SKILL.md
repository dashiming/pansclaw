---
name: ollama-local-verify
description: Verify, configure, and test local Ollama models (qwen3-fast, qwen3-coder, etc). Use this to test model connectivity, switch between models, diagnose "does not support tools" errors, and run quick inference checks without full agent overhead. Useful for M-series Mac low-latency validation.
---

# Local Ollama Model Verification

Use this skill to quickly test Ollama models and diagnose configuration issues in the PansClaw gateway.

## Quick Start (5 min diag)

### 1. Check model availability

```bash
docker compose exec -T openclaw-gateway node dist/index.js models list | grep ollama
```

Expect output like:

```
ollama/qwen3-fast:latest     text       32k      no    yes
ollama/qwen3-coder:30b       text       195k     no    yes   default
```

### 2. Check current default model

```bash
docker compose exec -T openclaw-gateway node dist/index.js config get agents.defaults.model.primary
```

### 3. Direct Ollama API test (no agent, no tools overhead)

```bash
docker compose exec -T openclaw-gateway sh -lc \
  "printf '%s' '{\"model\":\"qwen3-fast:latest\",\"prompt\":\"hello\",\"stream\":false,\"options\":{\"num_predict\":16}}' \
   | curl -sS http://host.docker.internal:11434/api/generate \
   -H 'Content-Type: application/json' -d @- | head -c 300"
```

Expect JSON with `"response":"..."` field containing model output.

## Switching Models

### A. Try a different model (immediate, no restart)

```bash
# Switch to qwen3-fast (3.3B params, fast on M-series)
docker compose exec -T openclaw-gateway node dist/index.js config set agents.defaults.model.primary ollama/qwen3-fast:latest

# Or qwen3-coder:30b (30B params, slower on M-series)
docker compose exec -T openclaw-gateway node dist/index.js config set agents.defaults.model.primary ollama/qwen3-coder:30b

# Verify
docker compose exec -T openclaw-gateway node dist/index.js config get agents.defaults.model.primary
```

### B. Agent test with new model (after config change)

```bash
docker compose exec -T openclaw-gateway sh -lc \
  'rm -f /home/node/.openclaw/agents/main/sessions/*.lock; \
   node dist/index.js agent --agent main --message "一句话：你好" --thinking low'
```

## Troubleshooting

### "does not support tools" error

This error occurs when an Ollama model doesn't support tool/function calling. **This is a model limitation, not a configuration error.** The `agent` command automatically adds tools support; models like `qwen3-fast` and `qwen3-coder` don't support it.

**Workarounds:**

1. **Use direct Ollama API** (skip agent tools):

   ```bash
   docker compose exec -T openclaw-gateway sh -lc \
     "curl -sS http://host.docker.internal:11434/api/generate \
      -H 'Content-Type: application/json' \
      -d '{\"model\":\"qwen3-fast:latest\",\"prompt\":\"your prompt\",\"stream\":false}'"
   ```

2. **Use a model that supports tools** (if available locally, or switch to remote provider):

   ```bash
   # Try DeepSeek (supports tools via openai provider)
   docker compose exec -T openclaw-gateway node dist/index.js config set agents.defaults.model.primary openai/deepseek-chat
   ```

3. **Measure inference time** for your model choice:
   ```bash
   docker compose exec -T openclaw-gateway sh -lc \
     "time curl -sS http://host.docker.internal:11434/api/generate \
      -H 'Content-Type: application/json' \
      -d '{\"model\":\"qwen3-fast:latest\",\"prompt\":\"why is the sky blue\",\"stream\":false,\"options\":{\"num_predict\":64}}' \
      > /tmp/ollama-output.json"
   ```

### Ollama not responding

Check if Ollama service is running:

```bash
# On Mac with homebrew:
launchctl list | grep ollama

# Or direct test:
curl -sS http://127.0.0.1:11434/api/tags | head -c 100
```

### Model not found

Ensure model is pulled:

```bash
# In mac terminal (not docker):
ollama pull qwen3-fast:latest
ollama pull qwen3-coder:30b

# List pulled models
ollama list
```

## Model Comparison (M-series Mac baseline)

| Model                            | Size  | Params | Approx Latency (first token) | Tools Support |
| -------------------------------- | ----- | ------ | ---------------------------- | ------------- |
| `qwen3-fast:latest`              | 3.3B  | 3B     | ~100-300ms                   | ❌ No         |
| `qwen3-coder:30b`                | ~18GB | 30B    | ~5-15s                       | ❌ No         |
| `openai/deepseek-chat` (via API) | N/A   | 671B   | ~1-3s                        | ✅ Yes        |

Choose based on your latency tolerance and whether you need tool calling.

## Keep Clean

- Always clean session locks before testing: `docker compose exec -T openclaw-gateway sh -lc 'rm -f /home/node/.openclaw/agents/main/sessions/*.lock'`
- Use short prompts and `--thinking low` to minimize token usage
- Test with `num_predict: 16-64` in direct Ollama calls to get feedback fast

## Reference: Full Config Check

```bash
docker compose exec -T openclaw-gateway sh -lc \
  'node dist/index.js config get models.providers.ollama | head -c 500'
```

Expect:

```json
{
  "baseUrl": "http://host.docker.internal:11434",
  "api": "ollama",
  "apiKey": "__OPENCLAW_REDACTED__",
  "models": [{...}]
}
```
