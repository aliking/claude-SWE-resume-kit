---
name: make-resume
description: Generate a tailored resume from a JD
user-invocable: true
---

# /make-resume

**User input:** `$ARGUMENTS`

Parse `$ARGUMENTS`:
- File path (e.g., `JDs/*.txt`) → read that file for the JD
- Job URL (e.g., `https://...`) → fetch posting, normalize into a JD file in `JDs/`, then proceed with that file
- Text after the path starting with "Focus:"/"Emphasize:"/"Downplay:" → focus directive
- "Quick:" prefix → Quick Mode (see below)
- Empty → ask the user for the JD
- Inline JD text (no file path) → save to `JDs/temp_<company>.txt`, proceed normally

---

## JD URL Intake Addendum

When the user provides a job URL, perform this intake before Phase 0.

1. Parse URL + optional directive suffixes (`Focus:`, `Emphasize:`, `Downplay:`).
2. Fetch the posting page content from the URL.
3. Extract and normalize posting details into the canonical JD format below.
4. Save to `JDs/<company>_<role>_<yyyymmdd>.txt` (lowercase, underscores; fallback `JDs/temp_job_<yyyymmdd>.txt`).
5. Continue `/make-resume` using that saved JD path as the source JD.

If fetch is partial/blocked:
- Make one retry.
- If still blocked, ask user to paste the JD text (or key sections), then write it into the canonical JD format and continue.

If page has navigation clutter, prioritize core role text over marketing/legal boilerplate.

### Canonical JD Format (for all new JD files created from URLs)

Use this exact section order so downstream parsing is consistent:

```text
SOURCE
- URL: <job URL>
- Captured: <YYYY-MM-DD>
- Access Notes: <ok | partial | blocked + note>

ROLE SNAPSHOT
- Company: <company name>
- Role Title: <title>
- Team/Org: <if available>
- Location: <onsite/hybrid/remote + city/region>
- Employment Type: <full-time/contract/etc>
- Compensation: <if available>
- Closing Date: <if available>

ABOUT
<short company/role summary from posting>

RESPONSIBILITIES
- ...

REQUIRED QUALIFICATIONS
- ...

PREFERRED QUALIFICATIONS
- ...

TOOLS AND KEYWORDS
- Languages: ...
- Frameworks: ...
- Cloud/Infra: ...
- Domain Terms: ...
- Soft Skills: ...

NOTES
- Any extraction caveats, missing sections, or assumptions.
```

Normalization rules:
- Preserve factual wording where possible; lightly clean punctuation/whitespace only.
- Never infer compensation, location, or requirements not present in source.
- If unknown, use `Not listed`.
- Remove duplicate bullets and boilerplate EEO text unless it contains role-relevant constraints.

---

## Safety Rules (ALWAYS ENFORCED)

**Accuracy > Relevance > Impact > ATS > Brevity**

Read `config.md` Provenance Flags before generating any content. Verify every claim against that table.

- Use the email from `config.md` Personal Info in all outputs
- Resume bullets: ALL variable bullets are 2L (unless the user explicitly requests a longer variant)
- Source ALL bullet content from `resume_builder/experience/` files. Never fabricate.
- Run `bash scripts/safe-run.sh scripts/char_count.sh` after each section — the tool is authoritative (do NOT call `python3 ... char_count.py` directly — triggers VS Code permission prompts)

---

## User Input During Execution

If the user provides feedback, corrections, or suggestions at any point:
1. Acknowledge the input immediately
2. If it affects an already-written section: go back, fix it, re-run char count gate
3. If it changes the bullet plan: update session file Bullet Plan
4. If it's a question: answer it, then continue from current step
5. Never restart a phase — resume from current position

---

## Startup

Read `resume_builder/reference/shared_ops.md` for session startup, file derivation, and organization protocols.

**Pre-flight check:**
- If `config.md` does not exist: "You need to create a config.md with your personal info and provenance flags before generating a resume. See `config.template.md`" Stop.

Then:
1. Read `CLAUDE.md` — check Active Sessions and KB Corrections
2. Read `config.md` — load Provenance Flags, email, document preferences, role types
3. If session file exists for this JD:
   - Read session file, check Status
   - Phase 0: DONE, Phase 1: PENDING → resume at Phase 1
   - Phase 1: DONE → resume at Budget Gate
   - Phase 2: IN_PROGRESS → read .tex, check what sections exist, resume from checkpoint
   - Phase 2: DONE → "Resume already done. Run /make-cl next." Show next command. Stop.
4. If no session file: proceed to Phase 0

---

## Quick Mode

Trigger: `$ARGUMENTS` starts with "Quick:"

Defaults:
- Select all HIGH priority achievements from bundle's Priority Matrix as 2L
- Fill remaining budget with MEDIUM priority in Priority Matrix order
- Default format: 2-page resume
- Skip Phase 0 STOP and Phase 1 STOP
- Keep Budget Gate (auto-pass if within target) and end-of-resume STOP
- Run all phases with progress commentary instead of interactive stops

---

## Phase 0: Research & Session Setup

**Read these files:**
1. The JD (from `$ARGUMENTS`)
2. `resume_builder/reference/resume_reference.md` — Budget Card, Section Specs, Char Limits, Page Budgets
3. `config.md` — Role-Type Decision Tree to identify the matching bundle

**Web Search (MANDATORY — 2-3 searches).** Load WebSearch via ToolSearch first.
1. `[Company] research & development [key JD domain]` — products, recent projects
2. `[Company] [specific technology from JD]` — concrete hooks for cover letter
3. `[Company] careers [role type] culture` OR recent news — hiring context

If web search returns no results: use JD text + training knowledge. Flag: "Web search returned limited results — CL hooks may be generic."

**Application Type Detection (MANDATORY — do this before writing the session file):**

Check the JD and application URL for signals:
- Does the JD explicitly say no cover letter is accepted or required? → `No CL (resume-only)`
- Does the JD or application page list specific form questions (e.g., "Why do you want to work at X?", "Describe a time when...")? → `Form-based` — record each question verbatim
- Otherwise: attempt to infer from context (job board vs. direct ATS, company culture signals, if there is no apparent way to submit a cover letter). If signals are mixed or weak, default to `Standard` but note uncertainty in session file.

If the application type cannot be determined from available information:
> **Ask the user:** "Does this application accept a cover letter? Options: (1) Yes, standard CL; (2) No CL — resume only; (3) Form-based — paste the form questions."

Record the result in the session file under both **JD Info** (`Application Type:`) and **Cover Letter Plan** (`Application Type:`).

**Produce all of these (reference `resume_builder/reference/session_file_template.md` for format):**
- **JD Analysis** — classify every requirement as Direct / Bridge (with confidence) / Gap. Extract ATS keywords by category.
- **Company Context** — mission, role purpose, culture signals, "why them" angle (from web research)
- **Framing Strategy** — lead narrative, reframing map, emphasize/downplay, CL hooks, user focus directives
- **Critique Context** — reviewer persona, competitive landscape, domain vocabulary
- **Cover Letter Plan** — institution type, application type, paragraph structure, hooks, jargon level; if form-based: list all form questions verbatim

**Create output folder:**
Derive folder name from JD filename: `JDs/JD_Acme.txt` → `output/Acme/`
```bash
bash scripts/safe-run.sh scripts/prep_output.sh <FolderName>
```
Write session file to `output/<FolderName>/session_<name>.md` (NOT flat `output/`).
All subsequent output files go in this folder.

**Verify completeness:** Re-read the session file. Confirm these 8 sections are non-empty: JD Info, Requirements table, ATS Keywords, Gap Assessment, Company Context, Framing Strategy, Critique Context, Cover Letter Plan. Fill any missing section before presenting.

**Write memory pointer** to `CLAUDE.md` Active Sessions.

**Update session file Status:** `Phase 0: DONE`

Progress: "Searching for [company] + [domain]..." / "JD analysis: X/Y requirements direct match, Z bridges, W gaps"

### >>>>>> MANDATORY STOP — DO NOT PROCEED <<<<<<
Present: research summary, role type + bundle, format, framing strategy.
Ask user to confirm: (1) role type + bundle, (2) format, (3) framing strategy.
**You MUST wait for the user's explicit text response before continuing.**
Proceeding without confirmation misaligns the entire resume and requires full regeneration.

---

## Phase 1: Plan Bullets

**Re-read `output/<FolderName>/session_<name>.md`** — specifically Framing Strategy and ATS Keywords.

**Read:**
1. The matching bundle from `config.md` Role Types → `resume_builder/bundles/bundle_[role_type].md` — Section 1 (Priority Matrix)
   - For hybrid JDs: read both bundles. Use primary for Priority Matrix, secondary for Reframing Map on 1-2 bridging bullets.
2. All experience files from `resume_builder/experience/`
3. `resume_builder/support/achievement_reframing_guide.md`
4. `resume_builder/support/skills_taxonomy.md`
5. `resume_builder/support/evidence_index.md`

**Present one table per position:**

**[Position Name] (Budget: N-M bullets, ~X-Y rendered lines)**

| | ID | Achievement | Variant | Lines | JD Match |
|---|---|-------------|---------|-------|----------|
| * | P1-1 | [short description] | 2L | 2 | Direct |
| * | P1-5 | [short description] | 2L | 2 | Direct |
| o | P1-3 | [short description] | 2L | 2 | Bridge |
| x | P1-7 | [short description] | -- | -- | Weak |

**Legend:** `*` = recommended (HIGH on Priority Matrix + Direct JD match) | `o` = available (MEDIUM priority or Bridge match) | `x` = not recommended (LOW priority or Gap)

**After all positions, show:**
- Recommended set total vs budget (from Quick Budget Card in resume_reference.md)
- Remaining budget slots and what could fill them
- Forced exclusions per provenance flags
- Focus directive impact (what changed vs Priority Matrix defaults)

**User Context Checkpoint (OPTIONAL — gap-filling)**
- Read `resume_builder/reference/user_context_checkpoints.md`
- Review JD Requirements table from session file Gap Assessment
- Identify gaps where **JD requires Skill Y, but no direct extraction exists**
- For each gap: Does user have **related experience X that could frame as Y?**
  - Example: JD requires "web scraping," no direct extraction. User has web-driver E2E automation.
  - Ask Format B: "Do you have [web-driver E2E] experience that could frame as [web scraping]?"
- Prepare 1-2 highest-impact gap-filling questions (Tier 1 triggers per user_context_checkpoints.md)
- **Do NOT ask:** gaps the user explicitly said to downplay (focus directives)
- **Record:** Note any user-provided framing in session file under `## Evidence Tracking` if planning to use it

**Update session file** — write Bullet Plan tables. Status: `Phase 1: DONE (N bullets confirmed)`

Progress: "Reading experience files for bullet candidates..." / "Recommending N bullets per position"

### >>>>>> MANDATORY STOP — DO NOT PROCEED <<<<<<
Present bullet plan.
**IF gap-filling questions were prepared:** Also ask: "For [gap Y], do you have experience with [related X] that could strengthen this section?"
Wait for user to confirm/modify selections **AND** answer gap-filling questions if asked.
**You MUST wait for the user's explicit text response before continuing.**
If you proceed without confirmation, you will generate bullets the user didn't approve.
**Update session file with confirmed plan and any user-provided framing evidence before continuing.**

---

## Budget Gate (AFTER user confirms bullet plan, BEFORE Phase 2)

**Re-read session file Bullet Plan section** to verify confirmed counts.

- Check budget targets from `resume_builder/reference/resume_reference.md` Budget Card.
- Show: `Budget: [N] bullets vs target [T]. PASS/FAIL`
- **FAIL = do not proceed. Reconcile with user first.**

---

## Phase 2: Generate

**Re-read to restore context after compaction:**
1. `output/<FolderName>/session_<name>.md` (framing + confirmed bullet plan)
2. `resume_builder/reference/critical_rules.md` — Character Limits, Bold Width Penalty, Orphan rules
3. `resume_builder/support/ai_fingerprint_rules.md` — Banned words, structural rules, post-gen checklist
4. `resume_builder/support/leadership_volunteering.md` — canonical fixed section entries (if file exists)

**Read template:** `resume_builder/templates/resume_template.tex` + `.cls`
FIXED sections (from `config.md` FIXED Sections) are template-locked — only generate VARIABLE sections (Summary, Skills, Experience bullets/headers).
NEVER rewrite, paraphrase, infer, or "fill in" FIXED sections from memory or profile assumptions.
For FIXED sections, copy verbatim from the template source already configured by the user.
If a fixed `Leadership \& Volunteering` section is present in the template, populate it from `resume_builder/support/leadership_volunteering.md` using externally safe phrasing.

**Read section specs:** `resume_builder/reference/resume_reference.md` — Section-by-Section Specs for your format

**If Application Type is `No CL (resume-only)` — Resume-Only Mode:**
- The resume is the only written signal the reviewer will receive. Apply heightened scrutiny:
  - Summary must function as both positioning statement AND motivation signal — no generic openers
  - Every bullet must be fully self-contained: context, action, and outcome without CL support
  - Prefer bullets with explicit scope indicators (team size, user count, timeline) over abstract impact claims
  - Ensure at least one bullet per position speaks directly to the JD's primary requirement
- Note this in session file Framing Strategy: "Resume-only — CL not accepted. Resume carries full narrative."

**Generate section by section** (follow Section-by-Section Specs):
1. Summary → check against session framing strategy
   - Update Status → `Phase 2: Summary DONE`
2. Skills
   - Update Status → `Phase 2: Skills DONE`
3. Each position's bullets → **CHAR COUNT GATE after each position**
   - Position titles: bold theme + date must fit ONE line (see resume_reference.md). If wrapping, shorten title.
   - After each position: Update Status → `Phase 2: [Position] DONE`
4. **PAGE FILL GATE after all experience**

Save .tex to `output/<FolderName>/e2e_<name>_resume.tex`

**Update session file** — add Output Files.

Progress: "Writing Position 1 bullets (6 of 7)..." / "Bullet 4 is SHORT at 184 chars — padding" / "Compiling resume... 2 pages OK"

### CHAR COUNT GATE (per position)
```bash
bash scripts/safe-run.sh scripts/char_count.sh -f resume output/<FolderName>/[file].tex
```
Use `scripts/char_count.sh` via `safe-run.sh` (NOT `python3 ... char_count.py` directly — the raw python3 call triggers VS Code permission prompts in this devcontainer).
No OVER violations. Last line of 2L bullets >= 70% fill. **Fix before next position.**

### PAGE FILL GATE
```bash
bash scripts/safe-run.sh scripts/check_pdf_fill.sh output/<FolderName>/[file].pdf
```
PASS = ≤ 3 trailing blank lines. **WARN or FAIL: add optional bullets from bullet plan, then recompile and recheck.**

### COMPILE GATE
```bash
bash scripts/safe-run.sh scripts/compile_tex.sh output/<FolderName>/e2e_<name>_resume.tex
```
`scripts/compile_tex.sh` enforces FIXED-section integrity checks (including Education) before running `pdflatex`.
Verify page counts match `config.md` Document Preferences. Use the Read tool to view compiled PDF — check orphans, header wrapping, page fill. **If FAIL: fix variable content, recompile.**

Run the Post-Generation Verification checklist from `resume_builder/reference/resume_reference.md` before proceeding.

Update Status → `Phase 2: Compile DONE`

---

## End of /make-resume

Check `Application Type` from session file, then update status accordingly:

**Standard (cover letter accepted):**
- `Resume: DONE` | `Cover Letter: PENDING` | `Critique: PENDING`
- `Next: /make-cl output/<FolderName>/session_<name>.md`

**No CL (resume-only):**
- `Resume: DONE` | `Cover Letter: N/A — resume-only application` | `Critique: PENDING`
- `Next: /critique output/<FolderName>/session_<name>.md`

**Form-based:**
- `Resume: DONE` | `Cover Letter: PENDING (form-based — questions recorded in Cover Letter Plan)` | `Critique: PENDING`
- `Next: /make-cl output/<FolderName>/session_<name>.md`

### >>>>>> MANDATORY STOP <<<<<<
Present: resume compilation summary (pages, char count results, any violations fixed).
**You MUST wait for the user's explicit text response before continuing.**

Present next steps based on application type:
- **Standard:** "Resume compiled and verified. Next steps:\n1. /clear\n2. [exact /make-cl command with session file path]"
- **No CL:** "Resume compiled and verified (resume-only application — no cover letter).\nNext steps:\n1. /clear\n2. [exact /critique command with session file path]"
- **Form-based:** "Resume compiled and verified. Form questions recorded — /make-cl will use them as paragraph headings.\nNext steps:\n1. /clear\n2. [exact /make-cl command with session file path]"

If the user wants a submission-safe PDF name immediately, run:
```bash
scripts/finalize_resume_outputs.sh output/<FolderName>/session_<name>.md
```
