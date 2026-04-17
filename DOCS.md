# Documentation

Detailed reference for claude-resume-kit. For the quick overview, see [README.md](README.md).

---

## Architecture

```
claude-resume-kit/
├── CLAUDE.md                          # Auto-loaded project instructions
├── config.md                          # Your personal configuration
├── .claude/skills/                    # 6 skills (invoked as /skill-name)
│   ├── setup-extract/SKILL.md         # Extract from projects and initiatives → structured data
│   ├── setup-build-kb/SKILL.md        # Synthesize KB from extractions
│   ├── make-resume/SKILL.md           # JD → tailored resume (.tex)
│   ├── make-cl/SKILL.md              # Session → cover letter (.tex)
│   ├── edit-resume/SKILL.md           # Edit from critique/feedback
│   └── critique/SKILL.md             # Independent quality review
├── resume_builder/
│   ├── reference/                     # Generation rules and protocols
│   │   ├── shared_ops.md              # Session workflow (all skills read this)
│   │   ├── resume_reference.md        # Resume formatting rules
│   │   ├── cl_reference.md            # Cover letter rules
│   │   ├── critical_rules.md          # Compact re-read for generation phase
│   │   ├── session_file_template.md   # Session file format spec
│   │   └── critique_framework.md      # 8-part critique system
│   ├── templates/                     # LaTeX .cls classes + .tex templates
│   │   ├── resume.cls                 # 2-page resume class
│   │   ├── resume_template.tex        # Resume structural template
│   │   └── coverletter_template.tex   # Cover letter template
│   ├── helpers/
│   │   └── char_count.py              # Character counting utility for bullets
│   ├── examples/                      # Fictional candidate — full worked example
│   ├── experience/                    # YOUR experience files (built by /setup-build-kb)
│   ├── bundles/                       # YOUR role-type bundles (built by /setup-build-kb)
│   └── support/                       # Skills taxonomy, evidence index, AI fingerprint rules
├── knowledge_base/
│   ├── extractions/                   # Work-item extractions (built by /setup-extract)
│   └── sources/
│       ├── resume_inputs/             # Existing resume PDFs
│       ├── performance_reviews/       # Annual/performance review PDFs
│       ├── supporting_docs/           # Project docs, notes, exports
│       └── repo_manifests/            # Markdown files listing local repo paths/ranges
├── JDs/                               # Job descriptions (text files)
└── output/                            # Generated .tex files, session files, critiques
```

---

## Concepts

### Session Files

Every JD gets a session file (`output/<Folder>/session_<name>.md`) that tracks:
- JD analysis and ATS keywords
- Which bundle was selected
- Bullet plan (which achievements, in what order, at what length)
- All generation decisions and their rationale
- Cover letter plan
- Critique scores

All 4 generation skills read and update this file. It's the single source of truth for each application.

### Experience Files

One file per position (e.g., `experience_senior_engineer_company.md`). Each achievement has:
- **Source work item** with provenance notes
- **Technical and/or non-technical evidence**
- **Quantitative or directional results**
- **Pre-written bullet variants** (2-line and 3-line)
- **Tags** for which role types this achievement is relevant to
- **Significance** context for cover letters

### Extraction Source Modes

`/setup-extract` supports four source modes:
- **resume-pdf mode:** Uses bullet points as claim seeds that must be verified
- **git-repo mode:** Uses local repository evidence (files, commits, tags, ownership windows)
- **review-pdf mode:** Uses annual review evidence for impact, scope, and non-technical contributions
- **mixed mode:** Combines multiple source types for one work item and resolves dedupe via merge/split confirmation

For mixed mode, the workflow is:
1. Build a candidate map from all sources
2. Confirm merge/split decisions with the user
3. Extract one consolidated work item with source evidence, confidence, and confidentiality fields

Confidence labels should be tracked for major claims:
- **High:** directly supported by repo/review evidence
- **Medium:** supported by resume bullets or partial evidence
- **Low:** inferred and requires confirmation

Confidentiality labels should be tracked for external safety:
- **safe-external**
- **redact-before-use**
- **internal-only**

### Role-Type Bundles

One file per target audience (e.g., `bundle_full_stack.md`). Each bundle contains:
- **S1: Role Profile** — what this audience values, positioning strategy
- **S2: Summary Guide** — how to write the summary for this role type
- **S3: Achievement Reframing Map** — priority ranking of your achievements for this audience
- **S4: Skills Guide** — which tools to bold, which to include, grouping strategy
- **S5: Cover Letter Guide** — opening hooks, paragraph templates, anti-patterns

### Provenance Flags

The system enforces accuracy through provenance tracking in `config.md`. Every achievement is tagged with its visibility and claim safety. The skills check this table before every output and will never:
- Claim prototype work is deployed in production
- Claim internal tools are open source
- Use full-ownership verbs for shared work
- Inflate contribution level

### The Critique System

The `/critique` skill runs a multi-part assessment:
1. **Domain-Specialist Lens** — reviewer persona, gap analysis, competitive landscape
2. **Five-Perspective Read-Through** — ATS bot, recruiter (10s), HR (30s), hiring manager (2min), technical reviewer (10min)
3. **Eight-Dimension Scoring** — weighted score out of 100
4. **Interview Likelihood** — per-reader probability estimates
5. **Tiered Improvements** — ranked by point impact
6. **Interview Bridge Points** — resume-to-interview talking points
7. **Cover Letter Critique** — 6 sub-checks (anti-patterns, tailoring, context-specific, ATS keywords, structural, package cohesion)
8. **Post-Generation Verification** — mechanical and content checklists including AI fingerprint scan

---

## Three-Session Workflow

For best results, use a **separate Claude Code session** for each step. This gives each skill fresh context, which produces better quality (especially for critique — you want fresh eyes, not the same context that generated the resume).

```
Session 1:  /make-resume JDs/job.txt     → resume .tex
            /clear
Session 2:  /make-cl                      → cover letter .tex
            /clear
Session 3:  /critique                     → critique .md with score
            /clear
            /edit-resume                  → refined .tex (if needed)
```

---

## Customization

### Everything in `config.md` (edit directly)

| Setting | What it controls | Example |
|---------|-----------------|---------|
| **Personal Info** | Name, email, phone, links on all outputs | Your contact details |
| **Document Preferences** | Page counts, bullet variants, skills layout | `Resume: 2 pages` |
| **Provenance Flags** | What claims are safe to make | `Onboarding initiative: internal recurring program → don't imply company-wide ownership unless true` |
| **Role Types** | Target audiences and their bundles | `Full Stack (Tier 1), Backend (Tier 2)` |
| **Decision Tree** | How JD keywords map to role types | `"backend" → Backend Engineer` |
| **FIXED Sections** | Template sections that never change per JD | `Education, optional Publications, Awards` |
| **Output Rules** | Package formats and constraints | `Resume: 2pg + 1pg CL = 3pg package` |
| **KB Corrections** | Errors to never re-introduce | `Spearman is 0.82, not 0.85` |

### LaTeX Templates (edit directly)

- **Fonts, colors, spacing** — modify `.cls` files
- **Section order** — reorder sections in `.tex` templates
- **FIXED content** — fill in education, awards, optional publications, header
- **Icons** — replace `GS.png` / `orcid.png` with your own
- **Page geometry** — adjust margins in `.cls` if needed

### Knowledge Base (built by skills, then editable)

| File | How to customize |
|------|-----------------|
| **Experience files** | Edit bullet text, add/remove achievements, adjust tags |
| **Bundles** | Change priority matrices, rewrite summary guides, add role types |
| **Skills taxonomy** | Add/remove skills, change groupings, adjust bold rules |
| **Evidence index** | Update project, initiative, and optional external evidence summaries |

### Reference Docs (advanced)

| File | What you'd change |
|------|-------------------|
| `resume_reference.md` | Page budgets, character limits, section specs |
| `cl_reference.md` | Cover letter paragraph templates, word count targets |
| `critical_rules.md` | Generation-time rules tables |
| `critique_framework.md` | Scoring weights, critique dimensions |
| `shared_ops.md` | Session workflow, file derivation logic |

### Skill Prompts (advanced)

Each skill is a markdown file in `.claude/skills/<name>/SKILL.md`. You can:
- Add STOP points for more user control
- Change the number of web searches in Phase 0
- Adjust how many bullets per position
- Modify the critique scoring weights
- Add new skills for your workflow

---

## Key Design Decisions

- **Accuracy > Relevance > Impact > ATS > Brevity** — the priority hierarchy for every generation decision
- **LaTeX-only output** — Claude generates `.tex`, you compile locally. No formatting surprises.
- **FLIPPED position format** — the bold line under each position title is a JD-customized theme, not a generic description. This is the strongest tailoring lever.
- **Structured provenance** — every achievement is tracked from source material through extraction to experience file to resume bullet
- **Character-precise budgets** — every bullet is calibrated to fit the template geometry, not "try to keep it short"
- **Session files as state** — all decisions for a JD live in one file. Skills can recover from interruptions.
- **Anti-fabrication by design** — provenance flags, verb discipline, and corrections logs prevent overclaiming even under pressure to impress
- **AI fingerprint avoidance** — a dedicated rules file is loaded by all generation and critique skills, covering banned words and phrases (with technical exceptions), structural anti-patterns, positive markers, and a 12-item post-generation checklist

---

## FAQ

**Q: Do I need to know LaTeX?**
No. Claude generates the `.tex` files. You just compile them (`pdflatex file.tex`). The templates handle all formatting.

**Q: How many items should I extract?**
Extract the work items that best represent your strongest technical delivery and your strongest non-technical contributions. Quality matters more than quantity — 8 well-extracted items beat 30 shallow ones.

**Q: Can I tailor this for different software engineering roles?**
Yes. Define role types in `config.md` (for example full stack, backend, frontend, DX) and map JD keywords in the decision tree.

**Q: What if I only have GitHub and LinkedIn links?**
That is fully supported. Keep only the links that help your target roles.

**Q: How do I update after a new project or initiative?**
Run `/setup-extract` on the new source material, then update your experience file and bundles. Existing session files are not affected.

**Q: Can I use this with resume formats other than the included templates?**
Yes. The `.cls` files define the visual style. You can modify them or write your own. The skills generate content based on the template structure — update the `[GENERATE: ...]` and `[FIXED: ...]` markers in your template.

**Q: Can multiple people use the same kit?**
Each person needs their own clone with their own `config.md`, knowledge base, and templates. The framework itself is shared; the content is personal.

**Q: What Claude model should I use?**
The skills are designed for Claude's most capable models (Opus, Sonnet). Less capable models may skip steps or produce lower-quality output.
