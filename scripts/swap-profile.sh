#!/usr/bin/env bash
# swap-profile.sh — List and swap Claude Code profiles.
#
# Usage:
#   swap-profile.sh list   [--repo-root <path>]
#   swap-profile.sh swap <name> [--repo-root <path>] [--target <path>]
#   swap-profile.sh help
set -euo pipefail

# ── Argument parsing ──

COMMAND=""
PROFILE_NAME=""
REPO_ROOT=""
TARGET=""

while [[ $# -gt 0 ]]; do
	case "$1" in
		list|swap|help)
			COMMAND="$1"
			shift
			# If swap, next positional arg (if not a flag) is the profile name
			if [[ "$COMMAND" == "swap" && $# -gt 0 && "$1" != --* ]]; then
				PROFILE_NAME="$1"
				shift
			fi
			;;
		--repo-root)
			REPO_ROOT="$2"
			shift 2
			;;
		--target)
			TARGET="$2"
			shift 2
			;;
		*)
			shift
			;;
	esac
done

# Resolve repo root: default to the parent of the scripts/ directory
if [[ -z "$REPO_ROOT" ]]; then
	REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

PROFILES_DIR="$REPO_ROOT/claude-profiles"
COMMANDS_DIR="$REPO_ROOT/commands"

# ── Subcommands ──

cmd_list() {
	if [[ ! -d "$PROFILES_DIR" ]]; then
		echo "Error: No claude-profiles/ directory found at $PROFILES_DIR" >&2
		exit 1
	fi

	echo "Available profiles:"
	echo ""

	for profile_dir in "$PROFILES_DIR"/*/; do
		[[ -d "$profile_dir" ]] || continue
		local name
		name="$(basename "$profile_dir")"
		local description="(no description)"

		if [[ -f "$profile_dir/profile.json" ]]; then
			# Extract description using lightweight parsing (no jq dependency)
			description="$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' "$profile_dir/profile.json" | head -1 | sed 's/.*:[[:space:]]*"\(.*\)"/\1/')" || description="(no description)"
		fi

		printf "  %-20s %s\n" "$name" "$description"
	done
	echo ""
}

cmd_swap() {
	if [[ -z "$PROFILE_NAME" ]]; then
		echo "Error: Profile name required. Usage: swap-profile.sh swap <name>" >&2
		exit 1
	fi

	local profile_dir="$PROFILES_DIR/$PROFILE_NAME"

	if [[ ! -d "$profile_dir" ]]; then
		echo "Error: Profile \"$PROFILE_NAME\" not found." >&2
		echo "Available profiles:" >&2
		for d in "$PROFILES_DIR"/*/; do
			[[ -d "$d" ]] && echo "  $(basename "$d")" >&2
		done
		exit 1
	fi

	# Resolve target directory
	if [[ -z "$TARGET" ]]; then
		# Default: parent of the repo root (ff-profiles/ lives inside the project)
		TARGET="$(cd "$REPO_ROOT/.." && pwd)"
	fi

	local target_claude_dir="$TARGET/.claude"

	# Remove existing .claude/ directory
	if [[ -d "$target_claude_dir" ]]; then
		rm -rf "$target_claude_dir"
	fi

	# Copy profile to .claude/
	cp -r "$profile_dir" "$target_claude_dir"

	# Inject /profiles command so it's always available
	mkdir -p "$target_claude_dir/commands"
	if [[ -f "$COMMANDS_DIR/profiles.md" ]]; then
		cp "$COMMANDS_DIR/profiles.md" "$target_claude_dir/commands/profiles.md"
	fi

	echo "Profile \"$PROFILE_NAME\" applied to $TARGET"
}

cmd_help() {
	cat <<'EOF'
Usage: swap-profile.sh <command> [options]

Commands:
  list                List available profiles
  swap <name>         Apply a profile to the target directory
  help                Show this help message

Options:
  --repo-root <path>  Path to the ff-profiles repo (default: auto-detected)
  --target <path>     Target project directory (default: parent of repo root)

Examples:
  swap-profile.sh list
  swap-profile.sh swap developer
  swap-profile.sh swap minimal --target /path/to/project
EOF
}

# ── Dispatch ──

case "${COMMAND:-help}" in
	list) cmd_list ;;
	swap) cmd_swap ;;
	help) cmd_help ;;
	*)
		echo "Error: Unknown command: $COMMAND" >&2
		cmd_help >&2
		exit 1
		;;
esac
