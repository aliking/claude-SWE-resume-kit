---
name: setup-build-kb
description: Synthesize completed extractions into the knowledge base files needed for resume generation
user-invocable: true
---

# /setup-build-kb

**User input:** `$ARGUMENTS`

Parse `$ARGUMENTS`:
- Empty → full build (all phases)
- Phase number (e.g., `3`) → resume from that phase
- "experience" / "bundles" / "skills" / "evidence" / "reframing" / "significance" → run only that component
- "status" → show what's built and what's missing

---

## Startup

1. Read `CLAUDE.md` — check KB Corrections Log
2. Read `config.md` — load:
   - Personal Info (positions, employers, dates)
   - Role Types table (defines which bundles to create)
   - Provenance Flags (propagate to all KB files)
   - Document Preferences (bullet variant defaults)
3. Read `knowledge_base/extractions/_INVENTORY.md` — verify extractions exist
4. Scan `resume_builder/` to see what's already built

**Pre-flight check:**
- If `_INVENTORY.md` is empty or has no entries: "No extractions found. Run `/setup-extract` first." Stop.
- If fewer than 2 extractions: warn "Only [N] extraction(s) found. KB quality improves with more work items. Continue anyway?"

Progress: "Found [N] extractions across [M] positions. Config has [K] role types defined."

---

## Phase 1: Build Experience Files

**Goal:** Create one experience file per position, containing both technical and non-technical achievements organized for resume generation.

**Read:** All extraction files listed in `_INVENTORY.md`

**For each position** (from `config.md` or inferred from extraction metadata):

1. Group extractions by the position they belong to (based on dates, company, team, or user clarification)
2. Ask the user to confirm grouping if ambiguous: "I've grouped these items under [Position]. Correct?"

**Experience file format** (`resume_builder/experience/experience_<position_key>.md`):

```markdown
# Experience: [Position Title] — [Company]
## [Date Range]

### Cross-Position Section
[Brief narrative connecting this position's work to the user's broader career]
[CL framing content — how this position fits the career arc]

---

### Achievement [ID]: [Short Title]
**Source:** [extraction filename]
**Type:** [technical-project | internal-tool | leadership-initiative | culture-program | hiring/onboarding | process-improvement | mixed]
**Work item:** [project name, initiative name, or "internal program"]
**User's role:** [lead developer / key contributor / mentor / organizer / interviewer / program owner]
**Status:** [deployed / internal / open source / prototype | recurring initiative]

**Context:** [1-2 sentences — what problem, why it matters]

**Impact area:** [product | reliability | team effectiveness | hiring | onboarding | culture | customer experience | cross-functional execution]

**Bullet variants:**
- **2L:** [Full 2-line bullet text — STAR format, ~180-210 rendered characters]
- **3L:** [Full 3-line bullet text — for long-form variants, ~270-310 rendered characters]
- **1L:** [Condensed 1-line version — ~90-110 rendered characters, for tight budgets]

**Key skills:** [comma-separated list of skills this achievement demonstrates]
**Core competencies:** [ownership, mentoring, recruiting, stakeholder management, process design, operational excellence, etc.]
**ATS keywords:** [domain-specific terms an ATS might scan for]
**Reframing notes:** [how to emphasize different aspects for different role types]

---
[Repeat for each achievement]
```

### >>>>>> MANDATORY STOP — DO NOT PROCEED <<<<<<
Present the experience file(s) — show achievement count per position, total bullet variants.
Ask user to review: "Are the groupings correct? Any achievements or non-technical contributions missing or misattributed?"
**You MUST wait for the user's explicit text response before continuing.**

---

## Phase 2: Build Skills Taxonomy

**Goal:** Create a categorized inventory of both technical skills and non-technical differentiators from extractions.

**Read:** All extraction files (Technical Surface + Non-Technical Surface sections) + experience files from Phase 1

**Build** `resume_builder/support/skills_taxonomy.md`:

```markdown
# Skills Taxonomy

## Summary Stats
- Total unique skills: [N]
- Total non-technical signals: [N]
- Top themes: [ranked list]

## Categories

### [Category 1: e.g., Languages & Frameworks]
| Skill | Proficiency | Evidence | Resume Weight |
|-------|-----------|----------|---------------|
| [skill] | [expert/proficient/familiar] | [achievement IDs or extraction files] | [HIGH/MED/LOW] |

### [Category 2: e.g., Cloud, Data & Operations]
[same table format]

### [Category 3: e.g., Leadership, Mentorship & Collaboration]
[same table format]

### [Category 4: e.g., Hiring, Onboarding & Culture]
[same table format]

[Continue for all categories — typically 4-7 categories]
```

**Proficiency levels:**
- **Expert:** Repeatedly owned and delivered independently; can set direction or teach others
- **Proficient:** Used effectively across multiple projects or initiatives; can operate without supervision
- **Familiar:** Used in a limited scope, or contributed under guidance

Progress: "Built taxonomy — [N] skills across [M] categories"

---

## Phase 3: Build Evidence Index

**Goal:** Structured evidence data for resume generation, including technical, leadership, and culture contributions.

**Build** `resume_builder/support/evidence_index.md`:

```markdown
# Evidence Index

## Summary
- Total work items: [N]
- Technical projects: [N] | Internal tools: [N] | Leadership/culture/process items: [N]
- Deployed: [N] | Internal: [N] | Open source: [N] | Recurring initiatives: [N]

## Evidence List

### Core Delivery Work
| # | Work Item | Type | Position | Status | Primary Theme |
|---|-----------|------|----------|--------|---------------|
| 1 | [project/initiative] | [type] | [position] | [status] | [theme] |

### Leadership, Mentorship & Culture
[same table format]

### External or Optional Evidence
[same table format, with provenance notes for open source, talks, publications, or certifications when applicable]
```

Progress: "Evidence index — [N] technical items, [M] leadership/culture items, [K] external items"

### Also build canonical leadership/volunteering section data

**Build** `resume_builder/support/leadership_volunteering.md` from leadership/community/representation extractions that are safe for external use.

Required fields per entry:
- Organization
- Dates
- Role line
- Concise contribution text
- Source extraction filename
- Claim safety flag

This file is used as the canonical source for fixed `Leadership \& Volunteering` resume content.

---

## Phase 4: Build Achievement Reframing Guide

**Goal:** Per-achievement significance lines + framing directives for each role type.

**Read:** Experience files + `config.md` Role Types

**Build** `resume_builder/support/achievement_reframing_guide.md`:

```markdown
# Achievement Reframing Guide

## How to Use
For each achievement, `Significance:` provides a one-line framing cue.
The role-type table shows how to emphasize/de-emphasize for each target audience.

---

### [Achievement ID]: [Title]
**Significance:** [One sentence — why this matters broadly]

| Role Type | Emphasis | Lead Verb | Framing Angle |
|-----------|----------|-----------|---------------|
| [role 1] | HIGH | Developed | [emphasize X aspect] |
| [role 2] | MEDIUM | Applied | [bridge to Y domain] |
| [role 3] | LOW | -- | [omit or condense] |

**Overclaiming warning:** [if applicable — e.g., "Do not claim sole credit for experimental results"]
**First-pass checklist:** [ ] Verb matches contribution role [ ] Numbers or outcomes trace to source [ ] Status matches provenance

---
[Repeat for each achievement]
```

### >>>>>> MANDATORY STOP — DO NOT PROCEED <<<<<<
Present the reframing guide summary — show which achievements are HIGH for which role types.
Ask user: "Does this priority mapping look right for your target roles?"
**You MUST wait for the user's explicit text response before continuing.**

---

## Phase 5: Build Bundles

**Goal:** One bundle per role type from `config.md`, with 5 sections each.

**Read:** Experience files + Skills Taxonomy + Reframing Guide + Evidence Index + `config.md` Role Types

**For each role type**, create `resume_builder/bundles/bundle_<role_type>.md`:

```markdown
# Bundle: [Role Type Name]

> Target employers: [from config.md]
> Tier: [from config.md]

---

## S1: Role Profile & Priority Matrix

**Positioning:** [1-2 sentences — how to position the user for this role type]

### Priority Matrix
| Priority | Achievement IDs | Rationale |
|----------|----------------|-----------|
| HIGH | [IDs] | [why these lead for this role type] |
| MEDIUM | [IDs] | [supporting evidence, bridge topics] |
| LOW | [IDs] | [omit unless budget allows or JD specifically asks] |

---

## S2: Summary Guide

**Headline pattern:** [Role-appropriate headline template]
**Building blocks:** [3-5 phrases that should appear in summaries for this role type]
**Avoid:** [terms/framings that don't fit this audience]

---

## S3: Achievement Reframing Map

[For each HIGH/MEDIUM achievement: which angle to use, which metrics to lead with]

| ID | Default Framing | This Role's Framing | Key Metric |
|----|----------------|--------------------|-----------|
| [ID] | [generic] | [role-specific angle] | [number to highlight] |

---

## S4: Skills Guide

**Bold tools (resume):** [3-5 tools to bold in Skills for this role type]
**Must-include skills:** [skills and capabilities that MUST appear for ATS match]
**Nice-to-have:** [skills or leadership signals to include if budget allows]
**Omit:** [skills or culture items irrelevant to this audience]

---

## S5: Cover Letter Guide

**Institution type:** [Product/Startup / Enterprise/Platform / Mission-driven]
**Opening hook pattern:** [template for first paragraph opener]
**Key narrative thread:** [what story to tell across paragraphs]
**"Why them" angle:** [what to research about target employer]
**Avoid:** [CL anti-patterns for this role type]
```

Progress: "Building bundle for [role type] — [N] HIGH priority achievements, [M] bold tools"

---

## Phase 6: Build Significance Research Files

**Goal:** Field context for cover letters — NOT for resume bullets.

**For each position**, create `resume_builder/support/significance_<position_key>.md`:

```markdown
# Significance Research: [Position]

> Use in cover letters and summaries — NOT in resume bullet text.
> These provide field context that demonstrates the user understands the landscape.

---

### [Achievement ID]: Field Context
**The problem:** [What challenge does this address? Industry/scientific context]
**Competing approaches:** [What else exists? What are the limitations?]
**Why this matters:** [Market size, DOE/funding priorities, industry need]
**Differentiation:** [What makes the user's approach unique or better?]

---
[Repeat for each major achievement worth cover-letter depth]

### Field Overview: [Broad Topic]
[2-3 paragraphs of field context that multiple achievements contribute to]
[Useful for cover letter opening hooks and "why this matters" framing]
```

Progress: "Significance research — [N] achievements with field context, [M] field overviews"

---

## Final: Status Report

After all phases complete (or after the requested subset), present:

### KB Build Status
| Component | File | Status | Items |
|-----------|------|--------|-------|
| Experience files | `experience/*.md` | [DONE/MISSING] | [N achievements] |
| Skills taxonomy | `support/skills_taxonomy.md` | [DONE/MISSING] | [N skills] |
| Evidence index | `support/evidence_index.md` | [DONE/MISSING] | [N items] |
| Leadership volunteering | `support/leadership_volunteering.md` | [DONE/MISSING] | [N entries] |
| Reframing guide | `support/achievement_reframing_guide.md` | [DONE/MISSING] | [N entries] |
| Bundles | `bundles/bundle_*.md` | [DONE/MISSING] | [N bundles] |
| Significance | `support/significance_*.md` | [DONE/MISSING] | [N files] |

### Ready for Generation?
- [ ] At least 1 experience file with 5+ achievements
- [ ] Skills taxonomy with 20+ skills
- [ ] At least 1 bundle matching a target role type
- [ ] Evidence index complete
- [ ] Reframing guide covers all achievements
- [ ] Significance files for cover letter depth

If all checked: "Knowledge base is ready. Save a JD to `JDs/` and run `/make-resume JDs/<filename>.txt`"
If gaps: "[List what's missing and which phase to re-run]"

### >>>>>> MANDATORY STOP <<<<<<
Present status report. Wait for user confirmation.
**You MUST wait for the user's explicit text response before continuing.**
