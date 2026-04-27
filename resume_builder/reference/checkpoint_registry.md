# Checkpoint Registry

> Canonical reference for all pipeline checkpoint IDs, contracts, and flow.
> Read by: `pipeline_orchestrator.agent.md` and all skills in Pipeline Mode.
> Update this file whenever a checkpoint ID, arg field, or return schema changes.

---

## Checkpoint ID Format

`<skill>.<phase>.<intent>`

- `skill` ∈ `make-resume` | `make-cl` | `critique` | `edit-resume` | `pipeline`
- `phase` ∈ `phase0` | `phase1` | `phase2` | `phase3` | `phase4` | `phase5` | `review`
- `intent` — short lowercase kebab descriptor of the stop purpose

IDs are **stable** — never rename after first use. To deprecate: add `(deprecated since YYYY-MM-DD, replaced by <new_id>)` and keep the entry.

---

## Return Payload Schema

Every skill checkpoint returns a JSON block as its final output:

```json
{
  "version": "1",
  "status": "done | needs_input | needs_approval | blocked | error",
  "checkpoint_id": "<current checkpoint id>",
  "next_checkpoint": "<next expected checkpoint id, or null if pipeline ends>",
  "session_file": "<path to session file>",
  "output_files": ["<path>"],
   "preamble": "<multi-sentence context block shown to user before questions — mandatory and non-empty when status=needs_input; null otherwise>",
  "questions": [
    {
      "id": "<q_id>",
      "text": "<question text for user>",
      "options": ["<option>"],
      "required": true
    }
  ],
  "block_reason": "<description — only if status=blocked>",
  "error": "<description — only if status=error>",
  "summary": "<one-line human-readable summary of what was done>"
}
```

Output-size rule (all checkpoints, strict in Phase 2):
- Return payload must be compact JSON only; do not include long debug dumps or full generated content.
- Keep `summary` concise (single line).
- Detailed progress belongs in the session file, not checkpoint return text.
- For long-running Phase 2 work, emit compact streamed slices (see `make-resume.phase2.resume-done` contract).

**`preamble` guidelines (required for `needs_input`):**
- Write 3-6 sentences summarizing what the sub-agent found and decided before asking the questions.
- Include concrete details (metrics, bullet/fix IDs, file/section targets) and avoid generic prompts.
- Include options and consequence summary when asking for a decision.
- Never ask a decision question with only a generic one-liner preamble.
- For `phase0.strategy-confirm`: include company overview, role-to-bundle match rationale, recommended framing angle, and any notable gaps or flags found in the JD.
- For `phase1.plan-confirm`: include total planned bullet count per position, which experience files were matched, any positions with thin evidence, and any gap-fill questions triggered.
- For `make-cl` voice-intake: include confirmed app type, detected CL tone signals from the JD, and any specifics from the job posting that should influence the CL.
- For `critique` score-return: include overall score, top 2-3 strengths, and top Tier 1 issues.
- For `critique.phase1.tier1-decision` (when `needs_input`): include a numbered Tier 1 fix table with each fix's short label, affected section/file, and expected score/readability impact.
- Preamble is **displayed verbatim** to the user before questions. Write in second person addressed to the applicant.

### Context Sufficiency Requirement (All Pipeline Questions)

For every checkpoint returning `status=needs_input`, the user must receive enough context to answer without opening source files first.

Minimum required context before questions:
- What was evaluated or changed in this checkpoint
- Key findings that triggered the question
- Decision options and implications
- Affected files/sections

If a sub-agent cannot provide full context in the payload, the orchestrator must synthesize and prepend it from session artifacts before prompting the user.

**Status meanings:**
| Status | Meaning | Orchestrator action |
|--------|---------|---------------------|
| `done` | Checkpoint completed, no user input needed | Advance to `next_checkpoint` immediately |
| `needs_input` | User must answer questions before next step | Collect answers via `vscode_askQuestions`, re-invoke next checkpoint with answers in ARGS |
| `needs_approval` | Unexpected approval gate hit | Surface description to user, collect decision, re-invoke |
| `blocked` | Sub-agent hit an operation not in its Approved Tool Manifest | Surface `block_reason` to user, offer manual workaround, resume at next checkpoint |
| `error` | Fatal execution error | Surface to user, log to pipeline_error_log, stop pipeline |

Parser resiliency expectation:
- Orchestrator may recover payload from fenced JSON or trailing balanced JSON blocks.
- Sub-agents should still emit a single canonical JSON block as final output.

---

## Pipeline Flow Diagrams

### Standard Application (with CL)

```
make-resume.phase0.strategy-confirm
   ↓ ARGS: q_bundle, q_framing, q_cl_type, q_format
make-resume.phase1.plan-confirm
   ↓ ARGS: q_bullets_<slug> per position, q_gap_<n> (optional)
make-resume.phase1.budget-gate              ← auto-passes if budget OK
   ↓ ARGS: q_budget_reconcile (only if gate FAIL)
make-resume.phase2.resume-done
   ↓
make-cl.phase1.app-type-confirm             ← auto-passes if type already set from Phase 0
   ↓ ARGS: q_cl_app_type (if not already set)
make-cl.phase1.voice-intake
   ↓ ARGS: q_why_company, q_why_role, q_tone, q_avoid, q_raw_quote
make-cl.phase2.hook-verify
   ↓ ARGS: q_hook_<n> (only if unverified hooks)
make-cl.phase3.cl-done
   ↓
critique.phase1.score-return
   ↓ ARGS: q_score_ack, q_evidence_<n> (optional)
critique.phase1.tier1-decision
   ↓ ARGS: q_t1_apply
edit-resume.phase2.plan-confirm             ← only if Tier 1 fixes selected
   ↓ ARGS: q_edit_plan, q_prov_defense_<n> (optional)
edit-resume.phase4.verify
   ↓ ARGS: q_edit_verify
edit-resume.phase5.accept
   ↓
pipeline.review.user-review-prompt          ← USER INSPECTS FILES DIRECTLY
   ↓ ARGS: q_review_feedback, q_review_edited_files
pipeline.review.cl-edit-capture             ← only if CL was edited directly
pipeline.review.resume-edit-capture         ← only if resume was edited directly
pipeline.review.post-review-decision
   ↓ routes to: re-critique | targeted edit | finalize
```

### No CL Application

```
make-resume.phase0.strategy-confirm         [q_cl_type → "No CL"]
   ↓ ...make-resume checkpoints...
make-resume.phase2.resume-done
   ↓ (skip ALL make-cl checkpoints)
critique.phase1.score-return
   ↓ ...critique / edit / review as normal...
```

### Form-Based CL Application

```
make-resume.phase0.strategy-confirm         [q_cl_type → "Form-based"; form questions recorded]
   ↓ ...make-resume checkpoints...
make-resume.phase2.resume-done
   ↓
make-cl.phase1.app-type-confirm             ← auto-passes (type already set)
   ↓
make-cl.phase1.voice-intake                 ← limited to "why company/role" questions
   ↓
make-cl.phase2.hook-verify
   ↓
make-cl.phase3.cl-done                      ← produces form_responses.tex instead of cover_letter.tex
   ↓ ...critique / edit / review as normal...
```

---

## Checkpoint Contracts

> Format: Precondition → ARGS accepted → Execution summary → Return fields → Postcondition

---

### make-resume

#### `make-resume.phase0.strategy-confirm`
- **Precondition:** Phase 0: PENDING, or no session file yet
- **Web access required:** Yes — 2-3 web searches (mandatory) + JD URL fetch (if URL was provided). Orchestrator runs URL Pre-Authorization before invoking this checkpoint.
- **ARGS fields:** `{ "version": "1", "jd_path": "<path>", "directives": "<optional focus/emphasize/downplay text>" }`
- **Execution:** Full Phase 0 — web research (2-3 searches), JD analysis, requirements table, company context, framing strategy, CL type detection, create output folder, write session file
- **Return status:** `needs_input`
- **Questions returned:**
  - `q_bundle`: "Role type detected: [X] → Bundle: [Y]. Confirm, or specify different bundle."
  - `q_framing`: "Lead narrative: [summary]. Reframing map: [X→Y, …]. Any adjustments?"
  - `q_cl_type`: "Application type detected: [X]. Confirm?" *(options: Standard | No CL | Form-based)*
  - `q_format`: "Format: [N]-page resume. Confirm?"
- **Postcondition written to session:** Phase 0: DONE; session file written at `output/<FolderName>/session_<name>.md`

#### `make-resume.phase1.plan-confirm`
- **Precondition:** Phase 0: DONE, Phase 1: PENDING
- **ARGS fields:** `{ "version": "1", "q_bundle": "...", "q_framing": "...", "q_cl_type": "Standard|No CL|Form-based", "q_format": "..." }`
- **Execution:** Apply confirmations to session file framing strategy and CL type; run full Phase 1 — read bundle + all experience files, build bullet plan tables per position, prepare up to 2 gap-fill questions
- **Return status:** `needs_input`
- **Questions returned:**
  - `q_bullets_<slug>` (one per position, slug = lowercase position name): "Bullet plan for [Position]: [table]. Confirm or modify selections."
  - `q_gap_<n>` (if gap questions prepared, up to 2): gap-fill question text
- **Postcondition written to session:** Bullet Plan tables written; Phase 1: PENDING (completed after budget-gate)

#### `make-resume.phase1.budget-gate`
- **Precondition:** Phase 1 PENDING; bullet confirmations in ARGS
- **ARGS fields:** `{ "version": "1", "q_bullets_<slug>": "<confirmed or modified plan>", ..., "q_gap_<n>": "..." }`
- **Execution:** Apply bullet confirmations + gap answers; update session Bullet Plan; run budget gate against `resume_reference.md` Budget Card
- **Return status:** `done` (auto-pass, next: `make-resume.phase2.resume-done`) OR `needs_input` if budget FAIL
- **Questions returned (if FAIL only):**
  - `q_budget_reconcile`: "Budget: [N] bullets vs target [T]. Which bullets to drop or shorten? [list options]"
- **Postcondition written to session:** Phase 1: DONE ([N] bullets confirmed); confirmed Bullet Plan finalized

#### `make-resume.phase2.resume-done`
- **Precondition:** Phase 1: DONE
- **ARGS fields:** `{ "version": "1" }` (or `{ "q_budget_reconcile": "..." }` if reconciliation was needed)
   - Optional streaming controls from orchestrator:
      - `response_mode`: `compact`
      - `max_return_chars`: integer
      - `stream_phase2`: `true|false`
      - `phase2_chunk`: `summary_skills|experience_a|experience_b|compile_finalize`
- **Execution:** Full Phase 2 — generate Summary, Skills, all position bullets; char count gate after each position; compile; page fill gate; save .tex and compile to .pdf.
   - If `stream_phase2=true`, run as compact slices, writing detailed progress to session state.
- **Return status:** `done`
- **Streaming continuation:** When a slice completes but Phase 2 is not fully done, return `done` with `next_checkpoint` set to `make-resume.phase2.resume-done`.
- **Next checkpoint:** `make-cl.phase1.app-type-confirm` (Standard/Form-based) OR `critique.phase1.score-return` (No CL)
- **Postcondition written to session:** Phase 2: DONE; `e2e_<name>_resume.tex` + `.pdf` written

---

### make-cl

#### `make-cl.phase1.app-type-confirm`
- **Precondition:** Phase 2 Resume: DONE; Cover Letter: PENDING
- **ARGS fields:** `{ "version": "1" }`
- **Execution:** Read session Application Type. If already set → auto-pass. If unset or ambiguous → return question.
- **Return status:** `done` (auto-pass, next: `make-cl.phase1.voice-intake`) OR `needs_input`
- **Questions returned (only if unknown):**
  - `q_cl_app_type`: "Does this application accept a cover letter? (1) Standard CL, (2) No CL — resume only, (3) Form-based — paste questions."
  - `q_form_questions` (if form-based selected): "Paste the application form questions."
- **Postcondition written to session:** Application Type set if was previously unknown

#### `make-cl.phase1.voice-intake`
- **Precondition:** Application Type confirmed in session; Cover Letter: PENDING or IN_PROGRESS
- **ARGS fields:** `{ "version": "1", "q_cl_app_type": "..." }` (if just set in previous checkpoint; omit if type was already known)
- **Execution:** Apply app type to session file if just set; set Cover Letter: IN_PROGRESS; prepare voice intake questions
- **Return status:** `needs_input`
- **Questions returned:**
  - `q_why_company`: "Why this company specifically? (blunt, in your own words)"
  - `q_why_role`: "Why this role specifically?"
  - `q_tone`: "Tone for the opening?" *(options: direct | warm | restrained | intense | other)*
  - `q_avoid`: "Any phrases or styles to avoid in the opening?"
  - `q_raw_quote`: "One sentence you'd actually say out loud about applying here."
- **Postcondition written to session:** Cover Letter: IN_PROGRESS

#### `make-cl.phase2.hook-verify`
- **Precondition:** Cover Letter: IN_PROGRESS; voice intake ARGS provided
- **Web access required:** Yes — web searches to verify CL hooks. Orchestrator should confirm web access is pre-authorized before invoking.
- **ARGS fields:** `{ "version": "1", "q_why_company": "...", "q_why_role": "...", "q_tone": "...", "q_avoid": "...", "q_raw_quote": "..." }`
- **Execution:** Record voice inputs to session file Cover Letter Plan; generate full CL (Standard) or form responses (Form-based); run CL Hook Verification Gate (web-search all factual hooks); compile
- **Return status:** `done` if all hooks verified (next: `make-cl.phase3.cl-done`) OR `needs_input` if unverified hooks
- **Questions returned (only if unverified hooks):**
  - `q_hook_<n>` (one per unverified hook): "UNVERIFIED hook: '[claim]'. Please confirm or correct."
- **Postcondition written to session:** CL .tex written and compiled; hook verification results recorded

#### `make-cl.phase3.cl-done`
- **Precondition:** CL generated and compiled; hooks resolved
- **ARGS fields:** `{ "version": "1", "q_hook_<n>": "confirmed | <corrected text>" }` (if unverified hooks existed)
- **Execution:** Apply any hook corrections; recompile if needed; verify word count and page count gates; update session Status Cover Letter: DONE
- **Return status:** `done`
- **Next checkpoint:** `critique.phase1.score-return`
- **Postcondition written to session:** Cover Letter: DONE; final `.tex` and `.pdf` written

---

### critique

#### `critique.phase1.score-return`
- **Precondition:** Phase 2 Resume: DONE; Cover Letter: DONE or N/A
- **Web access required:** Conditional — 1-2 web searches if session file lacks Company Context. Orchestrator should confirm web access is still authorized (or re-run pre-auth) if this is the pipeline entry point.
- **ARGS fields:** `{ "version": "1" }`
- **Execution:** Full critique protocol — read session file, run 8-dimension scoring, char count, visual PDF check, tiered improvements, prepare optional evidence questions (max 2 from User Context Checkpoint); save `critique_<name>.md`
- **Return status:** `needs_input`
- **Questions returned:**
  - `q_score_ack`: "Score: [N]/100. Tier 1 fixes: [list]. Approve, or add comments." *(freeform)*
  - `q_evidence_<n>` (up to 2, if evidence questions prepared): evidence / gap-fill question text
- **Postcondition written to session:** Critique: CURRENT (score N/100); `critique_<name>.md` written

#### `critique.phase1.tier1-decision`
- **Precondition:** Critique: CURRENT; user has reviewed score
- **ARGS fields:** `{ "version": "1", "q_score_ack": "approved | <comments>", "q_evidence_<n>": "..." }`
- **Execution:** Record evidence answers to session file Evidence Tracking; parse user response to determine Tier 1 fix scope; update session with T1 decision
- **Return status:** `done` (if user accepts as-is, next: `pipeline.review.user-review-prompt`) OR `needs_input` (if T1 scope unclear)
- **Preamble required (when `needs_input`):** concise recap of score context plus numbered Tier 1 fixes with impact and file/section target.
- **Questions returned (if unclear):**
   - `q_t1_apply`: "Apply all Tier 1 fixes, or specify which to skip? Include fix IDs from the list above." *(options: all | specify)*
- **Postcondition written to session:** Evidence Tracking updated; T1 fix list finalized; next step recorded

#### `critique.phase1.finalize`
- **Precondition:** T1 decision made; user provided `q_t1_apply` if needed
- **ARGS fields:** `{ "version": "1", "q_t1_apply": "all | <comma-separated subset>" }`
- **Execution:** Verify all expected package files exist; record T1 fix list to session; determine routing
- **Return status:** `done`
- **Next checkpoint:** `edit-resume.phase2.plan-confirm` (if T1 fixes selected) OR `pipeline.review.user-review-prompt` (if none)
- **Postcondition written to session:** T1 fix list in session; routing decision recorded

---

### edit-resume

#### `edit-resume.phase2.plan-confirm`
- **Precondition:** Critique: CURRENT; `.tex` files exist
- **ARGS fields:** `{ "version": "1", "q_t1_apply": "all | <subset>", "critique_file": "<path>", "inline_instructions": "<optional additional user instructions>" }`
- **Execution:** Load Phase 1 context (session file, .tex, critique file); run Phase 2 — build edit plan from T1 fixes + inline instructions; check for provenance defense questions (risky REMOVE/MODIFY items); run budget revalidation; record Edit N baseline
- **Return status:** `needs_input`
- **Questions returned:**
  - `q_edit_plan`: "Edit plan ([N] changes): [numbered list with what/why/classification]. Confirm or modify."
  - `q_prov_defense_<n>` (one per risky removal, if any): "Before removing '[phrase]', can you defend it with evidence from a specific project?"
- **Postcondition written to session:** Edit [N] Baseline recorded; edit plan written to session

#### `edit-resume.phase2.provenance-defense` *(optional — emitted only if risky removals exist)*
- **Precondition:** Edit plan has REMOVE/MODIFY items flagged as low-confidence
- **ARGS fields:** `{ "version": "1", "q_edit_plan": "confirmed", "q_prov_defense_<n>": "..." }`
- **Execution:** Apply defense answers to edit plan (REMOVE→MODIFY where evidence provided); record to Evidence Tracking in session file
- **Return status:** `done`
- **Next checkpoint:** `edit-resume.phase4.verify`
- **Postcondition written to session:** Final edit plan updated; Evidence Tracking appended

#### `edit-resume.phase4.verify`
- **Precondition:** Edit plan confirmed (via plan-confirm or provenance-defense)
- **ARGS fields:** `{ "version": "1", "q_edit_plan": "confirmed | <modified plan>", ...defense answers if applicable }`
- **Execution:** Execute all confirmed edits one section at a time; char count gate after each section; fix violations before next section; compile; page fill check; append Edit History to session file
- **Return status:** `needs_input`
- **Questions returned:**
  - `q_edit_verify`: "Edits applied. [before/after delta table]. Approve or request further changes." *(freeform)*
- **Postcondition written to session:** `.tex` edited and compiled; Edit [N] Status updated; Edit History appended; Critique: STALE

#### `edit-resume.phase5.accept`
- **Precondition:** Edits applied; gates passed; user responded to verify question
- **ARGS fields:** `{ "version": "1", "q_edit_verify": "approved | <further requests>" }`
- **Execution:** If `q_edit_verify` contains further requests → extend edit plan, re-execute, re-verify; else finalize. Update session.
- **Return status:** `done`
- **Next checkpoint:** `pipeline.review.user-review-prompt`
- **Postcondition written to session:** Critique: STALE; final `.tex` and `.pdf` written; session Status updated

---

### pipeline (managed directly by orchestrator — no sub-agent invocation)

#### `pipeline.review.user-review-prompt`
- **Managed by:** Orchestrator agent directly
- **Execution:** Present compiled PDF and `.tex` file links to user; explicitly pause pipeline; prompt user to make direct edits in `.tex` files OR type text feedback
- **User prompt presented by orchestrator:**
  > "Your package is ready for your review:
  > - Resume PDF: `output/<FolderName>/e2e_<name>_resume.pdf`
  > - Resume source: `output/<FolderName>/e2e_<name>_resume.tex`
  > - Cover letter PDF: `output/<FolderName>/e2e_<name>_cover_letter.pdf`
  > - Cover letter source: `output/<FolderName>/e2e_<name>_cover_letter.tex`
  >
  > Open the PDF(s) and review. You can:
  > - Edit the `.tex` file(s) directly and save them, then reply "done" or describe what you changed
  > - Type feedback or corrections here
  > - Reply "looks good" to finalize"
- **Questions:**
  - `q_review_feedback`: "Feedback, corrections, or 'looks good'." *(freeform)*
  - `q_review_edited_files`: "Did you edit any files directly?" *(options: none | resume | cover letter | both)*
- **Next checkpoint:** `pipeline.review.cl-edit-capture` (if CL edited) OR `pipeline.review.resume-edit-capture` (if resume edited) OR `pipeline.review.post-review-decision` (if neither)

#### `pipeline.review.cl-edit-capture`
- **Managed by:** Orchestrator agent directly
- **Execution:** Run Cover Letter Edit Capture protocol from `shared_ops.md` (pdftotext diff, signal classification, update session + `output/CL_VOICE_SIGNALS.md`); recompile CL
- **Next checkpoint:** `pipeline.review.resume-edit-capture` OR `pipeline.review.post-review-decision`

#### `pipeline.review.resume-edit-capture`
- **Managed by:** Orchestrator agent directly
- **Execution:** Run Resume Edit Capture protocol from `shared_ops.md` (pdftotext diff on resume, classify signals, update session `## Resume Edit Signals`, append to `output/RESUME_EDIT_SIGNALS.md`); recompile resume
- **Next checkpoint:** `pipeline.review.post-review-decision`

#### `pipeline.review.post-review-decision`
- **Managed by:** Orchestrator agent directly
- **Execution:** Evaluate user feedback + edit signals captured:
  - Significant text changes or substantive critique feedback → re-critique: route to `critique.phase1.score-return`
  - Minor corrections or targeted fixes → route to `edit-resume.phase2.plan-confirm` with `inline_instructions` set from feedback
  - "looks good" / cosmetic-only edits → run finalization (shared_ops.md Finalization protocol)
- **Next checkpoint:** `critique.phase1.score-return` OR `edit-resume.phase2.plan-confirm` OR `DONE`

---

## ARGS Version Policy

All ARGS JSON objects must include `"version": "1"`. On version mismatch, skills return `blocked` with explanation: `"ARGS version mismatch: expected 1, got <N>"`.

## Naming Policy

Checkpoint IDs are stable after first use. Never rename a published ID. To deprecate: append `(deprecated YYYY-MM-DD, replaced by <new_id>)` to its section header and keep the entry.
