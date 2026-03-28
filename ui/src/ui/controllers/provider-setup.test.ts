import { describe, expect, it, vi } from "vitest";
import {
  saveProviderSetupDefaultModel,
  updateProviderSetupBaseUrlDraft,
  updateProviderSetupModelSelection,
  type ProviderSetupState,
} from "./provider-setup.ts";

function createState(request = vi.fn()): ProviderSetupState {
  return {
    client: { request } as never,
    connected: true,
    configSnapshot: { hash: "cfg-hash", config: {} },
    chatModelsLoading: false,
    chatModelCatalog: [],
    modelSetupSelectedModel: "",
    modelSetupBaseUrlDrafts: {},
    modelSetupModelSaving: false,
    modelSetupModelMessage: null,
    envFileAvailable: null,
    envFileEntries: {},
    envFileLoading: false,
    envFileWriting: false,
    envFileMessage: null,
    configForm: {},
  };
}

describe("provider-setup controller", () => {
  it("requires a remote endpoint before saving vllm models", async () => {
    const state = createState();
    updateProviderSetupModelSelection(state, "vllm/minimax-m2.5-gs32");

    await saveProviderSetupDefaultModel(state);

    expect(state.modelSetupModelMessage).toEqual({
      kind: "error",
      text: "Enter the remote DGX / vLLM endpoint before saving.",
    });
  });

  it("saves vllm endpoint and selected model together", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    const state = createState(request);
    updateProviderSetupModelSelection(state, "vllm/minimax-m2.5-gs32");
    updateProviderSetupBaseUrlDraft(state, "vllm", "http://dgx.example:8000/v1/");

    await saveProviderSetupDefaultModel(state);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      "config.patch",
      expect.objectContaining({
        baseHash: "cfg-hash",
        raw: expect.any(String),
      }),
    );

    const payload = JSON.parse(request.mock.calls[0][1].raw) as Record<string, unknown>;
    expect(payload).toEqual({
      agents: { defaults: { model: { primary: "vllm/minimax-m2.5-gs32" } } },
      models: {
        providers: {
          vllm: {
            api: "openai-completions",
            baseUrl: "http://dgx.example:8000/v1",
            models: [
              {
                id: "minimax-m2.5-gs32",
                name: "minimax-m2.5-gs32",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
    });
    expect(state.modelSetupModelMessage).toEqual({
      kind: "success",
      text: "Default model and remote vLLM endpoint updated.",
    });
    expect(state.configForm).toMatchObject({
      agents: { defaults: { model: { primary: "vllm/minimax-m2.5-gs32" } } },
      models: {
        providers: {
          vllm: {
            baseUrl: "http://dgx.example:8000/v1",
          },
        },
      },
    });
  });

  it("saves endpoint for generic openai-compatible provider", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    const state = createState(request);
    updateProviderSetupModelSelection(state, "openai/gpt-oss-120b");
    updateProviderSetupBaseUrlDraft(state, "openai", "http://proxy.example:4000/v1");

    await saveProviderSetupDefaultModel(state);

    expect(request).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(request.mock.calls[0][1].raw) as Record<string, unknown>;
    expect(payload).toEqual({
      agents: { defaults: { model: { primary: "openai/gpt-oss-120b" } } },
      models: {
        providers: {
          openai: {
            api: "openai-completions",
            baseUrl: "http://proxy.example:4000/v1",
            models: [
              {
                id: "gpt-oss-120b",
                name: "gpt-oss-120b",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
    });
    expect(state.modelSetupModelMessage).toEqual({
      kind: "success",
      text: "Default model updated.",
    });
  });
});
