---
description: Manage skillsets — list, add, or remove groups of skills and agents
---

Run the skillsets CLI to handle this request.

**If no arguments were provided**, run:
```
npx tsx .claude/skillsets/skillsets.ts list
```

**If arguments were provided** (`$ARGUMENTS`), run:
```
npx tsx .claude/skillsets/skillsets.ts $ARGUMENTS
```

## Output rules

- Show ONLY the command's stdout/stderr output to the user. Do NOT add any extra commentary, explanation, or formatting around it.
- If the output contains "not found in repo", stop immediately. Do NOT try alternative names, do NOT suggest corrections, do NOT troubleshoot.
- Do NOT describe what the command did or summarize its output — just show it verbatim.
