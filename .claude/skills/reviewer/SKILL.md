# Skill: Review Changes

Review staged or branched changes for common issues.

## When to Use
- Before committing: review staged changes (`git diff --cached`)
- Before creating a PR: review branch changes (`git diff main...HEAD`)

## Steps
1. Identify what to review:
   - If there are staged changes, review those
   - Otherwise, review changes between the current branch and main
2. For each changed file, check for:
   - Accidental debug code (console.log, print statements, debugger)
   - Credentials or secrets
   - TODO/FIXME/HACK comments that should be resolved
   - Obvious logic errors or typos
   - Large files that shouldn't be committed (binaries, node_modules, etc.)
3. Summarize findings in a short list
4. If nothing found, say "Looks clean — no issues spotted."
