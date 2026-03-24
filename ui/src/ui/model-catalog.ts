import type { ModelCatalogEntry } from "./types.ts";

export const PROVIDER_DISPLAY_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  minimax: "MiniMax",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  Qwen: "Qwen",
  mistral: "Mistral",
  cohere: "Cohere",
  groq: "Groq",
  perplexity: "Perplexity",
  openrouter: "OpenRouter",
  ollama: "Ollama",
  xai: "xAI",
  together: "Together AI",
};

export const WELL_KNOWN_MODELS: ModelCatalogEntry[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", provider: "openai" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 nano", provider: "openai" },
  { id: "o3", name: "o3", provider: "openai" },
  { id: "o3-mini", name: "o3-mini", provider: "openai" },
  { id: "o1", name: "o1", provider: "openai" },
  { id: "o1-mini", name: "o1-mini", provider: "openai" },
  { id: "o4-mini", name: "o4-mini", provider: "openai" },
  { id: "gpt-4.5-preview", name: "GPT-4.5 Preview", provider: "openai" },
  { id: "chatgpt-4o-latest", name: "ChatGPT 4o Latest", provider: "openai" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "anthropic" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "anthropic" },
  { id: "claude-haiku-3-5", name: "Claude Haiku 3.5", provider: "anthropic" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" },
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", provider: "anthropic" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google" },
  { id: "gemini-2.5-pro-preview", name: "Gemini 2.5 Pro Preview", provider: "google" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", provider: "google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google" },
  { id: "gemini-exp-1206", name: "Gemini Experimental 1206", provider: "google" },
  { id: "MiniMax-M2.5", name: "MiniMax M2.5", provider: "minimax" },
  { id: "MiniMax-M2.5-highspeed", name: "MiniMax M2.5 Highspeed", provider: "minimax" },
  { id: "MiniMax-Text-01", name: "MiniMax Text-01", provider: "minimax" },
  { id: "MiniMax-Text-01-05", name: "MiniMax Text-01-05", provider: "minimax" },
  { id: "deepseek-chat", name: "DeepSeek V3", provider: "deepseek" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", provider: "deepseek" },
  { id: "deepseek-v2.5", name: "DeepSeek V2.5", provider: "deepseek" },
  { id: "qwen-max", name: "Qwen Max", provider: "qwen" },
  { id: "qwen-plus", name: "Qwen Plus", provider: "qwen" },
  { id: "qwen-turbo", name: "Qwen Turbo", provider: "qwen" },
  { id: "qwen2.5-72b-instruct", name: "Qwen2.5 72B Instruct", provider: "qwen" },
  { id: "qwen3-235b-a22b", name: "Qwen3 235B-A22B", provider: "qwen" },
  { id: "Qwen/Qwen3-32B", name: "Qwen3 32B (Local)", provider: "Qwen" },
  { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen2.5 72B (Local)", provider: "Qwen" },
  { id: "mistral-large-latest", name: "Mistral Large", provider: "mistral" },
  { id: "mistral-small-latest", name: "Mistral Small", provider: "mistral" },
  { id: "open-mistral-nemo", name: "Mistral Nemo", provider: "mistral" },
  { id: "codestral-latest", name: "Codestral", provider: "mistral" },
  { id: "grok-3", name: "Grok-3", provider: "xai" },
  { id: "grok-3-mini", name: "Grok-3 mini", provider: "xai" },
  { id: "grok-2-latest", name: "Grok-2", provider: "xai" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", provider: "groq" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "groq" },
  { id: "llama3-70b-8192", name: "Llama 3 70B", provider: "groq" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "groq" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "groq" },
  { id: "command-r-plus", name: "Command R+", provider: "cohere" },
  { id: "command-r", name: "Command R", provider: "cohere" },
  { id: "command-a-03-2025", name: "Command A", provider: "cohere" },
  { id: "sonar-pro", name: "Sonar Pro", provider: "perplexity" },
  { id: "sonar", name: "Sonar", provider: "perplexity" },
  { id: "sonar-reasoning", name: "Sonar Reasoning", provider: "perplexity" },
  { id: "sonar-deep-research", name: "Sonar Deep Research", provider: "perplexity" },
  { id: "ollama/llama3.2", name: "Llama 3.2", provider: "ollama" },
  { id: "ollama/llama3.1:70b", name: "Llama 3.1 70B", provider: "ollama" },
  { id: "ollama/mistral", name: "Mistral", provider: "ollama" },
  { id: "ollama/mixtral:8x7b", name: "Mixtral 8x7B", provider: "ollama" },
  { id: "ollama/qwen2.5:14b", name: "Qwen2.5 14B", provider: "ollama" },
  { id: "ollama/deepseek-r1:7b", name: "DeepSeek R1 7B", provider: "ollama" },
  { id: "ollama/phi4", name: "Phi-4", provider: "ollama" },
  {
    id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    name: "Llama 3.1 70B Turbo",
    provider: "together",
  },
  {
    id: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
    name: "Llama 3.1 405B Turbo",
    provider: "together",
  },
  { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", name: "Qwen2.5 72B Turbo", provider: "together" },
  { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3", provider: "together" },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B", provider: "together" },
];

export type ChatModelOption = {
  value: string;
  label: string;
  provider: string;
  displayName: string;
};

export function buildChatModelOptions(
  catalog: ModelCatalogEntry[],
  currentOverride: string,
  defaultModel: string,
): ChatModelOption[] {
  const seen = new Set<string>();
  const options: ChatModelOption[] = [];
  const addOption = (id: string, displayName: string, provider: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const providerLabel = PROVIDER_DISPLAY_LABELS[provider] || provider;
    options.push({
      value: trimmed,
      label: `${displayName} · ${providerLabel}`,
      provider,
      displayName,
    });
  };

  for (const entry of catalog) {
    addOption(entry.id, entry.name || entry.id, entry.provider?.trim() || "");
  }

  for (const entry of WELL_KNOWN_MODELS) {
    addOption(entry.id, entry.name || entry.id, entry.provider);
  }

  if (currentOverride) {
    addOption(
      currentOverride,
      currentOverride,
      currentOverride.includes("/") ? currentOverride.split("/")[0] : currentOverride,
    );
  }
  if (defaultModel && defaultModel !== currentOverride) {
    addOption(
      defaultModel,
      defaultModel,
      defaultModel.includes("/") ? defaultModel.split("/")[0] : defaultModel,
    );
  }
  return options;
}

export function groupChatModelOptions(options: ChatModelOption[]): Map<string, ChatModelOption[]> {
  const grouped = new Map<string, ChatModelOption[]>();
  for (const option of options) {
    const list = grouped.get(option.provider) ?? [];
    list.push(option);
    grouped.set(option.provider, list);
  }
  return grouped;
}
