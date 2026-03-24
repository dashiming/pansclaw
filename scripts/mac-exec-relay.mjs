#!/usr/bin/env node
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
/**
 * mac-exec-relay.mjs
 * 在 Mac 本机运行的命令执行中继服务。
 * 容器内的 agent 通过 http://host.docker.internal:18001 执行 Mac 原生命令。
 *
 * 用法:
 *   node scripts/mac-exec-relay.mjs
 *   PORT=18001 node scripts/mac-exec-relay.mjs
 *
 * 安全:
 *   - 仅监听 127.0.0.1（外网不可访问）
 *   - 需要请求头 Authorization: Bearer <token>（与 gateway token 相同）
 */
import { createServer } from "http";
import { homedir } from "os";

const PORT = parseInt(process.env.PORT || "18001", 10);
const BIND = "127.0.0.1";

// 读取 gateway token（与 openclaw 共用，方便管理）
function readToken() {
  if (process.env.MAC_RELAY_TOKEN) {
    return process.env.MAC_RELAY_TOKEN;
  }
  const envFile = `${homedir()}/Documents/pansclaw/.env`;
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, "utf8").match(/OPENCLAW_GATEWAY_TOKEN=(.+)/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

const TOKEN = readToken();

function respond(res, status, body) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function execCommand(cmd, args, opts) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      shell: false,
      env: { ...process.env },
      cwd: opts?.cwd || homedir(),
      timeout: (opts?.timeout || 30) * 1000,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", (code) => resolve({ exitCode: code, stdout, stderr }));
    proc.on("error", (err) => resolve({ exitCode: -1, stdout: "", stderr: err.message }));
  });
}

const server = createServer(async (req, res) => {
  // 鉴权
  if (TOKEN) {
    const auth = req.headers["authorization"] || "";
    const provided = auth.replace(/^Bearer\s+/i, "").trim();
    if (provided !== TOKEN) {
      return respond(res, 401, { error: "Unauthorized" });
    }
  }

  if (req.method === "GET" && req.url === "/healthz") {
    return respond(res, 200, { ok: true, host: process.platform });
  }

  if (req.method !== "POST" || req.url !== "/exec") {
    return respond(res, 404, { error: "Not found. POST /exec" });
  }

  // 读取请求体
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return respond(res, 400, { error: "Invalid JSON" });
  }

  // 支持两种格式:
  // 1. { "shell": "open -a Safari" }          — 通过 /bin/zsh -c 执行 shell 命令
  // 2. { "shell": "...", "sudo": true }        — 以 sudo 运行（需已配置 NOPASSWD）
  // 3. { "cmd": "osascript", "args": [...] }   — 直接 spawn
  if (!payload.shell && !payload.cmd) {
    return respond(res, 400, { error: 'Need "shell" or "cmd" field' });
  }

  let result;
  if (payload.shell) {
    const useSudo = payload.sudo === true;
    if (useSudo) {
      result = await execCommand("sudo", ["/bin/zsh", "-c", payload.shell], {
        cwd: payload.cwd,
        timeout: payload.timeout,
      });
    } else {
      result = await execCommand("/bin/zsh", ["-c", payload.shell], {
        cwd: payload.cwd,
        timeout: payload.timeout,
      });
    }
  } else {
    const useSudo = payload.sudo === true;
    const finalCmd = useSudo ? "sudo" : payload.cmd;
    const finalArgs = useSudo ? [payload.cmd, ...(payload.args || [])] : payload.args || [];
    result = await execCommand(finalCmd, finalArgs, {
      cwd: payload.cwd,
      timeout: payload.timeout,
    });
  }

  respond(res, 200, result);
});

server.listen(PORT, BIND, () => {
  console.log(`mac-exec-relay listening on ${BIND}:${PORT}`);
  if (!TOKEN) {
    console.warn("WARNING: No token configured — all requests accepted");
  }
});
