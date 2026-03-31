// Compatibility shim for legacy channel dock imports.
import { getChannelPlugin } from "./plugins/registry.js";
import type { ChannelId } from "./plugins/types.js";

export function getChannelDock(id: string) {
  return getChannelPlugin(id as ChannelId);
}
