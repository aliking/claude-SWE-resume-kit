---
name: pipeline-manager
description: "Run the full JD application pipeline for a single job description from start to finish. Orchestrates /make-resume, /make-cl, /critique, and /edit-resume as sequential checkpointed steps. Relays questions from sub-agents to the user and feeds answers back. Use when: starting a new application, resuming a mid-pipeline application, or running the full automated pipeline for a JD."
user-invocable: true
---

# /run-pipeline

**User input:** `$ARGUMENTS`

Parse `$ARGUMENTS`:
- JD file path (e.g., `JDs/acme_engineer.txt`) → start new pipeline from Phase 0
- JD URL (e.g., `https://...`) → run **JD URL Intake** (see `resume_builder/reference/shared_ops.md`) to fetch, normalize, and save the JD file first, then start pipeline from Phase 0 with the saved path
- Session file path (e.g., `output/Acme/session_acme_engineer.md`) → resume pipeline from current `## Orchestration State`
- Session name (e.g., `acme_engineer`) → find session file via derivation, resume
- `$ARGUMENTS` includes `Focus:`/`Emphasize:`/`Downplay:` → record as directives and pass to Phase 0
- Empty → check `CLAUDE.md` Active Sessions for a pipeline-active session; if found, offer to resume it; if none, ask for JD

---

## Safety Rules (ALWAYS ENFORCED)

**Accuracy > Relevance > Impact > ATS > Brevity**

This skill is an orchestrator — it does not generate resume content. All content generation happens in sub-agents. These rules apply to this skill's own outputs (progress messages, question relay, routing decisions).

- Read `config.md` before starting — if it does not exist, stop: "You need `config.md` before running the pipeline."
- Never fabricate pipeline state. If session Orchestration State is ambiguous, ask user to confirm before proceeding.

---

## Startup

1. Read `config.md` — verify it exists and contains Personal Info and Provenance Flags
2. Read `CLAUDE.md` — check Active Sessions for any pipeline-active session for this JD
3. Read `resume_builder/reference/checkpoint_registry.md` — load flow diagrams and checkpoint contracts
4. Read `resume_builder/reference/shared_ops.md` — load Orchestration Lifecycle rules

**Determine starting state:**

| Condition | Action |
|-----------|--------|
| JD path/URL provided, no session file exists | New pipeline — start at `make-resume.phase0.strategy-confirm` |
| JD path/URL provided, session file exists | Offer to resume or restart. If resume: read Orchestration State for current checkpoint. If restart: confirm with user before overwriting. |
| Session file/name provided | Resume at `Next Checkpoint` from `## Orchestration State` |
| Empty ARGS, pipeline-active session found in CLAUDE.md | Offer to resume that session |
| Empty ARGS, no pipeline-active session | Ask: "Which JD would you like to run the pipeline for?" |

**Pre-pipeline confirmation:**

Before starting a new pipeline (not a resume), show the user:
```
Starting pipeline for: [company] — [role title]
JD file: [path]
Directives: [list or "none"]
Starting at: make-resume.phase0.strategy-confirm

The pipeline will ask you questions at each key decision point.
Type "abort" at any time to pause and switch to manual mode.

Proceed? (yes / no)
```

---

## Delegation

After startup and confirmation, hand off fully to the `pipeline_orchestrator` agent:

```
Invoke pipeline_orchestrator with:
  session_file: <path or null for new pipeline>
  start_checkpoint: <checkpoint_id or null>
  jd_path: <path if new pipeline>
  directives: <directives string or null>
```

This skill's role ends at delegation. All subsequent loop management, sub-agent invocations, question relay, and file operations are handled by `pipeline_orchestrator`.

---

## Aborting Mid-Pipeline

If the user types "abort" at any point during pipeline execution:
1. The orchestrator writes final Orchestration State to session file
2. This skill presents the manual resume commands:
   ```
   Pipeline paused. To resume later:
     /run-pipeline output/<FolderName>/session_<name>.md

   To continue manually (next step):
     /clear
     <exact next skill command>
   ```
3. Updates `CLAUDE.md` Active Sessions

---

## Resuming a Paused Pipeline

When `$ARGUMENTS` is a session file path and `## Orchestration State` shows `Pipeline Active: false`:
- If `Next Checkpoint` is set → offer to resume from that checkpoint
- If `Next Checkpoint` is NONE → "Pipeline already complete for this session."
- If `Pipeline Error Log` has entries → surface them before resuming

---

## What Users Should Expect

At each checkpoint the pipeline will pause and ask questions. Common question points:
1. **After Phase 0** — confirm bundle, framing strategy, CL type, format
2. **After Phase 1** — approve bullet selections per position; answer any gap-fill questions
3. **After voice intake** — provide your motivation for this role/company
4. **After critique** — review the score and approve or request Tier 1 fixes
5. **After edit** — approve the applied changes
6. **User review** — inspect the final PDFs, make direct edits if desired

Questions within each checkpoint are grouped and asked together. You will not be interrupted mid-step.
