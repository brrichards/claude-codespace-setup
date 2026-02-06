---
name: Pre-PR-Pipeline
description: Use after implementation is complete — spawns review and simplification subagents in a loop until both pass, then presents final work to user. Do NOT prompt the user until the pipeline completes.
---

# Pre-PR Pipeline

## Overview

Automated quality gate that runs before presenting work. Spawns subagents for review and simplification, loops until both pass cleanly.

**Core principle:** Do not involve the user until the code is clean. Fix your own mess.

**Announce at start:** "Running pre-PR pipeline."

## Pre-Flight

Before entering the loop:

- [ ] If any dependencies were added or removed, run `pnpm install --no-frozen-lockfile` from the repo root
- [ ] If new tests were added, run `pnpm build` in the affected package(s) first
- [ ] Run `npx eslint --quiet` on all changed files — fix all errors before proceeding
- [ ] Get the list of changed files: `git diff --name-only main...HEAD`

## The Pipeline

<required>
Add each step to your Todo list using TodoWrite.

### Step 1: Review (subagent)

- Read the subagent definition at `.claude/subagents/code-reviewer.md`
- Use the Task tool to spawn a `general-purpose` subagent
- Pass the contents of `.claude/subagents/code-reviewer.md` as the prompt
- If the subagent returned fixes: go to Step 1 (re-review after fixes)
- If "PASS": continue to Step 2

### Step 2: Simplify (subagent)

- Read the subagent definition at `.claude/subagents/code-simplifier.md`
- Use the Task tool to spawn a `general-purpose` subagent
- Pass the contents of `.claude/subagents/code-simplifier.md` as the prompt
- If the subagent made changes: go to Step 1 (simplification may introduce issues)
- If "PASS": continue to Step 3

### Step 3: Final Review (subagent)

- Spawn the same review subagent as Step 1 one last time
- If issues found: fix them, go to Step 1
- If "PASS": pipeline complete
</required>

## Safety

- **Maximum 5 full loops.** If still not passing after 5, STOP. Present current state to user with remaining issues listed.
- **Each loop must make progress.** Never re-introduce something you just removed.
- **Run tests after every change.** If tests break, fix before continuing the loop. Build the package first if needed (`pnpm build`).
- **Lint after every change.** Run `npx eslint --quiet` on touched files. Fix errors before continuing.
- **Dependencies after every change.** If package.json was modified, run `pnpm install --no-frozen-lockfile` from repo root before continuing.

## Why Subagents

- Each review/simplify pass gets a **fresh context window** — stays sharp across loops
- The orchestrator (this pipeline) stays lean and tracks pass/fail + loop count
- Subagents read the full skill files without bloating the main conversation
- If a subagent fails or times out, the orchestrator can retry or present partial results

## Output

When the pipeline passes, present to the user:

- Summary of what was implemented
- What the review caught and fixed (if anything)
- What was simplified (if anything)
- Confirm all lint errors resolved and tests passing
- State that changes are ready for their review

## Red Flags

**Never:**
- Prompt the user during the pipeline
- Skip the review after simplification
- Loop without making progress
- Exceed 5 loops without stopping
- Skip lint or dependency install between loops
- Run tests without building the package first

**Always:**
- Use subagents for review and simplification passes
- Run tests after every fix (build first if needed)
- Lint every touched file for errors (not warnings)
- Install dependencies from repo root if package.json changed
- Track which loop you're on
- Present a clean summary at the end
