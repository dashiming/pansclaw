import { html, nothing } from "lit";
import type { AuthProfilesState } from "../controllers/auth-profiles.ts";
import type { ConfigState } from "../controllers/config.ts";
import type { GatewayBrowserClient } from "../gateway.ts";
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
    onSaveModel: () => void;
    onDraftChange: (provider: string, value: string) => void;
    onSaveProviderKey: (provider: string) => void;
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
    id: "gemini",
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
  const grouped = groupModelsByProvider(props.chatModelCatalog);
  const busy = props.modelSetupModelSaving;

  return html`
    <section class="card" style="margin-bottom: 20px;">
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

      <div style="margin-top: 18px; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
        <label class="field" style="flex: 1; min-width: 240px;">
          <span>Model</span>
          <select
            .value=${selected}
            ?disabled=${busy || !props.connected || props.chatModelsLoading}
            @change=${(e: Event) => props.onModelSelect((e.target as HTMLSelectElement).value)}
          >
            ${
              currentModel && !props.chatModelCatalog.find((m) => m.id === currentModel)
                ? html`<option value=${currentModel}>${currentModel} (current)</option>`
                : nothing
            }
            ${grouped.map(
              ([providerLabel, models]) => html`
                <optgroup label=${providerLabel}>
                  ${models.map(
                    (m) =>
                      html`<option value=${m.id} ?selected=${m.id === selected}>${m.name}</option>`,
                  )}
                </optgroup>
              `,
            )}
          </select>
        </label>
        <button
          class="btn primary"
          style="margin-bottom: 2px;"
          ?disabled=${busy || !props.connected || !selected || selected === currentModel}
          @click=${props.onSaveModel}
        >
          ${busy ? "Saving…" : "Set as default"}
        </button>
      </div>

      ${
        currentModel
          ? html`<div class="muted" style="margin-top: 8px;">
            Current default: <code style="font-family: monospace;">${currentModel}</code>
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

function groupModelsByProvider(catalog: ModelCatalogEntry[]): [string, ModelCatalogEntry[]][] {
  const map = new Map<string, ModelCatalogEntry[]>();
  for (const m of catalog) {
    const list = map.get(m.provider) ?? [];
    list.push(m);
    map.set(m.provider, list);
  }
  return [...map.entries()].toSorted(([a], [b]) => a.localeCompare(b));
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
