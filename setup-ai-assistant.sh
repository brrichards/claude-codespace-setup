#!/usr/bin/env bash
set -euo pipefail

# Claude Codespace Setup Script
#
# Usage:
#   ./setup-ai-assistant.sh [skill1 skill2 ...]
#   Default skills from .claude/skills/skills.md are always installed.
#   Additional skills can be provided as arguments.
#
# Environment Variables:
#   CLAUDE_SETUP_REPO - GitHub repo to fetch configs from (default: brrichards/claude-codespace-setup)
#   CLAUDE_SETUP_REF  - Git ref (branch/tag) to use (default: main)

CLAUDE_SETUP_REPO="${CLAUDE_SETUP_REPO:-brrichards/claude-codespace-setup}"
CLAUDE_SETUP_REF="${CLAUDE_SETUP_REF:-main}"
BASE_URL="https://raw.githubusercontent.com/${CLAUDE_SETUP_REPO}/${CLAUDE_SETUP_REF}"

# --- Install Claude Code ---
curl -fsSL https://claude.ai/install.sh | bash || true

if ! command -v claude &> /dev/null; then
    exit 0
fi

# --- Create directories ---
mkdir -p .claude/skills

# --- Download helpers ---
download_file() {
    local remote_path="$1"
    local local_path="$2"
    local overwrite="${3:-true}"

    if [[ "$overwrite" == "false" && -f "$local_path" ]]; then
        return 0
    fi

    curl -fsSL "${BASE_URL}/${remote_path}" -o "$local_path" || true
}

download_skill() {
    local skill_name="$1"
    local skill_dir=".claude/skills/${skill_name}"
    local skill_file="${skill_dir}/SKILL.md"

    mkdir -p "$skill_dir"

    echo "Downloading skill: ${skill_name}..."
    download_file "$skill_file" "$skill_file" "true"
    echo "Successfully downloaded skill: ${skill_name}"
}

# --- Download configs ---
download_file ".claude/settings.json" ".claude/settings.json" "true"
download_file ".claude/CLAUDE.md" ".claude/CLAUDE.md" "false"

# --- Download skills ---
# Always download default skills from manifest
echo "Downloading default skills from manifest..."
TMP_DIR="/tmp/gh-aw/agent"
SKILLS_TMP_FILE="${TMP_DIR}/skills.md"

mkdir -p "$TMP_DIR"
if curl -fsSL "${BASE_URL}/.claude/skills/skills.md" -o "$SKILLS_TMP_FILE"; then
    while IFS= read -r line; do
        line="${line#- }"
        [[ -z "$line" || "$line" == \#* ]] && continue
        download_skill "$line" || true
    done < "$SKILLS_TMP_FILE"
    rm -f "$SKILLS_TMP_FILE"
fi

# Download additional skills from arguments if provided
if [[ $# -gt 0 ]]; then
    echo "Downloading ${#} additional skill(s) from arguments..."
    for skill_name in "$@"; do
        download_skill "$skill_name" || true
    done
fi