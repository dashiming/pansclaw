import type { GatewayBrowserClient } from "../gateway.ts";
import { updateConfigFormValue } from "./config.ts";
import { loadModels } from "./models.ts";

export type ProviderSetupState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  configSnapshot: { hash?: string | null } | null;
  chatModelsLoading: boolean;
  chatModelCatalog: Array<{ id: string; name: string; provider: string }>;
  modelSetupSelectedModel: string;
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

export async function saveProviderSetupDefaultModel(state: ProviderSetupState) {
  if (!state.client || !state.connected) {
    return;
  }
  const model = state.modelSetupSelectedModel.trim();
  if (!model) {
    state.modelSetupModelMessage = { kind: "error", text: "Please select a model first." };
    return;
  }
  state.modelSetupModelSaving = true;
  state.modelSetupModelMessage = null;
  try {
    const patch = { agents: { defaults: { model: { primary: model } } } };
    const raw = JSON.stringify(patch);
    await state.client.request("config.patch", {
      raw,
      baseHash: state.configSnapshot?.hash ?? null,
    });
    if (state.configForm) {
      updateConfigFormValue(
        state as unknown as Parameters<typeof updateConfigFormValue>[0],
        ["agents", "defaults", "model", "primary"],
        model,
      );
    }
    state.modelSetupModelMessage = { kind: "success", text: "Default model updated." };
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
