import type { OpenClawPluginApi } from "openclaw/plugin-sdk/memory-core";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk/memory-core";

const memoryCorePlugin = {
  id: "memory-core",
  name: "Memory (Core)",
  description: "File-backed memory search tools and CLI",
  kind: "memory",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    api.registerTool(
      (ctx) => {
        const memorySearchTool = api.runtime.tools.createMemorySearchTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        const memoryGetTool = api.runtime.tools.createMemoryGetTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        const memoryTimelineTool = api.runtime.tools.createMemoryTimelineTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        const memoryCausalQueryTool = api.runtime.tools.createMemoryCausalQueryTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        if (!memorySearchTool || !memoryGetTool || !memoryTimelineTool || !memoryCausalQueryTool) {
          return null;
        }
        return [memorySearchTool, memoryGetTool, memoryTimelineTool, memoryCausalQueryTool];
      },
      { names: ["memory_search", "memory_get", "memory_timeline", "memory_causal_query"] },
    );

    api.registerCli(
      ({ program }) => {
        api.runtime.tools.registerMemoryCli(program);
      },
      { commands: ["memory"] },
    );
  },
};

export default memoryCorePlugin;
