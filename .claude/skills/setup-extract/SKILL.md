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
- **github-contributions-export mode:** Exported `.json` contribution summaries from the GitHub exporter script
- **review-pdf mode:** Annual/performance review PDFs (impact and non-technical evidence)
- **mixed mode:** Multiple source types for one work item (recommended for strongest provenance)

---

## Startup

1. Read `CLAUDE.md` — check KB Corrections Log for known issues
2. Read `config.md` — load Personal Info (to identify user's role), Provenance Flags
3. If `knowledge_base/extractions/_INVENTORY.md` does not exist, copy `_INVENTORY.template.md` to create it
4. Read `knowledge_base/extractions/_INVENTORY.md` — see what's already extracted, avoid duplicates

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

**Additional requirement for `github-contributions-export mode`:**
- Include a triage column for each repo: `extract`, `corroborate-existing`, or `ignore`
- Include a one-line reason per repo (ownership signal, impact signal, or low-signal reason)
- Call out likely low-value repos early (e.g., one-off forks, pure learning experiments) so the user can quickly confirm exclusions
- Explicitly ask whether each `ignore` repo should be permanently skipped for resume use or only skipped for now

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
- **GitHub contributions exports:** Treat each contributed repo as a candidate work item or supporting evidence file. Use repo metadata only as contextual evidence, not as proof of specific code authorship. Use PRs, commit history, PR comments, and issue comments as the main evidence for the user's role, ownership, communication, and iteration pattern.
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

**For GitHub contributions exports, explicitly evaluate these signals:**
1. **Ownership / initiation signals:**
   - Target user is the first contributor in the repo
   - Target user is the first contributor after fork
   - First authored PR establishes the repo's new direction or operating model
   - Repo shows mostly or only target-user contribution records in the export
2. **Contribution intensity signals:**
   - Multiple commits and PRs in a short window
   - Follow-up commits after initial PR open/merge
   - Separate maintenance/doc/CI updates after the initial feature commit
   - Repeated return to the repo over time rather than one isolated change
   - PR change-shape summaries: new vs updated files, deleted/renamed files, and total changed files
3. **Communication / collaboration signals:**
   - PR descriptions explain tradeoffs, constraints, rationale, or rollout choices
   - PR comments or issue comments show review quality, coordination, or mentorship
   - README / documentation commits show enablement and communication work
4. **Technical-context signals:**
   - Repo language breakdown suggests the technical surface area, but does NOT prove the language of the user's exact changes
   - PR file-extension breakdown is stronger evidence of what file types the user directly touched than repo-level language mix
   - Repo description and topics help infer domain and likely business context
   - Workflow / CI / release-related commit messages suggest operational responsibility
5. **Quality / judgment signals:**
   - Commit messages indicate cleanup, iteration, naming fixes, workflow tuning, or follow-through after initial delivery
   - Multiple small improvement commits can indicate careful maintenance rather than low impact
   - Test-file and automation-file changes can indicate quality ownership, release stewardship, or developer enablement

6. **Resume relevance triage signals (new):**
   - **Likely extract:** sustained contribution pattern, clear ownership after fork, non-trivial maintenance/release work, or meaningful culture/process/tooling impact
   - **Likely corroborate-existing:** repo clearly supports an already-extracted work item and does not add enough independent scope for a standalone extraction
   - **Likely ignore:** one-off fork with minimal changes, explicit learning sandbox with no outcome signal, toy/demo repo with no production or organizational impact evidence
   - User clarification can promote or demote any repo regardless of commit count

**Do not overclaim from GitHub export evidence:**
- Repo primary language is context, not direct proof of user proficiency level
- PR file-extension summaries are better evidence than repo language mix, but still suggest touch surface rather than proficiency level by themselves
- Being first contributor after fork suggests ownership/initiative, not sole authorship of the whole repo
- Commit count alone does not equal impact; prefer patterns, scope, and rationale from PR text
- Public/private visibility does not imply production use or external adoption

**When the source is a personal-account export with many forks:**
- Default stance: treat most forks as `ignore` unless there is clear evidence of sustained ownership or outcome
- Prefer extracting repos that show maintainer behavior (compatibility fixes, release/version commits, docs follow-through, merged patches)
- If a repo is culture/recruiting oriented, keep it as low-salience `color` evidence unless the user indicates strategic importance
- If user gives explicit adoption metrics (e.g., package downloads), record them as user-provided unless independently corroborated

**Cross-linking requirement:**
- For every extracted repo, explicitly check whether it should instead strengthen an existing extraction
- If it strengthens an existing extraction, note that in the candidate map and inventory update as `corroborate-existing`
- If extracted as standalone, include one sentence under Distinguishing Signals explaining why it was not merged into an existing item

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
- **Repo-context vs user-authorship note:** [separate what the repo suggests about stack/domain from what the evidence directly proves the user changed]

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
- [If GitHub export evidence exists: note ownership, iteration intensity, communication quality, or maintainer-style follow-through]

## Collaboration & Scope
- **Stakeholders/Partner teams:** [engineering, product, recruiting, design, support, leadership, etc.]
- **User's specific contribution:** [from Phase 2 clarification]
- **Shared vs. sole work:** [what the user did alone vs. with others]

## Provenance Notes
- **Visibility/status:** [matches config.md if listed there]
- **Safe to claim:** [what the user can put on a resume without hedging]
- **Needs hedging:** [claims that require "contributed to" or "supported" framing]
- **Do NOT claim:** [results owned by others, confidential details, claims that would be overclaiming]
- **GitHub export interpretation notes:** [what is directly evidenced by PRs/commits/comments vs what is only inferred from repo context]

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
