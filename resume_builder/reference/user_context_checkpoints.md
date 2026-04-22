# User Context Checkpoints & Provenance Evidence Recording

> Used by `/critique`, `/make-resume`, and `/edit-resume` to ask for user context when gaps, low-confidence claims, or abstract phrases are detected. User responses are recorded as evidence in session files and extractions for future resume generations.

---

## Philosophy

**Goal:** Close the gap between "this resume claim is hard to defend" and "the user knows how to defend it, but wasn't asked."

When the system identifies a risky phrase, a keyword gap, or an abstract framing, ask the user for context **in the moment** rather than flagging it as a permanent weakness. User context + evidence becomes KB-recordable framing for future JDs.

---

## Trigger Rules

### Tier 1 Triggers (Always Ask)
1. **Section 9 Provenance Questions (from /critique)**
   - Already in framework — these are natural checkpoints
---
   - When user is re-reading critique: offer follow-up slot
2. **Low-Confidence Phrases Flagged in /edit-resume**
   - Phrases that "feel overreaching" but source artifacts exist
   - Before removing: ask "Can you defend this with X?"
3. **Critical Keyword Gaps in /critique**
   - JD emphasizes skill Y, but resume shows minimal evidence
   - Ask: "Do you have X experience that could frame as Y?"

### Tier 2 Triggers (Ask if Time/Context Allows)
1. **Gap in /make-resume Phase 1 (bullet planning)**
   - JD requires skill Z, no direct extraction exists
   - Ask: "Do you have related experience with X that bridges to Z?"
2. **Abstract Phrasing Highlighted in /critique**
   - Phrases like "collection-integrity hardening" need concrete project tie-in
   - Ask: "What exact project/artifact supports this phrasing?"
3. **Alternative Framing Suggestions in /critique**
   - Tier 1 improvements mention "add production-outcome Python bullet"
   - Ask: "Which Python projects demonstrate X outcome?"

### Tier 3 Triggers (Document but Don't Interrupt)
1. **Simple mechanical issues** (orphans, page fill) — no context needed
2. **Routine small edits** (header shortening, spacing) — assume OK unless user flags concern
3. **FIXED sections** — never ask to edit (template-locked)

---

## How to Ask — Response Structure

### Format A: One-Shot Clarification
**When:** Simple missing detail or quick context.
**Prompt:**
```
I flagged "[phrase/keyword]" as lower-confidence because [reason].
Can you share:
- What specific project(s) support this?
- Is this direct experience or transfer framing?
- How would you defend this in an interview (20-second proof story)?
```

**Response Expected:** User provides 1-3 sentences + project name(s).

### Format B: Gap-Filling Question
**When:** Resume lacks a JD requirement but user may have related work.
**Prompt:**
```
The JD emphasizes "[skill/domain]" — currently your resume shows minimal evidence.
Do you have experience with [related skill X] that could frame as [JD skill Y]?

Example: You mentioned web-driver E2E automation testing — would that be a good bridge for "web scraping" in this context?

If yes: What specific projects demonstrate this?
If no: That's OK — we can emphasize other strengths instead.
```

**Response Expected:** Yes/No + project details (if Yes).

### Format C: Phrase Defense Checkpoint
**When:** /edit-resume considers removing or softening a phrase.
**Prompt:**
```
I was considering removing "[phrase]" because it feels abstract without project context.

Before I do: Can you point me to a specific project, PR, or artifact that proves this claim?
- If yes, I'll keep it (or strengthen it with concrete details)
- If no, I'll reword it to be plainer and more defensible

What's your evidence?
```

**Response Expected:** User provides artifact reference (repo commit, doc link, project name) OR confirms phrase needs rewording.

---
**Location:** Session file, new section `## Evidence Tracking`.

**Entry Template (copy for each user-provided piece of evidence):**

```markdown
### [Date] — Evidence: [Gap/Phrase Name]
**Checkpoint Source:** [Critique item #] / [Make-Resume Phase 1] / [Edit-Resume phrase defense]
**Question Asked:** [One-shot summary of what was asked]
**User Response:**
```
[User's verbatim response or summary]
```
**Framing Discovered:** [What alternative framing / evidence / defense was uncovered]
**Confidence:** high / medium / low
**Related Extractions:** [e.g., animoto2024_arm_mac_migration.md, animoto2025_internal_json_editor_dx.md]
**JD Keywords Covered:** [e.g., "Python in platform enablement", "developer enablement"]
**Action Taken:**
- [ ] Kept phrase as-is
- [ ] Strengthened phrase with concrete detail
- [ ] Reworded to be plainer
- [ ] Removed phrase
- [ ] Recorded to extraction as framing evidence

**Recording for KB:** [If applicable, extract this evidence to the source extraction file under "Framing Evidence" section]
```

### 2026-04-21 — Evidence: Python Signal Strength
**Checkpoint Source:** Critique r2 Section 5 (Tier 1 improvement #1)
**Question Asked:** Which two bullets can you defend with concrete "I wrote production Python" examples?
**User Response:**
```
ARM Mac migration involved updating Python scripts for M-series compatibility — used Python for build-system compatibility checking and dependency validation. Internal JSON editor was JavaScript/React, not Python.
### Format A: One-Shot Clarification
**Framing Discovered:** Python work was platform-enablement focused (build tooling, environment setup) rather than core algorithm/service development. Could be clearer about scope.
**Confidence:** medium
**Related Extractions:** animoto2024_arm_mac_migration.md
**JD Keywords Covered:** "Python" (platform/tooling context, not service/pipeline context)
**Action Taken:**
- [ ] Removed
- [x] Recorded to extraction

**Recording for KB:** Updated `animoto2024_arm_mac_migration.md` with clarification under "Framing Evidence": "Python work was build-system compatibility and dependency validation (not core service development)"
```

---

## Recording Framing Evidence to Extractions

**When:** After user provides context evidence, and you've decided to keep/strengthen the claim.

**File:** Update the relevant extraction file (e.g., `knowledge_base/extractions/animoto2024_arm_mac_migration.md`).

**Section to Add/Update:**

```markdown
## Framing Evidence (User-Provided)

### [Evidence Item Name]
- **JD Gap Filled:** [e.g., "Python production experience"]
- **User Context:** [Paraphrase of what user said]
- **Framing:** [How this work could be positioned for similar JDs]
- **Proof Story:** [20-second interview explanation user provided]
- **Related Keywords:** [e.g., Python, build tooling, platform enablement, dependency management]
- **Confidence:** high / medium / low
- **Recording Date:** [YYYY-MM-DD]
- **User Context:** "ARM Mac migration involved Python scripts for M-series compatibility, including build-system compatibility checking and dependency validation."
- **Framing:** "Platform-enablement Python work — managing cross-architecture tooling reliability and build-system compatibility."
- **Proof Story:** "I led the ARM Mac developer environment migration using Python build scripts and dependency validators to ensure consistent developer experience across Intel and M-series machines."
- **Related Keywords:** Python, platform tooling, build systems, developer experience, compatibility testing
- **Confidence:** medium (solid evidence for platform Python; weaker for production service Python)
- **Recording Date:** 2026-04-21
```

---

## Recording Alternative Framings to Bundles

**When:** User evidence reveals a new framing strategy applicable to other JD role types.

**File:** Update the relevant bundle (e.g., `resume_builder/bundles/bundle_full_stack.md`).

**Section:** `S3: Achievement Reframing Map`

**Entry Format:**

Add a note in the reframing table:

```markdown
| animoto2024_arm_mac_migration.md | Developer environment migration | Platform-enablement Python tooling work | Cross-language compatibility [USER EVIDENCE: Python for build-system checks, not core service] |
```

Or add a new row if the framing is significantly different:

```markdown
| animoto2024_arm_mac_migration.md | Backend/infrastructure focus | Platform Python (web-driver E2E automation → web-scraping skills bridge) | Developer enablement [USER FRAMING: Related but not direct] |
```

**Also update:** If the evidence suggests a whole new reframing strategy, add a subsection:

```markdown
### Alternative Framings (User-Discovered)

#### Python Platform Enablement → Python Production Services
- **Bridge:** Web-driver E2E automation has similar systematic debugging and performance-profiling skills to pipeline development
- **User Evidence:** [Reference user-context checkpoint date/summary]
- **Applies to JDs:** Backend engineer, data engineer roles emphasizing Python pipeline work
- **Caution:** Position as "adjacent but not direct" unless additional evidence surfaces

```

---

## Decision Tree: Ask or Don't Ask?

```
Is this a FIXED section (template-locked)?
  → YES: Don't ask. Can't change it.
  → NO: Continue.

Is this a mechanical issue (orphan, page fill, char count)?
  → YES: Fix without asking.
  → NO: Continue.

Is this a low-confidence claim or phrase?
  → NO: Continue.
  → YES: Proceed to checkpoint.

Will asking interrupt the workflow unacceptably?
  → YES (Tier 3 trigger): Document in session memory; suggest in final STOP
  → NO (Tier 1-2 trigger): Ask now.

Does the user have an easy answer?
  → PROBABLY (based on JD fit + existing extractions): Ask in Format B (gap-filling)
  → MAYBE (phrase is abstract): Ask in Format C (defense checkpoint)
  → UNKNOWN: Ask in Format A (one-shot clarification)
```

---

## Workflow Integration Points

### /critique Integration
- **Location:** After 8-dimension scoring and before Section 5 (Improvements) generation
- **Trigger:** Any Tier 1 or 2 provenance question
- **Prompt:** "I'd like to understand your context better on [X claims]. Can you help clarify?"
- **Record:** Session file Evidence Tracking + checkbox for "Ask user on next /critique run"
- **Output:** Evidence Tracking section + updated critique Section 5 with user-informed improvements

### /make-resume Integration
- **Location:** Phase 1 (Bullet Planning) after Priority Matrix presentation
- **Trigger:** Gap between JD requirements and available extractions
- **Prompt:** When presenting bullet plan table with gaps: "For [skill Y], do you have [experience X]?"
- **Record:** Session file Evidence Tracking (same location)
- **Output:** Updated bullet plan with user-discovered framing options noted

### /edit-resume Integration
- **Location:** Phase 2 (Diagnose & Plan Edits), before presenting edit plan
- **Trigger:** Flag or remove a low-confidence phrase
- **Prompt:** "Before I remove/soften '[phrase]', can you defend it?"
- **Record:** Session file Evidence Tracking + which edit decision was influenced
- **Output:** Edit plan updated with user context, Evidence Tracking populated

---

## Anti-Patterns to Avoid

❌ **Asking for evidence on things with solid provenance already documented**
- Check extraction file first; if evidence exists, don't re-ask
- User will feel over-questioned and distrusted

❌ **Asking for evidence on FIXED sections**
- These are template-locked; waste of time to ask for context
- Only ask on VARIABLE sections (summary, skills, experience bullets)

❌ **Asking for multiple pieces of evidence in one prompt**
- Pick the highest-value gap (Tier 1)
- Ask about other gaps in future workflows, not all at once
- Avoid "evidence fatigue"

❌ **Recording evidence but never using it**
- After recording 3-4 pieces of evidence in a session, update the extractions immediately
- Don't let evidence stale in session file; synthesize to KB

✓ **Do:** Ask for context on high-impact, low-confidence claims only
✓ **Do:** Record evidence immediately in session file with clear sourcing
✓ **Do:** Update extractions + bundles after session complete
✓ **Do:** Reuse recorded evidence in future JD matching ("We discovered in [prior JD] that you can frame X as Y")

---

## Session File Integration

**Add to session file template** (`resume_builder/reference/session_file_template.md`):

```markdown
## Evidence Tracking

> User context collected during /critique, /make-resume, or /edit-resume.
> Each entry documents a provenance question, user response, and KB recording decision.

[Evidence entries go here]

### Summary
- Evidence items collected: [N]
- Items recorded to extractions: [N]
- New framing strategies discovered: [list]
```

---

## Examples

### Example 1: Web Scraping Gap (From User Request)

**Scenario:**
- JD mentions "web scraping" as important skill
- Resume shows no direct experience
- Extract coverage: web-driver E2E automation exists (animoto2024_test_modernization_rtl.md)

**Checkpoint:**
```
The JD emphasizes "web scraping" — I see you have strong web-driver E2E automation experience from your frontend test modernization work.

Would web-driver test automation be a good bridge to position as web-scraping capability?
If yes: How would you explain the connection in an interview?
```

**User Response (Example):**
```
Yes, exactly. In my E2E tests, I use Selenium/Puppeteer to drive dynamic content loading and validate scraped data structures. That's very similar to web-scraping workflows — capturing dynamically-loaded content and validating structure.
```

**Recording (Session File):**
```markdown
### 2026-04-21 — Evidence: Web Scraping → E2E Automation Bridge
**Checkpoint Source:** /make-resume Phase 1 (gap in JD requirements)
**Question Asked:** Can web-driver E2E automation be positioned as web-scraping capability?
**User Response:**
```
Yes — E2E tests use Selenium/Puppeteer to drive and validate dynamic content, which is very similar to web-scraping workflows. Both involve capturing dynamically-loaded content and validating structure.
```
**Framing Discovered:** E2E test automation → web scraping (dynamic content loading + validation)
**Related Extractions:** animoto2024_test_modernization_rtl.md
**JD Keywords Covered:** web scraping, dynamic content handling
**Action Taken:**
- [x] Recorded to extraction as framing evidence
- [x] Added to bundle S3 reframing map as alternative framing

**KB Recording:** Updated bundle_backend.md with new S3 entry: "animoto2024_test_modernization_rtl.md: E2E automation with dynamic content validation → web-scraping adjacent skills"
```

**Extraction Update** (animoto2024_test_modernization_rtl.md):
```markdown
## Framing Evidence (User-Provided)

### E2E Automation as Web-Scraping Bridge
- **JD Gap Filled:** "Web scraping" in data engineering JDs
- **User Context:** "E2E test automation using Selenium/Puppeteer involves driving and validating dynamic content loading, similar to web-scraping workflows."
- **Framing:** "Dynamic content validation via E2E automation tools has overlapping skills with web-scraping (content loading, structure validation)."
- **Proof Story:** "In my test modernization work, I built E2E tests that drive dynamic content loads and validate scraped data structures using Puppeteer — the patterns are identical to web-scraping workflows."
- **Related Keywords:** web scraping, dynamic content, E2E automation, Puppeteer, Selenium, data validation
- **Confidence:** medium (adjacent skills; not pure web-scraping experience)
- **Recording Date:** 2026-04-21
```

### Example 2: Python Signal Strength (From Prior Internet Archive Session)

**Scenario:**
- JD emphasizes Python production work
- Resume mentions Python only in skills list, not in experience bullets
- Critique flags this as "Tier 1 fix"

**Checkpoint:**
```
Python is mentioned in the JD frequently — I currently show Python in your skills list but minimal Python in your project bullets.

Can you share 1-2 projects where Python was central to the work (not just a tool)?
- What did you build/fix/deploy in Python?
- How would you describe the impact or scope?
```

**User Response (Example):**
```
Honestly, most of my Python work has been platform/build tooling (ARM Mac migration, dependency validators) rather than core service development. I'm stronger in JavaScript/React.
```

**Recording (Session File):**
```markdown
### 2026-04-21 — Evidence: Python Signal Scope
**Checkpoint Source:** /critique r2 Section 5 (Tier 1 improvement)
**Question Asked:** Point to 1-2 projects with Python as central work (not just a tool)
**User Response:**
```
Mostly platform/build tooling (ARM migration, validators) rather than core service development. Stronger in JavaScript/React for main work.
```
**Framing Discovered:** Python is legitimate platform-enablement and build-tooling work, but not "production service" Python. Different positioning required.
**Confidence:** high (clear self-assessment)
**Action Taken:**
- [x] Reworded Python claim to clarify scope (platform tooling vs service development)
- [x] Repositioned bullet to emphasize JavaScript/React for core service work
- [x] Recorded to extraction

**KB Recording:** Updated animoto2024_arm_mac_migration.md framing evidence + updated bundle to note "Python: platform/build-tooling context, not service development"
```

---

## Token Budget Note

User context checkpoints add ~2-3 turns per checkpoint asked. Design for:
- **High-impact questions only** (Tier 1 triggers)
- **Batch-able questions** during natural STOP points (/critique, end of /make-resume Phase 1)
- **Optional Tier 2 questions** presented with "If you have a moment..." framing to suggest, not demand

Target: 1-2 user context checkpoints per /critique or /make-resume session; optional additional in /edit-resume if time permits.
