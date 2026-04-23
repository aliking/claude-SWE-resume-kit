#!/usr/bin/env bash
# Regenerates .devcontainer/claude-settings.json from the policy in devcontainer.json,
# then copies it into the Claude config directory if the bind-mount is absent.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_DIR="${HOME}/.claude"
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"

# Always regenerate the source file so it stays in sync with devcontainer.json
node "${REPO_ROOT}/scripts/generate_claude_settings.js"

# Copy into place only if the bind-mount hasn't already put it there
if [[ ! -f "${SETTINGS_FILE}" ]]; then
  mkdir -p "${CLAUDE_DIR}"
  cp "${REPO_ROOT}/.devcontainer/claude-settings.json" "${SETTINGS_FILE}"
  echo "init-claude-permissions: Installed settings to ${SETTINGS_FILE}"
fi
