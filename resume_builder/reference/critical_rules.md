# Critical Rules — Compact Re-Read

> Quick reference for Phase 2 generation. Full rules in `resume_reference.md`.

## Character Limits

**Resume (10pt, textwidth=7.5in):**

| Target Lines | Rendered Char Range | HARD MAX | Orphan Threshold |
|-------|---------------|---------|------------------|
| 1 line | 105-111 chars | 117 | -- |
| 2 lines | 189-205 chars | 218 | Last line >= 78 chars |

### Variant Naming

| Variant | Document | Lines | Target Range | HARD MAX | Orphan | Word Target |
|---------|----------|-------|-------------|----------|--------|-------------|
| Resume-1L | 1/2-page resume | 1 | 105-111 | 117 | -- | ~13 words |
| Resume-2L | 2-page resume | 2 | 189-205 | 218 | >= 78 | ~23-25 words |

## Bold Width Penalty

Resume (10pt): Effective limit = 119 - (0.5 x bold_char_count)

## Orphan Rule

Multi-line bullet last rendered line must fill >= 70% of line width.
Resume 2L: last line >= 78 chars.

## FIXED Sections — NEVER Modify

All FIXED sections (internships, education, publications, honors/awards, header block) are set in the template.
NEVER change: \vspace values, \geometry settings, .cls formatting, header layout.
Only modify VARIABLE sections: Summary, Technical Skills, Experience bullets/headers.

## Provenance Flags

See `CLAUDE.md` for your project-specific provenance flags. Common patterns:

| Item Status | Rule |
|-------------|------|
| Under review | State journal name: "under review at [Journal]" |
| Unpublished | No specific numbers or publication claims |
| Internal/proprietary | "infrastructure I developed" — not peer-reviewed |
| Preprint only | Always flag provenance |

## LaTeX Notation Quick-Ref

| Item | Correct LaTeX | Wrong | Rendered |
|------|--------------|-------|----------|
| Chemical formulas | `\ce{H2O}` | `H2O`, `H$_2$O` | H₂O |
| Superscript labels | `X$^2$Y` | `X2Y` | X²Y |
| R² values | `R$^2$=0.99` | `R^2`, `R2` | R² |
| Greek letters | `$\alpha$-phase` | `alpha-phase` | α-phase |
| Approximately | `$\sim$64` | `~64` (LaTeX non-breaking space!) | ~64 |

CRITICAL: ~ in LaTeX = non-breaking space. Use $\sim$ for "approximately."

## KB Corrections

See `CLAUDE.md` for your project-specific KB corrections log. Always check before generation to avoid re-introducing known errors.

## Budget Reminder

Resume: ~20 variable bullets (exact count depends on skills config + immigration line). All resume bullets are 2L.
