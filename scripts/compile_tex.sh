#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: scripts/compile_tex.sh <tex-file> [passes]" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
tex_input="$1"
passes="${2:-2}"

if [[ "$tex_input" = /* ]]; then
  tex_file="$tex_input"
else
  tex_file="$repo_root/$tex_input"
fi

if [[ ! -f "$tex_file" ]]; then
  echo "TeX file not found: $tex_input" >&2
  exit 1
fi

validate_tex_content() {
  local file="$1"
  local failed=0
  local template_file="$repo_root/resume_builder/templates/resume_template.tex"

  extract_section() {
    local src="$1"
    local start_pat="$2"
    local end_pat="$3"
    awk -v start_pat="$start_pat" -v end_pat="$end_pat" '
      $0 ~ start_pat { in_section=1 }
      in_section { print }
      in_section && $0 ~ end_pat { exit }
    ' "$src"
  }

  normalize_section() {
    sed -e 's/\r$//' -e 's/[[:space:]]\+$//' -e '/^[[:space:]]*$/d'
  }

  # Block unresolved template placeholders from ever compiling.
  if rg -n "\\[CONFIG:|\\[GENERATE:|\\[FIXED:" "$file" >/dev/null; then
    echo "compile_tex: ERROR: unresolved template placeholders detected in $file" >&2
    rg -n "\\[CONFIG:|\\[GENERATE:|\\[FIXED:" "$file" >&2
    failed=1
  fi

  # Enforce that Education remains exactly FIXED relative to the template.
  if [[ -f "$template_file" ]] && rg -n "^\\begin\{rSection\}\{Education\}" "$file" >/dev/null; then
    local target_education
    local template_education
    target_education="$(extract_section "$file" '^\\begin\{rSection\}\{Education\}$' '^\\end\{rSection\}$' | normalize_section)"
    template_education="$(extract_section "$template_file" '^\\begin\{rSection\}\{Education\}$' '^\\end\{rSection\}$' | normalize_section)"

    if [[ -z "$template_education" ]]; then
      echo "compile_tex: ERROR: could not locate Education section in template: $template_file" >&2
      failed=1
    elif [[ -z "$target_education" ]]; then
      echo "compile_tex: ERROR: could not locate Education section in target file: $file" >&2
      failed=1
    elif [[ "$target_education" != "$template_education" ]]; then
      echo "compile_tex: ERROR: Education section differs from FIXED template content in $file" >&2
      echo "compile_tex: Education is FIXED and must be copied verbatim from resume_template.tex" >&2
      failed=1
    fi
  fi

  if [[ "$failed" -ne 0 ]]; then
    exit 1
  fi
}

validate_tex_content "$tex_file"

output_dir="$(dirname "$tex_file")"

cd "$repo_root"
export TEXINPUTS="$repo_root/resume_builder/templates:"

for ((pass = 1; pass <= passes; pass++)); do
  pdflatex -interaction=nonstopmode -output-directory="$output_dir" "$tex_file"
done

pdf_file="${tex_file%.tex}.pdf"
if [[ -f "$pdf_file" ]]; then
  echo "Compiled: $pdf_file"
fi
