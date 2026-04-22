# Provenance Feedback Loop — Workflow Integration Guide

This document shows **when** and **how** the user-context checkpoint system integrates into the standard resume workflow.

---

## Standard Three-Session Workflow (Updated)

### Session 1: `/make-resume JDs/JD_xyz.txt`

```
Phase 0: Research & Session Setup
  └─ Create session file with JD analysis, company context, framing strategy

Phase 1: Plan Bullets
  └─ **[NEW] User Context Checkpoint (Optional)**
  │  Identify JD requirements without direct extractions
  │  Ask: "Do you have [related skill X] that could frame as [JD skill Y]?"
  │  Record responses in session file Evidence Tracking section
  │
  ├─ MANDATORY STOP
  │  Present bullet plan + ask gap-filling questions (if prepared)
  │  Wait for user to confirm bullets AND answer context questions
  │
  └─ Budget Gate

Phase 2: Generate Resume
  └─ Generate summary, skills, bullets
  └─ Compile + validate (no context checkpoint in Phase 2)

  MANDATORY STOP
  Present compiled resume, file paths
```

**Expected output:**
- Session file with Evidence Tracking section populated (if gaps were addressed)
- Generated resume .tex + .pdf
- All evidence recorded to session for later KB updates

**Token cost:** Normal + 1-2 user context turns (if gaps identified)

---

### Session 2: `/make-cl output/<Folder>/session_<name>.md`

```
Load context from session file
Generate cover letter (no context checkpoint — CL is tactical copy, not strategic evidence)
Compile + validate
MANDATORY STOP
Present compiled CL
```

**Note:** User context checkpoints are NOT triggered in CL workflow — CL is not a source of new evidence about the candidate's work.

---

### Session 3: `/critique output/<Folder>/session_<name>.md`

```
Phase 0: Load context
  └─ Read session file, JD, bundle, experience extractions

Phase 1: Run full 8-part critique
  └─ Scoring and analysis

  **[NEW] User Context Checkpoint (Optional)**
  └─ Identify Tier 1 provenance questions from Section 9
  └─ Prepare 1-2 highest-impact context questions
  └─ For low-confidence claims: ask "Can you defend [phrase] with evidence?"
  └─ Record responses in session file Evidence Tracking section

  MANDATORY STOP
  Present score + Tier 1 fixes + interview likelihood
  **If** user-context checkpoints prepared: "I have follow-up questions about [claims]"
  Present questions + wait for user response

  **[NEW] Post-Approval Recording Step**
  └─ If Evidence Tracking was populated:
     - Ask user: "Should I record this framing evidence to extractions for future JDs?"
     - If yes: Update relevant extraction files with framing evidence
     - If no: Keep in session file only (may reference in future critiques)
```

**Expected output:**
- Critique .md with full 8-part analysis
- Session file with Evidence Tracking populated
- Optional: Updated extraction files with new framing evidence

**Token cost:** Normal critique + 1-2 user context turns

---

## Optional Mid-Session Edit Pass

If critique results in requested edits: `/edit-resume output/<Folder>/e2e_<name>_resume.tex`

```
Phase 1: Load context
Phase 2: Diagnose & Plan Edits

  **[NEW] Provenance Defense Checkpoint (Optional)**
  └─ For any REMOVE or MODIFY edits flagged as "risky":
  │  Ask Format C: "Before I remove/soften '[phrase]', can you defend it?"
  │  If user provides evidence: change REMOVE → MODIFY (strengthen instead)
  │  If user cannot defend: proceed with REMOVE as planned
  │
  └─ Record user defense evidence in session file Evidence Tracking

  MANDATORY STOP
  Present edit plan + ask for provenance defense (if prepared)
  Wait for user confirmation + evidence

Phase 3-4: Execute Edits
  └─ Apply confirmed edits
  └─ Validate (char count, compile)

  **[NEW] Post-Edit Recording**
  └─ If any phrases were defended and kept:
     - Update Evidence Tracking with defense proof
     - Optionally record to extraction file
```

---

## Evidence Flow Diagram

```
User works on JD
    ↓
/make-resume Phase 1
├─ Bullet plan shows gaps (skill Y not in extractions)
├─ Checkpoint asks: "Do you have related work X?"
└─ User responds → Evidence Tracking in session file
    ↓
Resume generated
    ↓
/critique
├─ Critique identifies low-confidence claims
├─ Section 9 asks provenance questions
├─ Checkpoint asks: "Can you defend [phrase]?"
└─ User responds → Evidence Tracking in session file
    ↓
[OPTIONAL] /edit-resume
├─ Plan identifies risky REMOVE edits
├─ Checkpoint asks: "Evidence for [phrase]?"
└─ User responds → Evidence Tracking in session file
    ↓
User approves + ready to finalize
    ↓
[NEW STEP] Recording Phase
├─ Ask: "Record framing evidence to KB?"
├─ If YES:
│  ├─ Update extraction file(s) with framing evidence
│  ├─ Update bundle(s) with alternative framing
│  └─ Session file notes KB updates made
└─ If NO:
   └─ Evidence stays in session file only
    ↓
Future JD
    ↓
/make-resume Phase 0
├─ JD analysis shows keyword Y
├─ Extractions are searched for evidence
├─ Framing evidence from prior JD is surfaced:
│  "In prior [company] JD, you could frame [work X] as [skill Y]."
│  "Would that apply here?"
└─ User decides: use framing or skip
    ↓
Bullet plan includes user-discovered framing with better confidence
```

---

## Integration Points by Skill

### /make-resume

**Phase 1 Checkpoint:**
- When: After bullet plan tables presented
- Trigger: JD requires skill Y, no direct extraction exists
- Prompt: "Do you have [experience X] that could frame as [JD Y]?"
- Record: Session file Evidence Tracking
- Output: Updated bullet plan with user framing noted; user confirmsplan

**No checkpoint in Phase 2 (generation phase)** — Phase 1 already collected framing.

### /critique

**Phase 1 Checkpoint:**
- When: After 8-dimension scoring, before MANDATORY STOP
- Trigger: Section 9 provenance questions + low scores in 8-dimension table
- Prompt: "Can you defend [phrase] with [evidence]?" or "For [requirement], do you have [work X]?"
- Record: Session file Evidence Tracking
- Output: Critique .md + Evidence Tracking populated

**Post-Approval Recording:**
- When: After user approves critique (no more edits needed)
- Action: Ask user if they want framing evidence recorded to KB
- If YES: Update extractions + bundles
- If NO: Evidence stays in session file

### /edit-resume

**Phase 2 Checkpoint:**
- When: After edit plan prepared (before MANDATORY STOP)
- Trigger: Edit plan includes REMOVE or MODIFY of phrases flagged as "low-confidence"
- Prompt: "Before I remove/soften '[phrase]', can you defend it with evidence?"
- Record: Session file Evidence Tracking
- Output: Edit plan updated based on user defense (REMOVE → MODIFY if evidence provided)

**No post-edit recording step** — evidence from /edit-resume is typically restatement of prior checkpoint, so handled in /critique.

---

## Session File Evidence Tracking — Update Schedule

### During /make-resume Phase 1
- Populate with gap-filling questions + user responses
- Format: "Evidence: [Gap Name]"
- Action: Keep phrase candidates that user confirmed with evidence

### During /critique Phase 1
- Populate with provenance questions + user responses
- Format: "Evidence: [Phrase/Claim Name]"
- Action: Flag which claims user successfully defended

### During /edit-resume Phase 2
- Populate with phrase defense questions + user responses
- Format: "Evidence: [Removed Phrase] - Defense Provided / Defense Failed"
- Action: Change REMOVE → MODIFY if defense was strong

### After Session Complete
- Review Evidence Tracking
- Ask user: "Record to KB?" (manual decision point)
- If YES: Batch update extractions + bundles
- If NO: Evidence stays in session file (may be referenced in future critiques)

---

## Recording to Knowledge Base — Decision Tree

```
Is there evidence collected in Evidence Tracking?
  NO → Done. Session complete.
  YES → Continue.

User approved final package (resume + CL + critique)?
  NO → Evidence available but not yet finalized. Keep in session file.
  YES → Continue.

Does user want to record evidence to KB for future JDs?
  NO → Keep in session file. Document as "evidence available but not KB-recorded"
  YES → Continue.

For each evidence item:
  ├─ Is it a framing discovery (not just clarification)?
  │  NO → Keep in session file only; not generic enough for extraction
  │  YES → Proceed to extraction recording
  │
  ├─ Find the relevant extraction file (source of the work)
  │  └─ Add to "Framing Evidence (User-Provided)" section
  │
  ├─ Is there a matching bundle reframing opportunity?
  │  NO → Done with this extraction
  │  YES → Update bundle S3 table + add alternative framing subsection
  │
  └─ Mark in session file Evidence Tracking: "[ ] Recorded to extraction as framing evidence"

Update session file Evidence Tracking Summary:
  ├─ Evidence items collected: [N]
  ├─ Items recorded to KB: [N]
  └─ New framing strategies discovered: [list]
```

---

## Anti-Patterns & Guardrails

❌ **Anti-Pattern: Ask too many context questions**
- Too many checkpoints = fatigue, longer sessions, higher token cost
- **Fix:** Tier 1 triggers only (high-impact gaps or risky claims)
- Limit to 1-2 questions per skill run

❌ **Anti-Pattern: Record all evidence to extractions immediately**
- Some evidence is JD-specific and not generic enough to reuse
- **Fix:** Ask user before recording; filter for generic/transferable framings only
- "This is great context, but is it specific to [company] or would it apply to other [role type] JDs?"

❌ **Anti-Pattern: Use checkpoint evidence without user confirmation**
- User provided context in one JD; don't assume it applies elsewhere
- **Fix:** In future /make-resume: "In [prior JD], you could frame [X] as [Y]. Apply here?"
- Always get explicit permission before reusing framing

✓ **Pattern: One checkpoint per session, high-value topics only**
- /make-resume Phase 1: Gap-filling (which extractions missing?)
- /critique Phase 1: Provenance defense (can you prove risky claims?)
- /edit-resume Phase 2: Defense against removal (is this worth keeping?)

✓ **Pattern: Explicit recording decision**
- "I've collected [N] pieces of evidence. Want me to record these to extractions for future JDs?"
- User says yes/no/partial
- Only record what user approves

✓ **Pattern: Session file is canonical; extraction recording is optional**
- All evidence goes to session file automatically
- Recording to KB is a separate, explicit action
- User can finalize package without KB recording (low-friction path)

---

## Example: Internet Archive SWE Session (Applying New System)

**Context:** Re-critique of Internet Archive Software Engineer role.

### Session 3 (/critique) with New System

```
/critique output/internet_archive/session_internet_archive_software_engineer.md

[Critique runs, score 78.05/100]

User Context Checkpoint:
  Section 9 identifies Tier 1 provenance questions:
  1. "Python claim depth: Which two bullets can you defend?"
  2. "Ingestion/access phrasing: What exact systems support this?"
  3. "Collection integrity: Which extraction supports this vs. generic data-quality?"

  Checkpoint asks user:
  "I'd like to understand your framing better:
  1. For Python work in your resume — which 2 projects are truly production Python vs. platform tooling?
  2. For 'ingestion and access workflows' — what specific projects / architectural decisions support this phrasing?
  3. For 'collection integrity' — how do you distinguish this from generic 'data quality'?"

User Response:
  "Python is mostly platform/build tooling, not core service. Strongest Python: ARM Mac build setup. Ingestion/access comes from project experience with media library validation, but I realize it's mostly backend validation work, not true ingestion pipeline work. Collection integrity: I was trying to avoid 'data quality' jargon, but honestly that's what most of it is."

Recording to Evidence Tracking:
  ### 2026-04-21 — Evidence: Python Platform vs. Service Distinction
  **Question Asked:** Which Python projects are production vs. platform tooling?
  **User Response:** "Platform/build tooling focus; strongest is ARM Mac build setup. Not core service Python."
  **Framing Discovered:** Python work is legitimate but scoped to platform/environment enablement, not service development.
  **Action Taken:** Reword Python claim to clarify scope; consider moving focus to JavaScript/React.

  ### 2026-04-21 — Evidence: Ingestion/Access Vocabulary
  **Question Asked:** What systems/projects support "ingestion and access workflows"?
  **User Response:** "Mostly backend validation work on media library — realized it's not true ingestion pipeline work."
  **Framing Discovered:** Should distinguish between backend validation (what user does) vs. ingestion pipeline (what JD emphasizes).
  **Action Taken:** Soften "ingestion" language; emphasize validation/integrity instead.

  ### 2026-04-21 — Evidence: Collection Integrity Framing
  **Question Asked:** How distinguish "collection integrity" from "data quality"?
  **User Response:** "Honestly, it's data quality work. I was trying to use domain language but that might be overstating it."
  **Framing Discovered:** User comfortable with simpler vocabulary; "data quality hardening" is more defensible than "collection integrity."
  **Action Taken:** Replace abstract term with concrete "data quality" language.

MANDATORY STOP
[Present critique + Evidence Tracking summary]

"You've given me great context. Want me to record this framing clarification to your extractions for future data-engineering or platform JDs? It helps me match you better if I remember: 'Python work is platform/tooling focused, not service pipeline.'"

User Response: "Yes, record it. But note that I might have stronger service Python in future projects."

Recording Phase:
  Update extraction animoto2024_arm_mac_migration.md:

  ## Framing Evidence (User-Provided)
  ### Python Platform Tooling Clarification
  - **JD Gap Filled:** "Python production experience" (service/pipeline roles)
  - **User Context:** "Python work has been platform/build tooling (ARM Mac setup, dependency validators). Stronger in JavaScript/React for main product work."
  - **Framing:** "Platform-enablement Python (cross-architecture compatibility, build systems) ≠ service/pipeline Python. Different value proposition."
  - **Proof Story:** "I led the ARM Mac migration using Python build scripts — that's platform enablement, not core service work."
  - **Confidence:** high
  - **Recording Date:** 2026-04-21

  Note added to bundle_backend.md:
  [USER CLARIFICATION: animoto2024_arm_mac_migration.md Python work is platform-tooling scoped, not service-pipeline scoped. For backend/data-eng roles, frame as adjacent but clarify scope.]
```

**Outcome:**
- Critique completed (78.05/100)
- Evidence Tracking populated with 3 framing clarifications
- Extractions updated with platform vs. service Python distinction
- Bundle noted that this extraction has scope constraints for service-focused JDs
- User can now generate future resumes with better Python framing choices

---

## Future JD Application (Using Recorded Evidence)

**New JD:** Google Cloud Platform Data Ingestion Engineer (emphasizes Python, GCP, ingestion pipelines)

### /make-resume Phase 0

Session setup includes:

```
## Framing Strategy
- **Lead narrative:** Your reliability and data-quality work should lead, not Python breadth
- **Reframing map:**
  - Backend validation (media library) → data-quality/ingestion boundary testing
  - Kubernetes reliability → infrastructure for data pipelines
  - [NOTE: Prior evidence indicates Python work is platform-tooling scoped, not pipeline-scoped. Surface this for user decision.]
- **Emphasize:** Data quality, validation architecture, reliability engineering
- **Downplay:** Python breadth claims (stronger in JavaScript for product; Python is platform tooling)
```

### /make-resume Phase 1

```
Bullet Plan presented, shows:
  - Position 1, Bullet 5 (Kubernetes crash-loop): "Direct for reliability signals"
  - Position 2, Bullet 3 (Media library validation): "Possible bridge to data-quality emphasis"
  - ARM Mac migration: "Marked as MEDIUM priority — Python work is platform-focused, matches infrastructure angle but not pipeline-focused angle"

User Context Checkpoint (Gap-filling):
"The JD emphasizes 'Python data pipelines' — I see your strongest Python is platform/build tooling.
Based on our prior Internet Archive work, we noted this distinction.

For this GCP role:
  1. Should I play up platform Python (infrastructure-adjacent) or downplay it?
  2. Or do you have other Python experience (backend services, data processing) we haven't surfaced yet?"

User Response: "Platform Python is legit for infrastructure. But I don't have true pipeline/data-processing Python. Let's emphasize the platform angle — that's real."

Bullet Plan updated with user confirmation:
  - ARM Mac migration: Repositioned from MEDIUM to HIGH for "infrastructure Python" signal
  - Lead narrative adjusted: "Platform reliability engineer with infrastructure Python and data-quality testing"
```

**Outcome:**
- Framing evidence from prior JD reused with user confirmation
- New resume generated with better Python scoping
- User didn't waste time re-explaining Python distinction; it was in session context

---

## Summary: Why This Works

1. **Closes credibility gaps without creating new ones**
   - Asks for context on risky/low-confidence claims
   - Records evidence for reuse, not permanent changes

2. **Respects user judgment**
   - User confirms context and framing decisions
   - Recording to KB is optional, explicit approval required

3. **Builds sustainable KB**
   - Framing evidence is user-vetted, not AI-inferred
   - Future JDs benefit from user context already collected
   - Reduces friction on repeat applications

4. **Integrates into existing workflow**
   - Checkpoints happen at natural STOP points
   - No additional sessions needed
   - Optional (Tier 2 triggers can be skipped if time/tokens constrained)

5. **Token-efficient**
   - 1-2 context questions per session
   - Evidence recording batched after session complete
   - Reuse in future sessions reduces overall token cost
