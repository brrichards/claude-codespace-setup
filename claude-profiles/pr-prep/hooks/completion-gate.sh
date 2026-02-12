#!/usr/bin/env bash
# Stop hook: blocks session completion if validation errors exist.
# Checks that recent conversation shows no unresolved build/test/lint errors.
# Exit 0 with JSON output to control blocking behavior.
# Only blocks on errors, not warnings.
set -euo pipefail

INPUT="$(cat)"

# Extract the transcript path from hook input
TRANSCRIPT_PATH="$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('transcript_path', ''))
" 2>/dev/null)" || TRANSCRIPT_PATH=""

# If no transcript available, allow completion
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
	echo '{"decision": "allow"}'
	exit 0
fi

# Check the last 100 lines of transcript for error indicators
TAIL="$(tail -100 "$TRANSCRIPT_PATH" 2>/dev/null)" || TAIL=""

HAS_ERRORS=false
ERROR_REASONS=""

# Check for common error patterns in recent output
if echo "$TAIL" | grep -qi "FAIL.*error\|error.*FAIL\|Build failed\|tsc.*error TS\|ESLint.*[0-9]\+ error\|policy.*violation\|[0-9]\+ tests\? failed\|FAILURES\|NOT READY"; then
	# Verify it's not just a "fixed" or "resolved" mention
	if ! echo "$TAIL" | tail -20 | grep -qi "all.*pass\|READY\|0 error\|no error\|fixed\|resolved"; then
		HAS_ERRORS=true
		ERROR_REASONS="Recent transcript contains unresolved errors (build, lint, test, or policy failures)."
	fi
fi

if [ "$HAS_ERRORS" = true ]; then
	cat <<EOF
{"decision": "block", "reason": "$ERROR_REASONS Fix all errors before completing."}
EOF
else
	echo '{"decision": "allow"}'
fi

exit 0
