#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: scripts/finalize_resume_outputs.sh <session-file>" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
session_input="$1"

if [[ "$session_input" = /* ]]; then
  session_file="$session_input"
else
  session_file="$repo_root/$session_input"
fi

if [[ ! -f "$session_file" ]]; then
  echo "Session file not found: $session_input" >&2
  exit 1
fi

config_file="$repo_root/config.md"
if [[ ! -f "$config_file" ]]; then
  echo "config.md not found" >&2
  exit 1
fi

name_line="$(grep -m1 '^\- \*\*Name:\*\* ' "$config_file" || true)"
role_line="$(grep -m1 '^\- \*\*Role type:\*\* ' "$session_file" || true)"
folder_line="$(grep -m1 '^\- \*\*Output folder:\*\* ' "$session_file" || true)"

if [[ -z "$name_line" || -z "$role_line" || -z "$folder_line" ]]; then
  echo "Could not parse required metadata from config/session file" >&2
  exit 1
fi

full_name="${name_line#- **Name:** }"
role_type="${role_line#- **Role type:** }"
output_folder_raw="${folder_line#- **Output folder:** }"
output_folder_rel="${output_folder_raw//\`/}"
output_folder_rel="${output_folder_rel%/}"
output_folder="$repo_root/$output_folder_rel"

if [[ ! -d "$output_folder" ]]; then
  echo "Output folder not found: $output_folder" >&2
  exit 1
fi

resume_pdf="$(find "$output_folder" -maxdepth 1 -type f -name 'e2e_*_resume.pdf' | head -n 1)"
cover_pdf="$(find "$output_folder" -maxdepth 1 -type f -name 'e2e_*_cover_letter.pdf' | head -n 1)"

if [[ -z "$resume_pdf" ]]; then
  echo "No generated resume PDF found in $output_folder" >&2
  exit 1
fi

first_name="$(printf '%s' "$full_name" | awk '{print $1}')"
last_name="$(printf '%s' "$full_name" | awk '{print $NF}')"
role_slug="$(printf '%s' "$role_type" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//')"
base="${first_name}_${last_name}_${role_slug}"

resume_target="$output_folder/${base}.pdf"
cover_target="$output_folder/${base}_cover.pdf"

rotate_existing_target() {
  local target="$1"
  local stem="$2"
  local ext="$3"

  if [[ ! -e "$target" ]]; then
    return
  fi

  local n=1
  while [[ -e "$output_folder/${stem}_old_v${n}.${ext}" ]]; do
    ((n++))
  done

  mv "$target" "$output_folder/${stem}_old_v${n}.${ext}"
  echo "Archived: $output_folder/${stem}_old_v${n}.${ext}"
}

rotate_existing_target "$resume_target" "$base" "pdf"
rotate_existing_target "$cover_target" "${base}_cover" "pdf"

cp "$resume_pdf" "$resume_target"
echo "Created: $resume_target"

if [[ -n "$cover_pdf" ]]; then
  cp "$cover_pdf" "$cover_target"
  echo "Created: $cover_target"
fi
