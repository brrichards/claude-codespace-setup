# ff-profiles

Self-contained Claude Code profiles for FluidFramework. Swap your entire `.claude/` configuration with a single command.

## Quick Start

### Codespace / Fresh Setup

```bash
curl -fsSL https://raw.githubusercontent.com/brrichards/ff-profiles/main/setup.sh | bash
```

This will:
1. Install Claude Code if not already installed
2. Clone this repo to `./ff-profiles/`
3. Apply the `developer` profile to `.claude/`

### Codespace Auto-Setup

Add to `.devcontainer/devcontainer.json`:

```json
{
  "postCreateCommand": "curl -fsSL https://raw.githubusercontent.com/brrichards/ff-profiles/main/setup.sh | bash"
}
```

## Switching Profiles

Once set up, use the `/profiles` slash command inside Claude Code:

```
/profiles list              # Show available profiles
/profiles swap minimal      # Switch to a different profile
/profiles swap developer    # Switch back
```

Or use the script directly:

```bash
bash ./ff-profiles/scripts/swap-profile.sh list
bash ./ff-profiles/scripts/swap-profile.sh swap minimal
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
