---
name: Code-Reviewer
description: Use after completing implementation to review all changes for bugs, security issues, debug artifacts, and code quality problems before presenting work
---

# Code Review

## Overview

Review all changes before presenting work. Catch bugs, security issues, and debug artifacts that shouldn't ship.

**Core principle:** Read every changed line. Don't skim.

**Announce at start:** "Reviewing changes before presenting work."

## The Process

### Step 0: Dependencies and Build

- [ ] If any dependencies were added or removed, run `pnpm install --no-frozen-lockfile` from the repo root
- [ ] If any new tests need to be run, run `pnpm build` in the affected package first

### Step 1: Identify Changes

- [ ] Run `git diff main...HEAD` to see all branch changes
- [ ] If no branch changes, run `git diff --cached` for staged changes
- [ ] If neither, there's nothing to review — return "PASS"

### Step 2: Lint Changed Files

- [ ] For every changed file, run `npx eslint --quiet <file>` (errors only, no warnings)
- [ ] Fix all lint errors before continuing
- [ ] Re-run lint to confirm clean

### Step 3: Review Each Changed File

**For every changed file, check for:**

- [ ] Bugs, logic errors, off-by-one mistakes
- [ ] Accidental debug code (console.log, print, debugger, TODO/FIXME/HACK)
- [ ] Credentials, secrets, API keys, tokens
- [ ] Missing error handling at system boundaries (user input, external APIs)
- [ ] Security issues (injection, XSS, unsanitized input)
- [ ] Large files that shouldn't be committed (binaries, node_modules, .env)
- [ ] Obvious typos in user-facing strings

### Step 4: Report

**If issues found:**
- List each issue with file path and line number
- Fix every issue found
- Return to Step 1 after fixing

**If nothing found:**
- Return "PASS"

## Common Mistakes

| Mistake | Fix |
|---|---|
| Skimming diffs instead of reading | Read every changed line |
| Ignoring test files | Review test changes too — broken tests ship bugs |
| Missing debug code in nested logic | Search explicitly: `grep -r "console.log\|debugger\|print(" .` |
| Assuming generated files are fine | Review generated code — generators have bugs too |
| Forgetting to install after dependency changes | Always run `pnpm install --no-frozen-lockfile` from repo root when package.json changes |
| Running tests without building first | Run `pnpm build` in the affected package before running new tests |

## Red Flags

**Never:**
- Skip reviewing a changed file because it "looks fine"
- Approve without reading the full diff
- Leave TODOs or FIXMEs unresolved
- Ignore lint errors
- Skip dependency install after adding/removing packages

**Always:**
- Read every line of every changed file
- Search for debug artifacts explicitly
- Verify error handling at boundaries
- Lint every changed file (errors only)
- Install dependencies from repo root if package.json changed
- Build the package before running new tests
