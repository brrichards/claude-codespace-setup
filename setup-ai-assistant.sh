#!/usr/bin/env bash
set -euo pipefail

# Claude Codespace Setup Script
#
# Environment Variables:
#   claudeSetupRepo - GitHub repo to fetch configs from (default: brrichards/claude-codespace-setup)
#   claudeSetupRef  - Git ref (branch/tag) to use (default: main)

claudeSetupRepo="${claudeSetupRepo:-brrichards/claude-codespace-setup}"
claudeSetupRef="${claudeSetupRef:-brrichards/skillsets-skeleton}"
baseUrl="https://raw.githubusercontent.com/${claudeSetupRepo}/${claudeSetupRef}"

# --- Install Claude Code ---
curl -fsSL https://claude.ai/install.sh | bash || true

if ! command -v claude &> /dev/null; then
    exit 0
fi

# --- Create directories ---
mkdir -p .claude/skills
mkdir -p .claude/skillsets
mkdir -p .claude/commands
mkdir -p .claude/agents

# --- Download helpers ---
downloadFile() {
    local remotePath="$1"
    local localPath="$2"
    local overwrite="${3:-true}"

    if [[ "$overwrite" == "false" && -f "$localPath" ]]; then
        return 0
    fi

    curl -fsSL "${baseUrl}/${remotePath}" -o "$localPath" || true
}

downloadSkill() {
    local skillName="$1"
    mkdir -p ".claude/skills/${skillName}"
    downloadFile ".claude/skills/${skillName}/SKILL.md" ".claude/skills/${skillName}/SKILL.md" "true"
}

# --- Download configs ---
downloadFile ".claude/settings.json" ".claude/settings.json" "true"
downloadFile ".claude/CLAUDE.md" ".claude/CLAUDE.md" "false"

# --- Persist repo/ref for skillset CLI ---
echo "$claudeSetupRepo" > .claude/skillsets/.setupRepo
echo "$claudeSetupRef" > .claude/skillsets/.setupRef

# --- Download skillsets system ---
downloadFile ".claude/skillsets/skillsets.json" ".claude/skillsets/skillsets.json" "true"
downloadFile ".claude/skillsets/skillsets.ts" ".claude/skillsets/skillsets.ts" "true"
downloadFile ".claude/commands/skillsets.md" ".claude/commands/skillsets.md" "true"
downloadFile ".claude/commands/skills.md" ".claude/commands/skills.md" "true"

# --- Seed active.json (preserve user state across re-runs) ---
downloadFile ".claude/skillsets/active.json" ".claude/skillsets/active.json" "false"

# --- Download skills from manifest ---
if curl -fsSL "${baseUrl}/.claude/skills/skills.md" -o /tmp/skills.md; then
    while IFS= read -r line; do
        line="${line#- }"
        [[ -z "$line" || "$line" == \#* ]] && continue
        downloadSkill "$line"
    done < /tmp/skills.md
    rm -f /tmp/skills.md
fi
