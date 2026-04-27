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

## Pipeline Mode

**Trigger:** `$ARGUMENTS` contains `PIPELINE_MODE=true`

In pipeline mode this skill runs as a **headless sub-agent** with no direct user interaction. At every mandatory stop it writes a structured `CHECKPOINT_RETURN` payload and immediately returns — it does **not** wait for user input.

Full checkpoint contracts and flow diagrams are in `resume_builder/reference/checkpoint_registry.md`.

### Input Fields (pipeline)

Parse from `$ARGUMENTS`:

| Field | Description |
|-------|-------------|
| `PIPELINE_MODE=true` | Activates this mode |
| `CHECKPOINT_ID=<id>` | Which checkpoint to stop at — run until this checkpoint's stop point, then return |
| `SESSION_FILE=<path>` | Path to session file (required for all checkpoints except `phase0.strategy-confirm` on first run) |
| `ARGS=<json>` | JSON string — user answers from the previous checkpoint; apply before executing |

### Approved Tool Manifest

In pipeline mode **only** these operations are permitted:
- `bash scripts/safe-run.sh scripts/char_count.sh ...`
- `bash scripts/safe-run.sh scripts/compile_tex.sh ...`
- `bash scripts/safe-run.sh scripts/prep_output.sh ...` (Phase 0 only)
- File read/write tools
- Web search / URL fetch — **only for URLs listed in the session file `## Orchestration State` → `Pre-Authorized URLs` field** (set by the orchestrator before invoking this sub-agent). Do not fetch any URL not on that list.

**Any other `bash` invocation** → stop immediately and return:
```json
{"version":"1","status":"blocked","checkpoint_id":"<current>","block_reason":"Attempted to run <command> — not in Approved Tool Manifest","summary":"Blocked before executing unlisted command"}
```

### Hard Rules

1. **Never ask the user a question directly.** Return `needs_input` with a `questions` array instead.
2. **Never stall waiting for approval.** Return `needs_approval` with `block_reason` describing what you need.
3. **Never run an unlisted command.** Return `blocked` immediately.
4. **Always write the session file before returning.** State must never be lost mid-checkpoint.
5. **Preserve non-pipeline behavior.** When `PIPELINE_MODE` is absent, all mandatory stops behave as written in the main skill sections.
6. **Never fetch an unlisted URL.** In pipeline mode, only fetch URLs present in `## Orchestration State → Pre-Authorized URLs`. Any attempt to access a URL not on that list → return `blocked` with `block_reason: "URL not pre-authorized: <url>"`. The orchestrator will pre-authorize and re-invoke.

### Return Payload Schema

Write this JSON block as the final output, then stop:
```json
{
  "version": "1",
  "status": "done | needs_input | blocked | error",
  "checkpoint_id": "<current checkpoint id>",
  "next_checkpoint": "<next checkpoint id or null>",
  "session_file": "<path>",
  "output_files": ["<path>"],
  "preamble": "<context block for user — required when status=needs_input; null otherwise>",
  "questions": [
    {"id": "<q_id>", "text": "<question>", "options": ["<option>"], "required": true}
  ],
  "block_reason": "<only if blocked>",
  "error": "<only if error>",
  "summary": "<one-line summary of what was done>"
}
```

### Checkpoint Definitions

#### `make-resume.phase0.strategy-confirm`
**ARGS applied:** `jd_path`, `directives`
**Execution:** Full Phase 0 (web research, JD analysis, company context, framing strategy, CL type detection, folder creation, session file write).
**Web access required:** Yes — 2-3 web searches + possible JD URL fetch. The orchestrator runs URL Pre-Authorization before invoking this checkpoint; web fetches should be pre-approved by the time this sub-agent runs.
**Return:** `needs_input` with questions: `q_bundle`, `q_framing`, `q_cl_type`, `q_format`.
**Preamble must include:** Company overview (size, product, stage), role-to-bundle match rationale and recommended bundle, recommended framing angle (and why), detected CL type with reasoning, any notable gaps or flags in the JD (e.g., skill mismatch, seniority ambiguity).
**Postcondition:** Phase 0: DONE written to session file.

#### `make-resume.phase1.plan-confirm`
**ARGS applied:** `q_bundle`, `q_framing`, `q_cl_type`, `q_format` (from previous checkpoint)
**Execution:** Apply confirmations to session file; run full Phase 1 (read bundle + experience files, build bullet plan tables, prepare up to 2 gap-fill questions).
**Return:** `needs_input` with questions: `q_bullets_<slug>` per position, `q_gap_<n>` if prepared.
**Preamble must include:** Confirmed bundle + framing angle, total planned bullets per position (with position name and file source), any positions with thin evidence or below-minimum bullets, any gap-fill questions triggered and what they cover.
**Postcondition:** Bullet Plan tables written; Phase 1: PENDING.

#### `make-resume.phase1.budget-gate`
**ARGS applied:** `q_bullets_<slug>` per position, `q_gap_<n>` answers
**Execution:** Apply bullet confirmations + gap answers; update session Bullet Plan; run budget gate against `resume_reference.md`.
**Return:** `done` (auto-pass, next: `make-resume.phase2.resume-done`) OR `needs_input` with `q_budget_reconcile` if FAIL.
**Postcondition:** Phase 1: DONE ([N] bullets confirmed).

#### `make-resume.phase2.resume-done`
**ARGS applied:** `q_budget_reconcile` (if gate needed reconciliation)
**Optional ARGS controls (from orchestrator):** `response_mode=compact`, `max_return_chars`, `stream_phase2=true`, `phase2_chunk=summary_skills|experience_a|experience_b|compile_finalize`
**Execution:** Full Phase 2 — generate Summary, Skills, all position bullets; char count gate after each position; compile; page fill gate; save `.tex` and `.pdf`.
If `stream_phase2=true`, run in compact slices and write detailed progress to session state; when not yet complete, return `done` with `next_checkpoint=make-resume.phase2.resume-done` to continue the next slice.
**Return:** `done`. Next: `make-cl.phase1.app-type-confirm` (Standard/Form-based) or `critique.phase1.score-return` (No CL).
**Postcondition:** Phase 2: DONE; `e2e_<name>_resume.tex` + `.pdf` written.

---

## JD URL Intake

When the user provides a job URL, perform the **JD URL Intake** protocol from `resume_builder/reference/shared_ops.md` before Phase 0.

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
Present: research summary, role type + bundle, format (from `config.md`), framing strategy.
Ask user to confirm: (1) role type + bundle, (2) framing strategy.
For format, default to `config.md` Document Preferences and only discuss application type questions (Standard vs No CL vs Form-based) when relevant.
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
**CRITICAL: NEVER read any `.tex` file from `output/` as a formatting reference.** The canonical template is `resume_builder/templates/resume_template.tex` — always and only. Reading a prior session's compiled `.tex` introduces content bleed from a different JD.
**UNIT CHECK (Phase 2, pipeline mode):** Reject any read of `output/**/*.tex` during Phase 2. If any such read is attempted, return `blocked` with `block_reason: "Phase2 template guard violation: attempted read of output tex"`.
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

**Pipeline output-size safeguard:** In pipeline mode, checkpoint return text must be compact JSON only. Keep `summary` to one line and write long per-position progress to the session file.

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
