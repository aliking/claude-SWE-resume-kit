#!/usr/bin/env bash
# check_pdf_fill.sh — Assess last-page fill of a compiled resume PDF.
#
# Called via safe-run.sh to avoid VS Code permission prompts on compound
# pdftotext commands that include pipes or flags.
#
# Usage (via safe-run.sh):
#   bash scripts/safe-run.sh scripts/check_pdf_fill.sh output/Foo/e2e_foo_resume.pdf
#
# Output:
#   - Page count and which page is being assessed
#   - Non-blank line count on last page
#   - Trailing blank line count
#   - PASS / WARN / FAIL verdict
#
# Thresholds (trailing blank lines on last page):
#   PASS <= 3  |  WARN 4-8  |  FAIL > 8
#
# Note: line counts are from pdftotext -layout output, which approximates
# visual page fill well but is not pixel-exact. Treat WARN as "check visually."

set -euo pipefail

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------

if [[ $# -ne 1 ]]; then
  echo "Usage: check_pdf_fill.sh <pdf_file>" >&2
  exit 2
fi

PDF_FILE="$1"

if [[ ! -f "$PDF_FILE" ]]; then
  echo "check_pdf_fill: File not found: $PDF_FILE" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

PASS_MAX=3
WARN_MAX=8

# ---------------------------------------------------------------------------
# Get page count via pdfinfo
# ---------------------------------------------------------------------------

PAGES=$(pdfinfo "$PDF_FILE" | grep "^Pages:" | awk '{print $2}')

# ---------------------------------------------------------------------------
# Extract last page text via pdftotext
# ---------------------------------------------------------------------------

LAST_PAGE_TEXT=$(pdftotext -layout -f "$PAGES" -l "$PAGES" "$PDF_FILE" -)

# ---------------------------------------------------------------------------
# Count trailing blank lines using Python (available in container)
# ---------------------------------------------------------------------------

TRAILING_BLANK=$(echo "$LAST_PAGE_TEXT" | python3 -c "
import sys
lines = sys.stdin.read().rstrip('\n').split('\n')
count = 0
for line in reversed(lines):
    if line.strip() == '':
        count += 1
    else:
        break
print(count)
")

NONBLANK_LINES=$(echo "$LAST_PAGE_TEXT" | python3 -c "
import sys
lines = sys.stdin.read().split('\n')
print(sum(1 for l in lines if l.strip()))
")

# ---------------------------------------------------------------------------
# Verdict
# ---------------------------------------------------------------------------

if [[ "$TRAILING_BLANK" -le "$PASS_MAX" ]]; then
  VERDICT="PASS"
elif [[ "$TRAILING_BLANK" -le "$WARN_MAX" ]]; then
  VERDICT="WARN — check visually; consider adding optional bullets"
else
  VERDICT="FAIL — add bullets or reduce vspace to fill page"
fi

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

echo "PDF:              $PDF_FILE"
echo "Pages:            $PAGES  (assessing page $PAGES)"
echo "Non-blank lines:  $NONBLANK_LINES"
echo "Trailing blank:   $TRAILING_BLANK lines"
echo "Threshold:        PASS <= $PASS_MAX | WARN <= $WARN_MAX | FAIL > $WARN_MAX"
echo "Verdict:          $VERDICT"
