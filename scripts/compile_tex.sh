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
