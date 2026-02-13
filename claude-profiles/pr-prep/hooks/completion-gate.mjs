#!/usr/bin/env node
// Stop hook: blocks session completion if validation errors exist.
// Checks that recent conversation shows no unresolved build/test/lint errors.
// Exit 0 with JSON output to control blocking behavior.
// Only blocks on errors, not warnings.

import fs from "node:fs";

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

const transcriptPath = input?.transcript_path || "";

// If no transcript available, allow completion
if (!transcriptPath || !fs.existsSync(transcriptPath)) {
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

// Read transcript and check last 100 lines
let lines;
try {
  const content = fs.readFileSync(transcriptPath, "utf8");
  lines = content.split("\n");
} catch {
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

const tail100 = lines.slice(-100).join("\n");

// Check for common error patterns in recent output
const errorPattern =
  /FAIL.*error|error.*FAIL|Build failed|tsc.*error TS|ESLint.*\d+ error|policy.*violation|\d+ tests? failed|FAILURES|NOT READY/i;

let hasErrors = false;

if (errorPattern.test(tail100)) {
  // Verify it's not just a "fixed" or "resolved" mention in the last 20 lines
  const tail20 = lines.slice(-20).join("\n");
  const resolvedPattern =
    /all.*pass|READY|0 error|no error|fixed|resolved/i;

  if (!resolvedPattern.test(tail20)) {
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log(
    JSON.stringify({
      decision: "block",
      reason:
        "Recent transcript contains unresolved errors (build, lint, test, or policy failures). Fix all errors before completing.",
    })
  );
} else {
  console.log(JSON.stringify({ decision: "allow" }));
}

process.exit(0);
