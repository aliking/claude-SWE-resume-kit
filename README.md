# claude-SWE-resume-kit

Skeptical collaborator for software engineer resume and cover letters.

Most AI resume tools work the same way: paste resume + paste Job Description, get a rewrite. They don't know which of your work shipped to production, which stayed internal, or which contributions were team-wide programs like mentoring or onboarding. They'll upgrade "contributed to" into "developed" and add entirely made up impacts.

This tool is intended to be a collaborator system that helps you frame real experience accurately. It helps to extract signals from projects, git codebases, review documents and anything else you think can give a good feel for your real work. It then uses those signals to customize a resume and cover letter that are true and defensible, and also tailored.

This repo is based on https://github.com/ARPeeketi/claude-resume-kit, customized for software engineers or other non-academic professionals.

---

## Principles

**Knowledge base, not a rewriter.** The system is designed to build a structured knowledge base of your real experience, and then reframe that accurately for each application.

**Anti-fabrication by design.** Every achievement is flagged for provenance. If you can't prove something, the system won't rank it highly for inclusion.

**AI fingerprint avoidance.** Banned-word lists, structural anti-patterns, and a 12-item post-generation scan so output reads as more human-written. (You should still customize!)

**Multi-perspective critique.** Five reader personas (ATS bot through technical reviewer) score your resume across 8 dimensions in a fresh context window.

**LaTeX output, locally compiled.** No data leaves your machine beyond the Claude Code conversation.

---

## Human-in-the-loop: expect a dialogue, not a vending machine

This system is intentionally **slightly adversarial**. When you describe your work, the system will err on the side of underclaiming. This is good, you want it to be skeptical of your claims.

**Be completely honest.** Your framing — the words you use to describe ownership, scope, and impact — is captured in the session log and fed back into the knowledge base. Over time this calibrates the system to your voice and your actual contribution level. If you stretch claims early, the system will build on stretched claims.

**Common loop: gap identification → repo search.** During extraction and resume generation, the system will frequently identify gaps — work it can't find evidence for. Before accepting a gap, you can point it at a repository: *"That's not a gap — look for the auth refactor in `payments-service`, branch `feature/auth-overhaul`, 2023-Q3."* The system will search the repo manifest, extract evidence, and update the knowledge base. The Knowledge Base improves over time.

**Cover letters take more iteration than resumes.** Resumes tend to come out strong on the first pass because they draw directly from structured KB bullets. Cover letters require your voice; the first draft will often feel AI-generated. Expect to rewrite cover letters more heavily at first. As you correct them and the system absorbs your edits, the output _should_ improve.


## What you actually do

Try `/getting-started` to see the initial instructions.

**One-time setup (~10 min per item):**
1. Place source materials in `knowledge_base/sources/`
   - `knowledge_base/sources/resume_inputs/` for old resume PDFs
   - `knowledge_base/sources/performance_reviews/` for annual review PDFs
   - `knowledge_base/sources/supporting_docs/` for project docs and notes
   - `knowledge_base/sources/repo_manifests/` for markdown files listing local repo paths and branch/time ranges
2. Run `/setup-extract` on each — Claude reads it and asks you questions about your contributions and claim safety
3. Run `/setup-build-kb` — synthesizes everything into your knowledge base

**Ongoing maintenance:**
- When you finish a project, get a new review, or want to capture recent codebase work: add the source and run `/setup-update`. It detects what's new and incorporates it without duplicating existing entries. If you have active repo access, make this a regular habit — the more current your KB, the less gap-filling you'll do at application time.
- When the system identifies a gap during generation, point it at the right repo rather than accepting the gap: *"look for X in payments-service, 2023-Q3."* The KB improves each time.

**Per application (~15-30 min with review):**

Run each step in a **separate agent session** — fresh context avoids bias from prior output:

1. `/make-resume JDs/target_job.txt` — or pass a URL directly
2. `/make-cl <session_path>` — cover letter from the session file
3. `/critique <session_path>` — scored 8-dimension review
4. `/edit-resume output/<Folder>/resume.tex output/<Folder>/critique.md` — apply fixes and your own feedback

**Expect to spend real time on the cover letter.** The resume draws from structured KB bullets and is usually strong on the first pass. The cover letter requires narrative voice that the system doesn't have yet. Plan on rewriting it heavily for your first few applications; your edits are captured and used to calibrate future output.

---

## Prerequisites

- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** CLI installed and authenticated OR your preferred local agent runner with access to the repo
- **A LaTeX distribution** for compiling `.tex` to `.pdf` (e.g., [TeX Live](https://tug.org/texlive/), [MacTeX](https://tug.org/mactex/), [MiKTeX](https://miktex.org/))
- **Your project docs, notes, reviews, or reports** ready for extraction

**N.B.** This repository runs well in a vscode devcontainer with the above dependencies pre-installed. If you have docker, vscode and the devcontainer extension, you can open the repo in a devcontainer and avoid local setup.

## Full Setup

### 1. Clone and configure

```bash
git clone https://github.com/aliking/claude-SWE-resume-kit.git
cd claude-SWE-resume-kit
```

Copy `config.template.md` to `config.md`, then edit `config.md` with your details (name, email, provenance flags, role types).

### 2. Add your code repositories

Code repositories are the richest evidence source. The system reads commit history, PR descriptions, and module ownership to identify what you actually committed. There are two ways to bring in repo evidence.

**Option A — local clones (strongly preferred):** Local repos give full code context. Clone the repos you worked on to your machine, then create a manifest file describing each one:

```bash
# Example manifest: knowledge_base/sources/repo_manifests/payments_service_manifest.md
# Repo path: /home/you/work/payments-service
# Branch: main
# Range: 2022-01-01 to 2024-06-30
# Focus paths: src/auth/, src/billing/
# Evidence purpose: Auth refactor, Stripe integration, rate-limiting work
```

Run `/getting-started` and it will guide you through creating manifest files for each repo. Then pass them to `/setup-extract`:

```
/setup-extract knowledge_base/sources/repo_manifests/payments_service_manifest.md
```

**Option B — GitHub contributions export (no local access needed):** If you don't have local clones — or if you've since lost access to a codebase (e.g., after a layoff) — use the GitHub exporter script. It scans an org or repo via the GitHub API and exports your PRs, commits, and review comments as a JSON file for extraction.

If you still have access to the org:
```bash
GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=your-github-login node scripts/export_github_contributions.js --org your-company
```

If you no longer have org access, maybe you can ask someone who still does. They run the same command with their own token and `GITHUB_TARGET` set to your login. This script only extracts metadata: comments, commit names etc., which shouldn't be sensitive (also why it's less good signal. Hopefully you made good commit messages!). They return the JSON file, which you drop into `knowledge_base/sources/supporting_docs/`.

For personal repos or public OSS contributions:
```bash
GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=your-github-login node scripts/export_github_contributions.js --repo owner/repo
```

Then extract it:
```
/setup-extract knowledge_base/sources/supporting_docs/github_contributions_your-company.json
```

### 3. Extract your other source materials

Place PDFs and notes in `knowledge_base/sources/`, then run extraction on them:

```
/setup-extract knowledge_base/sources/resume_inputs/current_resume.pdf knowledge_base/sources/performance_reviews/2025_review.pdf
```

Claude reads each item, asks clarifying questions about your contributions and claim safety, and creates a structured extraction.

**Make `/setup-update` a regular habit.** If you actively work in a set of codebases, re-run `/setup-update` every few weeks or after any significant project wraps up. It detects what's new since your last extraction and incorporates it without duplicating existing entries. The more current your KB is, the less gap-chasing you'll do during application generation.

### 4. Build your knowledge base

```
/setup-build-kb
```

This synthesizes all extractions into experience files, role-type bundles, and support files.

### 5. Customize your LaTeX templates

Open the templates in `resume_builder/templates/` and fill in your FIXED sections — education, header, awards, and optional publications. The `[CONFIG: ...]` placeholders show you what to fill in.

### 6. Generate for a job

Open a new agent session and run:

```
/make-resume JDs/target_job.txt
```

Or pass a posting URL directly:

```
/make-resume https://company.com/jobs/software-engineer
```

Then run `/make-cl`, `/critique`, and `/edit-resume` in separate sessions in sequence. Each skill writes a session file that the next one reads — you don't need to pass context manually.

---

## How It Works

```
Your Projects + Initiatives --> /setup-extract --> Extractions --> /setup-build-kb --> Knowledge Base
                                                                          |
                  ┌───────────────────────────────────────────────────────┘
                  ▼
Job Description --> /make-resume --> Tailored Resume (.tex)
                        │
                        ▼
                   /make-cl ──────> Cover Letter (.tex)
                        │
                        ▼
                   /critique ─────> 8-Part Score + AI Scan + Fixes
                        │
                        ▼
                   /edit-resume --> Refined Package ◄── your review & CL rewrites
```

Each skill uses a separate agent session and reads the session file written by the previous step.

| Skill | Purpose | Input | Output |
|-------|---------|-------|--------|
| `/setup-extract` | Extract structured data from a project or initiative | Source path | `knowledge_base/extractions/*.md` |
| `/setup-build-kb` | Build KB from extractions | All extractions | `resume_builder/{experience,bundles,support}/` |
| `/setup-update` | Incrementally update KB with new material | New source paths | Updated extractions + KB files |
| `/make-resume` | Generate tailored resume | JD path | `output/<Folder>/e2e_*.tex` + session file |
| `/make-cl` | Generate matching cover letter | Session file | `output/<Folder>/*_cover_letter.tex` |
| `/edit-resume` | Edit resume/CL from feedback | Session + feedback | Updated `.tex` files |
| `/critique` | Independent quality review | Session file | `output/<Folder>/critique_*.md` |

---

## Documentation

For architecture details, customization tables, the full critique system breakdown, key design decisions, and FAQ, see **[DOCS.md](DOCS.md)**.

---

## License

MIT — see [LICENSE](LICENSE).
