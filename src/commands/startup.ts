import { spawn } from "child_process";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { theme } from "../terminal/theme.js";

type StartupOptions = {
  port?: number;
  bind?: string;
  verbose?: boolean;
  checkOnly?: boolean;
};

/**
 * Startup command: Manages gateway process lifecycle
 * - Kills any existing gateway processes
 * - Starts a fresh gateway instance
 * - Verifies gateway is running and accessible
 * - Displays configuration summary
 */
export async function startupCommand(
  runtime: RuntimeEnv = defaultRuntime,
  opts: StartupOptions = {},
): Promise<void> {
  const port = opts.port || 18890;
  const bind = opts.bind || "loopback";
  const verbose = opts.verbose || false;
  const checkOnly = opts.checkOnly || false;

  const stateDir = process.env.OPENCLAW_STATE_DIR || `${process.env.HOME}/.openclaw-pansclaw`;

  try {
    runtime.log("🚀 PansClaw Startup");
    runtime.log(`   State dir: ${theme.muted(stateDir)}`);

    if (checkOnly) {
      runtime.log("   Mode: Check only (no daemon changes)");
      await verifyGateway(port);
      runtime.log(theme.success("   ✓ Gateway is running"));
      return;
    }

    // Step 1: Kill any existing gateway processes
    runtime.log("📋 Step 1: Cleaning up old gateway processes...");
    await killExistingGateway();
    runtime.log(theme.success("   ✓ Old processes cleaned"));

    // Step 2: Start fresh gateway
    runtime.log("📋 Step 2: Starting gateway...");
    const gatewayProcess = await startGateway(stateDir, port, bind, verbose);
    runtime.log(theme.success(`   ✓ Gateway started (PID: ${gatewayProcess})`));

    // Step 3: Wait and verify gateway is ready
    runtime.log("📋 Step 3: Verifying gateway...");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Give gateway time to start
    const token = await verifyGateway(port);
    runtime.log(theme.success("   ✓ Gateway verified"));
    runtime.log(`   Token: ${theme.muted(token.substring(0, 16) + "...")}`);

    // Step 4: Show config summary
    runtime.log("📋 Step 4: Configuration summary");
    runtime.log(`   Gateway URL: ${theme.muted(`ws://127.0.0.1:${port}`)}`);
    runtime.log(`   Bind: ${theme.muted(bind)}`);
    runtime.log(`   State: ${theme.muted(stateDir)}`);

    runtime.log(theme.success("\n✅ Startup complete! Gateway is ready."));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    runtime.error(theme.error(`❌ Startup failed: ${message}`));
    throw err;
  }
}

/**
 * Kill any existing gateway processes (pnpm or direct node)
 */
async function killExistingGateway(): Promise<void> {
  return new Promise((resolve) => {
    // Try to kill both pnpm and node gateway processes
    const commands = [
      "pkill -f 'openclaw.*gateway run' || true",
      "pkill -f 'node.*gateway' || true",
      "pkill -f 'pnpm.*gateway' || true",
    ];

    // Execute all kill commands (they all end with || true so they won't fail)
    let completed = 0;
    commands.forEach((cmd) => {
      spawn("bash", ["-c", cmd], { stdio: "ignore" }).on("close", () => {
        completed++;
        if (completed === commands.length) {
          resolve();
        }
      });
    });
  });
}

/**
 * Start the gateway process
 */
async function startGateway(
  stateDir: string,
  port: number,
  bind: string,
  verbose: boolean,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OPENCLAW_STATE_DIR: stateDir };
    const args = ["openclaw", "gateway", "run", "--bind", bind, "--port", String(port), "--force"];

    if (verbose) {
      args.push("--verbose");
    }

    // Use nohup to detach from parent process
    const cmd = `nohup pnpm ${args.join(" ")} > /tmp/pansclaw-gateway.log 2>&1 & echo $!`;
    const child = spawn("bash", ["-c", cmd], {
      env,
      stdio: "pipe",
    });

    let pidOutput = "";
    child.stdout?.on("data", (data) => {
      pidOutput += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        const pid = parseInt(pidOutput.trim(), 10);
        if (!isNaN(pid)) {
          resolve(pid);
        } else {
          reject(new Error("Could not parse gateway PID from startup output"));
        }
      } else {
        reject(new Error(`Failed to start gateway process (exit code: ${code})`));
      }
    });
  });
}

/**
 * Verify gateway is running and return the access token
 */
async function verifyGateway(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    const check = () => {
      attempts++;

      // Try to connect to gateway websocket
      const command = `nc -z -w 1 127.0.0.1 ${port}`;
      spawn("bash", ["-c", command], { stdio: "ignore" }).on("close", (code) => {
        if (code === 0) {
          // Port is open, gateway is running
          // Try to read token from config
          getGatewayToken()
            .then((token) => resolve(token))
            .catch(() => {
              // Fallback to environment variable or default message
              resolve(process.env.OPENCLAW_GATEWAY_TOKEN || "token-check-config");
            });
        } else if (attempts < maxAttempts) {
          setTimeout(check, 1000);
        } else {
          reject(new Error(`Gateway failed to start on port ${port} after 30 seconds`));
        }
      });
    };

    check();
  });
}

/**
 * Try to get the gateway token from config
 */
async function getGatewayToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const stateDir = process.env.OPENCLAW_STATE_DIR || `${process.env.HOME}/.openclaw-pansclaw`;
    const configPath = `${stateDir}/gateway-auth.json`;

    // Try to read gateway-auth.json
    const cmd = `[ -f "${configPath}" ] && cat "${configPath}" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4 || echo ""`;
    const child = spawn("bash", ["-c", cmd], { stdio: "pipe" });

    let tokenOutput = "";
    child.stdout?.on("data", (data) => {
      tokenOutput += data.toString();
    });

    child.on("close", () => {
      const token = tokenOutput.trim();
      if (token) {
        resolve(token);
      } else {
        reject(new Error("Could not read token"));
      }
    });
  });
}
