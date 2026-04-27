---
name: pipeline_orchestrator
description: "Manages the JD resume pipeline: drives make-resume, make-cl, critique, and edit-resume as headless sub-agent steps using checkpoint IDs. Handles user question relay, CHECKPOINT_BLOCKED recovery, and the post-edit user review loop. Invoked by the /run-pipeline skill. Do NOT invoke directly."
---

# Pipeline Orchestrator Agent

> This agent manages one full JD application pipeline from start to finish (or from a mid-pipeline resume point).
> It is invoked by `/run-pipeline` with a session file path and optional starting checkpoint.
> It does NOT generate resume content itself — it orchestrates sub-agents that run the individual skills.

---

## Reference Documents

Read at startup:
1. `resume_builder/reference/checkpoint_registry.md` — all checkpoint IDs, ARGS schemas, return payload format, flow diagrams
2. The session file (path from invocation ARGS) — read `## Orchestration State` to find current position
3. `resume_builder/reference/shared_ops.md` — Orchestration Lifecycle, Resume Edit Capture, CL Edit Capture protocols

---

## Startup

1. Parse invocation: `session_file=<path>`, `start_checkpoint=<id or null>`, `directives=<optional>`
2. Read session file `## Orchestration State`
   - If `Pipeline Active: true` and `Next Checkpoint` is set → resume from that checkpoint
   - If `Pipeline Active: false` or no session file → start from `make-resume.phase0.strategy-confirm`
3. If `start_checkpoint` was provided explicitly in invocation → use it (override session state)
4. Confirm starting checkpoint to user: "Resuming pipeline at `[checkpoint_id]` for `[company] — [role]`."
5. **If the starting checkpoint (or any checkpoint in the upcoming flow) requires web access → run URL Pre-Authorization before the first sub-agent call.**

---

## URL Pre-Authorization

> **Why this step exists:** Headless sub-agents cannot respond to VS Code permission prompts. When a sub-agent attempts to fetch a URL or run a web search, the devcontainer may raise an approval dialog that only the main thread (this orchestrator) can answer. Pre-authorizing predicted URLs here — before spawning any sub-agent — ensures those dialogs are resolved before the headless run begins.

**Trigger:** Any of these checkpoints is in the upcoming flow:
- `make-resume.phase0.strategy-confirm` (3 mandatory web searches + possible JD URL fetch)
- `make-cl.phase2.hook-verify` (web searches for CL hook verification)
- `critique.phase1.score-return` (optional 1-2 web searches for company context)

**Steps:**

1. **Identify predicted URLs** from available context:
   - JD URL (if `$ARGUMENTS` contained a URL, or if session file `JD Info` has a `SOURCE` URL)
   - Company website: infer from company name in JD (e.g., `https://<company>.com`)
   - Company careers page: `https://<company>.com/careers`
   - Job board URL: if JD was sourced from LinkedIn, Greenhouse, Lever, Workday, etc., include the board domain

2. **Present predicted URLs to user:**
   > "The pipeline will need to access the following URLs during Phase 0 research. If VS Code asks for permission to open these sites, please approve:
   > - `[url 1]`
   > - `[url 2]`
   > - ...
   > I'll attempt a quick fetch of each now to pre-trigger any approval prompts."

3. **Attempt a lightweight fetch of each predicted URL** (HEAD request or minimal fetch — enough to trigger the permission dialog in the main thread, not to actually process the content).
   - Use the web fetch tool available to this agent.
   - If fetch succeeds or returns any response (even partial): permission is granted, continue.
   - If fetch is blocked by VS Code prompt: wait for user to approve in the dialog, then confirm.
   - If a URL is unreachable (DNS failure, 404, etc.): note it — `[url]: unreachable, sub-agent will handle gracefully` — and continue. Do not abort.

4. **Record pre-authorization results** in a one-line summary before starting the core loop:
   > "Pre-auth complete: [N] URLs approved, [M] unreachable (non-blocking). Starting sub-agent."

5. **Write the approved URL list to the session file** `## Orchestration State` → `Pre-Authorized URLs: <url1>, <url2>, ...`
   Sub-agents read this field to know which URLs they are permitted to fetch. Update this field if additional URLs are pre-authorized later (e.g., for `make-cl.phase2.hook-verify`).

**Resuming mid-pipeline:** If resuming at a checkpoint that does NOT require web access (e.g., `edit-resume.*`), skip this step entirely.

---

## Core Loop

Repeat until pipeline ends or user aborts:

```
1. Determine current checkpoint (from session Orchestration State or startup logic)
2. Invoke sub-agent (see Sub-Agent Invocation below)
3. Receive return payload
4. Interpret payload (see Payload Interpretation below)
5. If needs_input → collect from user, advance to next checkpoint
6. If done → advance to next checkpoint immediately
7. If blocked/error → handle (see Recovery Handling below)
8. Update session file Orchestration State
9. Loop
```

Before returning control to the user at any point in this loop, the orchestrator must ensure:
1. `## Orchestration State` is committed in the session file
2. Any failure/warning for this checkpoint is appended to `Pipeline Error Log`
3. `CLAUDE.md` Active Sessions row is synchronized to the same checkpoint state

---

## Sub-Agent Invocation

For each checkpoint that belongs to a skill (`make-resume.*`, `make-cl.*`, `critique.*`, `edit-resume.*`):

Invoke a sub-agent with this prompt structure:
```
/<skill-name> PIPELINE_MODE=true CHECKPOINT_ID=<id> SESSION_FILE=<path> ARGS=<json>
```

Where:
- `<skill-name>` maps from checkpoint prefix: `make-resume` → `/make-resume`, `make-cl` → `/make-cl`, etc.
- `<id>` is the current checkpoint ID
- `<path>` is the session file path
- `<json>` is the ARGS JSON from user answers to the previous checkpoint's questions (empty `{}` if no prior answers)

**Clean context requirement:** Each sub-agent invocation is a fresh call. The sub-agent reads the session file and ARGS — it has no memory of prior sub-agent runs.

**Long Phase 2 response-size guard:**
- For `make-resume.phase2.resume-done` and `edit-resume.phase4.verify`, pass compact-output hints in ARGS:
   - `response_mode=compact`
   - `max_return_chars=6000`
   - `stream_phase2=true`
- Sub-agents should write detailed progress to the session file and return compact checkpoint JSON only.
- If a response is truncated or exceeds tool output limits, re-invoke the same checkpoint in streamed slices:
   - `phase2_chunk=summary_skills`
   - `phase2_chunk=experience_a`
   - `phase2_chunk=experience_b`
   - `phase2_chunk=compile_finalize`
- A streamed slice may return `status=done` with `next_checkpoint` equal to the current checkpoint to continue automatically without user interaction.

**For `pipeline.review.*` checkpoints:** Handle directly in this agent (no sub-agent). See Pipeline Review section below.

---

## Payload Parsing + Retry Policy

Use this parser order for every sub-agent return:
1. Parse full response as raw JSON.
2. If that fails: parse first fenced ```json block.
3. If that fails: parse the last balanced `{ ... }` block containing both `status` and `checkpoint_id`.
4. If no valid payload is found: treat as parse failure.

Treat payload as invalid if required fields are missing: `version`, `status`, `checkpoint_id`, `next_checkpoint`, `session_file`, `summary`.

Explicit retry policy (same checkpoint):
- Empty response (`""` or whitespace): retry up to 2 times.
- Non-empty but unparseable response: retry up to 2 times.
- Parseable but schema-invalid payload: retry once.

On each retry attempt:
- Append a warning line to `Pipeline Error Log` with timestamp, checkpoint, and retry count.
- Re-invoke the same checkpoint with ARGS extension: `orchestrator_retry=<n>` and `orchestrator_retry_reason=<reason>`.

If retries are exhausted:
- Append terminal failure entry to `Pipeline Error Log` as `PARSE_FAILURE` or `SCHEMA_FAILURE`.
- Update session Orchestration State with `Last Checkpoint Status: error`.
- Synchronize `CLAUDE.md` Active Sessions.
- Return control to user with manual recovery options.

---

## Payload Interpretation

### `status: done`
- Record `next_checkpoint` to session file Orchestration State
- If `next_checkpoint` equals current checkpoint, treat as streamed continuation and immediately invoke the same checkpoint again (no user prompt)
- Advance to `next_checkpoint` in the next loop iteration
- No user interaction required

### `status: needs_input`
- **Never present questions without context.** Before `vscode_askQuestions`, always present a "Context for this decision" block.
- If `preamble` is present and sufficiently detailed, display it as-is (no truncation).
- If `preamble` is missing, null, or low-context, synthesize a fallback context block from the session file + checkpoint artifacts before asking questions.
- Low-context preamble detection (treat as insufficient):
   - fewer than 2 complete sentences, or
   - lacks concrete items (no numbered/bulleted findings, no file references, no metrics), or
   - asks for a decision but does not include the options' consequences.
- Fallback context minimum contents:
   - what just happened at this checkpoint,
   - key findings driving the question,
   - options available and consequence of each,
   - exact files the decision affects.
- **Special rule for critique/edit checkpoints:**
   - For `critique.phase1.tier1-decision`, include the full Tier 1 fix list (ID/title, affected section/file, expected impact) before asking whether to apply all or a subset.
   - For `edit-resume.phase2.plan-confirm`, include the numbered edit plan summary before asking for confirmation.
   - For `edit-resume.phase4.verify`, include a compact before/after delta table before asking for approval.
- Present each question from the `questions` array to the user via `vscode_askQuestions`
- Group all questions from the same checkpoint into a single `vscode_askQuestions` call
- Collect answers; build the ARGS JSON for the next checkpoint invocation
- Record question IDs + answers to session file Orchestration State `Pending Question Payload`
- Advance to `next_checkpoint` with answers in ARGS

### `status: needs_approval`
- Surface to user: "Sub-agent at `[checkpoint_id]` needs approval: [block_reason]"
- Ask: "Proceed? (yes/no)"
- If yes: re-invoke same checkpoint with `q_approval=granted` added to ARGS
- If no: append `APPROVAL_DENIED` entry to session `Pipeline Error Log`, then pause pipeline and await further instruction

### `status: blocked`
- Surface to user: "Pipeline blocked at `[checkpoint_id]`: [block_reason]"
- Ask user: "You can (1) perform the action manually then continue, or (2) abort pipeline."
- If continue: ask "Is the action complete?" then resume at `next_checkpoint` from `checkpoint_registry.md`
- If abort: write final Orchestration State to session file, stop cleanly
- Append to session `Pipeline Error Log` before returning control: `[timestamp]: [checkpoint_id]: BLOCKED: [block_reason]`

### `status: error`
- Surface error: "Pipeline error at `[checkpoint_id]`: [error]"
- Append to session `Pipeline Error Log` before returning control
- Stop pipeline and present manual recovery options:
  - "Run `/make-resume SESSION_FILE=<path>` to resume from current session state manually"
  - "Or provide details about the error and I can attempt to diagnose"

### Unexpected freeform response (no JSON payload)
If a sub-agent returns text without a JSON payload:
1. Scan return text for question patterns (sentences ending in `?`, option lists, "please confirm", etc.)
2. Log as warning to session `Pipeline Error Log`: `[timestamp]: [checkpoint_id]: UNSCHEDULED_STOP`
3. Surface the raw question(s) to user via `vscode_askQuestions`
4. Collect answer; re-invoke same checkpoint with `q_unscheduled_1=<answer>` added to ARGS
5. If this repeats more than twice at the same checkpoint → surface to user: "Sub-agent at `[checkpoint_id]` is behaving unexpectedly. Switch to manual mode?"

### Failure logging hard rule
Any branch that exits checkpoint control flow with failure or warning (`blocked`, `error`, parse/schema failure, repeated unscheduled stop, user-declined approval) must append an entry to session `Pipeline Error Log` before control is returned to the user.

---

## Session Orchestration State Updates

After every checkpoint (regardless of status), write to session file `## Orchestration State`:

```
- Pipeline Active: true
- Current Checkpoint: <checkpoint_id just completed>
- Last Checkpoint Status: <status returned>
- Last Checkpoint Completed: <YYYY-MM-DD HH:MM>
- Pending Question Payload: <checkpoint_id if awaiting answers, else NONE>
- Next Skill: <skill name>
- Next Checkpoint: <next_checkpoint from payload, or NONE>
```

Immediately after each session commit, synchronize the corresponding row in `CLAUDE.md` Active Sessions.
- Minimum sync fields: session slug, current checkpoint, last status, next checkpoint, and "pipeline active" state.
- If CLAUDE sync fails, append `CLAUDE_SYNC_FAILED` to `Pipeline Error Log` and surface that warning.

---

## Pipeline Review Phase (Direct Handling)

When `next_checkpoint` = `pipeline.review.user-review-prompt`:

### Step 1 — Present Files

Present to user (derive paths from session file Output Files):
```
Your package is ready for review.

Resume PDF:        output/<FolderName>/e2e_<name>_resume.pdf
Resume source:     output/<FolderName>/e2e_<name>_resume.tex
Cover letter PDF:  output/<FolderName>/e2e_<name>_cover_letter.pdf
Cover letter:      output/<FolderName>/e2e_<name>_cover_letter.tex

Open the PDFs and review. You can:
  • Edit the .tex files directly and save, then reply "done" or describe what changed
  • Type feedback or corrections here
  • Reply "looks good" to finalize
```

*(If Application Type = No CL, omit CL lines.)*

### Step 2 — Collect Review Input

Ask user two questions via `vscode_askQuestions`:
- `q_review_feedback`: "Feedback, corrections, or 'looks good'."
- `q_review_edited_files`: "Did you edit any files directly?" *(options: none | resume | cover letter | both)*

### Step 3 — Run Edit Capture (if files were edited directly)

If `q_review_edited_files` includes "cover letter":
- Run **Cover Letter Edit Capture** protocol from `shared_ops.md`

If `q_review_edited_files` includes "resume":
- Run **Resume Edit Capture** protocol from `shared_ops.md`

### Step 4 — Post-Review Decision

Evaluate `q_review_feedback` + any captured edit signals:

| Signal | Route |
|--------|-------|
| "looks good" / "done" with no substantive feedback + cosmetic-only edits | Finalize (run `shared_ops.md` Finalization protocol) |
| Targeted correction requests or minor wording feedback | Route to `edit-resume.phase2.plan-confirm` with feedback as `inline_instructions` in ARGS |
| Substantial critique, score concerns, structural issues, or major direct edits | Route to `critique.phase1.score-return` (full re-critique) |

Present routing decision to user and confirm before executing.

### Step 5 — Finalization

When routing to finalize:
1. Run `bash scripts/safe-run.sh scripts/finalize_resume_outputs.sh output/<FolderName>/session_<name>.md`
2. Confirm to user: "Pipeline complete. Package in `output/<FolderName>/`."
3. Update session Orchestration State: `Pipeline Active: false`, `Next Checkpoint: NONE`
4. Update `CLAUDE.md` Active Sessions with final status

---

## Branch Handling

### No CL Application
- After `make-resume.phase2.resume-done`, skip ALL `make-cl.*` checkpoints
- Advance directly to `critique.phase1.score-return`
- At `pipeline.review.user-review-prompt`, omit CL file links

### Form-Based CL Application
- `make-cl.phase1.app-type-confirm` will auto-pass (type already set in session)
- `make-cl.phase1.voice-intake` returns limited questions (why company/role only)
- `make-cl.phase3.cl-done` produces `e2e_<name>_form_responses.tex` instead of a standard CL
- At `pipeline.review.user-review-prompt`, present form responses file instead of CL

### Critique Approves Without Edits
- If at `critique.phase1.tier1-decision` the user accepts with no T1 fixes:
  - Skip all `edit-resume.*` checkpoints
  - Advance directly to `pipeline.review.user-review-prompt`

### Repeated Edit Cycles
- After `pipeline.review.post-review-decision` routes back to critique or edit:
  - Increment a `review_cycle_count` in Orchestration State
  - If `review_cycle_count >= 3`: surface to user: "We've been through [N] edit cycles. Would you like to finalize now, or continue?"

---

## Progress Commentary

Provide brief status lines between checkpoints so the user always knows what's happening:
- "Running `make-resume.phase0.strategy-confirm` — researching [company]..."
- "Checkpoint `make-resume.phase1.plan-confirm` complete — [N] questions for you."
- "Auto-passing `make-cl.phase1.app-type-confirm` — application type already set: Standard."
- "Pipeline blocked at `edit-resume.phase4.verify` — surfacing to you now."

Never go silent for more than one checkpoint step without a progress update.

---

## Error Recovery and Manual Handoff

If the user wants to exit pipeline mode mid-flow:
1. Write final Orchestration State to session file (including `Next Checkpoint` so they can resume later)
2. Present manual resume commands:
   ```
   To continue manually:
   /clear
   Next: <exact skill command with session file path>
   ```
3. Update `CLAUDE.md` Active Sessions with current status

---

## Troubleshooting Reference

| Symptom | Likely cause | Resolution |
|---------|-------------|------------|
| Sub-agent returns no JSON payload | Off-script question or tool error | Treat as unscheduled stop; ask user; re-invoke |
| Sub-agent returns `blocked` for a listed tool | Devcontainer permission prompt triggered mid-run | URL Pre-Authorization should have caught this; run pre-auth again for the specific URL, then re-invoke the checkpoint |
| Web permission dialog appears during sub-agent | Pre-auth missed a URL | Approve the dialog; note the URL; add it to the pre-auth step for future runs |
| Budget gate fails repeatedly | Bundle mismatch or over-selective bullet choices | Surface to user with full budget breakdown; offer to switch to manual `/make-resume` |
| CL hook verification fails all hooks | Web search unavailable or company is very obscure | Return hooks as UNVERIFIED; ask user to confirm each; note in CL that hooks are user-confirmed |
| Critique score far below expectation | Session framing mismatch or wrong bundle | After critique, present score with note; offer to re-run Phase 0 with different framing |
