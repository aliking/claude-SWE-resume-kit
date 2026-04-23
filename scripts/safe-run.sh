#!/usr/bin/env bash
# safe-run.sh — Execute a script in ./scripts/ only if it matches the main branch.
#
# Protects against an agent editing a local script and then running it without
# human review: any script whose content differs from the main branch is refused.
#
# Usage:
#   bash scripts/safe-run.sh scripts/<name>.sh [args...]
#
# Environment:
#   SAFE_RUN_MAIN_BRANCH  — override the reference branch name (default: main)
#
# Exit codes:
#   0  Script ran successfully
#   1  Security or validation check failed (see stderr)
#   2  Bad usage

set -euo pipefail

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]]; then
  echo "Usage: safe-run.sh scripts/<name>.sh [args...]" >&2
  exit 2
fi

SCRIPT_ARG="$1"
shift

# ---------------------------------------------------------------------------
# Locate repo root via git
# ---------------------------------------------------------------------------

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "safe-run: ERROR: Not inside a git repository." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Resolve and validate script path
# ---------------------------------------------------------------------------

if [[ "$SCRIPT_ARG" = /* ]]; then
  SCRIPT_ABS="$SCRIPT_ARG"
else
  SCRIPT_ABS="$REPO_ROOT/$SCRIPT_ARG"
fi

REL_PATH="$(realpath --relative-to="$REPO_ROOT" "$SCRIPT_ABS" 2>/dev/null || echo "$SCRIPT_ARG")"

# Must reside under scripts/
if [[ "$REL_PATH" != scripts/* ]]; then
  echo "safe-run: ERROR: Only scripts under ./scripts/ are permitted." >&2
  echo "  Requested: $REL_PATH" >&2
  exit 1
fi

if [[ ! -f "$SCRIPT_ABS" ]]; then
  echo "safe-run: ERROR: Script not found: $SCRIPT_ABS" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Verify content matches main branch
# ---------------------------------------------------------------------------

MAIN_BRANCH="${SAFE_RUN_MAIN_BRANCH:-main}"

# Script must exist on main (not a local-only addition)
if ! git -C "$REPO_ROOT" cat-file -e "${MAIN_BRANCH}:${REL_PATH}" 2>/dev/null; then
  echo "safe-run: ERROR: '$REL_PATH' does not exist on branch '$MAIN_BRANCH'." >&2
  echo "  Scripts must be merged to $MAIN_BRANCH before safe-run will execute them." >&2
  exit 1
fi

# Compare working-tree content to main branch content (catches staged,
# committed-but-not-merged, and dirty working-tree changes alike)
MAIN_CONTENT="$(git -C "$REPO_ROOT" show "${MAIN_BRANCH}:${REL_PATH}" 2>/dev/null)"
CURRENT_CONTENT="$(cat "$SCRIPT_ABS")"

if [[ "$MAIN_CONTENT" != "$CURRENT_CONTENT" ]]; then
  echo "safe-run: ERROR: '$REL_PATH' differs from '$MAIN_BRANCH'." >&2
  echo "  Merge your changes to $MAIN_BRANCH before running via safe-run." >&2
  echo "" >&2
  git -C "$REPO_ROOT" diff "${MAIN_BRANCH}" -- "$REL_PATH" >&2 || true
  exit 1
fi

# ---------------------------------------------------------------------------
# Safe to run
# ---------------------------------------------------------------------------

echo "safe-run: OK — '$REL_PATH' matches $MAIN_BRANCH." >&2
exec bash "$SCRIPT_ABS" "$@"
