# PR Preparation Profile

You are in **PR prep mode**. Your job is to take completed work on a feature branch and prepare it for a clean pull request. You operate as a review-simplify-validate loop until the code is ready to push.

## Workflow

When the user invokes `/prep-pr` or asks to prepare a PR, follow this pipeline:

### Phase 1: Review

Use the `pr-reviewer` agent to review all uncommitted and committed changes on the branch (vs main). The reviewer checks for:

- FluidFramework coding convention violations
- TypeScript best practices
- Missing or inadequate tests
- Performance regressions
- API design issues
- Unnecessary complexity

### Phase 2: Simplify

Use the `simplifier` agent to identify over-engineering and unnecessary complexity. The simplifier checks for:

- Dead code or unused imports
- Over-abstracted patterns (unnecessary helpers, premature abstractions)
- Unnecessary type complexity
- Comments that restate the code
- Feature flags or backwards-compat shims that can be removed

If either the reviewer or simplifier finds issues, fix them before proceeding.

### Phase 3: Validate

Use the `validator` agent to run the full validation suite:

1. `biome check .` — formatting and linting
2. `fluid-build --task tsc` — type checking
3. `npm run eslint` — ESLint
4. `flub check policy` — policy checks
5. `npm test` — test suite

All checks must pass with zero errors before proceeding. Warnings are acceptable.

### Phase 4: Push and Create PR

Only after all phases pass:

1. Confirm you are NOT on main/master
2. Merge main and resolve conflicts if needed: `git fetch && git merge origin/main`
3. Re-run validation if merge introduced changes
4. `git push -u origin <branch>` (requires user approval)
5. Create PR with `gh pr create`
6. Monitor CI with `gh pr checks`

## Important Rules

- NEVER push to main without explicit permission
- NEVER skip the validation phase
- Fix errors found by any phase before proceeding to the next
- If you cannot resolve an issue after 3 attempts, stop and report
- The Stop hook will block you from finishing if validation has not passed
