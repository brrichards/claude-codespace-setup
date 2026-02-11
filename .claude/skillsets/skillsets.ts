/// <reference types="node" />

import { readFile, writeFile, rename, mkdir, rm } from "fs/promises";
import { join, dirname } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

// #region Constants

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..", "..");
const skillsetsDir = join(root, ".claude", "skillsets");
const registryPath = join(skillsetsDir, "skillsets.json");
const statePath = join(skillsetsDir, "active.json");
const skillsDir = join(root, ".claude", "skills");
const agentsDir = join(root, ".claude", "agents");

// #endregion

// #region Interfaces

/**
 * A single skillset entry from the registry.
 *
 * @remarks
 * Each skillset groups related skills and agents that can be
 * activated or deactivated together as a named package.
 */
interface SkillsetEntry {
  description: string;
  skills: string[];
  agents: string[];
}

/**
 * The skillset registry read from `skillsets.json`.
 */
interface Registry {
  skillsets: Record<string, SkillsetEntry>;
}

/**
 * Persisted state tracking the active skillset and pinned items.
 *
 * @remarks
 * Stored in `active.json`. Pinned items survive skillset switches —
 * only non-pinned skillset items are removed when switching or deactivating.
 */
interface State {
  activeSkillset: string | null;
  skillsetItems: string[];
  pinned: string[];
}

// #endregion

// #region Config resolution

/**
 * Reads the repo and ref from `.setupRepo` and `.setupRef` config files.
 *
 * @returns The GitHub repo slug and git ref to fetch remote content from.
 *
 * @remarks
 * Falls back to `brrichards/claude-codespace-setup` and `main` when
 * config files are missing or empty. These files are written by the
 * setup script during initial installation.
 */
async function getConfig(): Promise<{ repo: string; ref: string }> {
  let repo = "brrichards/claude-codespace-setup";
  let ref = "main";

  try {
    const repoFile = await readFile(join(skillsetsDir, ".setupRepo"), "utf-8");
    if (repoFile.trim()) repo = repoFile.trim();
  } catch {
    // Config file missing — use default
  }

  try {
    const refFile = await readFile(join(skillsetsDir, ".setupRef"), "utf-8");
    if (refFile.trim()) ref = refFile.trim();
  } catch {
    // Config file missing — use default
  }

  return { repo, ref };
}

// #endregion

// #region State management

/**
 * Loads and parses the skillset registry from disk.
 *
 * @returns The parsed registry containing all available skillset definitions.
 *
 * @remarks
 * Exits the process with code 1 if the registry file cannot be read or parsed.
 */
async function loadRegistry(): Promise<Registry> {
  try {
    const data = await readFile(registryPath, "utf-8");
    return JSON.parse(data) as Registry;
  } catch {
    console.error(`Error: Failed to load registry at ${registryPath}`);
    return process.exit(1);
  }
}

/**
 * Loads and parses the current skillset state from disk.
 *
 * @returns The parsed state, or a default empty state if the file is missing.
 */
async function loadState(): Promise<State> {
  try {
    const data = await readFile(statePath, "utf-8");
    return JSON.parse(data) as State;
  } catch {
    return { activeSkillset: null, skillsetItems: [], pinned: [] };
  }
}

/**
 * Persists the skillset state to disk atomically.
 *
 * @param state - The state object to serialize and write.
 *
 * @remarks
 * Writes to a temporary file first, then renames to the target path.
 * This prevents partial writes from corrupting state on crash.
 */
async function saveState(state: State): Promise<void> {
  const tmpPath = statePath + ".tmp";
  await writeFile(tmpPath, JSON.stringify(state, null, 2) + "\n", "utf-8");
  await rename(tmpPath, statePath);
}

// #endregion

// #region Helpers

/**
 * Computes the set difference of two string arrays.
 *
 * @param a - The source array.
 * @param b - The array of items to exclude.
 * @returns Items present in `a` but not in `b`.
 */
function setDiff(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((item) => !bSet.has(item));
}

/**
 * Prompts the user for yes/no confirmation via stdin.
 *
 * @param message - The prompt message displayed before `[y/N]`.
 * @returns `true` if the user entered `y` or `Y`, `false` otherwise.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer: string) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// #endregion

// #region Download helpers

/**
 * Downloads a skill's `SKILL.md` from the remote repository.
 *
 * @param repo - The GitHub repo slug (e.g. `owner/repo`).
 * @param ref - The git ref to fetch from (branch, tag, or SHA).
 * @param name - The skill name, used as the subdirectory under `.claude/skills/`.
 *
 * @remarks
 * Creates the skill directory if it does not exist. Logs a warning and
 * returns gracefully on HTTP errors (e.g. 404 when the skill is not
 * yet published to the remote).
 */
async function downloadSkill(
  repo: string,
  ref: string,
  name: string,
): Promise<void> {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/.claude/skills/${name}/SKILL.md`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`  Warning: Failed to download skill '${name}' (HTTP ${response.status})`);
    return;
  }
  const content = await response.text();
  const skillDir = join(skillsDir, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content, "utf-8");
}

/**
 * Downloads an agent definition from the remote repository.
 *
 * @param repo - The GitHub repo slug (e.g. `owner/repo`).
 * @param ref - The git ref to fetch from (branch, tag, or SHA).
 * @param name - The agent name, used as the filename under `.claude/agents/`.
 *
 * @remarks
 * Creates the agents directory if it does not exist. Logs a warning and
 * returns gracefully on HTTP errors.
 */
async function downloadAgent(
  repo: string,
  ref: string,
  name: string,
): Promise<void> {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/.claude/agents/${name}.md`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`  Warning: Failed to download agent '${name}' (HTTP ${response.status})`);
    return;
  }
  const content = await response.text();
  await mkdir(agentsDir, { recursive: true });
  await writeFile(join(agentsDir, `${name}.md`), content, "utf-8");
}

// #endregion

// #region Deletion helpers

/**
 * Removes a skill directory and all its contents.
 *
 * @param name - The skill name whose directory to delete.
 *
 * @remarks
 * Silently succeeds if the directory does not exist.
 */
async function deleteSkill(name: string): Promise<void> {
  try {
    await rm(join(skillsDir, name), { recursive: true, force: true });
  } catch {
    // Directory may not exist — safe to ignore
  }
}

/**
 * Removes an agent definition file.
 *
 * @param name - The agent name whose `.md` file to delete.
 *
 * @remarks
 * Silently succeeds if the file does not exist.
 */
async function deleteAgent(name: string): Promise<void> {
  try {
    await rm(join(agentsDir, `${name}.md`), { force: true });
  } catch {
    // File may not exist — safe to ignore
  }
}

// #endregion

// #region Subcommands

/**
 * Lists all available skillsets, the active skillset, and pinned items.
 *
 * @remarks
 * Marks the currently active skillset with a `*` indicator.
 * This is the default subcommand when no arguments are provided.
 */
async function cmdList(): Promise<void> {
  const registry = await loadRegistry();
  const state = await loadState();

  console.log("Available Skillsets:");
  for (const [name, entry] of Object.entries(registry.skillsets)) {
    const marker = name === state.activeSkillset ? "*" : " ";
    console.log(`  ${marker} ${name} — ${entry.description}`);
  }

  console.log();

  console.log("Pinned items:");
  if (state.pinned.length === 0) {
    console.log("  (none)");
  } else {
    for (const item of state.pinned) {
      console.log(`  ${item}`);
    }
  }

  console.log("Active skillset items:");
  if (state.skillsetItems.length === 0) {
    console.log("  (none)");
  } else {
    for (const item of state.skillsetItems) {
      console.log(`  ${item}`);
    }
  }
}

/**
 * Activates a skillset by downloading its skills and agents.
 *
 * @param name - The skillset name from the registry to activate.
 * @param autoYes - When `true`, skips the confirmation prompt.
 *
 * @remarks
 * Removes non-pinned items from the previously active skillset before
 * downloading the new one. Pinned items are never deleted. Exits with
 * code 1 if the requested skillset is not found in the registry.
 */
async function cmdAdd(name: string, autoYes: boolean): Promise<void> {
  const registry = await loadRegistry();
  const state = await loadState();

  const entry = registry.skillsets[name];
  if (!entry) {
    console.error(`Error: Skillset '${name}' not found in registry.`);
    console.error(`Available skillsets: ${Object.keys(registry.skillsets).join(", ")}`);
    process.exit(1);
  }

  const allItems = [...entry.skills, ...entry.agents];
  const toDelete = setDiff(state.skillsetItems, state.pinned);
  const toDownload = allItems;

  console.log(`Switching to skillset: ${name}`);
  console.log(`Will remove: ${toDelete.length > 0 ? toDelete.join(", ") : "nothing"}`);
  console.log(`Will download: ${toDownload.join(", ")}`);

  if (!autoYes) {
    const ok = await confirm("Proceed?");
    if (!ok) {
      console.log("Aborted.");
      return;
    }
  }

  // Remove old non-pinned skillset items
  for (const item of toDelete) {
    await deleteSkill(item);
    await deleteAgent(item);
  }

  // Download all skills and agents for the new skillset
  const { repo, ref } = await getConfig();

  for (const skill of entry.skills) {
    await downloadSkill(repo, ref, skill);
  }
  for (const agent of entry.agents) {
    await downloadAgent(repo, ref, agent);
  }

  // Persist the new active skillset
  state.activeSkillset = name;
  state.skillsetItems = allItems;
  await saveState(state);

  console.log(`Skillset '${name}' activated.`);
}

/**
 * Deactivates the current skillset and removes its non-pinned items.
 *
 * @param autoYes - When `true`, skips the confirmation prompt.
 *
 * @remarks
 * Pinned items are preserved on disk. Only items that were installed
 * by the skillset (and not individually pinned) are deleted.
 */
async function cmdRemove(autoYes: boolean): Promise<void> {
  const state = await loadState();

  if (!state.activeSkillset) {
    console.log("No active skillset.");
    return;
  }

  const toDelete = setDiff(state.skillsetItems, state.pinned);

  console.log(`Removing skillset: ${state.activeSkillset}`);
  console.log(`Will remove: ${toDelete.length > 0 ? toDelete.join(", ") : "nothing"}`);
  console.log(`Pinned items preserved: ${state.pinned.length > 0 ? state.pinned.join(", ") : "(none)"}`);

  if (!autoYes) {
    const ok = await confirm("Proceed?");
    if (!ok) {
      console.log("Aborted.");
      return;
    }
  }

  // Delete non-pinned skillset items from disk
  for (const item of toDelete) {
    await deleteSkill(item);
    await deleteAgent(item);
  }

  // Clear the active skillset
  state.activeSkillset = null;
  state.skillsetItems = [];
  await saveState(state);

  console.log("Skillset removed.");
}

// #endregion

// #region Main

/**
 * Parses CLI arguments and dispatches to the appropriate subcommand.
 *
 * @remarks
 * Defaults to `list` when no subcommand is provided. Prints usage
 * information and exits with code 1 for unknown commands.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "list";

  switch (command) {
    case "list": {
      await cmdList();
      break;
    }

    case "add": {
      const name = args[1];
      if (!name || name.startsWith("--")) {
        console.error("Usage: skillsets.ts add <name> [--yes]");
        process.exit(1);
      }
      const autoYes = args.includes("--yes");
      await cmdAdd(name, autoYes);
      break;
    }

    case "remove": {
      const autoYes = args.includes("--yes");
      await cmdRemove(autoYes);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.error("Usage: skillsets.ts <list|add|remove>");
      console.error("  list              List available skillsets (default)");
      console.error("  add <name> [--yes]  Activate a skillset");
      console.error("  remove [--yes]      Remove the active skillset");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

// #endregion
