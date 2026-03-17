import { resolveAgentConfig, resolveDefaultAgentId } from "../../agents/agent-scope.js";
import {
  ensureAuthProfileStore,
  resolveAuthProfileOrder,
  upsertAuthProfileWithLock,
} from "../../agents/auth-profiles.js";
import { updateAuthProfileStoreWithLock } from "../../agents/auth-profiles/store.js";
import type { AuthProfileCredential, AuthProfileStore } from "../../agents/auth-profiles/types.js";
import { normalizeProviderIdForAuth } from "../../agents/model-selection.js";
import { loadConfig } from "../../config/config.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateAuthProfilesListParams,
  validateAuthProfilesRemoveParams,
  validateAuthProfilesSetParams,
} from "../protocol/index.js";
import type { AuthProfileProviderEntry, AuthProfilesListResult } from "../protocol/schema/types.js";
import type { GatewayRequestHandlers } from "./types.js";

function resolveTargetAgentScope() {
  const cfg = loadConfig();
  const agentId = resolveDefaultAgentId(cfg);
  const agentDir = resolveAgentConfig(cfg, agentId)?.agentDir;
  return { cfg, agentId, agentDir };
}

function loadCurrentStore(agentDir?: string): AuthProfileStore {
  return ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
}

function resolveProviderProfiles(params: {
  cfg: ReturnType<typeof loadConfig>;
  store: AuthProfileStore;
  provider: string;
}) {
  const ordered = resolveAuthProfileOrder({
    cfg: params.cfg,
    store: params.store,
    provider: params.provider,
  });
  const normalized = normalizeProviderIdForAuth(params.provider);
  const profiles = ordered
    .map((profileId) => ({ profileId, credential: params.store.profiles[profileId] }))
    .filter(
      (entry): entry is { profileId: string; credential: AuthProfileCredential } =>
        Boolean(entry.credential) &&
        normalizeProviderIdForAuth(entry.credential.provider) === normalized,
    );
  const apiKeyProfile = profiles.find((entry) => entry.credential.type === "api_key") ?? null;
  const primaryProfile = apiKeyProfile ?? profiles[0] ?? null;
  return { orderedProfiles: profiles, apiKeyProfile, primaryProfile };
}

function resolveProviderLabel(provider: string) {
  const knownLabels: Record<string, string> = {
    anthropic: "Anthropic",
    google: "Google",
    openai: "OpenAI",
    openrouter: "OpenRouter",
    minimax: "MiniMax",
    moonshot: "Moonshot",
    zai: "Z.ai",
  };
  const fallback = provider
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return knownLabels[provider] ?? fallback;
}

function buildProviderEntry(params: {
  provider: string;
  cfg: ReturnType<typeof loadConfig>;
  store: AuthProfileStore;
  sampleModels: string[];
}): AuthProfileProviderEntry {
  const { apiKeyProfile, primaryProfile } = resolveProviderProfiles({
    cfg: params.cfg,
    store: params.store,
    provider: params.provider,
  });
  let source: AuthProfileProviderEntry["source"] = "none";
  let secretRef: AuthProfileProviderEntry["secretRef"] | undefined;
  if (primaryProfile?.credential.type === "api_key") {
    source = primaryProfile.credential.keyRef ? "env_ref" : "api_key";
    secretRef = primaryProfile.credential.keyRef;
  } else if (primaryProfile?.credential.type === "oauth") {
    source = "oauth";
  } else if (primaryProfile?.credential.type === "token") {
    source = "token";
    secretRef = primaryProfile.credential.tokenRef;
  }
  return {
    provider: params.provider,
    label: resolveProviderLabel(params.provider),
    profileId: apiKeyProfile?.profileId ?? primaryProfile?.profileId,
    configured: primaryProfile !== null,
    canDelete: apiKeyProfile !== null,
    source,
    secretRef,
    modelCount: params.sampleModels.length,
    sampleModels: params.sampleModels.slice(0, 3),
  };
}

function summarizeProviders(params: {
  cfg: ReturnType<typeof loadConfig>;
  store: AuthProfileStore;
  models: Array<{ provider: string; id: string }>;
}): AuthProfilesListResult["providers"] {
  const providerModels = new Map<string, string[]>();
  for (const model of params.models) {
    const provider = normalizeProviderIdForAuth(model.provider);
    if (!provider) {
      continue;
    }
    const entries = providerModels.get(provider) ?? [];
    entries.push(model.id);
    providerModels.set(provider, entries);
  }
  for (const credential of Object.values(params.store.profiles)) {
    const provider = normalizeProviderIdForAuth(credential.provider);
    if (!provider || providerModels.has(provider)) {
      continue;
    }
    providerModels.set(provider, []);
  }
  return [...providerModels.entries()]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([provider, models]) =>
      buildProviderEntry({
        provider,
        cfg: params.cfg,
        store: params.store,
        sampleModels: [...new Set(models)],
      }),
    );
}

async function saveProviderApiKey(provider: string, apiKey: string) {
  const normalizedProvider = normalizeProviderIdForAuth(provider);
  const normalizedKey = apiKey.trim();
  const { cfg, agentDir } = resolveTargetAgentScope();
  const store = loadCurrentStore(agentDir);
  const { apiKeyProfile } = resolveProviderProfiles({ cfg, store, provider: normalizedProvider });
  const profileId = apiKeyProfile?.profileId ?? `${normalizedProvider}:dashboard`;
  await upsertAuthProfileWithLock({
    agentDir,
    profileId,
    credential: {
      type: "api_key",
      provider: normalizedProvider,
      key: normalizedKey,
    },
  });
  await updateAuthProfileStoreWithLock({
    agentDir,
    updater: (nextStore) => {
      const currentOrder = resolveAuthProfileOrder({
        cfg,
        store: nextStore,
        provider: normalizedProvider,
      }).filter((entry) => entry !== profileId);
      nextStore.order = nextStore.order ?? {};
      nextStore.order[normalizedProvider] = [profileId, ...currentOrder];
      return true;
    },
  });
  return profileId;
}

async function removeProviderApiKey(provider: string): Promise<boolean> {
  const normalizedProvider = normalizeProviderIdForAuth(provider);
  const { cfg, agentDir } = resolveTargetAgentScope();
  const store = loadCurrentStore(agentDir);
  const { apiKeyProfile } = resolveProviderProfiles({ cfg, store, provider: normalizedProvider });
  if (!apiKeyProfile) {
    return false;
  }
  const removedProfileId = apiKeyProfile.profileId;
  const updated = await updateAuthProfileStoreWithLock({
    agentDir,
    updater: (nextStore) => {
      if (!nextStore.profiles[removedProfileId]) {
        return false;
      }
      delete nextStore.profiles[removedProfileId];
      if (nextStore.order?.[normalizedProvider]) {
        const filtered = nextStore.order[normalizedProvider].filter(
          (entry) => entry !== removedProfileId,
        );
        if (filtered.length > 0) {
          nextStore.order[normalizedProvider] = filtered;
        } else {
          delete nextStore.order[normalizedProvider];
          if (Object.keys(nextStore.order).length === 0) {
            nextStore.order = undefined;
          }
        }
      }
      if (nextStore.lastGood?.[normalizedProvider] === removedProfileId) {
        delete nextStore.lastGood[normalizedProvider];
        if (nextStore.lastGood && Object.keys(nextStore.lastGood).length === 0) {
          nextStore.lastGood = undefined;
        }
      }
      return true;
    },
  });
  return Boolean(updated);
}

export const authProfilesHandlers: GatewayRequestHandlers = {
  "auth.profiles.list": async ({ params, respond, context }) => {
    if (!validateAuthProfilesListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid auth.profiles.list params: ${formatValidationErrors(validateAuthProfilesListParams.errors)}`,
        ),
      );
      return;
    }
    try {
      const { cfg, agentId, agentDir } = resolveTargetAgentScope();
      const store = loadCurrentStore(agentDir);
      const models = await context.loadGatewayModelCatalog();
      respond(
        true,
        {
          agentId,
          providers: summarizeProviders({ cfg, store, models }),
        } satisfies AuthProfilesListResult,
        undefined,
      );
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
  "auth.profiles.set": async ({ params, respond }) => {
    if (!validateAuthProfilesSetParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid auth.profiles.set params: ${formatValidationErrors(validateAuthProfilesSetParams.errors)}`,
        ),
      );
      return;
    }
    try {
      const provider = String((params as { provider: string }).provider).trim();
      const apiKey = String((params as { apiKey: string }).apiKey).trim();
      const profileId = await saveProviderApiKey(provider, apiKey);
      respond(true, { ok: true, provider, profileId }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
  "auth.profiles.remove": async ({ params, respond }) => {
    if (!validateAuthProfilesRemoveParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid auth.profiles.remove params: ${formatValidationErrors(validateAuthProfilesRemoveParams.errors)}`,
        ),
      );
      return;
    }
    try {
      const provider = String((params as { provider: string }).provider).trim();
      const removed = await removeProviderApiKey(provider);
      respond(true, { ok: true, provider, removed }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
};
