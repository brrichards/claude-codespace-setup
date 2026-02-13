| name | description |
|------|-------------|
| prep-pr | Run the full PR preparation pipeline: review, simplify, validate, push |

You are executing the PR preparation pipeline. Follow the `pr-checklist` skill to prepare this branch for a pull request.

## Context

- Current branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Commits ahead of base: !`node .claude/hooks/branch-context.mjs commits`
- Changed files: !`node .claude/hooks/branch-context.mjs files`

## Instructions

1. Read and follow the `pr-checklist` skill at `.claude/skills/pr-checklist/SKILL.md`.
2. Execute each phase in order: Review → Simplify → Validate → Push.
3. If any phase finds errors, fix them and re-run that phase.
4. After all phases pass, push the branch and create a PR.

If the user provided arguments, interpret them:
- `/prep-pr` — run the full pipeline
- `/prep-pr review` — run only the review phase
- `/prep-pr validate` — run only the validation phase
- `/prep-pr push` — skip to push (only if validation already passed)

Arguments: $ARGUMENTS
