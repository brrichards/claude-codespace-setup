---
name: pr-checklist
description: FluidFramework PR preparation checklist — ensures all validation passes before push
user-invocable: false
---

<required>
*CRITICAL* Add the following steps to your Todo list using TodoWrite:

1. Confirm you are on a feature branch, not main/master.
2. Run the `pr-reviewer` agent on current changes.
3. Fix any ERRORS found by the reviewer.
4. Run the `simplifier` agent on current changes.
5. Apply simplifications where appropriate.
6. Run the `validator` agent to check formatting, types, lint, policy, and tests.
7. Fix any errors reported by the validator. Re-run until all pass.
8. Merge main and resolve conflicts: `git fetch && git merge origin/main`.
9. Re-run the `validator` agent if merge introduced changes.
10. Stage and commit all changes.
11. Push branch and create PR with `gh pr create`.
12. Monitor CI with `gh pr checks`.
</required>

# FluidFramework PR Checklist

This skill enforces the full PR preparation pipeline for FluidFramework. Each step must pass before proceeding to the next.

## Review Phase

The `pr-reviewer` agent examines your diff for coding standard violations, missing tests, and quality issues. Only ERRORS are blocking — WARNINGS and SUGGESTIONS are informational.

## Simplification Phase

The `simplifier` agent scans for over-engineering: dead code, premature abstractions, unnecessary complexity. Apply fixes where the simplification is clearly better.

## Validation Phase

Run each tool in order. All must report zero errors:

| Tool | Command | Auto-fix |
|------|---------|----------|
| Biome | `biome check .` | `biome check --write .` |
| TypeScript | `fluid-build --task tsc` | Manual |
| ESLint | `npm run eslint` | `npm run eslint:fix` |
| Policy | `flub check policy` | `flub check policy --fix` |
| Tests | `npm test` | Manual |

## Push Phase

After all validation passes:

```bash
git push -u origin <branch-name>
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<what changed and why>

## Test Plan
- [ ] All CI checks pass
- [ ] Manual verification of <specific behavior>
EOF
)"
```
