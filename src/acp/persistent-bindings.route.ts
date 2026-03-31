import type { OpenClawConfig } from "../config/config.js";
import { deriveLastRoutePolicy, type ResolvedAgentRoute } from "../routing/resolve-route.js";
import { resolveAgentIdFromSessionKey } from "../routing/session-key.js";
import { ensureConfiguredAcpBindingReady } from "./persistent-bindings.lifecycle.js";
import { resolveConfiguredAcpBindingRecord } from "./persistent-bindings.resolve.js";
import { buildConfiguredAcpSessionKey } from "./persistent-bindings.types.js";

export function resolveConfiguredAcpRoute(params: {
  cfg: OpenClawConfig;
  route: ResolvedAgentRoute;
  channel: string;
  accountId: string;
  conversationId: string;
  parentConversationId?: string;
}): {
  route: ResolvedAgentRoute;
  configuredBinding: NonNullable<ReturnType<typeof resolveConfiguredAcpBindingRecord>>;
  boundSessionKey: string;
} | null {
  const configuredBinding = resolveConfiguredAcpBindingRecord({
    cfg: params.cfg,
    channel: params.channel,
    accountId: params.accountId,
    conversationId: params.conversationId,
    parentConversationId: params.parentConversationId,
  });
  if (!configuredBinding) {
    return null;
  }

  const boundSessionKey = buildConfiguredAcpSessionKey(configuredBinding.spec);
  const route: ResolvedAgentRoute = {
    ...params.route,
    sessionKey: boundSessionKey,
    agentId: resolveAgentIdFromSessionKey(boundSessionKey),
    lastRoutePolicy: deriveLastRoutePolicy({
      sessionKey: boundSessionKey,
      mainSessionKey: params.route.mainSessionKey,
    }),
    matchedBy: "binding.channel",
  };

  return {
    route,
    configuredBinding,
    boundSessionKey,
  };
}

export async function ensureConfiguredAcpRouteReady(params: {
  cfg: OpenClawConfig;
  configuredBinding: NonNullable<ReturnType<typeof resolveConfiguredAcpBindingRecord>>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return await ensureConfiguredAcpBindingReady({
    cfg: params.cfg,
    configuredBinding: params.configuredBinding,
  });
}
