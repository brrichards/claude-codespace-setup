# Project

## Skills

Read the following skills as needed:

- `.claude/skills/reviewer/SKILL.md` — Review code for bugs and issues
- `.claude/skills/simplifier/SKILL.md` — Simplify code without changing behavior
- `.claude/skills/pre-pr/SKILL.md` — Run the full review/simplify pipeline before presenting work

## Agents

The following agent definitions are available for use with the Task tool:

- `.claude/agents/code-reviewer.md` — Spawnable reviewer agent
- `.claude/agents/code-simplifier.md` — Spawnable simplifier agent

### Workflow

After completing any implementation task, read and follow `.claude/skills/pre-pr/SKILL.md` before presenting your work. The pre-pr pipeline will spawn agents to handle review and simplification passes.

### Adding Skills

More skills may be available in `.claude/skills/`. To use one:
1. List what's available: `ls .claude/skills/`
2. Read the SKILL.md file inside the skill folder before using it
