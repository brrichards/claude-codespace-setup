---
description: Pin or unpin individual skills and agents
---

You manage individual skill and agent pinning. Pinned items persist across skillset switches.

## State File

Read `.claude/skillsets/active.json` which has this structure:
```json
{
  "activeSkillset": "name-or-null",
  "skillsetItems": ["items-from-active-skillset"],
  "pinned": ["individually-pinned-items"]
}
```

## Config Files

Read `.claude/skillsets/.setupRepo` for the GitHub repo (default: `brrichards/claude-codespace-setup`).
Read `.claude/skillsets/.setupRef` for the git ref (default: `main`).

## Commands

### `/skills` or `/skills list`

1. Read `active.json`
2. Display:
   - **Pinned items:** list each pinned item, or "(none)"
   - **Active skillset:** name or "(none)"
   - **Skillset items:** list or "(none)"

### `/skills add <name>`

1. Read the repo and ref from config files
2. Use `gh api` to check if the item exists as a skill or agent:
   - Skill: `gh api repos/{repo}/contents/.claude/skills/{name}/SKILL.md?ref={ref}`
   - Agent: `gh api repos/{repo}/contents/.claude/agents/{name}.md?ref={ref}`
3. If found as a skill:
   - Create directory `.claude/skills/{name}/`
   - Download the content (the `content` field from the API response is base64-encoded, decode it)
   - Write to `.claude/skills/{name}/SKILL.md`
4. If found as an agent:
   - Create directory `.claude/agents/` if needed
   - Download and decode the content
   - Write to `.claude/agents/{name}.md`
5. If not found as either, report error
6. Add `name` to the `pinned` array in `active.json` (if not already there)
7. Save `active.json`
8. Report success

### `/skills remove <name>`

1. Read `active.json`
2. Remove `name` from `pinned` array
3. If `name` is NOT in `skillsetItems` (it's not part of the active skillset):
   - Delete `.claude/skills/{name}/` directory (if exists)
   - Delete `.claude/agents/{name}.md` file (if exists)
   - Report: "Removed and deleted {name}"
4. If `name` IS in `skillsetItems` (it came from the skillset):
   - Only unpin it (don't delete the files since the skillset provides them)
   - Report: "Unpinned {name} (files kept — provided by active skillset)"
5. Save `active.json`

## Important Notes
- Always read the state file fresh before making changes
- When writing `active.json`, preserve all fields and only modify what's needed
- Use `gh api` for GitHub API access (it handles authentication automatically in Codespaces)
