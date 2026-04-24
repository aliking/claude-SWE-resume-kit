# Shared Operations — All Skills

> Referenced by `/make-resume`, `/make-cl`, `/critique`, and `/edit-resume`.
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
1. `CLAUDE.md` — check Active Sessions and KB Corrections Log
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
4. `CLAUDE.md` Active Sessions pointer
5. Glob: `output/**/session_*<company>*.md`

**If still not found:**
- `/edit-resume`: Tell user — "No session file exists. Run `/make-resume` first, or I can create a minimal one (JD Info + Framing Strategy inferred from .tex content)."
- `/critique`: Do 1-2 web searches to build minimal context. Note in critique: "No session file — framing context is approximate."
- `/make-cl`: Tell user — "No session file exists. Run `/make-resume` first."

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
5. Extract **phrasing signals only** into user memory at `/memories/cl_voice.md` — verbatim or near-verbatim phrases the user wrote. Do NOT draw structural conclusions (e.g. "always drop the breadth paragraph"). Just record the wording as evidence of how the user talks.
6. Save the current .tex as the new `.generated.tex` baseline (overwrite) so the next diff is clean:
   `cp output/<FolderName>/e2e_<name>_cover_letter.tex output/<FolderName>/e2e_<name>_cover_letter.generated.tex`
7. Recompile: `bash scripts/safe-run.sh scripts/compile_tex.sh output/<FolderName>/e2e_<name>_cover_letter.tex`

**After /make-cl generation:** Always save `.generated.tex` immediately after generating any cover letter .tex, before the user has a chance to edit. This is the baseline.

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
2. `mkdir -p output/<FolderName>/`
3. Copy JD file into output folder: `cp JDs/<filename> output/<FolderName>/`
4. Write session file to `output/<FolderName>/session_<name>.md`
5. All subsequent output files (from ALL skills) go in this folder

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

## Session End Protocol

Before the session ends or user does `/clear`:

1. **Update session file Status** — reflects actual state (which phase completed, what's next)
2. **Update memory pointer** in `CLAUDE.md` Active Sessions
3. **If mid-phase:** Write a `## Resume Point` section to the session file noting exactly where you stopped and what remains
