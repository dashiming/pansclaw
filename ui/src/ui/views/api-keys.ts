import { html, nothing } from "lit";
import type { AuthProfilesState } from "../controllers/auth-profiles.ts";
import type { AuthProfileProviderEntry } from "../types.ts";

export type ApiKeysProps = Pick<
  AuthProfilesState,
  | "connected"
  | "authProfilesLoading"
  | "authProfilesError"
  | "authProfilesResult"
  | "authProfilesDrafts"
  | "authProfilesSavingProvider"
  | "authProfilesMessages"
  | "authProfilesFilter"
> & {
  onRefresh: () => void;
  onFilterChange: (next: string) => void;
  onDraftChange: (provider: string, value: string) => void;
  onSave: (provider: string) => void;
  onRemove: (provider: string) => void;
};

function resolveSourceLabel(entry: AuthProfileProviderEntry) {
  if (entry.source === "env_ref" && entry.secretRef?.source === "env") {
    return `Configured via env ref ${entry.secretRef.id}`;
  }
  if (entry.source === "api_key") {
    return "Configured with a stored API key";
  }
  if (entry.source === "oauth") {
    return "Authenticated via OAuth";
  }
  if (entry.source === "token") {
    return "Authenticated via token";
  }
  return "No API key configured";
}

function filterProviders(
  providers: AuthProfileProviderEntry[],
  query: string,
): AuthProfileProviderEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return providers;
  }
  return providers.filter((entry) =>
    [entry.provider, entry.label, ...entry.sampleModels]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export function renderApiKeys(props: ApiKeysProps) {
  const providers = filterProviders(
    props.authProfilesResult?.providers ?? [],
    props.authProfilesFilter,
  ).toSorted((left, right) => {
    if (left.configured !== right.configured) {
      return left.configured ? -1 : 1;
    }
    return left.label.localeCompare(right.label);
  });

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div>
          <div class="card-title">API Keys</div>
          <div class="card-sub">Configure provider credentials for the AI models shown in this dashboard.</div>
        </div>
        <button class="btn" ?disabled=${props.authProfilesLoading || !props.connected} @click=${props.onRefresh}>
          ${props.authProfilesLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div class="filters" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 14px;">
        <label class="field" style="flex: 1; min-width: 180px;">
          <input
            .value=${props.authProfilesFilter}
            @input=${(event: Event) =>
              props.onFilterChange((event.target as HTMLInputElement).value)}
            placeholder="Search providers"
            autocomplete="off"
          />
        </label>
        <div class="muted">${providers.length} shown</div>
      </div>

      ${
        props.authProfilesError
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.authProfilesError}</div>`
          : nothing
      }

      ${
        providers.length === 0
          ? html`
              <div class="muted" style="margin-top: 16px">No providers found.</div>
            `
          : html`
              <div class="list" style="margin-top: 16px;">
                ${providers.map((entry) => renderProviderCard(entry, props))}
              </div>
            `
      }
    </section>
  `;
}

function renderProviderCard(entry: AuthProfileProviderEntry, props: ApiKeysProps) {
  const draft = props.authProfilesDrafts[entry.provider] ?? "";
  const busy = props.authProfilesSavingProvider === entry.provider;
  const message = props.authProfilesMessages[entry.provider] ?? null;
  return html`
    <div class="list-item" style="align-items: stretch; gap: 16px;">
      <div class="list-main">
        <div class="list-title">${entry.label}</div>
        <div class="list-sub mono">${entry.provider}</div>
        <div class="muted" style="margin-top: 8px;">${resolveSourceLabel(entry)}</div>
        ${
          entry.sampleModels.length > 0
            ? html`
                <div class="muted" style="margin-top: 8px;">
                  Models: ${entry.sampleModels.join(", ")}${
                    entry.modelCount > entry.sampleModels.length
                      ? ` +${entry.modelCount - entry.sampleModels.length} more`
                      : ""
                  }
                </div>
              `
            : nothing
        }
      </div>
      <div class="list-meta" style="min-width: 320px; max-width: 420px; width: 100%;">
        <label class="field">
          <span>API key</span>
          <input
            type="password"
            .value=${draft}
            placeholder=${entry.configured ? "Enter a new key to replace the current credential" : "Paste API key"}
            @input=${(event: Event) =>
              props.onDraftChange(entry.provider, (event.target as HTMLInputElement).value)}
          />
        </label>
        <div class="row" style="justify-content: flex-end; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
          <button class="btn" ?disabled=${busy || !entry.canDelete} @click=${() => props.onRemove(entry.provider)}>
            ${busy && entry.canDelete ? "Clearing…" : "Clear"}
          </button>
          <button class="btn primary" ?disabled=${busy || !draft.trim()} @click=${() => props.onSave(entry.provider)}>
            ${busy ? "Saving…" : "Save key"}
          </button>
        </div>
        ${
          message
            ? html`<div
                class="muted"
                style="margin-top: 8px; color: ${message.kind === "error" ? "var(--danger-color, #d14343)" : "var(--success-color, #0a7f5a)"};"
              >
                ${message.message}
              </div>`
            : nothing
        }
      </div>
    </div>
  `;
}
