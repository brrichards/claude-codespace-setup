# Claude Codespace Setup

A distribution repo that deploys Claude Code configuration to GitHub Codespaces. Consuming repos add a single `curl | bash` one-liner to their `devcontainer.json`, and this repo handles everything else: installing Claude Code, deploying permissions, project instructions, skills, agents, and the skillset management system.

## Quick Start

Add this to your `devcontainer.json` `postCreateCommand`:

```json
{
  "postCreateCommand": "curl -fsSL https://raw.githubusercontent.com/brrichards/claude-codespace-setup/main/setup-ai-assistant.sh | bash"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `claudeSetupRepo` | `brrichards/claude-codespace-setup` | GitHub repo to fetch configs from (for forks) |
| `claudeSetupRef` | `main` | Git ref (branch/tag/commit) to use |

## File Structure

```
├── README.md                           # This file
skillsets system
├── setup-ai-assistant.sh               # Entry point — curled and piped to bash
└── .claude/
    ├── CLAUDE.md                       # Default project instructions template
    ├── settings.json                   # Permissions config
    ├── commands/
    │   ├── skillsets.md                # /skillsets slash command
    │   └── skills.md                   # /skills slash command
    ├── agents/
    │   ├── codeReviewer.md             # Code review agent
    │   └── codeSimplifier.md           # Code simplification agent
    ├── skills/
    │   ├── skills.md                   # Manifest listing skill names to download
    │   ├── reviewer/
    │   │   └── SKILL.md               # Review staged/branched changes skill
    │   ├── simplifier/
    │   │   └── SKILL.md               # Code simplification skill
    │   └── prePr/
    │       └── SKILL.md               # Pre-PR pipeline orchestrator skill
    └── skillsets/
        ├── skillsets.json              # Registry of available skillsets
        ├── skillsets.ts                # TypeScript CLI for skillset management
        └── active.json                # Persisted state (active skillset + pinned items)
```

## Skillsets

Skillsets are named packages of related skills and agents that can be activated or swapped as a group. The system supports individual skill pinning that persists across skillset switches.

### Available Skillsets

| Skillset | Description | Skills | Agents |
|----------|-------------|--------|--------|
| `codeQuality` | Review and lint pipeline | reviewer, prePr | codeReviewer |
| `simplifierTools` | Code simplification utilities | simplifier | codeSimplifier |
| `fullPipeline` | Complete review + simplify + pre-PR | reviewer, simplifier, prePr | codeReviewer, codeSimplifier |

### Managing Skillsets

Use the `/skillsets` slash command:

- `/skillsets` or `/skillsets list` — Show available skillsets, active skillset, and pinned items
- `/skillsets add <name>` — Activate a skillset (downloads its skills and agents)
- `/skillsets remove` — Deactivate the current skillset (pinned items are preserved)

### Pinning Individual Skills

Pinned items persist across skillset switches. Use the `/skills` slash command:

- `/skills` or `/skills list` — Show pinned items and active skillset info
- `/skills add <name>` — Download and pin an individual skill or agent
- `/skills remove <name>` — Unpin (and optionally delete) a skill or agent

The `reviewer` skill is pinned by default.

## Permissions Model

The `settings.json` uses `bypassPermissions` mode with an explicit deny list. This allows Claude Code to work efficiently while blocking dangerous operations.

### Default Mode: bypassPermissions

Claude Code runs most commands without prompting, enabling a smooth workflow for development tasks.

### Denied Operations

| Pattern | Reason |
|---------|--------|
| `git push*` | Prevents accidental pushes; requires explicit user action |
| `git push --force*` | Prevents force pushes that can destroy history |
| `git push -f*` | Same as above (short flag) |
| `git reset --hard*` | Prevents loss of uncommitted work |
| `git clean -f*` | Prevents deletion of untracked files |
| `rm -rf /*` | Prevents catastrophic system deletion |
| `rm -rf .*` | Prevents deletion of dotfiles/hidden directories |
| `: \| *` | Prevents fork bombs and similar resource exhaustion |

### Rationale

- **Git push operations**: Users should explicitly push changes after review
- **Destructive git operations**: Hard resets and force cleans can cause data loss
- **Dangerous rm commands**: Broad deletions should never be automated
- **Fork bombs**: Prevent resource exhaustion attacks

## How It Works

1. Consumer adds the `curl | bash` one-liner to `devcontainer.json`
2. When the Codespace starts, the script:
   - Installs Claude Code via the official installer
   - Creates the `.claude/` directory structure (skills, skillsets, commands, agents)
   - Downloads `settings.json` (always overwrites)
   - Downloads `CLAUDE.md` (only if not present)
   - Persists repo/ref config for the skillset CLI
   - Downloads the skillsets system (registry, CLI, slash commands)
   - Seeds `active.json` with reviewer pinned (only if not present)
   - Downloads all skills listed in the manifest (always overwrites)

The script is idempotent and safe to run multiple times. It uses only `curl` — no `git clone` or `gh` CLI required.
