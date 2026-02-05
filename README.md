# Claude Codespace Setup

A distribution repo that deploys Claude Code configuration to GitHub Codespaces. Consuming repos add a single `curl | bash` one-liner to their `devcontainer.json`, and this repo handles everything else: installing Claude Code, deploying permissions, project instructions, and skills.

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
| `CLAUDE_SETUP_REPO` | `brrichards/claude-codespace-setup` | GitHub repo to fetch configs from (for forks) |
| `CLAUDE_SETUP_REF` | `main` | Git ref (branch/tag/commit) to use |

## File Structure

```
├── README.md                     # This file
├── setup-ai-assistant.sh         # Entry point — curled and piped to bash
└── .claude/
    ├── CLAUDE.md                 # Default project instructions template
    ├── settings.json             # Permissions config
    └── skills/
        ├── skills.md             # Manifest listing skill names to download
        └── reviewer/
            └── SKILL.md          # Review staged/branched changes skill
```

The repo structure mirrors the deployed structure exactly, making it easy to see what gets installed where.

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
   - Verifies installation and prints the version
   - Creates the `.claude/` directory structure
   - Downloads `settings.json` (always overwrites)
   - Downloads `CLAUDE.md` (only if not present)
   - Downloads all skills (always overwrites)
   - Prints a summary of what was installed/skipped

The script is idempotent and safe to run multiple times. It uses only `curl` — no `git clone` or `gh` CLI required.