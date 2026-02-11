# Project

## Skills

Read the following skill before starting work:

- `.claude/skills/reviewer/SKILL.md` — Review staged/branched changes for common issues

### Using Additional Skills

More skills may be available in `.claude/skills/`. To use one:
1. List what's available: `ls .claude/skills/`
2. Read the skill file before using it

## Skillsets

Skillsets are named packages of related skills and agents. Use the `/skillsets` command to manage them:

- `/skillsets` or `/skillsets list` — Show available skillsets, active skillset, and pinned items
- `/skillsets add <name>` — Activate a skillset (downloads its skills and agents)
- `/skillsets remove` — Deactivate the current skillset (pinned items are preserved)

## Individual Skill Pinning

Pinned skills persist across skillset switches. Use the `/skills` command:

- `/skills` or `/skills list` — Show pinned items and active skillset info
- `/skills add <name>` — Download and pin an individual skill or agent
- `/skills remove <name>` — Unpin (and optionally delete) a skill or agent

The `reviewer` skill is the default pinned skill.
