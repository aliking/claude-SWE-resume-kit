# claude-resume-kit

Most AI resume tools work the same way: paste resume + paste JD, get a rewrite. They don't know which of your work shipped to production, which stayed internal, or which contributions were team-wide programs like mentoring or onboarding. They'll upgrade "contributed to" into "developed" without blinking.

This is different. You extract your projects, initiatives, codebases, and reports once — the system asks structured questions about each one. After that, every new application is just pointing it at a JD. It picks the right achievements, frames them for the audience, enforces accuracy, and generates LaTeX you compile locally.

Built for engineers and other professionals with lots of source material (projects, docs, reviews, reports, code) who apply to many positions across different employer types.

---

## What makes this different

**Knowledge base, not a rewriter.** You extract once. Every application draws from verified source material — not a pasted resume that gets "improved."

**Anti-fabrication by design.** Provenance flags on every achievement (deployed / internal / open source / recurring initiative). Verb discipline rules prevent overclaiming. A corrections log ensures fixed errors don't reappear.

**AI fingerprint avoidance.** Banned-word lists, structural anti-patterns, and a 12-item post-generation scan so output reads as human-written.

**Multi-perspective critique.** Five reader personas (ATS bot through technical reviewer) score your resume across 8 dimensions in a fresh context window.

**LaTeX output, locally compiled.** No data leaves your machine beyond the Claude Code conversation.

---

## Example Output

Here's what the system generates for the included fictional researcher (Dr. Jordan Chen, computational biologist) applying to a tenure-track faculty position:

- [Example Resume (PDF)](resume_builder/examples/example_resume.pdf) — 2-page resume with JD-tailored bullets, skills, and publications
- [Example Cover Letter (PDF)](resume_builder/examples/example_cover_letter.pdf) — 1-page tailored cover letter with specific hooks
- [Example Session File](resume_builder/examples/example_session_file.md) — the decision log that produced this output
- [Source .tex files](resume_builder/examples/output/) — the LaTeX source Claude generated

All example data is in `resume_builder/examples/` — extraction, experience file, bundle, config, and session file.

---

## What you actually do

**One-time setup (~10 min per item):**
1. Place source materials in `knowledge_base/sources/`
2. Suggested folders:
     - `knowledge_base/sources/resume_inputs/` for old resume PDFs
     - `knowledge_base/sources/performance_reviews/` for annual review PDFs
     - `knowledge_base/sources/supporting_docs/` for project docs and notes
     - `knowledge_base/sources/repo_manifests/` for markdown files listing local repo paths and branch/time ranges
2. Run `/setup-extract` on each — Claude reads it and asks you questions about your contributions and claim safety
3. Run `/setup-build-kb` — synthesizes everything into your knowledge base

**Per application (~15-20 min):**
1. Drop the JD into `JDs/`
2. Run `/make-resume JDs/target_job.txt` — approve the bullet plan, get a `.tex` file
3. Run `/make-cl` for a cover letter
4. Run `/critique` for a scored review with specific fixes

Each step uses a **separate Claude Code session** for best quality (fresh context = less bias).

---

## Prerequisites

- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** CLI installed and authenticated
- **A LaTeX distribution** for compiling `.tex` to `.pdf` (e.g., [TeX Live](https://tug.org/texlive/), [MacTeX](https://tug.org/mactex/), [MiKTeX](https://miktex.org/))
- **Your project docs, notes, reviews, or reports** ready for extraction

---

## Try it first (5 minutes)

Want to see what it does before extracting your own materials? The repo includes a complete example knowledge base for a fictional researcher:

```bash
git clone https://github.com/aliking/claude-SWE-resume-kit.git
cd claude-resume-kit
claude
/make-resume JDs/example_jd.txt
```

This runs the full pipeline — JD analysis, bullet selection, LaTeX generation — using the included example data. No setup required.

---

## Full Setup

### 1. Clone and configure

```bash
git clone https://github.com/aliking/claude-SWE-resume-kit.git
cd claude-resume-kit
```

Copy `config.template.md` to `config.md`, then edit `config.md` with your details (name, email, provenance flags, role types). See `resume_builder/examples/example_config.md` for a complete example.

### 2. Extract your source materials

Place PDFs, markdown notes, and repo manifest files in `knowledge_base/sources/`, then:

```
/setup-extract knowledge_base/sources/resume_inputs/current_resume.pdf knowledge_base/sources/repo_manifests/platform_work.md knowledge_base/sources/performance_reviews/2025_review.pdf
```

Claude reads the item, asks clarifying questions about your contributions, and creates a structured extraction. Repeat for each item.

### 3. Build your knowledge base

```
/setup-build-kb
```

This synthesizes all extractions into experience files, role-type bundles, and support files.

### 4. Customize your LaTeX templates

Open the templates in `resume_builder/templates/` and fill in your FIXED sections — education, header, awards, and optional publications. The `[CONFIG: ...]` placeholders show you what to fill in.

### 5. Generate for a job

```
/make-resume JDs/target_job.txt
```

Then in separate sessions: `/make-cl` for the cover letter, `/critique` for a scored review.

---

## How It Works

```
Your Projects + Initiatives --> /setup-extract --> Extractions --> /setup-build-kb --> Knowledge Base
                                                                          |
Job Description --> /make-resume --> Tailored Resume (.tex)               |
                        |              v                                  |
                   /make-cl --> Cover Letter (.tex)                       |
                        |              v                                  |
                   /critique --> 8-Part Score + AI Scan + Fixes           |
                        |              v                                  |
                   /edit-resume --> Refined Package                       |
```

| Skill | Purpose | Input | Output |
|-------|---------|-------|--------|
| `/setup-extract` | Extract structured data from a project or initiative | Source path | `knowledge_base/extractions/*.md` |
| `/setup-build-kb` | Build KB from extractions | All extractions | `resume_builder/{experience,bundles,support}/` |
| `/make-resume` | Generate tailored resume | JD path | `output/<Folder>/e2e_*.tex` + session file |
| `/make-cl` | Generate matching cover letter | Session file | `output/<Folder>/*_cover_letter.tex` |
| `/edit-resume` | Edit resume/CL from feedback | Session + feedback | Updated `.tex` files |
| `/critique` | Independent quality review | Session file | `output/<Folder>/critique_*.md` |

---

## Documentation

For architecture details, customization tables, the full critique system breakdown, key design decisions, and FAQ, see **[DOCS.md](DOCS.md)**.

---

## Contributing

Issues and PRs welcome. When contributing:
- Example files use the fictional Dr. Jordan Chen — keep examples in that persona
- Reference docs should stay domain-agnostic
- Test skill changes against the example data before submitting

---

## License

MIT — see [LICENSE](LICENSE).
