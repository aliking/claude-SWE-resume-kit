---
name: setup-update
description: Incrementally update sources, extractions, and KB outputs without duplicating existing work
user-invocable: true
---

# /setup-update

User input: $ARGUMENTS

Purpose:
Run an incremental update cycle after initial setup, avoiding duplicate extractions and unnecessary rebuilds.

Natural-language intent routing:
- "update my github sources for <org>" -> treat as github mode with org scope
- "refresh github data" -> treat as github mode and ask for scope
- "update sources" -> treat as sources mode
- "update extraction" or "refresh extraction" -> treat as extract mode
- "rebuild kb" or "update bundles" -> treat as build mode
- "what is stale" or "update status" -> treat as status mode

Parse $ARGUMENTS:
- Empty: full incremental scan (sources + extraction candidates + selective rebuild plan)
- "sources": intake and classify only new/changed sources
- "extract": run/update extraction candidates only
- "build": rebuild affected KB artifacts only
- "github": GitHub-only incremental intake planning
- "status": show current delta status and source freshness (only for sources marked updatable)

When user phrasing includes GitHub + an org or repo, map directly to github mode even if they do not use mode keywords.

---

## Startup

1. Read CLAUDE.md.
2. Read config.md (must exist and be populated).
3. Read knowledge_base/extractions/_INVENTORY.md (must exist).
4. Scan these locations and build a baseline map:
- knowledge_base/extractions/
- knowledge_base/sources/resume_inputs/
- knowledge_base/sources/performance_reviews/
- knowledge_base/sources/supporting_docs/
- knowledge_base/sources/repo_manifests/
- resume_builder/experience/
- resume_builder/bundles/
- resume_builder/support/

If config.md or _INVENTORY.md is missing, stop and run /getting-started first.

5. Read knowledge_base/sources/supporting_docs/_update_state.json if present.
	- If missing, initialize it on first write.

---

## Update State Model

Track source freshness and update policy in:
- knowledge_base/sources/supporting_docs/_update_state.json

Per-source record fields:
- source_key: stable identifier (org/repo/scope + file or manifest identity)
- source_type: github_export | repo_manifest | other
- scope: org name or repo full_name(s)
- updatable: true | false
- never_update_reason: optional text
- last_retrieved_at: when source evidence was last fetched
- last_extracted_at: when extraction last consumed the source
- last_checked_at: when status mode last evaluated freshness
- stale_after_days: default 60 unless overridden

Interpretation:
- updatable=true: include in stale-age checks and update recommendations
- updatable=false: never suggest updates; report as frozen/inactive source

How a source gets marked never-updating:
1. User explicitly says: "no, never update this source" (or equivalent)
2. During stale-check prompt, user declines update and confirms "do not check again"
3. Source is structurally non-updatable by user context (example: former employer org with no available access) and user confirms freeze

---

## Phase 0: Delta Detection

Classify each candidate source as one of:
- NEW: no matching extraction/evidence record found
- CHANGED: source exists previously but appears updated (new timestamp, new commit range, changed manifest notes)
- COVERED: already extracted and up-to-date
- UNSURE: potential overlap; needs user confirmation

Matching heuristics (use multiple signals):
- Extraction filename / work-item key similarity
- Repo full_name + PR numbers + commit SHAs for GitHub exports
- Manifest repo path + date/commit ranges
- Source filename and period

Required output table:
- candidate
- source path
- status (NEW/CHANGED/COVERED/UNSURE)
- rationale
- recommended action (extract/update/skip)

MANDATORY STOP:
Ask user to confirm actions for NEW/CHANGED/UNSURE before proceeding.

---

## Status Mode Freshness Check

When mode is status, perform a lightweight freshness review before any extraction planning.

Scope for this check:
1. GitHub export sources in knowledge_base/sources/supporting_docs/
2. Repo manifest sources in knowledge_base/sources/repo_manifests/

For each tracked source:
1. Resolve source_key in _update_state.json (create provisional record if missing)
2. Determine last activity timestamp:
	 - prefer last_retrieved_at
	 - fallback to file modified time when needed
3. Evaluate staleness only if updatable=true
4. If age > stale_after_days (default 60), mark STALE and suggest update
5. If updatable=false, mark FROZEN and do not suggest update

Required status output table:
- source_key
- source_type
- updatable (true/false)
- last_retrieved_at
- last_extracted_at
- age_days
- freshness (fresh/stale/frozen/unknown)
- suggestion

Stale-source interaction rule:
- If source is stale and user says "not now", ask:
	"Do you want me to keep checking this source in future status runs, or mark it never-update?"
- If user chooses never-update, set updatable=false and persist never_update_reason.
- If user keeps checking, leave updatable=true and keep stale suggestion for later.

---

## Phase 1: Incremental Source Intake

For each NEW/CHANGED source approved by user:

1. Ensure source is placed under correct folder in knowledge_base/sources/.
2. For local repos, ensure/refresh manifest in knowledge_base/sources/repo_manifests/.
3. For GitHub exports, ensure JSON file is present in supporting_docs/ and parse scope metadata.

### GitHub Incremental Rules

Avoid reprocessing previously captured windows.

Required inputs for github mode:
1. target login: GITHUB_TARGET value
2. scope (optional): --org <org_name> OR one/more --repo owner/repo
   - if scope is omitted, exporter defaults to all public repos owned by target user
3. prior export path (preferred) for deriving start-date

If target login is missing, ask for it before generating commands.
Ask for scope only when user intent does not clearly indicate org/repo/public mode.

Preferred evidence keys (in order):
1. PR number + repo full_name
2. Commit SHA + repo full_name
3. Issue number/comment URL + repo full_name
4. Export generated_at + scope metadata as fallback

Use exporter start-date filtering for incremental pulls:
- org scope:
	GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --org <org_name> --start-date <ISO-8601>
- selected repositories scope:
	GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --repo owner/repo --start-date <ISO-8601>
- target-public-repos scope (default when no scope flag is provided):
	GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --start-date <ISO-8601>
- set <ISO-8601> from last captured watermark per scope
- helper to derive start date from prior export generated_at:
	node scripts/derive_export_start_date.js --input <prior_export.json> --overlap-days 7 --quiet
- use helper output directly as --start-date
	GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --org <org_name> --start-date "$(node scripts/derive_export_start_date.js --input <prior_export.json> --overlap-days 7 --quiet)"
- include a small overlap window for safety, then dedupe by PR/SHA IDs

Fallback when start date is uncertain:
- run full export and dedupe strictly by IDs (PR numbers, SHAs, issue/comment URLs)

Store/update a local update state file:
- knowledge_base/sources/supporting_docs/_update_state.json

State structure:
- per scope (org or selected repos)
- last export generated_at
- observed repo-level latest contributed dates
- processed IDs hash sets or condensed summaries
- updatable flag and never-update metadata per source_key

---

## Phase 2: Incremental Extraction Plan

Build an extraction action plan with three operation types:
- CREATE: create new extraction file
- REFRESH: update existing extraction file with new evidence
- SKIP: no material change

Rules:
- Never duplicate existing extraction for same work item unless user explicitly requests split.
- For REFRESH operations, preserve prior validated claims and append new evidence with provenance notes.
- If confidence/regression risk appears, mark for manual review instead of auto-overwrite.

Required plan output:
- extraction target file
- operation (CREATE/REFRESH/SKIP)
- evidence added/changed
- risk level (low/medium/high)

MANDATORY STOP:
Ask user to approve the extraction plan before writing files.

---

## Phase 3: Execute Incremental Extractions

For approved CREATE/REFRESH items:
1. Run extraction logic equivalent to /setup-extract.
2. Update knowledge_base/extractions/_INVENTORY.md without duplicate rows.
3. Add provenance note: "incremental update" with date and source references.

Deduping requirement for inventory:
- unique key = extraction filename
- if row exists, update metadata columns rather than appending duplicate row

---

## Phase 4: Selective KB Rebuild

Only rebuild affected artifacts by dependency:

1. If extraction files changed:
- update relevant experience files first
2. If experience files changed:
- update skills taxonomy, evidence index, reframing guide as needed
3. If role-type priorities changed or many cross-cutting updates:
- rebuild bundles

Provide minimal rebuild plan first:
- files to regenerate
- reason each is stale

MANDATORY STOP:
Ask user whether to run selective rebuild or full /setup-build-kb.

---

## Phase 5: Completion Report

Report:
- sources scanned
- NEW/CHANGED/COVERED counts
- extraction files created/refreshed/skipped
- inventory rows updated
- KB artifacts rebuilt
- unresolved UNSURE items

Also include:
- residual risks
- suggested next command (e.g., /setup-build-kb build, /setup-extract <path>)

MANDATORY STOP:
Wait for user follow-up.

---

## Safety and Overclaiming Controls

1. Do not infer stronger ownership solely from repeated commits.
2. Do not infer proficiency level solely from repo language mix.
3. Treat first-contributor signals as ownership indicators, not sole-authorship proof.
4. Preserve provenance and confidence notes when refreshing existing extraction files.
5. Never remove prior extraction content without user approval.
