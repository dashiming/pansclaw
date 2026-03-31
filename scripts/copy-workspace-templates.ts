#!/usr/bin/env tsx
/**
 * Copy workspace templates from docs/reference/templates to dist/docs/reference/templates
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const srcDir = path.join(projectRoot, "docs", "reference", "templates");
const distDir = path.join(projectRoot, "dist", "docs", "reference", "templates");

function copyWorkspaceTemplates() {
  if (!fs.existsSync(srcDir)) {
    console.warn("[copy-workspace-templates] Source directory not found:", srcDir);
    return;
  }

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  let copiedCount = 0;
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(distDir, file));
    copiedCount += 1;
  }

  console.log(`[copy-workspace-templates] Copied ${copiedCount} workspace templates.`);
}

copyWorkspaceTemplates();
