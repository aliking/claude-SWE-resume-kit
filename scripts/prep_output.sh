#!/usr/bin/env bash
# prep_output.sh - opinionated setup for output/<FolderName>.
#
# Usage:
#   bash scripts/prep_output.sh <FolderName>

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: prep_output.sh <FolderName>" >&2
  exit 2
fi

FOLDER_NAME="$1"

if [[ -z "$FOLDER_NAME" ]]; then
  echo "prep_output: ERROR: FolderName must be non-empty." >&2
  exit 1
fi

# Opinionated: accept only a simple folder name (no path separators).
if [[ "$FOLDER_NAME" == */* ]]; then
  echo "prep_output: ERROR: Provide only a folder name, not a path." >&2
  echo "  Example: prep_output.sh Bloomberg" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="$REPO_ROOT/output/$FOLDER_NAME"

mkdir -p "$TARGET_DIR"

echo "prep_output: OK - created output/$FOLDER_NAME"
