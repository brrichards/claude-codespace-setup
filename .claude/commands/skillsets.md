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

Show the output to the user. If the command fails, check that `tsx` is available (`npx tsx --version`) and that the skillsets files exist.
