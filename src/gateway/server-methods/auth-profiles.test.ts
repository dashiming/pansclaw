import { describe, expect, it, vi } from "vitest";

const ensureAuthProfileStore = vi.fn();
const resolveAuthProfileOrder = vi.fn();
const upsertAuthProfileWithLock = vi.fn();
const updateAuthProfileStoreWithLock = vi.fn();

vi.mock("../../agents/auth-profiles.js", () => ({
  ensureAuthProfileStore,
  resolveAuthProfileOrder,
  upsertAuthProfileWithLock,
}));

vi.mock("../../agents/auth-profiles/store.js", () => ({
  updateAuthProfileStoreWithLock,
}));

vi.mock("../../agents/agent-scope.js", () => ({
  resolveDefaultAgentId: () => "main",
  resolveAgentConfig: () => ({}),
}));

vi.mock("../../config/config.js", () => ({
  loadConfig: () => ({}),
}));

const { authProfilesHandlers } = await import("./auth-profiles.js");

describe("authProfilesHandlers", () => {
  it("lists providers from model catalog and auth store", async () => {
    ensureAuthProfileStore.mockReturnValue({
      version: 1,
      profiles: {
        "openai:dashboard": {
          type: "api_key",
          provider: "openai",
          key: "sk-openai",
        },
        "anthropic:default": {
          type: "oauth",
          provider: "anthropic",
          access: "token",
          refresh: "refresh",
          expires: Date.now() + 60_000,
        },
      },
      order: {
        openai: ["openai:dashboard"],
        anthropic: ["anthropic:default"],
      },
    });
    resolveAuthProfileOrder.mockImplementation(({ provider }) => {
      if (provider === "openai") {
        return ["openai:dashboard"];
      }
      if (provider === "anthropic") {
        return ["anthropic:default"];
      }
      return [];
    });

    let payload: unknown;
    await authProfilesHandlers["auth.profiles.list"]({
      params: {},
      req: {} as never,
      client: null,
      isWebchatConnect: () => false,
      respond: (ok, result) => {
        expect(ok).toBe(true);
        payload = result;
      },
      context: {
        loadGatewayModelCatalog: async () => [
          { provider: "openai", id: "gpt-5" },
          { provider: "openai", id: "gpt-4.1-mini" },
          { provider: "anthropic", id: "claude-sonnet-4" },
          { provider: "google", id: "gemini-2.5-pro" },
        ],
      } as never,
    });

    expect(payload).toEqual({
      agentId: "main",
      providers: expect.arrayContaining([
        expect.objectContaining({
          provider: "openai",
          configured: true,
          canDelete: true,
          source: "api_key",
          sampleModels: ["gpt-5", "gpt-4.1-mini"],
        }),
        expect.objectContaining({
          provider: "anthropic",
          configured: true,
          canDelete: false,
          source: "oauth",
          sampleModels: ["claude-sonnet-4"],
        }),
        expect.objectContaining({
          provider: "google",
          configured: false,
          canDelete: false,
          source: "none",
          sampleModels: ["gemini-2.5-pro"],
        }),
      ]),
    });
  });

  it("saves a dashboard API key profile and promotes it in order", async () => {
    ensureAuthProfileStore.mockReturnValue({
      version: 1,
      profiles: {},
    });
    resolveAuthProfileOrder.mockReturnValue([]);
    upsertAuthProfileWithLock.mockResolvedValue({
      version: 1,
      profiles: {
        "openai:dashboard": {
          type: "api_key",
          provider: "openai",
          key: "sk-openai",
        },
      },
    });

    let orderedStore: Record<string, unknown> | null = null;
    updateAuthProfileStoreWithLock.mockImplementation(async ({ updater }) => {
      const store = { version: 1, profiles: {}, order: {} as Record<string, string[]> };
      updater(store);
      orderedStore = store as unknown as Record<string, unknown>;
      return store;
    });

    let payload: unknown;
    await authProfilesHandlers["auth.profiles.set"]({
      params: { provider: "openai", apiKey: " sk-openai " },
      req: {} as never,
      client: null,
      isWebchatConnect: () => false,
      respond: (ok, result) => {
        expect(ok).toBe(true);
        payload = result;
      },
      context: {} as never,
    });

    expect(upsertAuthProfileWithLock).toHaveBeenCalledWith({
      agentDir: undefined,
      profileId: "openai:dashboard",
      credential: {
        type: "api_key",
        provider: "openai",
        key: "sk-openai",
      },
    });
    expect(orderedStore).toMatchObject({
      order: {
        openai: ["openai:dashboard"],
      },
    });
    expect(payload).toEqual({ ok: true, provider: "openai", profileId: "openai:dashboard" });
  });
});
