import { readFileSync, writeFileSync } from "node:fs";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

const ENV_FILE_PATH = process.env.OPENCLAW_ENV_FILE;

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqPos = trimmed.indexOf("=");
    if (eqPos < 0) {
      continue;
    }
    const key = trimmed.slice(0, eqPos).trim();
    const value = trimmed.slice(eqPos + 1).trim();
    result[key] = value;
  }
  return result;
}

function serializeEnvFile(original: string, updates: Record<string, string>): string {
  const lines = original.split("\n");
  const remaining = new Set(Object.keys(updates));
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      result.push(line);
      continue;
    }
    const eqPos = trimmed.indexOf("=");
    if (eqPos < 0) {
      result.push(line);
      continue;
    }
    const key = trimmed.slice(0, eqPos).trim();
    if (remaining.has(key)) {
      result.push(`${key}=${updates[key]}`);
      remaining.delete(key);
    } else {
      result.push(line);
    }
  }

  // Append new keys not previously in the file
  for (const key of remaining) {
    result.push(`${key}=${updates[key]}`);
  }

  return result.join("\n");
}

export const envFileHandlers: GatewayRequestHandlers = {
  "env.file.read": async ({ respond }) => {
    if (!ENV_FILE_PATH) {
      respond(true, { available: false, entries: {}, reason: "OPENCLAW_ENV_FILE not configured" });
      return;
    }
    try {
      const content = readFileSync(ENV_FILE_PATH, "utf-8");
      const entries = parseEnvFile(content);
      respond(true, { available: true, entries });
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, `Failed to read env file: ${String(err)}`),
      );
    }
  },

  "env.file.write": async ({ params, respond }) => {
    if (!ENV_FILE_PATH) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          "OPENCLAW_ENV_FILE is not configured; cannot write .env file",
        ),
      );
      return;
    }
    if (
      !params ||
      typeof params !== "object" ||
      !("updates" in params) ||
      typeof params.updates !== "object" ||
      params.updates === null ||
      Array.isArray(params.updates)
    ) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "updates must be a key-value object"),
      );
      return;
    }
    const updates = (params as { updates: Record<string, string> }).updates;
    // Validate all values are strings
    for (const [key, val] of Object.entries(updates)) {
      if (typeof val !== "string") {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, `value for key "${key}" must be a string`),
        );
        return;
      }
    }
    try {
      let original = "";
      try {
        original = readFileSync(ENV_FILE_PATH, "utf-8");
      } catch {
        // File doesn't exist yet; start fresh
      }
      const newContent = serializeEnvFile(original, updates);
      writeFileSync(ENV_FILE_PATH, newContent, "utf-8");
      respond(true, { written: Object.keys(updates).length });
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, `Failed to write env file: ${String(err)}`),
      );
    }
  },
};
