import { describe, expect, it, vi } from "vitest";
import {
  loadAuthProfiles,
  removeAuthProfile,
  saveAuthProfile,
  updateAuthProfileDraft,
  type AuthProfilesState,
} from "./auth-profiles.ts";

function createState(request = vi.fn()): AuthProfilesState {
  return {
    client: { request } as never,
    connected: true,
    authProfilesLoading: false,
    authProfilesError: null,
    authProfilesResult: null,
    authProfilesDrafts: {},
    authProfilesSavingProvider: null,
    authProfilesMessages: {},
    authProfilesFilter: "",
  };
}

describe("auth-profiles controller", () => {
  it("loads provider auth summary", async () => {
    const request = vi.fn().mockResolvedValue({
      agentId: "main",
      providers: [
        {
          provider: "openai",
          label: "OpenAI",
          configured: false,
          canDelete: false,
          source: "none",
          modelCount: 1,
          sampleModels: ["gpt-5"],
        },
      ],
    });
    const state = createState(request);

    await loadAuthProfiles(state);

    expect(request).toHaveBeenCalledWith("auth.profiles.list", {});
    expect(state.authProfilesResult?.providers[0]?.provider).toBe("openai");
  });

  it("saves a provider key then reloads", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, provider: "openai", profileId: "openai:dashboard" })
      .mockResolvedValueOnce({
        agentId: "main",
        providers: [
          {
            provider: "openai",
            label: "OpenAI",
            configured: true,
            canDelete: true,
            source: "api_key",
            modelCount: 1,
            sampleModels: ["gpt-5"],
          },
        ],
      });
    const state = createState(request);
    updateAuthProfileDraft(state, "openai", " sk-openai ");

    await saveAuthProfile(state, "openai");

    expect(request).toHaveBeenNthCalledWith(1, "auth.profiles.set", {
      provider: "openai",
      apiKey: "sk-openai",
    });
    expect(request).toHaveBeenNthCalledWith(2, "auth.profiles.list", {});
    expect(state.authProfilesDrafts.openai).toBe("");
    expect(state.authProfilesMessages.openai).toEqual({
      kind: "success",
      message: "API key saved.",
    });
  });

  it("removes a provider key then reloads", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, provider: "openai", removed: true })
      .mockResolvedValueOnce({
        agentId: "main",
        providers: [
          {
            provider: "openai",
            label: "OpenAI",
            configured: false,
            canDelete: false,
            source: "none",
            modelCount: 1,
            sampleModels: ["gpt-5"],
          },
        ],
      });
    const state = createState(request);

    await removeAuthProfile(state, "openai");

    expect(request).toHaveBeenNthCalledWith(1, "auth.profiles.remove", { provider: "openai" });
    expect(request).toHaveBeenNthCalledWith(2, "auth.profiles.list", {});
    expect(state.authProfilesMessages.openai).toEqual({
      kind: "success",
      message: "API key cleared.",
    });
  });
});
