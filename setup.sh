#!/usr/bin/env bash
# setup.sh — Bootstrap Claude Code with ff-profiles.
#
# Installs Claude Code (if not present), clones the ff-profiles repo into the
# current project directory, and applies the default (developer) profile.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/brrichards/ff-profiles/main/setup.sh | bash
#
# Flags (for testing):
#   --local         Skip git clone, use local ff-profiles/ directory
#   --skip-install  Skip Claude Code installation check
#   --target <dir>  Target project directory (default: current directory)
set -euo pipefail

REPO_URL="https://github.com/brrichards/claude-codespace-setup.git"
DEFAULT_PROFILE="developer"

# ── Argument parsing ──

LOCAL_MODE=false
SKIP_INSTALL=false
TARGET="$(pwd)"

while [[ $# -gt 0 ]]; do
	case "$1" in
		--local)
			LOCAL_MODE=true
			shift
			;;
		--skip-install)
			SKIP_INSTALL=true
			shift
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

# ── Step 1: Install Claude Code if needed ──

if [[ "$SKIP_INSTALL" == false ]]; then
	if ! command -v claude &> /dev/null; then
		echo "Installing Claude Code..."
		npm install -g @anthropic-ai/claude-code
	else
		echo "Claude Code already installed."
	fi
fi

# ── Step 2: Get ff-profiles into the project ──

FF_PROFILES_DIR="$TARGET/ff-profiles"

if [[ "$LOCAL_MODE" == false ]]; then
	if [[ -d "$FF_PROFILES_DIR/.git" ]]; then
		echo "Updating ff-profiles..."
		git -C "$FF_PROFILES_DIR" pull --quiet
	else
		echo "Cloning ff-profiles..."
		git clone --quiet "$REPO_URL" "$FF_PROFILES_DIR"
	fi
	# Remove repo-specific CI/workflow files — consumers don't need these
	rm -rf "$FF_PROFILES_DIR/.github"
else
	# Local mode: ff-profiles/ should already exist at the target
	if [[ ! -d "$FF_PROFILES_DIR" ]]; then
		echo "Error: --local specified but $FF_PROFILES_DIR does not exist." >&2
		exit 1
	fi
fi

# ── Step 3: Apply default profile ──

bash "$FF_PROFILES_DIR/scripts/swap-profile.sh" swap "$DEFAULT_PROFILE" \
	--repo-root "$FF_PROFILES_DIR" \
	--target "$TARGET"
