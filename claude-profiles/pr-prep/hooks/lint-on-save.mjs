#!/usr/bin/env node
// PostToolUse hook: auto-format files after Edit/Write operations.
// Runs biome on the changed file if biome is available.
// Exit 0 = success (non-blocking feedback).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path || "";

// Skip if no file path or file doesn't exist
if (!filePath || !fs.existsSync(filePath)) {
  process.exit(0);
}

// Only format known file types
const ext = path.extname(filePath).toLowerCase();
const supported = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".md"];
if (!supported.includes(ext)) {
  process.exit(0);
}

// Run biome if available
// On Windows, npm-installed binaries are .cmd files requiring shell: true
const shell = process.platform === "win32";
try {
  execFileSync("biome", ["check", "--write", filePath], {
    stdio: "ignore",
    shell,
  });
} catch {
  try {
    execFileSync("npx", ["biome", "check", "--write", filePath], {
      stdio: "ignore",
      shell,
    });
  } catch {
    // biome not available, skip silently
  }
}

process.exit(0);
