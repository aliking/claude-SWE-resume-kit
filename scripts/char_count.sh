#!/usr/bin/env bash
# char_count.sh — Wrapper for resume_builder/helpers/char_count.py
#
# Called via safe-run.sh so the agent can execute char count checks
# without triggering VS Code permission prompts on the raw python3 command.
#
# Usage (via safe-run.sh):
#   bash scripts/safe-run.sh scripts/char_count.sh -f resume output/Foo/e2e_foo_resume.tex
#   bash scripts/safe-run.sh scripts/char_count.sh -f resume output/Foo/e2e_foo_resume.tex
#
# All arguments are forwarded directly to char_count.py.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

python3 "$repo_root/resume_builder/helpers/char_count.py" "$@"
