// Compatibility shim for legacy onboarding helper imports.
export {
  noteChannelLookupFailure,
  noteChannelLookupSummary,
  normalizeAllowFromEntries,
  parseMentionOrPrefixedId,
  patchChannelConfigForAccount,
  promptLegacyChannelAllowFrom,
  promptLegacyChannelAllowFromForAccount,
  resolveAccountIdForConfigure,
  resolveSetupAccountId,
  setAccountGroupPolicyForChannel,
  setLegacyChannelDmPolicyWithAllowFrom,
  setSetupChannelEnabled,
  splitSetupEntries,
} from "../setup-wizard-helpers.js";

// Legacy aliases kept for extension compatibility.
export { resolveSetupAccountId as resolveOnboardingAccountId } from "../setup-wizard-helpers.js";
export { setSetupChannelEnabled as setOnboardingChannelEnabled } from "../setup-wizard-helpers.js";
export { splitSetupEntries as splitOnboardingEntries } from "../setup-wizard-helpers.js";
