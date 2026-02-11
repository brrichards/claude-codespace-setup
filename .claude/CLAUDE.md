# Project

## Skills

Read the following skills as needed:

- `.claude/skills/reviewer/SKILL.md` — Review code for bugs and issues

Additional skills (simplifier, pre-pr, agents) are available via skillsets. Use `/skillsets add full-pipeline` to install the complete review/simplify/pre-PR pipeline.

### Skillsets

Skills are organized into named groups called skillsets. Use `/skillsets` to manage them:

- `/skillsets` - Show available skillsets and what's currently active
- `/skillsets add <name>` - Activate a skillset (replaces any currently active skillset)
- `/skillsets remove` - Remove the active skillset and its installed items

Skillset definitions live in the remote repo. The active state is tracked locally in `.claude/skillsets/active.json`.

### Individual Skills

Install individual skills or agents without a skillset. These persist across skillset switches:

- `/skills` - Show pinned and skillset skills
- `/skills add <name>` - Download and pin a skill or agent
- `/skills remove <name>` - Unpin and remove (unless still needed by active skillset)
