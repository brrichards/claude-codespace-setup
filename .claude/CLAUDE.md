# Project

## Skills

Read the following skills as needed:

- `.claude/skills/reviewer/SKILL.md` — Review code for bugs and issues

Additional skills (simplifier, pre-pr, agents) are available via skillsets. Use `/skillsets add full-pipeline` to install the complete review/simplify/pre-PR pipeline.

### Skillsets

Skills are organized into named groups called skillsets. Use `/skillsets` to manage them:

- `/skillsets list` - See available and active skillsets
- `/skillsets add <name>` - Add a group of related skills
- `/skillsets remove <name>` - Remove a skillset (keeps skills needed by other active skillsets)

Active skillsets and their state are tracked in `.claude/skillsets/active.json`.

### Adding Skills

More skills may be available in `.claude/skills/`. To use one:
1. List what's available: `ls .claude/skills/`
2. Read the SKILL.md file inside the skill folder before using it
