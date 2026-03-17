import type { AppViewState } from "../app-view-state.ts";
import type { AuthProfilesListResult } from "../types.ts";

export async function saveChatQuickApiKey(
  state: AppViewState,
  provider: string,
  apiKey: string,
  opts?: { pendingModel?: string },
): Promise<boolean> {
  if (!state.client || !state.connected) {
    return false;
  }
  if (!state.chatQuickApiKeyModal) {
    state.chatQuickApiKeyModal = {
      open: true,
      provider,
      label: provider,
      error: null,
      saving: false,
      pendingModel: opts?.pendingModel,
    };
  }
  if (!apiKey.trim()) {
    if (state.chatQuickApiKeyModal) {
      state.chatQuickApiKeyModal.error = "Enter an API key before saving.";
    }
    return false;
  }

  state.chatQuickApiKeyModal.saving = true;
  state.chatQuickApiKeyModal.error = null;

  try {
    await state.client.request("auth.profiles.set", { provider, apiKey });
    state.chatQuickApiKeyModal.saving = false;

    // Reload auth profiles to update the cached state
    try {
      const result = await state.client.request<AuthProfilesListResult>("auth.profiles.list", {});
      state.authProfilesResult = result;
    } catch {
      // If reload fails, close modal anyway
    }

    // If there's a pending model selection, apply it now
    const pendingModel = opts?.pendingModel ?? state.chatQuickApiKeyModal.pendingModel;

    // Close modal
    closeChatQuickApiKeyModal(state);

    // Apply the pending model if present and the modal was open
    if (pendingModel && state.client && state.connected) {
      const targetSessionKey = state.sessionKey;
      state.chatModelOverrides = {
        ...state.chatModelOverrides,
        [targetSessionKey]: pendingModel || null,
      };
      try {
        await state.client.request("sessions.patch", {
          key: targetSessionKey,
          model: pendingModel || null,
        });
      } catch (err) {
        state.lastError = `Failed to set model: ${String(err)}`;
      }
    }

    return true;
  } catch (err) {
    state.chatQuickApiKeyModal.saving = false;
    state.chatQuickApiKeyModal.error = `Failed to save API key: ${String(err)}`;
    return false;
  }
}

export function closeChatQuickApiKeyModal(state: AppViewState) {
  if (state.chatQuickApiKeyModal) {
    state.chatQuickApiKeyModal.open = false;
    state.chatQuickApiKeyModal.error = null;
    state.chatQuickApiKeyModal = null;
  }
  state.chatQuickApiKeyDraft = "";
}
