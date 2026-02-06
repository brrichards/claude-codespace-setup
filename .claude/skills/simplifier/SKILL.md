---
name: Code-Simplifier
description: Use after review passes to reduce complexity without changing behavior — fewer lines, fewer abstractions, fewer concepts
---

# Code Simplification

## Overview

Reduce complexity without changing behavior. Fewer lines, fewer files, fewer concepts.

**Core principle:** The best code is code that doesn't exist. Three similar lines beat a premature abstraction.

**Announce at start:** "Simplifying implementation."

## The Process

### Step 0: Dependencies and Build

- [ ] If any dependencies were added or removed, run `pnpm install --no-frozen-lockfile` from the repo root
- [ ] If any new tests need to be run, run `pnpm build` in the affected package first

### Step 1: Identify Changes

- [ ] Run `git diff main...HEAD` to see all branch changes
- [ ] Read every changed file completely

### Step 2: Look for Simplification Opportunities

**Check each changed file for:**

- [ ] Unnecessary abstractions — helpers/utilities used only once
- [ ] Code that could be inlined — wrappers that add no value
- [ ] Overly verbose logic — conditionals that can be condensed
- [ ] Dead code — unused variables, unreachable branches, commented-out code
- [ ] Premature generalization — configurability nobody asked for
- [ ] Comments that restate the code — `// increment counter` above `counter++`
- [ ] Unnecessary type assertions or casts
- [ ] Over-engineered error handling for impossible scenarios
- [ ] Feature flags or backwards-compatibility shims that can be removed
- [ ] Unnecessary dependencies that could be removed

### Step 3: Apply Simplifications

**For each simplification:**

- [ ] Verify it does NOT change behavior
- [ ] Make the change
- [ ] If a dependency was removed, run `pnpm install --no-frozen-lockfile` from the repo root
- [ ] Run `npx eslint --quiet <file>` on every touched file (errors only)
- [ ] Fix any lint errors introduced
- [ ] Confirm tests still pass (build the package first if needed: `pnpm build`)

### Step 4: Report

**If changes were made:**
- List what was simplified and why
- Return list of changes

**If nothing to simplify:**
- Return "PASS"

## The YAGNI Test

For every abstraction, ask:

1. Is this used more than once RIGHT NOW?
2. Was this explicitly requested?
3. Does removing it break anything?

If answers are No, No, No — remove it.

For every dependency, ask:

1. Is this still used after simplification?
2. Could a built-in or existing dependency handle this?

If answers are No, Yes — remove it and run `pnpm install --no-frozen-lockfile` from repo root.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Changing behavior while "simplifying" | Run tests after every change |
| Removing code that looks unused but is called dynamically | Grep for all references before removing |
| Over-simplifying into unreadable one-liners | Readability > brevity. Three clear lines > one clever line |
| Simplifying test code | Test verbosity aids debugging. Leave tests explicit |
| Removing a dependency without updating lockfile | Always run `pnpm install --no-frozen-lockfile` from repo root |
| Skipping lint after changes | Run `npx eslint --quiet` on every touched file |

## Red Flags

**Never:**
- Change behavior in the name of simplification
- Remove error handling at system boundaries
- Combine unrelated functions for "fewer files"
- Simplify without running tests after
- Remove dependencies without running `pnpm install --no-frozen-lockfile`
- Skip linting touched files

**Always:**
- Run tests after every simplification (build first if needed)
- Grep for references before removing code
- Keep test code explicit and verbose
- Prefer deleting code over refactoring code
- Lint every touched file for errors
- Install from repo root after dependency changes
