# Provenance Feedback-Loop System — Implementation Summary

## What You Requested

A system that:
1. **Identifies low-confidence claims or keyword gaps** during critique, resume generation, and editing
2. **Asks you for context** in the moment with structured questions (not just flags)
3. **Records your responses as evidence** back to extractions and bundles
4. **Reuses framing discoveries** in future resume workflows
5. **Respects your judgment** — you decide what's defensible, what needs reframing, what gets recorded

---

## What Was Built

### 3 New Reference Files

1. **`resume_builder/reference/user_context_checkpoints.md`** (7.2KB)
   - Complete protocol for **when** to ask and **how** to ask
   - 3 question formats: one-shot clarification, gap-filling, phrase defense
   - Session file entry template with decision checkboxes
   - Tier 1/2/3 trigger rules to avoid "checkpoint fatigue"
   - Anti-patterns and guardrails
   - Real examples (web scraping bridge, Python platform vs. service)
   - **USE THIS:** As the master reference when implementing checkpoints

2. **`resume_builder/support/extraction_framing_evidence_template.md`** (5.8KB)
   - How to update extraction files with user-provided framing evidence
   - Where to add new `## Framing Evidence (User-Provided)` section
   - High/medium/low confidence decision rules
   - How to update bundles with new framing strategies
   - Session file integration checklist
   - Examples for concrete reference
   - **USE THIS:** When recording evidence to extractions post-session

3. **`resume_builder/reference/provenance_feedback_loop_workflow.md`** (11.2KB)
   - Complete workflow integration showing all three sessions
   - ASCII evidence flow diagram
   - Where checkpoints happen in each skill
   - Session file Evidence Tracking update schedule
   - Decision tree for recording to KB
   - Real-world example: Internet Archive SWE session walkthrough
   - Future JD reuse scenario: Google Cloud Platform example
   - **USE THIS:** To understand the big picture; reference when running new JDs

### 4 Updated Skills

1. **`.claude/skills/critique/SKILL.md`**
   - Added "User Context Checkpoint" phase (Step 11) after 8-dimension scoring
   - Prepares 1-2 high-impact provenance questions
   - Updated MANDATORY STOP to present context questions if prepared
   - Added "Post-Approval Recording" step: "Want me to record this evidence to KB?"
   - **Changes:** Lines 10-25 (new section), STOP section expanded

2. **`.claude/skills/make-resume/SKILL.md`**
   - Added "User Context Checkpoint" to Phase 1 (gap-filling questions)
   - When JD requires skill Y but no extraction has it: asks "Do you have [related X]?"
   - Updated MANDATORY STOP to include context questions confirmation
   - **Changes:** After "After all positions, show:" section (new subsection), Phase 1 STOP expanded

3. **`.claude/skills/edit-resume/SKILL.md`**
   - Added "Provenance Defense Checkpoint" to Phase 2 (before final plan)
   - Before removing low-confidence phrases: asks "Can you defend [phrase]?"
   - Updates edit classification if user provides defense (REMOVE → MODIFY)
   - Updated Phase 2 MANDATORY STOP to include defense questions
   - **Changes:** After "If edit targets cover letter..." (new subsection), Phase 2 STOP expanded

4. **`resume_builder/reference/session_file_template.md`**
   - Added `## Evidence Tracking` section with full template
   - Entry format matches user_context_checkpoints.md structure
   - Includes checkboxes for action taken (keep/strengthen/reword/remove/record)
   - Summary section tracks items collected and recorded
   - **Changes:** New section added after Edit History

---

## How It Works — The Flow

### During /make-resume (Session 1)

```
Phase 1: Plan Bullets
  ├─ Present bullet recommendations per bundle Priority Matrix
  ├─ Identify JD gaps (skills required but no KB extraction exists)
  │
  └─ [NEW] User Context Checkpoint
     └─ Ask: "The JD requires [skill Y]. You have [experience X].
               Can you frame that as [Y]?"
     └─ Record user response in session file Evidence Tracking

  STOP: Show bullet plan + ask context questions
        "Confirm bullets + answer gap-filling questions?"

User responds → Record to session file
            → Proceed to Phase 2 (generation)
```

### During /critique (Session 3)

```
Phase 1: Run 8-Part Critique
  └─ Scoring, Section 9 (provenance questions), analysis

  [NEW] User Context Checkpoint
  └─ Identify Tier 1 provenance questions
  └─ Prepare 1-2 highest-impact context questions
  └─ Ask: "Can you defend [low-confidence phrase]?"
  └─ Ask: "For [requirement], do you have evidence of [work X]?"

  STOP: Present score + Tier 1 fixes + interview likelihood
        + "I have context questions about [claims]. Can you help?"

User responds → Record to session file Evidence Tracking

[NEW] Post-Approval Step (if user satisfied with package)
└─ Ask: "Should I record this framing evidence to your KB for future JDs?"
└─ If YES: Update extraction files + bundles
└─ If NO: Evidence stays in session file (may reference later)
```

### During /edit-resume (Optional Mid-Session)

```
Phase 2: Diagnose & Plan Edits
  ├─ Gather edit requests from user, critique, and auto-detected issues
  ├─ Plan changes (MODIFY / SWAP / ADD / REMOVE / FIXED)
  │
  └─ [NEW] Provenance Defense Checkpoint
     └─ For REMOVE edits on phrases flagged "low-confidence":
        └─ Ask: "Before I remove '[phrase]', can you defend it with evidence?"
        └─ Record user defense or "cannot defend"

  STOP: Show edit plan + ask for phrase defenses
        "Confirm edits + defend risky phrases?"

User responds → Record to session file
            → REMOVE becomes MODIFY if user defends
            → Proceed to Phase 3-4 (execute edits)
```

---

## Evidence Tracking — Where It Lives

### Tier 1: Session File (Always)
- **Location:** `output/<FolderName>/session_<name>.md` → `## Evidence Tracking` section
- **Format:** Entry per checkpoint with question, response, framing, confidence
- **Checkboxes:** Track which evidence items were recorded to KB
- **Timing:** Populated during checkpoints; reviewed at session end
- **User Decision:** "Record to KB?" — manual approval required

### Tier 2: Extraction Files (Optional, After User Approval)
- **Location:** Extraction file (e.g., `animoto2024_arm_mac_migration.md`) → new `## Framing Evidence (User-Provided)` section
- **Format:** JD gap, user context, framing, proof story, keywords, confidence, date
- **Trigger:** User says "yes, record this" at end of critique
- **Reusability:** Future JDs can reference this framing evidence
- **Example:** User explained Python is platform-tooling focused. Extraction now notes this for future backend/data-eng JDs.

### Tier 3: Bundle Files (Optional, After User Approval)
- **Location:** Bundle file (e.g., `bundle_backend.md`) → `S3: Achievement Reframing Map` table
- **Format:** Alternative framing note in existing entry OR new "Alternative Framings" subsection
- **Trigger:** User-discovered framing applies to multiple JD role types
- **Example:** "E2E automation → web-scraping adjacent skills" could apply to backend, data-eng, and frontend-infra roles
- **Reusability:** Next data-eng JD automatically sees: "You can frame [E2E automation] as web-scraping-adjacent"

---

## When Checkpoints Trigger

### Tier 1 (High-Impact — Always Ask)
- **Critique:** Section 9 provenance questions ("Can you defend [phrase]?")
- **Critique:** Phrases with score < 6/10 in 8-dimension table
- **Make-Resume:** JD requires skill Y, no direct extraction matches
- **Edit-Resume:** REMOVE of low-confidence phrases (especially section headers or key claims)

### Tier 2 (Medium-Impact — Ask if Time Allows)
- **Make-Resume:** Abstract JD requirements that could bridge to user work
- **Critique:** Alternative framing suggestions (Tier 1 improvements)
- **Edit-Resume:** MODIFY of vague phrasing

### Tier 3 (Low-Impact — Document but Don't Ask)
- Simple mechanical issues (orphans, page fill, char count)
- FIXED sections (education, awards, dates)
- Well-supported claims already with provenance in KB

---

## Example: Your Web Scraping Request

**Scenario:** JD emphasizes "web scraping," you have no direct web-scraping extraction.

**Make-Resume Phase 1 Checkpoint (Format B):**
```
The JD emphasizes "web scraping." I see you have web-driver E2E test automation
experience from your frontend test modernization work.

Would E2E test automation be a good bridge to frame as web-scraping capability?
If yes: How would you explain the connection in an interview?
```

**Your Response:**
```
Yes, exactly. In my E2E tests, I use Puppeteer to drive dynamic content loading
and validate scraped data structures. That's very similar to web-scraping workflows.
```

**Session File Evidence Tracking:**
```markdown
### 2026-04-21 — Evidence: E2E Automation → Web Scraping Bridge
**Checkpoint Source:** /make-resume Phase 1 (gap in JD requirements)
**Question Asked:** Can E2E automation bridge to web scraping?
**User Response:** "Puppeteer drives dynamic content + validates scraped structures — same patterns as web-scraping"
**Framing Discovered:** E2E automation (dynamic content validation) ≈ web-scraping skills
**Confidence:** medium (adjacent, not direct)
**Related Extractions:** animoto2024_test_modernization_rtl.md
**JD Keywords Covered:** web scraping, dynamic content, E2E automation
**Action Taken:** [X] Recorded to extraction as framing evidence
```

**Later, at Critique Approval:**
```
User: "Yes, record this evidence to my KB."

Agent updates animoto2024_test_modernization_rtl.md:

## Framing Evidence (User-Provided)
### E2E Automation → Web Scraping Bridge
- **JD Gap Filled:** "Web scraping" skill
- **User Context:** E2E tests use Puppeteer to drive and validate dynamic content,
  similar to web-scraping workflows.
- **Framing:** "Dynamic content validation via E2E automation has overlapping skills
  with web-scraping (content loading, structure validation)."
- **Proof Story:** "In my test modernization work, I built E2E tests using Puppeteer
  that drive dynamic content loads and validate scraped data structures — patterns
  identical to web-scraping workflows."
- **Related Keywords:** web scraping, dynamic content, E2E, Puppeteer, data validation
- **Confidence:** medium
- **Recording Date:** 2026-04-21
```

**Future JD (Web Scraping Role):**
```
Next web-scraping JD runs /make-resume

Phase 0 → Session setup notes:
"Prior evidence (2026-04-21): You can frame E2E automation work as web-scraping-adjacent.
This JD requires web scraping. Want to use that framing?"

User: "Yes, include it."

Phase 1 → Bullet plan automatically surfaces:
Priority: animoto2024_test_modernization_rtl.md (E2E automation → web-scraping framing)

Less friction, better confidence, clearer positioning.
```

---

## Integration into Your Existing Workflow

### Today: Internet Archive Software Engineer

You've already run `/critique` on the Internet Archive role. You can try the new system here:

1. **Create Evidence Tracking section** in your Internet Archive session file (if not auto-added)
2. **Manually populate** with the provenance questions from your critique r2, Section 9
3. **Provide your responses** (can you defend "collection-integrity hardening"? etc.)
4. **Decide:** Record to KB or keep in session only?

### Next JD: Try Full Integration

When you run `/make-resume` on the next JD:
- Watch for gap-filling checkpoint in Phase 1
- Answer context questions about related skills
- Session file will auto-populate Evidence Tracking
- At `/critique` post-approval: decide if evidence should be recorded to KB

---

## Key Design Principles

### You Decide What Gets Recorded
- Checkpoints ask questions, user answers
- Recording to KB requires explicit "yes" approval
- Evidence never recorded without your consent
- Low-friction option: leave evidence in session file only

### Evidence Is User-Verified
- Not AI-inferred, not auto-generated
- You provide the framing, the context, the defensibility
- Future resumes use framing YOU already approved
- Confidence levels reflect your comfort (high/medium/low)

### Respects Your Time
- Tier 1 triggers only (high-value gaps/claims)
- 1-2 questions per session, not 10
- Token-efficient: 1-2 turns per checkpoint
- Reuse saves turns on future JDs

### Builds Over Time
- First JD: Evidence goes to session file
- If valuable: You decide to record to KB
- Subsequent JDs: Automatically surfaces prior evidence
- "We discovered last time that you can frame X as Y — apply here?"

---

## What to Do Now

### Option 1: Apply to Current Internet Archive Session
1. Open `output/internet_archive/session_internet_archive_software_engineer.md`
2. Add `## Evidence Tracking` section (or verify if present from prior work)
3. Manually populate with answers to Section 9 provenance questions from critique r2
4. Add checkboxes for which evidence to record to KB
5. Use extraction_framing_evidence_template.md to update animoto extractions

### Option 2: Try on Next JD
1. Run `/make-resume [next JD]` normally
2. When Phase 1 STOP arrives, watch for gap-filling questions
3. Answer context questions about related skills
4. Session file auto-populates Evidence Tracking
5. At `/critique` post-approval: decide on recording

### Option 3: Review & Customize
1. Read `provenance_feedback_loop_workflow.md` for full picture
2. Adjust trigger rules in `user_context_checkpoints.md` if needed
   - Too many Tier 2 questions? Downgrade to optional
   - Missing a common gap? Add a Tier 1 trigger
3. Document your preferences in config.md or CLAUDE.md

---

## Files Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `user_context_checkpoints.md` | Complete protocol (when/how/what) | Before implementing; as reference |
| `extraction_framing_evidence_template.md` | How to update extractions | After /critique, pre-recording |
| `provenance_feedback_loop_workflow.md` | Full workflow integration + examples | Understanding big picture; future JDs |
| Updated SKILL.md files | Where checkpoints are integrated | During /make-resume, /critique, /edit-resume |
| Updated `session_file_template.md` | Evidence Tracking structure | When creating new session file |

---

## Success Criteria

You'll know the system is working when:

✓ Checkpoints feel natural, not intrusive (1-2 questions per session)
✓ Your responses are clearly recorded in session file Evidence Tracking
✓ You decide what gets recorded to KB (not auto-recorded)
✓ Evidence is discoverable in future JD sessions ("We found that you can frame X as Y")
✓ Resume claims feel more defensible in interviews (backed by framing you chose)
✓ Over time, KB accumulates reusable framings for common gaps (Python scope, web scraping, etc.)

---

## Questions?

All three new reference files have:
- Detailed examples
- Anti-patterns to avoid
- Decision trees
- Real-world walkthroughs

Start with `provenance_feedback_loop_workflow.md` for the big picture, then dive into specific files as needed.
