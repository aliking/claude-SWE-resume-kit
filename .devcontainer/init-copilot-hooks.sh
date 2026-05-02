#!/usr/bin/env bash
# Ensures the workspace Copilot PreToolUse hook is present.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_DIR="${REPO_ROOT}/.github/hooks"
HOOK_FILE="${HOOK_DIR}/terminal-devnull-guard.json"
HOOK_SCRIPT="${REPO_ROOT}/scripts/hooks/pretooluse_terminal_policy_guard.js"

mkdir -p "${HOOK_DIR}"

cat > "${HOOK_FILE}" <<'JSON'
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "node ./scripts/hooks/pretooluse_terminal_policy_guard.js",
        "timeout": 10
      }
    ]
  }
}
JSON

if [[ ! -f "${HOOK_SCRIPT}" ]]; then
  echo "init-copilot-hooks: missing hook script ${HOOK_SCRIPT}" >&2
  exit 1
fi

echo "init-copilot-hooks: ensured ${HOOK_FILE}"
