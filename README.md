# Claude Codespace Setup

Distributes Claude Code configuration, permissions, skills, and subagent definitions to GitHub Codespaces. Consuming repos add a single `curl | bash` one-liner to their `devcontainer.json` and this repo handles everything else — installing Claude Code, deploying permissions, project instructions, skills, and spawnable subagent prompts.

## Quick Start

Add this to your `devcontainer.json`:

```json
{
  "postCreateCommand": "curl -fsSL https://raw.githubusercontent.com/brrichards/claude-codespace-setup/main/setup-ai-assistant.sh | bash"
}
```

## Configuration

Two environment variables control where the script fetches configs from:

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_SETUP_REPO` | `brrichards/claude-codespace-setup` | GitHub repo to fetch configs from. Fork this repo and set this variable to use your own configuration. |
| `CLAUDE_SETUP_REF` | `main` | Git ref (branch or tag) to use. Pin to a specific tag for stability. |

## What Gets Deployed

The script writes the following files into `.claude/` in the consuming repo's workspace:

```
.claude/
├── settings.json                  # Permissions config (always overwritten)
├── CLAUDE.md                      # Project instructions (only if not present)
├── subagents/
│   ├── code-reviewer.md           # Reviewer subagent definition (always overwritten)
│   └── code-simplifier.md         # Simplifier subagent definition (always overwritten)
└── skills/
    ├── skills.md                  # Skill manifest
    ├── reviewer/
    │   └── SKILL.md               # Code review skill (always overwritten)
    ├── simplifier/
    │   └── SKILL.md               # Code simplification skill (always overwritten)
    └── pre-pr/
        └── SKILL.md               # Pre-PR pipeline skill (always overwritten)
```

## Permissions Model

The `settings.json` uses `bypassPermissions` mode with an explicit deny list. Claude Code runs most commands without prompting, while the deny list blocks dangerous operations:

| Pattern | What it prevents |
|---------|-----------------|
| `git push*` | Pushing to remote — users should push explicitly after review |
| `git reset --hard*` | Discarding uncommitted local work |
| `git clean -f*` | Deleting untracked files |
| `rm -rf /*` | Wiping the filesystem root |
| `rm -rf .*` | Wiping hidden directories |
| `: \| *` | Fork bombs and resource exhaustion |

## Skills

Three skills are included, each in its own folder under `.claude/skills/`:

| Skill | Description |
|-------|-------------|
| `reviewer` | Reviews all changes for bugs, security issues, debug artifacts, and code quality problems |
| `simplifier` | Reduces complexity without changing behavior — fewer lines, fewer abstractions, fewer concepts |
| `pre-pr` | Orchestrates a review/simplify loop using subagents until both pass, then presents clean work |

## Subagents

Two subagent definitions live in `.claude/subagents/` and are spawned by the pre-pr pipeline via the Task tool:

| Subagent | Description |
|----------|-------------|
| `code-reviewer.md` | Reviews branch changes for bugs, security issues, lint errors, and debug artifacts. Reads and follows the reviewer skill. |
| `code-simplifier.md` | Simplifies branch changes without changing behavior. Reads and follows the simplifier skill. |

The pre-pr pipeline reads these definitions and passes their contents as prompts when spawning `general-purpose` subagents with the Task tool. Each subagent gets a fresh context window for every pass.

## Adding a Skill

1. Create a folder in `.claude/skills/{name}/` with a `SKILL.md` inside
2. Add `- name` to `.claude/skills/skills.md`

The setup script reads the manifest and downloads each listed skill.

## Adding a Subagent

1. Create a markdown file in `.claude/subagents/` (e.g., `my-agent.md`)
2. Add a `download_file` line to `setup-ai-assistant.sh` to download it:
   ```bash
   download_file ".claude/subagents/my-agent.md" ".claude/subagents/my-agent.md" "true"
   ```

## Customization

- **`CLAUDE.md`**: Consumers can place their own `.claude/CLAUDE.md` in the repo before the script runs and it will not be overwritten. This lets teams add project-specific instructions on top of the centrally managed skills and permissions.
- **`settings.json`, skills, and subagents**: Always overwritten on each Codespace creation to ensure consistent, centrally managed configuration across all consuming repos.
