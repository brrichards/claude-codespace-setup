#!/usr/bin/env node

/**
 * Manage skillsets (groups of skills) in the current workspace.
 * Usage: node skillsets.js <command> [name] [--dry-run] [--yes]
 * Commands: list, add, remove
 */

const fs = require("fs/promises");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

// --- Config ---
const SETUP_REPO = process.env.CLAUDE_SETUP_REPO || "brrichards/claude-codespace-setup";
const SETUP_REF = process.env.CLAUDE_SETUP_REF || (() => {
    try {
        return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
    } catch {
        return "main";
    }
})();
const BASE_URL = `https://raw.githubusercontent.com/${SETUP_REPO}/${SETUP_REF}`;

// --- Colors ---
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const log = {
    error: (msg) => console.error(`${RED}Error: ${msg}${RESET}`),
    success: (msg) => console.log(`${GREEN}✓ ${msg}${RESET}`),
    info: (msg) => console.log(`${CYAN}${msg}${RESET}`),
    warn: (msg) => console.log(`${YELLOW}Warning: ${msg}${RESET}`),
    raw: (msg) => console.log(msg),
};

// --- Helpers ---
const loadJson = async (filePath) => {
    try {
        return JSON.parse(await fs.readFile(filePath, "utf-8"));
    } catch {
        return null;
    }
};

const saveJson = async (filePath, data) => {
    const tmp = filePath + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, filePath);
};

const fetchText = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.text();
};

const confirm = (question) =>
    new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === "y");
        });
    });

const getPaths = () => {
    let root;
    try {
        root = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    } catch {
        root = process.cwd();
    }
    return {
        root,
        claudeDir: path.join(root, ".claude"),
        skillsDir: path.join(root, ".claude", "skills"),
        agentsDir: path.join(root, ".claude", "agents"),
        skillsetsDir: path.join(root, ".claude", "skillsets"),
        activeFile: path.join(root, ".claude", "skillsets", "active.json"),
    };
};

// Map an item to its local path and remote URL
const itemPaths = (item, { skillsDir, agentsDir }) => {
    if (item.type === "agent") {
        return {
            localFile: path.join(agentsDir, `${item.name}.md`),
            remoteUrl: `${BASE_URL}/.claude/agents/${item.name}.md`,
        };
    }
    return {
        localFile: path.join(skillsDir, item.name, "SKILL.md"),
        remoteUrl: `${BASE_URL}/.claude/skills/${item.name}/SKILL.md`,
    };
};

// Get all items (skills + agents) from a skillset definition
const getItems = (skillset) => [
    ...(skillset.skills || []).map((name) => ({ name, type: "skill" })),
    ...(skillset.agents || []).map((name) => ({ name, type: "agent" })),
];

const loadRegistry = async (skillsetsDir) => {
    try {
        const text = await fetchText(`${BASE_URL}/.claude/skillsets/skillsets.json`);
        return JSON.parse(text);
    } catch (err) {
        const local = await loadJson(path.join(skillsetsDir, "skillsets.json"));
        if (!local) {
            log.error(`Could not load skillset registry: ${err.message}`);
            process.exit(1);
        }
        return local;
    }
};

// --- Commands ---

const list = async () => {
    const { skillsetsDir, activeFile } = getPaths();
    const registry = await loadRegistry(skillsetsDir);
    const active = (await loadJson(activeFile)) || { active_skillsets: [], installed_skills: {} };

    log.raw(`\n${BOLD}Available Skillsets:${RESET}\n`);
    for (const [name, def] of Object.entries(registry.skillsets)) {
        const status = active.active_skillsets.includes(name)
            ? `${GREEN}[active]${RESET}`
            : "[inactive]";
        const items = [...(def.skills || []), ...(def.agents || [])];
        log.raw(`  ${BOLD}${name}${RESET}  ${def.description}`);
        log.raw(`    ${status}  includes: ${items.join(", ")}\n`);
    }

    if (active.active_skillsets.length > 0) {
        log.raw(`${BOLD}Active Skillsets:${RESET}\n`);
        for (const name of active.active_skillsets) {
            const skills = Object.entries(active.installed_skills)
                .filter(([, owners]) => owners.includes(name))
                .map(([skill]) => skill);
            log.raw(`  ${BOLD}${name}${RESET}  skills: ${skills.join(", ")}`);
        }
        log.raw("");
    } else {
        log.raw("No skillsets currently active.\n");
    }
};

const add = async (skillsetName, { dryRun, yes }) => {
    const paths = getPaths();
    const { skillsDir, skillsetsDir, activeFile } = paths;
    const registry = await loadRegistry(skillsetsDir);
    const active = (await loadJson(activeFile)) || { active_skillsets: [], installed_skills: {} };

    // No name: show available
    if (!skillsetName) {
        await list();
        return;
    }

    // Validate
    const skillset = registry.skillsets[skillsetName];
    if (!skillset) {
        log.error(`Skillset "${skillsetName}" not found.`);
        log.info(`Available: ${Object.keys(registry.skillsets).join(", ")}`);
        process.exit(1);
    }

    // Already active
    if (active.active_skillsets.includes(skillsetName)) {
        log.success(`Skillset "${skillsetName}" is already active.`);
        return;
    }

    // Check which items need downloading
    const items = getItems(skillset);
    const alreadyInstalled = [];
    const needsDownload = [];
    for (const item of items) {
        const { localFile } = itemPaths(item, paths);
        try {
            await fs.access(localFile);
            alreadyInstalled.push(item);
        } catch {
            needsDownload.push(item);
        }
    }

    // Display plan
    log.raw(`\n${BOLD}Skillset: ${skillsetName}${RESET}`);
    log.raw(`${skillset.description}\n`);
    if (alreadyInstalled.length > 0) {
        log.raw(`  Already installed: ${alreadyInstalled.map((i) => i.name).join(", ")}`);
    }
    if (needsDownload.length > 0) {
        log.raw(`  Will download:     ${needsDownload.map((i) => i.name).join(", ")}`);
    } else {
        log.raw(`  All items already present.`);
    }
    log.raw("");

    if (dryRun) return;

    if (!yes) {
        const proceed = await confirm("Proceed? [y/N] ");
        if (!proceed) {
            log.info("Cancelled.");
            return;
        }
    }

    // Download missing items
    for (const item of needsDownload) {
        const { localFile, remoteUrl } = itemPaths(item, paths);
        try {
            const content = await fetchText(remoteUrl);
            await fs.mkdir(path.dirname(localFile), { recursive: true });
            await fs.writeFile(localFile, content);
            log.success(`Downloaded ${item.name}`);
        } catch (err) {
            log.error(`Failed to download ${item.name}: ${err.message}`);
            process.exit(1);
        }
    }

    // Update active.json
    active.active_skillsets.push(skillsetName);
    for (const item of items) {
        if (!active.installed_skills[item.name]) {
            active.installed_skills[item.name] = [];
        }
        if (!active.installed_skills[item.name].includes(skillsetName)) {
            active.installed_skills[item.name].push(skillsetName);
        }
    }
    await fs.mkdir(skillsetsDir, { recursive: true });
    await saveJson(activeFile, active);

    log.success(`Added skillset "${skillsetName}". ${needsDownload.length} item(s) downloaded.`);
};

const remove = async (skillsetName, { dryRun, yes }) => {
    const paths = getPaths();
    const { skillsDir, agentsDir, skillsetsDir, activeFile } = paths;
    const active = await loadJson(activeFile);

    if (!active || active.active_skillsets.length === 0) {
        log.info("No active skillsets.");
        return;
    }

    // No name: list active
    if (!skillsetName) {
        log.raw(`\n${BOLD}Active Skillsets:${RESET}`);
        for (const name of active.active_skillsets) {
            const skills = Object.entries(active.installed_skills)
                .filter(([, owners]) => owners.includes(name))
                .map(([skill]) => skill);
            log.raw(`  ${BOLD}${name}${RESET}  skills: ${skills.join(", ")}`);
        }
        log.raw("");
        return;
    }

    // Validate
    if (!active.active_skillsets.includes(skillsetName)) {
        log.error(`Skillset "${skillsetName}" is not active.`);
        log.info(`Active skillsets: ${active.active_skillsets.join(", ")}`);
        process.exit(1);
    }

    // Partition skills: orphaned vs shared
    const toRemove = [];
    const toKeep = [];
    for (const [skill, owners] of Object.entries(active.installed_skills)) {
        if (!owners.includes(skillsetName)) continue;
        const otherOwners = owners.filter((o) => o !== skillsetName);
        if (otherOwners.length === 0) {
            toRemove.push(skill);
        } else {
            toKeep.push({ skill, reason: `also used by: ${otherOwners.join(", ")}` });
        }
    }

    // Display plan
    log.raw(`\n${BOLD}Removing skillset: ${skillsetName}${RESET}\n`);
    if (toRemove.length > 0) {
        for (const skill of toRemove) {
            log.raw(`  Will remove: ${skill} (only used by ${skillsetName})`);
        }
    }
    if (toKeep.length > 0) {
        for (const { skill, reason } of toKeep) {
            log.raw(`  Will keep:   ${skill} (${reason})`);
        }
    }
    if (toRemove.length === 0) {
        log.raw(`  No skills to remove (all shared with other skillsets).`);
    }
    log.raw("");

    if (skillsetName === "default") {
        log.warn("Removing 'default' skillset. Re-running codespace creation will restore it.");
    }

    if (dryRun) return;

    if (!yes) {
        const proceed = await confirm("Proceed? [y/N] ");
        if (!proceed) {
            log.info("Cancelled.");
            return;
        }
    }

    // Load registry to determine item types for path resolution
    const registry = await loadRegistry(skillsetsDir);
    const skillsetDef = registry.skillsets[skillsetName];
    const agentNames = new Set(skillsetDef?.agents || []);

    // Remove orphaned items
    let removed = 0;
    for (const name of toRemove) {
        const item = { name, type: agentNames.has(name) ? "agent" : "skill" };
        const { localFile } = itemPaths(item, paths);
        const target = item.type === "agent" ? localFile : path.dirname(localFile);
        try {
            await fs.rm(target, { recursive: true, force: true });
            log.success(`Removed ${name}`);
            removed++;
        } catch (err) {
            log.warn(`Could not remove ${name}: ${err.message}`);
        }
    }

    // Update active.json
    active.active_skillsets = active.active_skillsets.filter((s) => s !== skillsetName);
    for (const [skill, owners] of Object.entries(active.installed_skills)) {
        active.installed_skills[skill] = owners.filter((o) => o !== skillsetName);
        if (active.installed_skills[skill].length === 0) {
            delete active.installed_skills[skill];
        }
    }
    await saveJson(activeFile, active);

    log.success(`Removed skillset "${skillsetName}". ${removed} skill(s) deleted, ${toKeep.length} kept.`);
};

// --- Main ---
const main = async () => {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const yes = args.includes("--yes");
    const positional = args.filter((a) => !a.startsWith("--"));
    const command = positional[0];
    const name = positional[1];
    const flags = { dryRun, yes };

    switch (command) {
        case "list":
            return list();
        case "add":
            return add(name, flags);
        case "remove":
            return remove(name, flags);
        default:
            log.raw(`Usage: node skillsets.js <command> [name] [--dry-run] [--yes]`);
            log.raw(`Commands: list, add, remove`);
            process.exit(command ? 1 : 0);
    }
};

main().catch((err) => {
    log.error(err.message);
    process.exit(1);
});
