---
name: setup-extract
description: Extract structured information from projects, initiatives, repositories, or documentation into knowledge base extractions
user-invocable: true
---

# /setup-extract

**User input:** `$ARGUMENTS`

Parse `$ARGUMENTS`:
- File path to a project or initiative (e.g., `knowledge_base/sources/supporting_docs/ecommerce_platform.md`) → read that file
- Multiple paths separated by spaces → batch mode (process each sequentially)
- Empty → ask the user for the source path or paste content

### Source Modes (auto-detect from input paths)
- **resume-pdf mode:** Resume PDF files with bullet points (claim seeds)
- **git-repo mode:** Local repository paths (contribution evidence)
- **review-pdf mode:** Annual/performance review PDFs (impact and non-technical evidence)
- **mixed mode:** Multiple source types for one work item (recommended for strongest provenance)

---

## Startup

1. Read `CLAUDE.md` — check KB Corrections Log for known issues
2. Read `config.md` — load Personal Info (to identify user's role), Provenance Flags
3. Read `knowledge_base/extractions/_INVENTORY.md` — see what's already extracted, avoid duplicates

If the work item is already in the inventory:
- Show the existing extraction path
- Ask: "This item is already extracted. Re-extract (overwrite) or skip?"
- Wait for user response before proceeding

---

## Phase 0: Source Intake & Candidate Mapping

Before deep extraction:
1. Detect source mode for each input path
2. Parse each source into candidate work items
3. Build a candidate map showing likely duplicates across sources

**Candidate map output (required):**
- Candidate work item title
- Source evidence (`resume_pdf` bullets, `repo` path/range, `review_pdf` section)
- Confidence preview (`high`/`medium`/`low`)

### >>>>>> MANDATORY STOP — DO NOT PROCEED <<<<<<
Present candidate map and ask:
1. Which candidates should be merged as one work item?
2. Which candidates should stay separate?
3. Any candidates to drop due to sensitivity or irrelevance?
**You MUST wait for the user's explicit text response before continuing.**

---

## Phase 1: Read & Understand the Work Item

Read the source using the appropriate method:
- **Markdown or text files:** Read directly for project, initiative, or culture-program descriptions
- **PDF reports:** Use the Read tool
- **Resume PDFs:** Treat bullets as claim leads, not ground truth. Extract action/result pairs and mark for verification.
- **Code repositories:** Summarize key files, README, commit history, release tags, and module ownership. Identify likely contribution windows and high-impact commits.
- **Annual review PDFs:** Treat as high-value evidence for impact, scope, leadership, mentoring, and process outcomes.
- **Notes or performance-review style docs:** Treat them as evidence for non-technical contributions such as mentoring, hiring, onboarding, process, documentation, or company culture work.
- **If multiple sources exist:** Combine information from all

**While reading, collect:**
1. Work item name, short description, timeline, and evidence type
2. The user's specific contributions and role (lead developer, mentor, organizer, interviewer, documentation owner, etc.)
3. Visibility/status (check `config.md` Provenance Flags first, then infer: deployed / internal / open source / prototype / recurring initiative)
4. Technical elements mentioned, if any: languages, frameworks, tools, systems
5. Non-technical elements mentioned, if any: mentoring, hiring, onboarding, process, documentation, incident response, culture-building, cross-functional coordination
6. Quantitative or directional results: performance metrics, adoption, time saved, onboarding speed, interview throughput, engagement, retention, cycle time, satisfaction, reliability
7. Collaboration indicators: team size, stakeholders, partner teams, audience served
8. Business, team, or organizational impact
9. Evidence provenance per claim: source type, source location, and confidence
10. Confidentiality constraints: safe external vs internal-only details

Progress: "Reading work item... [title], [evidence type], [year or period]"

---

## Phase 2: Clarify User's Role

If the user's contribution is not obvious from the source material, ask:

**Questions to ask (skip any that are already clear from the description):**
1. "What was your specific contribution? (e.g., built the backend, redesigned onboarding, ran mentoring sessions, coordinated the interview loop)"
2. "What changed because of your work? (technical, process, team, or culture impact)"
3. "Who else was involved, and what portion was yours versus shared?"
4. "What concrete results can you safely claim, including directional results if exact numbers are unavailable?"
5. "Is there anything here that should NOT appear on your resume? (e.g., sensitive internal details, confidential initiatives, manager-only information)"
6. "If this includes a repo: which branch/date range best reflects your work, and which commits/features should be excluded?"
7. "If this includes annual reviews: which items are safe to disclose externally, and which should remain internal-only?"
8. "If this includes resume bullets + repo/review evidence: should these be merged into one work item or split?"

### >>>>>> MANDATORY STOP — DO NOT PROCEED <<<<<<
Present your understanding of the work item and ask the clarifying questions above.
**You MUST wait for the user's explicit text response before continuing.**

---

## Phase 3: Write Extraction

Create the extraction file at `knowledge_base/extractions/<WorkItemKey><Year><2-3_word_descriptor>.md`

**Naming convention:** `<WorkItemName><Year><2-3_word_descriptor>.md`
- Examples: `ecommerce_platform2023_user_auth.md`, `engineering_onboarding2024_program_refresh.md`
- Normalize to lowercase with underscores

**Extraction format:**

```markdown
# [Full Project Name]

## Metadata
- **Description:** [brief project or initiative description]
- **Evidence type:** [technical-project | internal-tool | leadership-initiative | culture-program | hiring/onboarding | process-improvement | mixed]
- **Year:** [year completed, deployed, or active period]
- **Company/Organization:** [where developed or "personal project"]
- **Audience/Scope:** [product users, internal engineering org, new hires, interview panel, company-wide, etc.]
- **Technologies:** [languages, frameworks, tools, or "N/A"]
- **User's role:** [lead developer / key contributor / mentor / organizer / interviewer / program owner]
- **Status:** [deployed | internal | open source | prototype | recurring initiative]

## Source Evidence
- **Source mix:** [resume-pdf | git-repo | review-pdf | notes | mixed]
- **Resume bullets used:** [quoted bullets or "N/A"]
- **Repo evidence:** [local path + commit/tag/date range, or "N/A"]
- **Review evidence:** [document name + section/date, or "N/A"]
- **Evidence links:** [list of local paths and key file references]

## Technical Surface
- **Languages:** [e.g., JavaScript, Python, Java]
- **Frameworks/Libraries:** [e.g., React, Node.js, Django]
- **Databases:** [e.g., PostgreSQL, MongoDB]
- **Infrastructure:** [e.g., AWS, Docker, Kubernetes]
- **Key tools:** [specific tools or methodologies used, or "N/A"]

## Non-Technical Surface
- **Leadership/Mentorship:** [mentoring, coaching, onboarding, technical leadership, or "N/A"]
- **Process/Operations:** [planning, incident response, release process, documentation, rituals, or "N/A"]
- **Culture/Community:** [ERG work, recruiting, interview loop, morale, knowledge sharing, or "N/A"]
- **Cross-functional work:** [product, design, support, sales, recruiting, HR, or "N/A"]

## Key Contributions & Results
[Number each contribution/result. Include quantitative metrics wherever possible; use directional outcomes when exact numbers are unavailable.]
1. [Technical or organizational contribution with impact]
2. [Result — adoption, reliability, throughput, onboarding speed, quality, team effectiveness, or user impact]
3. [Optional additional result]

## Distinguishing Signals
- [What stands out about this work item and why it matters on a resume]
- [Optional: especially strong technical, leadership, ownership, or collaboration angle]

## Collaboration & Scope
- **Stakeholders/Partner teams:** [engineering, product, recruiting, design, support, leadership, etc.]
- **User's specific contribution:** [from Phase 2 clarification]
- **Shared vs. sole work:** [what the user did alone vs. with others]

## Provenance Notes
- **Visibility/status:** [matches config.md if listed there]
- **Safe to claim:** [what the user can put on a resume without hedging]
- **Needs hedging:** [claims that require "contributed to" or "supported" framing]
- **Do NOT claim:** [results owned by others, confidential details, claims that would be overclaiming]

## Confidence & Confidentiality
- **Claim confidence summary:** [high: N | medium: N | low: N]
- **Per-claim confidence notes:** [short list mapping key claims to high/medium/low]
- **Confidentiality flag:** [safe-external | redact-before-use | internal-only]
- **Redaction notes:** [what to generalize or omit in resume outputs]

## Resume Bullet Seeds
[3-5 draft bullets in STAR format. These are seeds, not final text.]
[Use full-ownership verbs only for sole-contributor work. Hedge for shared work. Technical and non-technical bullets are both valid.]
1. [Action verb] + [what was changed] + [quantitative or directional result]
2. [Action verb] + [system/process/team mechanism] + [what it enabled]
3. [Action verb] + [scope — e.g., "across 3 teams" or "for 25 new hires"] + [outcome]
4. [Optional: culture/mentorship/hiring/process bullet]
5. [Optional: tool/infrastructure/product bullet]
```

Save the file. Show the user the complete extraction.

Progress: "Writing extraction for [short title]... [N] contributions identified, [M] bullet seeds drafted"

---

## Phase 4: Update Inventory

Read and update `knowledge_base/extractions/_INVENTORY.md`.

Add a row to the inventory table:

```
| [filename] | [short title] | [position/team] | [contribution type] | [source mix] | [status] | [confidence summary] | [confidentiality] | [primary competencies] | [date extracted] |
```

Present the updated inventory entry to the user.

---

## Phase 5: Next Steps

After extraction is complete, present:

1. **Extraction summary:** [N] contribution areas, [M] results, [K] bullet seeds
2. **Provenance flags:** Any items that need special handling
3. **Confidence/confidentiality summary:** [high/medium/low counts + disclosure constraints]
4. **Suggested next action:**
   - If more items to extract: "Run `/setup-extract [next source path]`"
   - If all items are done: "Run `/setup-build-kb` to synthesize extractions into experience files and bundles"

### >>>>>> MANDATORY STOP <<<<<<
Present extraction summary. Wait for user feedback or next item.
**You MUST wait for the user's explicit text response before continuing.**

---

## Batch Mode

If `$ARGUMENTS` contains multiple file paths:
1. Build candidate map first (Phase 0) and resolve merge/split decisions
2. Process each resolved work item through Phases 1-4 sequentially
3. Ask Phase 2 clarifying questions grouped by source type (`resume-pdf`, `git-repo`, `review-pdf`)
4. After all extractions: present combined inventory update and summary
5. Single STOP at the end (not per item)
