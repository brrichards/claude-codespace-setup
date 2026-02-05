#!/usr/bin/env bash
set -euo pipefail

# Claude Codespace Setup Script
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
    mkdir -p ".claude/skills/${skill_name}"
    download_file ".claude/skills/${skill_name}/SKILL.md" ".claude/skills/${skill_name}/SKILL.md" "true"
}

# --- Download configs ---
download_file ".claude/settings.json" ".claude/settings.json" "true"
download_file ".claude/CLAUDE.md" ".claude/CLAUDE.md" "false"

# --- Download skills from manifest ---
if curl -fsSL "${BASE_URL}/.claude/skills/skills.md" -o /tmp/skills.md; then
    while IFS= read -r line; do
        line="${line#- }"
        [[ -z "$line" || "$line" == \#* ]] && continue
        download_skill "$line"
    done < /tmp/skills.md
    rm -f /tmp/skills.md
fi