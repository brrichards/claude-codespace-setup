#!/usr/bin/env bash
# Outputs branch context for the prep-pr command.
# Handles missing main/origin refs gracefully.
set -euo pipefail

MODE="${1:-summary}"

# Find base ref
BASE=""
if git rev-parse --verify origin/main >/dev/null 2>&1; then
	BASE="origin/main"
elif git rev-parse --verify main >/dev/null 2>&1; then
	BASE="main"
elif git rev-parse --verify origin/master >/dev/null 2>&1; then
	BASE="origin/master"
elif git rev-parse --verify master >/dev/null 2>&1; then
	BASE="master"
fi

case "$MODE" in
	commits)
		if [ -n "$BASE" ]; then
			git log "$BASE..HEAD" --oneline 2>/dev/null || echo "(no commits ahead of $BASE)"
		else
			git log --oneline -10 2>/dev/null || echo "(no base branch found)"
		fi
		;;
	files)
		if [ -n "$BASE" ]; then
			git diff "$BASE...HEAD" --name-only 2>/dev/null || echo "(no changes vs $BASE)"
		else
			git diff --name-only HEAD~10 2>/dev/null || echo "(no base branch found)"
		fi
		;;
	*)
		echo "Branch: $(git branch --show-current 2>/dev/null || echo unknown)"
		echo "Base: ${BASE:-none detected}"
		;;
esac
