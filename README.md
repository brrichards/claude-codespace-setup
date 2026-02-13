# Claude Codespace Setup

Self-contained Claude Code profiles for FluidFramework. Swap your entire `.claude/` configuration with a single command.

## Quick Start

### Any Platform (requires Node.js)

```bash
node setup.mjs
```

Or clone into an existing project and run:

```bash
git clone https://github.com/brrichards/claude-codespace-setup.git ff-profiles
node ff-profiles/setup.mjs --local --target .
```

This will:
1. Install Claude Code if not already installed
2. Clone this repo to `./ff-profiles/` (skipped with `--local`)
3. Apply the `developer` profile to `.claude/`

### Codespace Auto-Setup

Add this repo as a git submodule or clone it during setup. Then in `.devcontainer/devcontainer.json`:

```json
{
  "postCreateCommand": "git clone https://github.com/brrichards/claude-codespace-setup.git ff-profiles && node ff-profiles/setup.mjs --local --skip-install --target ."
}
```

## Permissions Model

All profiles use `bypassPermissions` mode — Claude Code runs most commands without prompting, with an explicit deny list blocking dangerous operations.

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

## Switching Profiles

Once set up, use the `/profiles` slash command inside Claude Code:

```
/profiles list              # Show available profiles
/profiles swap minimal      # Switch to a different profile
/profiles swap developer    # Switch back
```

Or use the script directly:

```bash
node ./ff-profiles/scripts/swap-profile.mjs list
node ./ff-profiles/scripts/swap-profile.mjs swap minimal
```

## Available Profiles

| Profile | Description |
|---------|-------------|
| `developer` | Full-featured FluidFramework development profile with coding standards, agents, and skills. |
| `pr-prep` | PR preparation profile — automated code review, simplification, validation, and push. |
| `minimal` | Bare-bones profile with no behavioral modifications. |

## Adding a New Profile

1. Create a directory under `claude-profiles/`:

```
claude-profiles/my-profile/
├── profile.json        # { "name": "my-profile", "description": "..." }
├── CLAUDE.md           # Main instructions
├── settings.json       # Permissions (allow/deny rules)
├── .mcp.json           # MCP server configs (optional)
├── hooks.json          # Hook definitions (optional)
├── agents/             # Agent definitions (.md files)
├── commands/           # Slash commands (.md files)
└── skills/             # Skills (skill-name/SKILL.md)
```

2. At minimum, provide `profile.json`, `CLAUDE.md`, and `settings.json`.

3. The `/profiles` command will automatically discover it.

## Profile Structure Reference

Each profile is a complete `.claude/` directory snapshot. When you swap to a profile, the entire `.claude/` directory is replaced with the profile contents. The `/profiles` slash command is automatically injected into every profile so you can always swap.

| File | Purpose |
|------|---------|
| `profile.json` | Profile metadata (name, description) |
| `CLAUDE.md` | Main instructions for Claude Code |
| `settings.json` | Permissions — allow/deny rules for tools |
| `.mcp.json` | MCP server configurations |
| `hooks.json` | Hook definitions (PreToolUse, SessionStart, etc.) |
| `agents/*.md` | Custom agent definitions |
| `commands/*.md` | Custom slash commands |
| `skills/*/SKILL.md` | Custom skills |
