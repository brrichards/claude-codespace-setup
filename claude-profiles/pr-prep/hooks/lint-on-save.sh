#!/usr/bin/env bash
# PostToolUse hook: auto-format files after Edit/Write operations.
# Runs biome on the changed file if biome is available.
# Exit 0 = success (non-blocking feedback).
set -euo pipefail

# Read tool input from stdin
INPUT="$(cat)"

# Extract the file path from the tool input
FILE_PATH="$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
# Edit and Write tools use 'file_path'
print(tool_input.get('file_path', ''))
" 2>/dev/null)" || FILE_PATH=""

# Skip if no file path or file doesn't exist
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
	exit 0
fi

# Only format known file types
case "$FILE_PATH" in
	*.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md)
		;;
	*)
		exit 0
		;;
esac

# Run biome if available
if command -v biome &>/dev/null; then
	biome check --write "$FILE_PATH" 2>/dev/null || true
elif command -v npx &>/dev/null; then
	npx biome check --write "$FILE_PATH" 2>/dev/null || true
fi

exit 0
