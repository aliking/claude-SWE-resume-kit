# Shared Operations — All Skills

> Referenced by `/make-resume`, `/make-cl`, `/critique`, `/edit-resume`, and `/run-pipeline`.
> Read this file at skill startup. Skills reference specific sections by name.

---

## Three-Session Workflow

Standard JD pipeline uses 3 sessions for token efficiency + quality:

Session 1: `/make-resume JDs/JD_xyz.txt`
  → Phase 0 (research) → STOP → Phase 1 (bullets) → STOP → Phase 2 (resume) → STOP
  → "Resume done. Copy after /clear: /make-cl output/<Folder>/session_<name>.md"

Session 2: `/make-cl output/<Folder>/session_<name>.md`
  → Load context → generate CL → compile → STOP
  → "CL done. Copy after /clear: /critique output/<Folder>/session_<name>.md"

Session 3: `/critique output/<Folder>/session_<name>.md`
  → Full package critique → STOP
  → If approved: finalization check → "Package complete in output/<Folder>/"

If edits needed after critique:
  /clear → /edit-resume output/<Folder>/e2e_<name>_cv.tex output/<Folder>/critique_<name>.md
  /clear → /critique output/<Folder>/session_<name>.md (re-critique)

---

## Fresh Session Startup

CLAUDE.md is auto-loaded. These files are NOT — read them at skill start:
1. `CLAUDE.md` — check KB Corrections Log; read `output/SESSIONS.md` for Active Sessions table
2. If resuming work on an existing JD: read its session file and pick up at Status → Next
3. If starting a new JD: proceed to Phase 0

---

## Session File System

Every JD gets a persistent session file: `output/<FolderName>/session_<name>.md` — the single source of truth for all context.

**Naming:** Derive `<name>` from company/role — lowercase, underscores (e.g., `acme_engineer`, `natlab_postdoc`).

**All output files use the same key:**
- `output/<FolderName>/session_<name>.md` — context file
- `output/<FolderName>/e2e_<name>_resume.tex` or `_cover_letter.tex` — generated document
- `output/<FolderName>/e2e_<name>_cover_letter.tex` — cover letter
- `output/<FolderName>/critique_<name>.md` — critique

**Re-read the session file at the start of EVERY phase** to restore context after compaction.

---

## Session File Derivation (for /make-cl, /critique, and /edit-resume)

From .tex path: strip `e2e_` prefix (if present) + `_resume.tex`/`_cover_letter.tex` suffix → `<name>`.

Example: `output/Acme/e2e_acme_engineer_resume.tex` → `acme_engineer` → look for `session_acme_engineer.md`

**Search order:**
1. Direct path from $ARGUMENTS
2. Folder path: `output/<FolderName>/session_<name>.md` (derive FolderName from JD filename or session name)
3. Flat `output/` (legacy): `output/session_<name>.md`
4. `output/SESSIONS.md` Active Sessions table
5. Glob: `output/**/session_*<company>*.md`

**If still not found:**
- `/edit-resume`: Tell user — "No session file exists. Run `/make-resume` first, or I can create a minimal one (JD Info + Framing Strategy inferred from .tex content)."
- `/critique`: Do 1-2 web searches to build minimal context. Note in critique: "No session file — framing context is approximate."
- `/make-cl`: Tell user — "No session file exists. Run `/make-resume` first."

---

## JD URL Intake

> Used by `/make-resume` and `/run-pipeline` when a URL is provided instead of a file path.
> Perform this intake **before Phase 0** (or before pipeline startup for `/run-pipeline`).

1. Parse URL + optional directive suffixes (`Focus:`, `Emphasize:`, `Downplay:`).
2. Fetch the posting page content from the URL.
3. Extract and normalize posting details into the canonical JD format below.
4. Save to `JDs/<company>_<role>_<yyyymmdd>.txt` (lowercase, underscores; fallback `JDs/temp_job_<yyyymmdd>.txt`).
5. Continue with the saved JD path as the source JD.

If fetch is partial/blocked:
- Make one retry.
- If still blocked, ask user to paste the JD text (or key sections), write it into the canonical JD format, then continue.

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

## Cover Letter Edit Capture (MANDATORY after user edits CL)

Trigger: User says "I've updated the cover letter", "I edited the CL", or similar.

**Why this approach:** The compiled PDF is the stable "before" snapshot. pdftotext is the authoritative source for before-text — it works even when session context is gone or a new session was started. Never rely on session memory alone.

**Steps:**
1. Run `pdftotext output/<FolderName>/e2e_<name>_cover_letter.pdf -` to extract before-text from the last compiled PDF.
   - If pdftotext is unavailable: use session memory if available, or note the limitation clearly.
2. Read current `e2e_<name>_cover_letter.tex` for the after-text (justify block only).
3. Diff the two. Identify changes under these signal categories:
   - **P1 opener:** What changed in the opening framing?
   - **Evidence density:** More or less specific achievement evidence?
   - **Paragraphs added/removed/merged?**
   - **Tone shift:** More personal/authentic? More formal? Shorter?
   - **Voice signals:** Any new phrases that reveal how the user wants to sound?
4. Record the diff summary in the session file under `## Cover Letter Edit Signals`.
5. Append **phrasing signals only** to the central store at `output/CL_VOICE_SIGNALS.md`.
  - Include: date, source session path, and verbatim/near-verbatim wording.
  - Do NOT draw structural conclusions (e.g. "always drop the breadth paragraph"). Record wording evidence only.
  - Keep newest entries at the top of the signal list.
6. Mirror the same phrasing snippets to `/memories/cl_voice.md` when available so cross-workspace memory still benefits.
7. Recompile: `bash scripts/safe-run.sh scripts/compile_tex.sh output/<FolderName>/e2e_<name>_cover_letter.tex`

---

## Progress Commentary

Provide brief status updates at each major step. Minimum: what you're doing + what you found.

If a step takes more than ~30 seconds of silent processing, output a progress line. The user should never wonder if things are stuck.

Per-phase examples are in each SKILL.md.

---

## Char Count Enforcement

Run `bash scripts/safe-run.sh scripts/char_count.sh` after each section or position you write/edit.

**IMPORTANT:** Never call `python3 resume_builder/helpers/char_count.py` directly — this triggers VS Code permission prompts in the devcontainer. Always use the `scripts/char_count.sh` wrapper via `safe-run.sh` instead.

The tool is authoritative — never trust mental math for char counts. If the tool fails, fall back to manual count and flag: "char_count.py unavailable — manual count, verify after compile."

---

## Folder Creation (Phase 0 of /make-resume)

**Trigger:** Start of Phase 0 in `/make-resume`.

**Steps:**
1. Derive folder name from JD filename: `JDs/JD_Acme.txt` → `output/Acme/`
2. `bash scripts/safe-run.sh scripts/prep_output.sh <FolderName>`
3. Write session file to `output/<FolderName>/session_<name>.md`
4. All subsequent output files (from ALL skills) go in this folder

## Finalization (after /critique approval)

**Trigger:** User approves final output at `/critique` STOP.

**Steps:**
1. Verify all expected files exist in `output/<FolderName>/`:
   - `session_<name>.md`
   - `e2e_<name>_resume.tex` + `.pdf` + compile artifacts
   - `e2e_<name>_cover_letter.tex` + `.pdf` + compile artifacts
   - `critique_<name>.md`
2. Create submission-safe PDF names (personal + role, no company/job tokens):
  - Derive `<role_slug>` from session file role type (preferred) or the resume title; short, lowercase, underscores.
  - Canonical outputs:
    - `<Firstname>_<Lastname>_<role_slug>.pdf`
    - `<Firstname>_<Lastname>_<role_slug>_cover.pdf`
  - Preferred implementation:
    - `bash scripts/safe-run.sh scripts/finalize_resume_outputs.sh output/<FolderName>/session_<name>.md`
  - Overwrite protection (same folder reruns): if a target filename already exists, append version suffixes `_v2`, `_v3`, etc.
  - Example shell pattern:
    - `base="<Firstname>_<Lastname>_<role_slug>"`
    - `resume_target="$base.pdf"`
    - `cover_target="${base}_cover.pdf"`
    - `i=2; while [[ -e "$resume_target" ]]; do resume_target="${base}_v${i}.pdf"; ((i++)); done`
    - `j=2; while [[ -e "$cover_target" ]]; do cover_target="${base}_cover_v${j}.pdf"; ((j++)); done`
    - `cp e2e_<name>_resume.pdf "$resume_target"`
    - `cp e2e_<name>_cover_letter.pdf "$cover_target"`
  - Keep originals alongside
3. Confirm to user: "Package complete in output/<FolderName>/ — [N] files"

---

## Resume Edit Capture (MANDATORY after user edits resume directly)

**Trigger:** User has made direct edits to the `.tex` resume file (confirmed via pipeline review prompt or explicit user statement).

**Why this approach:** The compiled PDF is the stable "before" snapshot. `pdftotext` provides authoritative before-text for diff even when session context is gone or a new session was started.

**Steps:**
1. Run `pdftotext output/<FolderName>/e2e_<name>_resume.pdf -` to extract before-text from the last compiled PDF.
   - If pdftotext is unavailable: use session memory if available, or note the limitation clearly.
2. Read current `e2e_<name>_resume.tex` for the after-text (variable sections only: Summary, Skills, bullet text).
3. Diff the two. Classify changes under these signal categories:
   - **Bullet modification:** text change to an existing bullet
   - **Bullet addition/removal:** bullet added or dropped from a position
   - **Summary rewrite:** any change to the Summary section
   - **Skills change:** technology additions or removals in Skills section
   - **Header change:** position title, company name, or date range edited
4. Record diff summary in session file under `## Resume Edit Signals`.
5. Append signal records to `output/RESUME_EDIT_SIGNALS.md`.
   - Include: date, source session path, signal category, brief description of change.
   - Do NOT record verbatim resume bullet text — record what type of change occurred and what it signals about user preferences.
   - Keep newest entries at the top.
6. Recompile: `bash scripts/safe-run.sh scripts/compile_tex.sh output/<FolderName>/e2e_<name>_resume.tex`

---

## Orchestration Lifecycle (Pipeline Mode)

> Used only when the JD pipeline is managed by the `pipeline_orchestrator` agent. Skip in all manual (non-pipeline) flows.

The orchestrator uses checkpoint IDs (from `resume_builder/reference/checkpoint_registry.md`) to drive headless sub-agent execution one step at a time. The session file `## Orchestration State` section is the source of truth for current position.

### Checkpoint Advancement Rules

| Return status | Orchestrator action |
|---------------|---------------------|
| `done` + `next_checkpoint` | Advance immediately — no user interaction needed |
| `needs_input` + questions | Collect answers via `vscode_askQuestions`; re-invoke next checkpoint with answers in ARGS |
| `needs_approval` | Surface description to user; collect decision; re-invoke same or next checkpoint |
| `blocked` | Surface `block_reason` to user; offer manual workaround option; resume at next checkpoint after user confirms |
| `error` | Surface error message; log to `Pipeline Error Log` in session; stop and await user instruction |

### Fallback Parsing + Retry Policy

For every sub-agent return, orchestrator must parse in this order:
1. Raw JSON response
2. Fenced ```json block
3. Last balanced `{...}` block containing both `status` and `checkpoint_id`

Retry policy for same checkpoint:
- Empty return: retry up to 2 times
- Unparseable return: retry up to 2 times
- Schema-invalid payload (missing required fields): retry once

On each retry, append warning to `Pipeline Error Log` and include retry metadata in ARGS.
If retries are exhausted, append terminal failure (`PARSE_FAILURE` or `SCHEMA_FAILURE`) before returning control.

### Session File Updates

After each checkpoint completes (regardless of status), the orchestrator updates `## Orchestration State` in the session file:
- `Current Checkpoint` → checkpoint just completed
- `Last Checkpoint Status` → status returned
- `Last Checkpoint Completed` → timestamp
- `Next Checkpoint` → `next_checkpoint` field from payload

Immediately after this commit, synchronize `output/SESSIONS.md` Active Sessions table with the same checkpoint/status/next-checkpoint values.

### Unexpected Sub-Agent Stops

If a sub-agent returns text containing a question but no structured JSON payload (off-script behavior):
1. Orchestrator scans return text for question patterns (lines ending in `?`, option lists, "please confirm", etc.)
2. Treats the return as `needs_input` with the raw question text surfaced to user
3. Collects answer; re-invokes the same checkpoint with the answer appended to ARGS under key `q_unscheduled_<n>`
4. Logs the unscheduled stop to `Pipeline Error Log` in session file as a warning

If unscheduled-stop behavior repeats past the retry ceiling, append a terminal failure entry before handing control back to the user.

### CHECKPOINT_BLOCKED Handling

1. Surface to user: "Sub-agent blocked at `[checkpoint_id]`: [block_reason]"
2. Ask user: "Proceed with manual workaround, or abort pipeline?"
3. If manual workaround: user performs action; orchestrator resumes at `next_checkpoint` from registry
4. If abort: orchestrator writes final Orchestration State to session file and stops cleanly; user can resume with `/run-pipeline` or switch to manual skill commands
5. Log to `Pipeline Error Log` in session file

### Failure Logging Requirement

Before returning control to the user for any failure path (`blocked`, `error`, parse failure, schema failure, exhausted unscheduled retries, or denied approval), append a `Pipeline Error Log` entry in session state.

### Pipeline Review Checkpoints (Orchestrator-Direct)

The `pipeline.review.*` checkpoints are handled directly by the orchestrator without spawning a sub-agent. See `checkpoint_registry.md` for their full contracts.

---

## Session End Protocol

Before the session ends or user does `/clear`:

1. **Update session file Status** — reflects actual state (which phase completed, what's next)
2. **Update memory pointer** in `output/SESSIONS.md` Active Sessions table
3. **If mid-phase:** Write a `## Resume Point` section to the session file noting exactly where you stopped and what remains
