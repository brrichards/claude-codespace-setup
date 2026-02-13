#!/usr/bin/env node
// setup.mjs — Bootstrap Claude Code with ff-profiles.
//
// Installs Claude Code (if not present), clones the ff-profiles repo into the
// current project directory, and applies the default (developer) profile.
//
// Usage:
//   node setup.mjs
//
// Flags (for testing):
//   --local         Skip git clone, use local ff-profiles/ directory
//   --skip-install  Skip Claude Code installation check
//   --target <dir>  Target project directory (default: current directory)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_URL = "https://github.com/brrichards/claude-codespace-setup.git";
const DEFAULT_PROFILE = "developer";

// ── Argument parsing ──

let localMode = false;
let skipInstall = false;
let target = process.cwd();

const args = process.argv.slice(2);
let i = 0;
while (i < args.length) {
  switch (args[i]) {
    case "--local":
      localMode = true;
      i++;
      break;
    case "--skip-install":
      skipInstall = true;
      i++;
      break;
    case "--target":
      target = args[i + 1];
      i += 2;
      break;
    default:
      i++;
      break;
  }
}

// ── Step 1: Install Claude Code if needed ──

if (!skipInstall) {
  try {
    execFileSync("claude", ["--version"], { stdio: "ignore" });
    console.log("Claude Code already installed.");
  } catch {
    console.log("Installing Claude Code...");
    execFileSync("npm", ["install", "-g", "@anthropic-ai/claude-code"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  }
}

// ── Step 2: Get ff-profiles into the project ──

const ffProfilesDir = path.join(target, "ff-profiles");

if (!localMode) {
  const gitDir = path.join(ffProfilesDir, ".git");
  if (fs.existsSync(gitDir)) {
    console.log("Updating ff-profiles...");
    execFileSync("git", ["-C", ffProfilesDir, "pull", "--quiet"], {
      stdio: "inherit",
    });
  } else {
    console.log("Cloning ff-profiles...");
    execFileSync("git", ["clone", "--quiet", REPO_URL, ffProfilesDir], {
      stdio: "inherit",
    });
  }
  // Remove repo-specific CI/workflow files — consumers don't need these
  const ghDir = path.join(ffProfilesDir, ".github");
  if (fs.existsSync(ghDir)) {
    fs.rmSync(ghDir, { recursive: true, force: true });
  }
} else {
  if (!fs.existsSync(ffProfilesDir)) {
    process.stderr.write(
      `Error: --local specified but ${ffProfilesDir} does not exist.\n`
    );
    process.exit(1);
  }
}

// ── Step 3: Apply default profile ──

const swapScript = path.join(ffProfilesDir, "scripts", "swap-profile.mjs");
execFileSync(
  "node",
  [swapScript, "swap", DEFAULT_PROFILE, "--repo-root", ffProfilesDir, "--target", target],
  { stdio: "inherit" }
);
