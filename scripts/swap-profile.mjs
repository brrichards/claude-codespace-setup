#!/usr/bin/env node
// swap-profile.mjs — List and swap Claude Code profiles.
//
// Usage:
//   node swap-profile.mjs list   [--repo-root <path>]
//   node swap-profile.mjs swap <name> [--repo-root <path>] [--target <path>]
//   node swap-profile.mjs help

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Argument parsing ──

let command = "";
let profileName = "";
let repoRoot = "";
let target = "";

const args = process.argv.slice(2);
let i = 0;
while (i < args.length) {
  switch (args[i]) {
    case "list":
    case "swap":
    case "help":
      command = args[i];
      i++;
      if (command === "swap" && i < args.length && !args[i].startsWith("--")) {
        profileName = args[i];
        i++;
      }
      break;
    case "--repo-root":
      repoRoot = args[i + 1];
      i += 2;
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

// Resolve repo root: default to the parent of the scripts/ directory
if (!repoRoot) {
  repoRoot = path.resolve(__dirname, "..");
}

const profilesDir = path.join(repoRoot, "claude-profiles");
const commandsDir = path.join(repoRoot, "commands");

// ── Subcommands ──

function cmdList() {
  if (!fs.existsSync(profilesDir) || !fs.statSync(profilesDir).isDirectory()) {
    process.stderr.write(
      `Error: No claude-profiles/ directory found at ${profilesDir}\n`
    );
    process.exit(1);
  }

  console.log("Available profiles:");
  console.log("");

  for (const entry of fs.readdirSync(profilesDir)) {
    const profileDir = path.join(profilesDir, entry);
    if (!fs.statSync(profileDir).isDirectory()) continue;

    let description = "(no description)";
    const profileJson = path.join(profileDir, "profile.json");
    if (fs.existsSync(profileJson)) {
      try {
        const data = JSON.parse(fs.readFileSync(profileJson, "utf8"));
        if (data.description) {
          description = data.description;
        }
      } catch {
        // fall through with default description
      }
    }

    const name = path.basename(profileDir);
    console.log(`  ${name.padEnd(20)} ${description}`);
  }

  console.log("");
}

function cmdSwap() {
  if (!profileName) {
    process.stderr.write(
      "Error: Profile name required. Usage: swap-profile.mjs swap <name>\n"
    );
    process.exit(1);
  }

  const profileDir = path.join(profilesDir, profileName);

  if (!fs.existsSync(profileDir) || !fs.statSync(profileDir).isDirectory()) {
    process.stderr.write(`Error: Profile "${profileName}" not found.\n`);
    process.stderr.write("Available profiles:\n");
    for (const entry of fs.readdirSync(profilesDir)) {
      const d = path.join(profilesDir, entry);
      if (fs.statSync(d).isDirectory()) {
        process.stderr.write(`  ${path.basename(d)}\n`);
      }
    }
    process.exit(1);
  }

  // Resolve target directory
  if (!target) {
    target = path.resolve(repoRoot, "..");
  }

  const targetClaudeDir = path.join(target, ".claude");

  // Remove existing .claude/ directory
  if (fs.existsSync(targetClaudeDir)) {
    fs.rmSync(targetClaudeDir, { recursive: true, force: true });
  }

  // Copy profile to .claude/
  fs.cpSync(profileDir, targetClaudeDir, { recursive: true });

  // Inject /profiles command so it's always available
  const targetCommandsDir = path.join(targetClaudeDir, "commands");
  fs.mkdirSync(targetCommandsDir, { recursive: true });
  const profilesMd = path.join(commandsDir, "profiles.md");
  if (fs.existsSync(profilesMd)) {
    fs.cpSync(profilesMd, path.join(targetCommandsDir, "profiles.md"));
  }

  console.log(`Profile "${profileName}" applied to ${target}`);
}

function cmdHelp() {
  console.log(`Usage: swap-profile.mjs <command> [options]

Commands:
  list                List available profiles
  swap <name>         Apply a profile to the target directory
  help                Show this help message

Options:
  --repo-root <path>  Path to the ff-profiles repo (default: auto-detected)
  --target <path>     Target project directory (default: parent of repo root)

Examples:
  node swap-profile.mjs list
  node swap-profile.mjs swap developer
  node swap-profile.mjs swap minimal --target /path/to/project`);
}

// ── Dispatch ──

switch (command || "help") {
  case "list":
    cmdList();
    break;
  case "swap":
    cmdSwap();
    break;
  case "help":
    cmdHelp();
    break;
  default:
    process.stderr.write(`Error: Unknown command: ${command}\n`);
    cmdHelp();
    process.exit(1);
}
