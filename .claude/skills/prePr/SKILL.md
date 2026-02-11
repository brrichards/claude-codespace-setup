# Skill: Pre-PR Pipeline

Run the full review pipeline before opening a pull request.

## When to Use
- Before opening a pull request
- When you want a comprehensive check of all changes on the current branch
- As a final quality gate before requesting review

## Steps

1. **Determine changes to review**
   - If there are staged changes (`git diff --cached`), review those
   - Otherwise, review branch changes vs main (`git diff main...HEAD`)
   - List all changed files for reference

2. **Run the reviewer skill**
   Read and follow `.claude/skills/reviewer/SKILL.md` on all changed files. Check for:
   - Accidental debug code
   - Credentials or secrets
   - Unresolved TODO/FIXME/HACK comments
   - Logic errors or typos
   - Large files that shouldn't be committed

3. **Run the simplifier skill**
   Read and follow `.claude/skills/simplifier/SKILL.md` on all changed files. Check for:
   - Unnecessary complexity
   - Deeply nested logic
   - Long functions
   - Repeated patterns
   - Dead code

4. **Collect and present findings**
   Present a unified summary with two sections:

   **Review Issues**
   - List each issue found by the reviewer pass
   - Include file name and line number where possible

   **Simplification Opportunities**
   - List each opportunity found by the simplifier pass
   - Include file name and specific suggestion

5. **Clean result**
   If no issues found in either pass, say "Pipeline clean — ready for PR."
