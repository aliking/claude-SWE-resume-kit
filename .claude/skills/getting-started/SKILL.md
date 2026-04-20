---
name: getting-started
description: Guided initial setup for config, inventory, source intake, local repo manifests, and GitHub contribution export
user-invocable: true
---

# /getting-started

User input: $ARGUMENTS

Purpose:
Run a guided first-time setup that prepares the knowledge base for high-quality extraction.

## Startup Checklist

1. Read CLAUDE.md and config.md or config.template.md.
2. Ensure required setup files exist with correct names.
3. Propose source files to add under knowledge_base/sources/.
4. Collect local repository paths and create repo manifest markdown files.
5. Collect GitHub contribution evidence using scripts/export_github_contributions.js.
6. Confirm what to extract first.

## File Name Normalization

Normalize setup files before anything else:

1. Config file:
- If config.md exists: use it.
- Else if config.template.md exists: duplicate config.template.md to config.md. prompt user for basic details to populate config.md if needed.

2. Inventory file:
- Preferred file: knowledge_base/extractions/_INVENTORY.md
- If _INVENTORY.md exists: use it.
- Else if knowledge_base/extractions/_INVENTORY.template.md exists: copy template to _INVENTORY.md and clear out example data

After normalization, show a short status block:
- config: ready or missing
- inventory: ready or missing

## Source Intake Suggestions

Scan and propose likely high-value sources to add:
- knowledge_base/sources/resume_inputs/
- knowledge_base/sources/performance_reviews/
- knowledge_base/sources/supporting_docs/
- knowledge_base/sources/repo_manifests/

Prioritize suggestions in this order:
1. Performance reviews and manager feedback docs
2. Existing resumes/CVs
3. Major project docs, launch notes, incident writeups
4. Repo manifests and GitHub contribution exports

Prompt user for missing items:
- "Any additional PDFs/docs to add now?"
- "Any sensitive docs to exclude?"

## Local Repository Intake

Ask user for local repository paths (absolute or workspace-relative).
For each path, gather:
- repo path
- branch (default main)
- commit/date range to include (optional)
- directories to focus on (optional)
- exclusions (generated/vendor/secrets)
- one-line context: what this repo proves

Create one manifest per repo under:
- knowledge_base/sources/repo_manifests/<repo_name>_manifest.md

Manifest template:

```markdown
# <repo_name> Manifest

- Repo path: <absolute or workspace-relative path>
- Branch: <branch>
- Range: <commits/dates or "full history">
- Focus paths: <paths or "entire repo">
- Exclusions: <paths/globs or "none">
- Evidence purpose: <why this repo is relevant>

## Candidate Evidence
- Key modules/files:
- Important commits/PR refs:
- Metrics/results to verify:
- Confidentiality notes:
```

## GitHub Contribution Intake

Use scripts/export_github_contributions.js for contribution evidence.

### Scenario A: User has repo access to an organization
Guide user to run:
- GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --org <org_name>

Optional quick validation:
- add --test

### Scenario B: User does not have repo access to an organization
Prepare copy-paste instructions for a former coworker:
- They run the same command with their token and target set to the user login.
- They return the resulting JSON file.
- Store returned JSON in knowledge_base/sources/supporting_docs/.

### Scenario C: Personal repos or public OSS contributions
Use explicit repo mode:
- GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --repo owner/repo
- Repeat --repo for multiple repositories.

Use this mode when org-wide scan is not possible or unnecessary.

### Expected output
- One JSON file in current directory (default name based on org or output flag).
- Move/keep it under knowledge_base/sources/supporting_docs/ for extraction.

## Quality Gates Before Extraction

Confirm all are true:
1. config.md exists and is populated
2. _INVENTORY.md exists
3. At least one source file exists in knowledge_base/sources/
4. Local repo manifests exist for chosen local repos
5. Optional GitHub JSON export exists when applicable

If any gate fails, stop and ask for the missing item.

## Handoff to Extraction

Once ready, propose first extraction command candidates.
Examples:
- /setup-extract knowledge_base/sources/supporting_docs/<github_export>.json
- /setup-extract knowledge_base/sources/repo_manifests/<repo_manifest>.md
- /setup-extract knowledge_base/sources/performance_reviews/<review>.pdf

Ask user which candidate to start with.

MANDATORY STOP:
Wait for explicit user choice before running setup-extract.
