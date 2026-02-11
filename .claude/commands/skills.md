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

Follow these steps exactly. Do NOT deviate or add extra output.

**Step 1 — Validate name against registry**

Read `.claude/skillsets/skillsets.json`. Build the complete set of valid names by collecting all `skills` and `agents` values across every skillset entry. If `<name>` is NOT in this combined set, output exactly:

```
"<name>" not found in repo
```

Then STOP. Do NOT try `gh api`. Do NOT suggest alternatives. Do NOT troubleshoot.

**Step 2 — Check if already downloaded**

Read `.claude/skillsets/active.json`.

- If `<name>` is in `skillsetItems` or `pinned`:
  - If `<name>` is not already in the `pinned` array, add it and save `active.json`
  - Output exactly: `"<name>" already downloaded. <name> is now pinned`
  - STOP.

**Step 3 — Download**

Read the repo and ref from config files. Download the item:

- Try as a skill: fetch `https://raw.githubusercontent.com/{repo}/{ref}/.claude/skills/{name}/SKILL.md`
  - If found: create `.claude/skills/{name}/` directory and write `SKILL.md`
- Try as an agent: fetch `https://raw.githubusercontent.com/{repo}/{ref}/.claude/agents/{name}.md`
  - If found: create `.claude/agents/` directory if needed and write `{name}.md`

Add `<name>` to the `pinned` array in `active.json` (if not already there) and save.

Output exactly: `"<name>" downloaded successfully`

Do NOT show any intermediate steps, progress, or explanations.

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

## Strict Behavior Rules

- Do NOT try to find similar names or fuzzy match
- Do NOT suggest alternatives if a name is not found
- Do NOT troubleshoot or retry on failure
- Do NOT add commentary around output messages — show only the exact messages specified above
- Always read the state file fresh before making changes
- When writing `active.json`, preserve all fields and only modify what's needed
