import type { GatewayBrowserClient } from "../gateway.ts";
import type { AuthProfilesListResult } from "../types.ts";

export type AuthProfilesState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  authProfilesLoading: boolean;
  authProfilesError: string | null;
  authProfilesResult: AuthProfilesListResult | null;
  authProfilesDrafts: Record<string, string>;
  authProfilesSavingProvider: string | null;
  authProfilesMessages: Record<string, { kind: "success" | "error"; message: string }>;
  authProfilesFilter: string;
};

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function setProviderMessage(
  state: AuthProfilesState,
  provider: string,
  message?: { kind: "success" | "error"; message: string },
) {
  const next = { ...state.authProfilesMessages };
  if (message) {
    next[provider] = message;
  } else {
    delete next[provider];
  }
  state.authProfilesMessages = next;
}

export async function loadAuthProfiles(state: AuthProfilesState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.authProfilesLoading) {
    return;
  }
  state.authProfilesLoading = true;
  state.authProfilesError = null;
  try {
    const result = await state.client.request<AuthProfilesListResult>("auth.profiles.list", {});
    state.authProfilesResult = result;
  } catch (err) {
    state.authProfilesError = getErrorMessage(err);
  } finally {
    state.authProfilesLoading = false;
  }
}

export function updateAuthProfileDraft(state: AuthProfilesState, provider: string, value: string) {
  state.authProfilesDrafts = { ...state.authProfilesDrafts, [provider]: value };
}

export async function saveAuthProfile(state: AuthProfilesState, provider: string) {
  if (!state.client || !state.connected) {
    return;
  }
  const apiKey = state.authProfilesDrafts[provider]?.trim() ?? "";
  if (!apiKey) {
    setProviderMessage(state, provider, {
      kind: "error",
      message: "Enter an API key before saving.",
    });
    return;
  }
  state.authProfilesSavingProvider = provider;
  state.authProfilesError = null;
  try {
    await state.client.request("auth.profiles.set", { provider, apiKey });
    state.authProfilesDrafts = { ...state.authProfilesDrafts, [provider]: "" };
    setProviderMessage(state, provider, {
      kind: "success",
      message: "API key saved.",
    });
    await loadAuthProfiles(state);
  } catch (err) {
    const message = getErrorMessage(err);
    state.authProfilesError = message;
    setProviderMessage(state, provider, { kind: "error", message });
  } finally {
    state.authProfilesSavingProvider = null;
  }
}

export async function removeAuthProfile(state: AuthProfilesState, provider: string) {
  if (!state.client || !state.connected) {
    return;
  }
  state.authProfilesSavingProvider = provider;
  state.authProfilesError = null;
  try {
    await state.client.request("auth.profiles.remove", { provider });
    state.authProfilesDrafts = { ...state.authProfilesDrafts, [provider]: "" };
    setProviderMessage(state, provider, {
      kind: "success",
      message: "API key cleared.",
    });
    await loadAuthProfiles(state);
  } catch (err) {
    const message = getErrorMessage(err);
    state.authProfilesError = message;
    setProviderMessage(state, provider, { kind: "error", message });
  } finally {
    state.authProfilesSavingProvider = null;
  }
}
