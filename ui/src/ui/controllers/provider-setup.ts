import type { GatewayBrowserClient } from "../gateway.ts";
import { updateConfigFormValue } from "./config.ts";
import { loadModels } from "./models.ts";

const DEFAULT_REMOTE_MODEL_CONTEXT_WINDOW = 128_000;
const DEFAULT_REMOTE_MODEL_MAX_TOKENS = 8_192;

export type ProviderSetupState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  configSnapshot: { hash?: string | null; config?: Record<string, unknown> | null } | null;
  chatModelsLoading: boolean;
  chatModelCatalog: Array<{ id: string; name: string; provider: string }>;
  modelSetupSelectedModel: string;
  modelSetupBaseUrlDrafts: Record<string, string>;
  modelSetupModelSaving: boolean;
  modelSetupModelMessage: { kind: "success" | "error"; text: string } | null;
  envFileAvailable: boolean | null;
  envFileEntries: Record<string, string>;
  envFileLoading: boolean;
  envFileWriting: boolean;
  envFileMessage: { kind: "success" | "error"; text: string } | null;
  configForm: Record<string, unknown> | null;
};

function toErrorText(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function inferProviderFromModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (!trimmed) {
    return "";
  }
  const slashIndex = trimmed.indexOf("/");
  if (slashIndex <= 0) {
    return "";
  }
  return trimmed.slice(0, slashIndex).toLowerCase();
}

function extractProviderModelId(modelRef: string, providerId: string): string {
  const trimmed = modelRef.trim();
  const prefix = `${providerId.trim().toLowerCase()}/`;
  if (trimmed.toLowerCase().startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim();
  }
  return trimmed;
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function validateHttpBaseUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Use an http:// or https:// endpoint.";
    }
    return null;
  } catch {
    return "Enter a valid endpoint URL.";
  }
}

function resolveConfigRoot(state: ProviderSetupState): Record<string, unknown> {
  if (state.configForm) {
    return state.configForm;
  }
  if (isRecord(state.configSnapshot?.config)) {
    return state.configSnapshot.config;
  }
  return {};
}

function resolveProviderConfig(
  state: ProviderSetupState,
  providerId: string,
): Record<string, unknown> | null {
  if (!providerId) {
    return null;
  }
  const root = resolveConfigRoot(state);
  const models = isRecord(root.models) ? root.models : null;
  const providers = models && isRecord(models.providers) ? models.providers : null;
  const provider = providers ? providers[providerId] : null;
  return isRecord(provider) ? provider : null;
}

function buildDefaultModelEntry(modelId: string) {
  return {
    id: modelId,
    name: modelId,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: DEFAULT_REMOTE_MODEL_CONTEXT_WINDOW,
    maxTokens: DEFAULT_REMOTE_MODEL_MAX_TOKENS,
  };
}

function buildVllmProviderPatch(state: ProviderSetupState, modelRef: string, baseUrl: string) {
  const providerId = "vllm";
  const providerModelId = extractProviderModelId(modelRef, providerId);
  const existingProvider = resolveProviderConfig(state, providerId);
  const existingModels = Array.isArray(existingProvider?.models)
    ? existingProvider.models.filter(isRecord)
    : [];
  const nextModels = existingModels.some((entry) => entry.id === providerModelId)
    ? existingModels
    : [...existingModels, buildDefaultModelEntry(providerModelId)];

  return {
    ...existingProvider,
    baseUrl,
    api: typeof existingProvider?.api === "string" ? existingProvider.api : "openai-completions",
    models: nextModels,
  };
}

export async function refreshProviderSetupModels(state: ProviderSetupState) {
  if (!state.client || !state.connected) {
    state.chatModelCatalog = [];
    state.chatModelsLoading = false;
    return;
  }
  state.chatModelsLoading = true;
  state.modelSetupModelMessage = null;
  try {
    state.chatModelCatalog = await loadModels(state.client);
  } finally {
    state.chatModelsLoading = false;
  }
}

export function updateProviderSetupModelSelection(state: ProviderSetupState, model: string) {
  state.modelSetupSelectedModel = model;
  state.modelSetupModelMessage = null;
}

export function updateProviderSetupBaseUrlDraft(
  state: ProviderSetupState,
  provider: string,
  value: string,
) {
  state.modelSetupBaseUrlDrafts = { ...state.modelSetupBaseUrlDrafts, [provider]: value };
  state.modelSetupModelMessage = null;
}

export async function saveProviderSetupDefaultModel(state: ProviderSetupState) {
  if (!state.client || !state.connected) {
    return;
  }
  const model = state.modelSetupSelectedModel.trim();
  const providerId = inferProviderFromModelId(model);
  if (!model) {
    state.modelSetupModelMessage = { kind: "error", text: "Please select a model first." };
    return;
  }

  let providerPatch: Record<string, unknown> | null = null;
  if (providerId === "vllm") {
    const existingProvider = resolveProviderConfig(state, providerId);
    const currentBaseUrl =
      typeof existingProvider?.baseUrl === "string" ? existingProvider.baseUrl.trim() : "";
    const nextBaseUrl = normalizeBaseUrl(
      state.modelSetupBaseUrlDrafts[providerId]?.trim() || currentBaseUrl,
    );
    if (!nextBaseUrl) {
      state.modelSetupModelMessage = {
        kind: "error",
        text: "Enter the remote DGX / vLLM endpoint before saving.",
      };
      return;
    }
    const baseUrlError = validateHttpBaseUrl(nextBaseUrl);
    if (baseUrlError) {
      state.modelSetupModelMessage = { kind: "error", text: baseUrlError };
      return;
    }
    providerPatch = buildVllmProviderPatch(state, model, nextBaseUrl);
  }

  state.modelSetupModelSaving = true;
  state.modelSetupModelMessage = null;
  try {
    const patch: Record<string, unknown> = {
      agents: { defaults: { model: { primary: model } } },
    };
    if (providerId && providerPatch) {
      patch.models = { providers: { [providerId]: providerPatch } };
    }
    const raw = JSON.stringify(patch);
    await state.client.request("config.patch", {
      raw,
      baseHash: state.configSnapshot?.hash ?? null,
    });
    if (state.configForm) {
      if (providerId && providerPatch) {
        updateConfigFormValue(
          state as unknown as Parameters<typeof updateConfigFormValue>[0],
          ["models", "providers", providerId],
          providerPatch,
        );
      }
      updateConfigFormValue(
        state as unknown as Parameters<typeof updateConfigFormValue>[0],
        ["agents", "defaults", "model", "primary"],
        model,
      );
    }
    state.modelSetupModelMessage = {
      kind: "success",
      text:
        providerId === "vllm"
          ? "Default model and remote vLLM endpoint updated."
          : "Default model updated.",
    };
  } catch (err) {
    state.modelSetupModelMessage = {
      kind: "error",
      text: `Failed to save default model: ${toErrorText(err)}`,
    };
  } finally {
    state.modelSetupModelSaving = false;
  }
}

export async function loadEnvFile(state: ProviderSetupState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.envFileLoading) {
    return;
  }
  state.envFileLoading = true;
  state.envFileMessage = null;
  try {
    const result = await state.client.request<{
      available: boolean;
      entries?: Record<string, string>;
      reason?: string;
    }>("env.file.read", {});
    state.envFileAvailable = Boolean(result?.available);
    state.envFileEntries = result?.entries ?? {};
    if (!result?.available && result?.reason) {
      state.envFileMessage = { kind: "error", text: result.reason };
    }
  } catch (err) {
    state.envFileAvailable = false;
    state.envFileMessage = { kind: "error", text: `Failed to load .env: ${toErrorText(err)}` };
  } finally {
    state.envFileLoading = false;
  }
}

export function updateEnvFileDraft(state: ProviderSetupState, key: string, value: string) {
  state.envFileEntries = { ...state.envFileEntries, [key]: value };
  state.envFileMessage = null;
}

export async function saveEnvFile(state: ProviderSetupState, updates: Record<string, string>) {
  if (!state.client || !state.connected) {
    return;
  }
  state.envFileWriting = true;
  state.envFileMessage = null;
  try {
    await state.client.request("env.file.write", { updates });
    state.envFileMessage = {
      kind: "success",
      text: "Saved to .env. Restart containers to ensure all runtime env vars are reloaded.",
    };
  } catch (err) {
    state.envFileMessage = { kind: "error", text: `Failed to save .env: ${toErrorText(err)}` };
  } finally {
    state.envFileWriting = false;
  }
}
