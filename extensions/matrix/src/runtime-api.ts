export {
  DEFAULT_ACCOUNT_ID,
  PAIRING_APPROVED_MESSAGE,
  GROUP_POLICY_BLOCKED_LABEL,
  addWildcardAllowFrom,
  addAllowlistUserEntriesFromConfigEntry,
  buildChannelConfigSchema,
  buildAllowlistResolutionSummary,
  buildChannelKeyCandidates,
  buildProbeChannelStatusSummary,
  canonicalizeAllowlistWithResolvedIds,
  chunkTextForOutbound,
  collectStatusIssuesFromLastError,
  createActionGate,
  createReplyPrefixOptions,
  createTypingCallbacks,
  formatDocsLink,
  formatAllowlistMatchMeta,
  formatLocationText,
  formatZonedTimestamp,
  getAgentScopedMediaLocalRoots,
  getSessionBindingService,
  getChatChannelMeta,
  hasConfiguredSecretInput,
  isPrivateOrLoopbackHost,
  jsonResult,
  logInboundDrop,
  logTypingFailure,
  mergeAllowFromEntries,
  moveSingleAccountChannelSectionToDefaultAccount,
  normalizeStringEntries,
  normalizeAccountId,
  normalizePollInput,
  normalizeResolvedSecretInputString,
  normalizeOptionalAccountId,
  patchAllowlistUsersInConfigEntries,
  promptAccountId,
  promptChannelAccessConfig,
  readNumberParam,
  readJsonFileWithFallback,
  readReactionParams,
  readStringArrayParam,
  readStringParam,
  registerSessionBindingAdapter,
  resolveAllowlistMatchByCandidates,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveAckReaction,
  resolveAgentIdFromSessionKey,
  resolveChannelEntryMatch,
  resolveControlCommandGate,
  resolveDefaultGroupPolicy,
  resolveOutboundSendDep,
  resolveThreadBindingIdleTimeoutMsForChannel,
  resolveThreadBindingMaxAgeMsForChannel,
  resolveThreadBindingFarewellText,
  summarizeMapping,
  toLocationContext,
  unregisterSessionBindingAdapter,
  warnMissingProviderGroupPolicyFallbackOnce,
  writeJsonFileAtomically,
} from "openclaw/plugin-sdk/matrix";
export type {
  ChannelDirectoryEntry,
  ChannelResolveKind,
  ChannelResolveResult,
  DmPolicy,
  GroupPolicy,
  OpenClawConfig,
  PluginRuntime,
  PollInput,
  RuntimeEnv,
  SecretInput,
  WizardPrompter,
} from "openclaw/plugin-sdk/matrix";
export {
  assertHttpUrlTargetsPrivateNetwork,
  closeDispatcher,
  createPinnedDispatcher,
  resolvePinnedHostnameWithPolicy,
  ssrfPolicyFromAllowPrivateNetwork,
  type LookupFn,
  type SsrFPolicy,
} from "openclaw/plugin-sdk/ssrf-runtime";
export {
  dispatchReplyFromConfigWithSettledDispatcher,
  ensureConfiguredAcpBindingReady,
  maybeCreateMatrixMigrationSnapshot,
  resolveConfiguredAcpBindingRecord,
} from "openclaw/plugin-sdk/matrix-runtime-heavy";
// resolveMatrixAccountStringValues already comes from plugin-sdk/matrix.
// Re-exporting auth-precedence here makes Jiti try to define the same export twice.

export function buildTimeoutAbortSignal(params: { timeoutMs?: number; signal?: AbortSignal }): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  const { timeoutMs, signal } = params;
  if (!timeoutMs && !signal) {
    return { signal: undefined, cleanup: () => {} };
  }
  if (!timeoutMs) {
    return { signal, cleanup: () => {} };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(controller.abort.bind(controller), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}
