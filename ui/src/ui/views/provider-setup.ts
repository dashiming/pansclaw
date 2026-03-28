import { html, nothing } from "lit";
import type { AuthProfilesState } from "../controllers/auth-profiles.ts";
import type { ConfigState } from "../controllers/config.ts";
import type { GatewayBrowserClient } from "../gateway.ts";
import {
  buildChatModelOptions,
  groupChatModelOptions,
  PROVIDER_DISPLAY_LABELS,
} from "../model-catalog.ts";
import type { ModelCatalogEntry } from "../types.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnvFileState = {
  envFileAvailable: boolean | null; // null = not yet loaded
  envFileEntries: Record<string, string>;
  envFileLoading: boolean;
  envFileWriting: boolean;
  envFileMessage: { kind: "success" | "error"; text: string } | null;
};

export type ProviderSetupState = EnvFileState & {
  client: GatewayBrowserClient | null;
  connected: boolean;
  // model picker
  modelSetupSelectedModel: string;
  modelSetupBaseUrlDrafts: Record<string, string>;
  modelSetupModelSaving: boolean;
  modelSetupModelMessage: { kind: "success" | "error"; text: string } | null;
  // per-provider key drafts (reuses authProfilesDrafts from AuthProfilesState)
};

export type ProviderSetupProps = ProviderSetupState &
  Pick<
    AuthProfilesState,
    | "authProfilesLoading"
    | "authProfilesResult"
    | "authProfilesDrafts"
    | "authProfilesSavingProvider"
    | "authProfilesMessages"
  > &
  Pick<ConfigState, "configSnapshot"> & {
    chatModelCatalog: ModelCatalogEntry[];
    chatModelsLoading: boolean;
    onRefreshModels: () => void;
    onModelSelect: (model: string) => void;
    onBaseUrlDraftChange: (provider: string, value: string) => void;
    onSaveModel: () => void | Promise<void>;
    onDraftChange: (provider: string, value: string) => void;
    onSaveProviderKey: (provider: string) => void | Promise<void>;
    onLoadEnvFile: () => void;
    onEnvDraftChange: (key: string, value: string) => void;
    onSaveEnvFile: (updates: Record<string, string>) => void;
  };

// ── Known providers for the quick-setup card ─────────────────────────────────

type ProviderInfo = {
  id: string;
  label: string;
  envKey: string;
  placeholder: string;
  requiresBaseUrl?: boolean;
  baseUrlPlaceholder?: string;
  docsUrl?: string;
};

const KNOWN_PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    envKey: "ANTHROPIC_API_KEY",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/",
  },
  {
    id: "openai",
    label: "OpenAI / DeepSeek (compatible)",
    envKey: "OPENAI_API_KEY",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/",
  },
  {
    id: "minimax",
    label: "MiniMax",
    envKey: "MINIMAX_API_KEY",
    placeholder: "sk-api-...",
    docsUrl: "https://www.minimaxi.com/",
  },
  {
    id: "google",
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    placeholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/",
  },
  {
    id: "vllm",
    label: "vLLM / DGX",
    envKey: "VLLM_API_KEY",
    placeholder: "vllm-local",
    requiresBaseUrl: true,
    baseUrlPlaceholder: "http://host.docker.internal:18080/v1",
    docsUrl: "https://docs.openclaw.ai/providers/vllm",
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function resolveCurrentPrimaryModel(snapshot: ConfigState["configSnapshot"]): string {
  if (!snapshot?.config) {
    return "";
  }
  const cfg = snapshot.config;
  const agents = cfg.agents as Record<string, unknown> | undefined;
  const defaults = agents?.defaults as Record<string, unknown> | undefined;
  const model = defaults?.model as Record<string, unknown> | string | undefined;
  if (typeof model === "string") {
    return model;
  }
  if (typeof model === "object" && model !== null) {
    const primary = model.primary;
    if (typeof primary === "string") {
      return primary;
    }
  }
  return "";
}

function resolveConfiguredStatus(
  providerId: string,
  authResult: AuthProfilesState["authProfilesResult"],
): { configured: boolean; label: string } {
  const entry = authResult?.providers?.find((p) => p.provider === providerId);
  if (!entry) {
    return { configured: false, label: "Not configured" };
  }
  if (entry.configured) {
    return { configured: true, label: "Configured" };
  }
  return { configured: false, label: "Not configured" };
}

function resolveCurrentProviderBaseUrl(
  providerId: string,
  snapshot: ConfigState["configSnapshot"],
): string {
  if (!providerId || !snapshot?.config) {
    return "";
  }
  const cfg = snapshot.config;
  const models = cfg.models as Record<string, unknown> | undefined;
  const providers = models?.providers as Record<string, unknown> | undefined;
  const provider = providers?.[providerId] as Record<string, unknown> | undefined;
  return typeof provider?.baseUrl === "string" ? provider.baseUrl : "";
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

// ── Render ────────────────────────────────────────────────────────────────────

export function renderProviderSetup(props: ProviderSetupProps) {
  return html`
    <div class="provider-setup">
      ${renderModelCard(props)}
      ${renderApiKeysCard(props)}
      ${renderEnvFileCard(props)}
    </div>
  `;
}

function renderModelCard(props: ProviderSetupProps) {
  const currentModel = resolveCurrentPrimaryModel(props.configSnapshot);
  const selected = props.modelSetupSelectedModel || currentModel;
  const options = buildChatModelOptions(props.chatModelCatalog, selected, currentModel);
  const grouped = groupChatModelOptions(options);
  const selectedOption = options.find((entry) => entry.value === selected) ?? null;
  const selectedProvider =
    selectedOption?.provider?.trim().toLowerCase() ?? inferProviderFromModelId(selected);
  const selectedProviderInfo =
    KNOWN_PROVIDERS.find((entry) => entry.id === selectedProvider) ?? null;
  const providerBaseUrl = selectedProvider
    ? (props.modelSetupBaseUrlDrafts[selectedProvider] ??
      resolveCurrentProviderBaseUrl(selectedProvider, props.configSnapshot))
    : "";
  const providerDraft = selectedProvider ? (props.authProfilesDrafts[selectedProvider] ?? "") : "";
  const providerStatus = selectedProvider
    ? resolveConfiguredStatus(selectedProvider, props.authProfilesResult)
    : { configured: false, label: "Not configured" };
  const busy =
    props.modelSetupModelSaving ||
    (selectedProvider ? props.authProfilesSavingProvider === selectedProvider : false);
  const needsApiKey = Boolean(selectedProviderInfo) && !providerStatus.configured;
  const needsBaseUrl = Boolean(selectedProviderInfo?.requiresBaseUrl) && !providerBaseUrl.trim();
  const canConfirm =
    Boolean(selected) &&
    props.connected &&
    !busy &&
    !needsBaseUrl &&
    (!needsApiKey || providerDraft.trim().length > 0) &&
    (selected !== currentModel || providerDraft.trim().length > 0);

  const handleConfirm = async () => {
    if (!canConfirm) {
      return;
    }
    if (needsApiKey && selectedProvider && providerDraft.trim()) {
      await props.onSaveProviderKey(selectedProvider);
    }
    await props.onSaveModel();
  };

  const handleFocus = (e: FocusEvent) => {
    const input = e.target as HTMLInputElement;
    const wrap = input.closest<HTMLElement>(".provider-model-search");
    if (!wrap) {
      return;
    }
    input.dataset.prevPlaceholder = input.placeholder;
    input.placeholder = "Search model...";
    input.value = "";
    const dropdown = wrap.querySelector<HTMLElement>(".provider-model-search__dd");
    if (dropdown) {
      dropdown.style.display = "block";
    }
  };

  const handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const query = input.value.toLowerCase();
    const wrap = input.closest<HTMLElement>(".provider-model-search");
    if (!wrap) {
      return;
    }
    wrap.querySelectorAll<HTMLElement>(".provider-model-search__item").forEach((entry) => {
      const visible =
        !query ||
        (entry.dataset.value ?? "").toLowerCase().includes(query) ||
        (entry.textContent ?? "").toLowerCase().includes(query);
      entry.style.display = visible ? "" : "none";
    });
    wrap.querySelectorAll<HTMLElement>(".provider-model-search__group").forEach((group) => {
      let sibling = group.nextElementSibling as HTMLElement | null;
      let visible = false;
      while (sibling && !sibling.classList.contains("provider-model-search__group")) {
        if (sibling.style.display !== "none") {
          visible = true;
        }
        sibling = sibling.nextElementSibling as HTMLElement | null;
      }
      group.style.display = visible ? "" : "none";
    });
  };

  const handleBlur = (e: FocusEvent) => {
    const input = e.target as HTMLInputElement;
    const wrap = input.closest<HTMLElement>(".provider-model-search");
    if (!wrap) {
      return;
    }
    setTimeout(() => {
      if (wrap.contains(document.activeElement)) {
        return;
      }
      const dropdown = wrap.querySelector<HTMLElement>(".provider-model-search__dd");
      if (dropdown) {
        dropdown.style.display = "none";
      }
      input.value = "";
      input.placeholder = input.dataset.prevPlaceholder ?? "Search model...";
    }, 180);
  };

  const pickModel = (e: MouseEvent, model: string) => {
    e.preventDefault();
    props.onModelSelect(model);
    const wrap = (e.currentTarget as HTMLElement).closest<HTMLElement>(".provider-model-search");
    const dropdown = wrap?.querySelector<HTMLElement>(".provider-model-search__dd");
    const input = wrap?.querySelector<HTMLInputElement>("input");
    if (dropdown) {
      dropdown.style.display = "none";
    }
    if (input) {
      input.value = "";
    }
  };

  return html`
    <section class="card" style="margin-bottom: 20px;">
      <style>
        .provider-model-toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: nowrap;
          margin-top: 18px;
        }

        .provider-model-search {
          position: relative;
          flex: 1 1 320px;
          min-width: 260px;
        }

        .provider-model-search__input,
        .provider-model-key-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
          border-radius: 10px;
          background: var(--bg-input, rgba(15, 23, 42, 0.6));
          color: var(--color-text, #e5e7eb);
        }

        .provider-model-search__dd {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          max-height: 320px;
          overflow-y: auto;
          background: var(--bg-panel, #111827);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
          border-radius: 10px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
          z-index: 30;
          padding: 6px 0;
        }

        .provider-model-search__group {
          padding: 8px 12px 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-secondary, #94a3b8);
          font-weight: 700;
        }

        .provider-model-search__item {
          padding: 8px 12px;
          cursor: pointer;
          color: var(--color-text, #e5e7eb);
        }

        .provider-model-search__item:hover,
        .provider-model-search__item--selected {
          background: rgba(255, 255, 255, 0.06);
        }

        .provider-model-key-wrap {
          flex: 1 1 260px;
          min-width: 220px;
        }

        @media (max-width: 960px) {
          .provider-model-toolbar {
            flex-wrap: wrap;
          }
        }
      </style>
      <div class="row" style="justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
        <div>
          <div class="card-title">Default AI Model</div>
          <div class="card-sub">The model used for new conversations.</div>
        </div>
        <button
          class="btn"
          ?disabled=${props.chatModelsLoading || !props.connected}
          @click=${props.onRefreshModels}
        >
          ${props.chatModelsLoading ? "Loading…" : "Refresh models"}
        </button>
      </div>

      <div class="provider-model-toolbar">
        <div class="provider-model-search">
          <input
            class="provider-model-search__input"
            type="text"
            placeholder=${selectedOption?.displayName || currentModel || "Search model..."}
            ?disabled=${busy || !props.connected || props.chatModelsLoading}
            autocomplete="off"
            spellcheck="false"
            @focus=${handleFocus}
            @input=${handleInput}
            @blur=${handleBlur}
          />
          <div class="provider-model-search__dd" style="display:none;">
            ${
              currentModel
                ? html`
                  <div
                    class="provider-model-search__item ${selected === currentModel ? "provider-model-search__item--selected" : ""}"
                    data-value=${currentModel}
                    @mousedown=${(e: MouseEvent) => pickModel(e, currentModel)}
                  >
                    ${currentModel} (current)
                  </div>
                `
                : nothing
            }
            ${[...grouped.entries()].map(
              ([provider, models]) => html`
                <div class="provider-model-search__group">
                  ${PROVIDER_DISPLAY_LABELS[provider] ?? provider}
                </div>
                ${models.map(
                  (model) => html`
                    <div
                      class="provider-model-search__item ${selected === model.value ? "provider-model-search__item--selected" : ""}"
                      data-value=${model.value}
                      @mousedown=${(e: MouseEvent) => pickModel(e, model.value)}
                    >
                      ${model.displayName}
                    </div>
                  `,
                )}
              `,
            )}
          </div>
        </div>
        <div class="provider-model-key-wrap">
          <input
            class="provider-model-key-input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            .value=${selected}
            placeholder="Custom model ID (for example: ollama/qwen2.5:14b)"
            ?disabled=${busy || !props.connected}
            @input=${(e: Event) => props.onModelSelect((e.target as HTMLInputElement).value)}
          />
        </div>
        ${
          selectedProviderInfo?.requiresBaseUrl
            ? html`
              <div class="provider-model-key-wrap">
                <input
                  class="provider-model-key-input"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  .value=${providerBaseUrl}
                  placeholder=${selectedProviderInfo.baseUrlPlaceholder ?? "https://your-server/v1"}
                  ?disabled=${busy || !props.connected}
                  @input=${(e: Event) =>
                    props.onBaseUrlDraftChange(
                      selectedProvider,
                      (e.target as HTMLInputElement).value,
                    )}
                />
              </div>
            `
            : nothing
        }
        <div class="provider-model-key-wrap">
          <input
            class="provider-model-key-input"
            type="password"
            autocomplete="off"
            .value=${providerDraft}
            placeholder=${
              selectedProviderInfo
                ? `Enter ${selectedProviderInfo.label} API key`
                : "API key (if needed)"
            }
            ?disabled=${busy || !props.connected || !selectedProviderInfo}
            @input=${(e: Event) =>
              selectedProvider
                ? props.onDraftChange(selectedProvider, (e.target as HTMLInputElement).value)
                : null}
          />
        </div>
        <button
          class="btn primary"
          ?disabled=${!canConfirm}
          @click=${() => {
            void handleConfirm();
          }}
        >
          ${busy ? "Saving…" : "Confirm"}
        </button>
      </div>

      ${
        currentModel
          ? html`<div class="muted" style="margin-top: 8px;">
            Current default: <code style="font-family: monospace;">${currentModel}</code>
          </div>`
          : nothing
      }

      <div class="muted" style="margin-top: 8px;">
        You can pick from the list or enter any custom model ID.
      </div>

      ${
        selectedProviderInfo?.requiresBaseUrl
          ? html`
              <div class="muted" style="margin-top: 8px">
                Enter the remote OpenAI-compatible "/v1" endpoint for your DGX or self-hosted vLLM server.
              </div>
            `
          : nothing
      }

      ${
        selectedProviderInfo
          ? html`<div class="muted" style="margin-top: 8px;">
              ${
                providerStatus.configured
                  ? `${selectedProviderInfo.label} key is already configured.`
                  : `Add ${selectedProviderInfo.label} API key, then confirm.`
              }
            </div>`
          : nothing
      }

      ${
        props.modelSetupModelMessage
          ? html`<div
            class="muted"
            style="margin-top: 8px; color: ${
              props.modelSetupModelMessage.kind === "error"
                ? "var(--danger-color, #d14343)"
                : "var(--success-color, #0a7f5a)"
            };"
          >
            ${props.modelSetupModelMessage.text}
          </div>`
          : nothing
      }
    </section>
  `;
}

function renderApiKeysCard(props: ProviderSetupProps) {
  return html`
    <section class="card" style="margin-bottom: 20px;">
      <div>
        <div class="card-title">Provider API Keys</div>
        <div class="card-sub">
          Keys are saved to the gateway configuration and take effect immediately. No restart
          needed.
        </div>
      </div>

      <div class="list" style="margin-top: 18px;">
        ${KNOWN_PROVIDERS.map((p) => renderProviderKeyRow(p, props))}
      </div>
    </section>
  `;
}

function renderProviderKeyRow(provider: ProviderInfo, props: ProviderSetupProps) {
  const draft = props.authProfilesDrafts[provider.id] ?? "";
  const busy = props.authProfilesSavingProvider === provider.id;
  const message = props.authProfilesMessages[provider.id] ?? null;
  const { configured } = resolveConfiguredStatus(provider.id, props.authProfilesResult);

  return html`
    <div class="list-item" style="align-items: stretch; gap: 14px; flex-wrap: wrap;">
      <div class="list-main" style="min-width: 160px;">
        <div class="list-title">${provider.label}</div>
        <div class="list-sub mono" style="font-size: 11px;">${provider.id}</div>
        <div class="muted" style="margin-top: 6px; display: flex; align-items: center; gap: 6px;">
          <span
            style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${
              configured ? "var(--success-color, #0a7f5a)" : "var(--muted-color, #aaa)"
            };"
          ></span>
          ${configured ? "Configured" : "Not configured"}
        </div>
      </div>
      <div class="list-meta" style="flex: 1; min-width: 260px;">
        <label class="field">
          <span>API key</span>
          <input
            type="password"
            autocomplete="off"
            .value=${draft}
            placeholder=${configured ? "Enter a new key to replace" : provider.placeholder}
            ?disabled=${busy || !props.connected}
            @input=${(e: Event) =>
              props.onDraftChange(provider.id, (e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="row" style="justify-content: flex-end; gap: 8px; margin-top: 8px;">
          ${
            provider.docsUrl
              ? html`<a
                class="btn btn--sm"
                href=${provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get key
              </a>`
              : nothing
          }
          <button
            class="btn primary btn--sm"
            ?disabled=${busy || !draft.trim() || !props.connected}
            @click=${() => props.onSaveProviderKey(provider.id)}
          >
            ${busy ? "Saving…" : "Save key"}
          </button>
        </div>
        ${
          message
            ? html`<div
              class="muted"
              style="margin-top: 6px; color: ${
                message.kind === "error"
                  ? "var(--danger-color, #d14343)"
                  : "var(--success-color, #0a7f5a)"
              };"
            >
              ${message.message}
            </div>`
            : nothing
        }
      </div>
    </div>
  `;
}

function renderEnvFileCard(props: ProviderSetupProps) {
  const available = props.envFileAvailable;

  if (available === false) {
    return html`
      <section class="card" style="margin-bottom: 20px; opacity: 0.7">
        <div class="card-title">.env File</div>
        <div class="card-sub" style="margin-top: 6px">
          .env file writing is not configured. Set
          <code style="font-family: monospace">OPENCLAW_ENV_FILE</code> in the container environment to
          enable this feature.
        </div>
      </section>
    `;
  }

  const busy = props.envFileWriting;
  const entries = props.envFileEntries;
  const relevantKeys = KNOWN_PROVIDERS.map((p) => p.envKey);

  return html`
    <section class="card" style="margin-bottom: 20px;">
      <div class="row" style="justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
        <div>
          <div class="card-title">.env File</div>
          <div class="card-sub">
            Edit API key environment variables stored in the .env file. Changes require
            a container restart to take full effect.
          </div>
        </div>
        <button
          class="btn"
          ?disabled=${props.envFileLoading || !props.connected}
          @click=${props.onLoadEnvFile}
        >
          ${props.envFileLoading ? "Loading…" : available === null ? "Load" : "Reload"}
        </button>
      </div>

      ${
        available === null
          ? html`
              <div class="muted" style="margin-top: 14px">Click Load to read the .env file.</div>
            `
          : nothing
      }

      ${
        available === true
          ? html`
            <div style="margin-top: 18px;">
              ${relevantKeys.map((envKey) => {
                const currentVal = entries[envKey] ?? "";
                return html`
                  <label class="field" style="margin-bottom: 12px;">
                    <span style="font-family: monospace; font-size: 12px;">${envKey}</span>
                    <input
                      type="password"
                      autocomplete="off"
                      .value=${currentVal}
                      placeholder="Not set"
                      ?disabled=${busy}
                      @input=${(e: Event) => {
                        props.onEnvDraftChange(envKey, (e.target as HTMLInputElement).value);
                      }}
                    />
                  </label>
                `;
              })}
              <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                <button
                  class="btn primary"
                  ?disabled=${busy || !props.connected}
                  @click=${() => {
                    const filtered: Record<string, string> = {};
                    for (const k of relevantKeys) {
                      if (entries[k] !== undefined) {
                        filtered[k] = entries[k];
                      }
                    }
                    props.onSaveEnvFile(filtered);
                  }}
                >
                  ${busy ? "Saving…" : "Save .env"}
                </button>
              </div>
            </div>
          `
          : nothing
      }

      ${
        props.envFileMessage
          ? html`<div
            class="muted"
            style="margin-top: 8px; color: ${
              props.envFileMessage.kind === "error"
                ? "var(--danger-color, #d14343)"
                : "var(--success-color, #0a7f5a)"
            };"
          >
            ${props.envFileMessage.text}
          </div>`
          : nothing
      }
    </section>
  `;
}
