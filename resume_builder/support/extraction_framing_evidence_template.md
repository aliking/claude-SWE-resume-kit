# Extraction Framing Evidence Update Template

Use this template when recording user-provided context evidence to an extraction file.

**Key Principle:** Capture **capabilities and worldviews**, not just mappings. Explain the underlying skills and reasoning so that future JDs can discover this work even when they use different terminology (e.g., "semantic web parsing" or "AI agent web interaction" both relate to the same programmatic web-navigation capability).

---

## When to Update

1. User provides context during `/critique`, `/make-resume`, or `/edit-resume` checkpoint
2. Evidence is recorded in session file under `## Evidence Tracking`
3. Decision made: phrase is kept/strengthened (not removed)
4. User has explained the underlying **capability** or **worldview**, not just a surface mapping
5. Ready to make evidence persistent for future JDs

---

## Where to Add in Extraction File

Add a new section titled `## Capability Evidence (User-Provided)` after the existing provenance sections.

**Location in file hierarchy:**
```
# [Extraction Title]

## Metadata

## Source Evidence

## Technical Surface

## Non-Technical Surface

## Key Contributions & Results

## Distinguishing Signals

## Collaboration & Scope

## Provenance Notes
(existing)

## Capability Evidence (User-Provided)    ← ADD HERE
(new section — captures the why and how broadly it applies)

## Confidence & Confidentiality

## Resume Bullet Seeds
```

---

## Template for Each Capability Evidence Item

A **capability** is an underlying skill, technique, or worldview that applies across multiple domains, JDs, and problem contexts. It's the "why" behind why different work is transferable.

```markdown
## Capability Evidence (User-Provided)

### [Capability Name — 2-3 word label for what you can do]

**Examples:**
- Programmatic Web Page Interaction
- Schema Evolution and Data Migration
- Production Service Reliability Hardening
- Distributed State Synchronization

**The Capability:**
[1-2 sentence explanation of what this capability is and why it matters]
- What is the core skill or technique?
- What types of problems does it solve?
- Why is it valuable across different domains?

**Evidence from Your Work:**
[Describe concrete projects where you demonstrated this capability]
- Project 1: [Brief description of what you did, specifically the capability demonstrated]
- Project 2: [Different context, same capability]
- Extract file reference: [e.g., animoto2024_test_modernization_rtl.md]

**Why It Matters — Underlying Worldview:**
[Explain your reasoning about why these seemingly different problems are actually the same capability]
- What are the common patterns?
- What tools/techniques do they share?
- What constraints or challenges do they face in common?

**Domain Applications:**
[List the different contexts where this capability is valuable, including JD keywords from various domains]
- Domain 1: [How this capability appears] (keywords: keyword1, keyword2)
- Domain 2: [How this capability appears] (keywords: keyword3, keyword4)
- Domain 3: [How this capability appears] (keywords: keyword5, keyword6)

**Interview Proof Story:**
[20-second explanation you'd give if asked "Tell me about your [capability name] experience"]

**Confidence:** high / medium / low
- **high** = Direct evidence from user's primary work; clear and transferable
- **medium** = Clear evidence but requires some framing/translation to new domain
- **low** = Evidence exists but significant interpretation required; use cautiously

**Recording Date:** [YYYY-MM-DD]

**Session Context:** [Which JD/session this evidence came from]
- Example: "Internet Archive Software Engineer, 2026-04-21, critique r2"
```

---

## Example 1: Programmatic Web Page Interaction

```markdown
### Programmatic Web Page Interaction and Data Extraction

**The Capability:**
Driving web browsers programmatically to navigate to desired states, interact with dynamic content, and extract/validate structured data from rendered pages. This capability underlies a spectrum of tools and domains that all require the same core techniques: browser automation, dynamic content handling, and structured data parsing.

**Evidence from Your Work:**
- E2E Test Modernization (animoto2024_test_modernization_rtl.md): Used Puppeteer to drive browsers through user workflows, handle async content loading, and validate rendered state by querying the DOM.
- Internal JSON Editor (animoto2025_internal_json_editor_dx.md): Built interactive JSON editor that drives browser state changes and captures resulting application state.
- Test Framework (animoto2012_api_test_framework_repl.md): Created test harness that navigates backend systems programmatically and validates responses.

**Why It Matters — Underlying Worldview:**
Whether you're testing, scraping, or training AI agents, the core challenge is the same: "How do I navigate a system to a desired state and extract information from that state?" The tools differ (Puppeteer vs. Selenium vs. Playwright), the domains differ (E2E testing vs. web scraping vs. semantic extraction), but the skills are identical:
1. Browser automation and navigation control
2. Handling asynchronous/dynamic content loading
3. State inspection and data extraction
4. Error handling and retry logic

This worldview applies to E2E testing, web scraping, semantic web parsing, AI agent web interaction, and content harvesting — they all solve the same fundamental problem using the same toolkit.

**Domain Applications:**
- **E2E Testing** (your current use): Validate rendered behavior matches expected user workflows (keywords: end-to-end testing, browser automation, DOM validation)
- **Web Scraping** (data engineering): Navigate pages to correct state, extract structured data (keywords: web scraping, dynamic content, data harvesting, Puppeteer/Selenium)
- **Semantic Web / Knowledge Extraction** (data science): Extract semantic markup or parse structured content from rendered pages (keywords: semantic extraction, RDF parsing, knowledge graphs)
- **AI Agent Web Skills** (emerging): Enable agents to interact with web applications to achieve goals (keywords: agent web browsing, web interaction, autonomous navigation)
- **Civic Data Harvesting** (gov tech): Navigate government websites to locate and extract public records (keywords: bulk harvesting, government data, civic data)

**Interview Proof Story:**
"I've built E2E test suites using Puppeteer that navigate complex interactive pages—waiting for async content, handling dynamic state, and validating that the rendered DOM matches what users expect to see. That same pattern—'get to the right state, extract the data'—is exactly what you do in web scraping. The tools might differ, but the core skills of browser automation, async handling, and data extraction are identical."

**Confidence:** high

**Recording Date:** 2026-04-21

**Session Context:** Internet Archive Software Engineer, critique r2 — web scraping gap-filling checkpoint
```

---

## Example 2: Schema Evolution and Data Migration

```markdown
### Schema Evolution and Safe Data Migration

**The Capability:**
Managing changes to data structures in systems with long-lived data and many dependents (internal services, external APIs, stored records). This requires understanding how to version schemas, migrate existing data safely, coordinate across teams, and provide clear deprecation/upgrade paths so systems don't break.

**Evidence from Your Work:**
- Document Version Migrations (animoto2019_document_version_migrations.md): Designed and implemented system to migrate video project documents across schema versions without data loss or breaking existing workflows.
- Credits Purchase Flow (animoto2020_credits_purchase_flow.md): Integrated new purchase system with existing billing data while maintaining backward compatibility.
- Test Framework Evolution (animoto2016_backend_test_framework_api.md): Evolved test framework API while supporting multiple client versions.

**Why It Matters — Underlying Worldview:**
Systems with long-lived data face a recurring problem: "How do I change the structure of my data without breaking production?" This applies at any scale:
- Internal documents (Animoto)
- Digital archive records (Internet Archive)
- Government databases (civic tech)
- Scientific datasets (research)

The core techniques are the same:
1. Schema versioning strategy (how to name/identify versions)
2. Migration strategy (in-place, parallel, staged)
3. Backward compatibility (dual-write, shims, gradual rollouts)
4. Verification (checksums, sampling, audit trails)
5. Rollback planning (if migration fails, how do we recover?)

This worldview is valuable for data integrity, long-term archival, and systems built to last.

**Domain Applications:**
- **Internal Product Evolution** (current): Update internal data structures as product requirements change (keywords: data migration, schema versioning, backward compatibility)
- **Archive/Collections Management** (Internet Archive domain): Maintain integrity of historical records while evolving metadata structures and preservation strategies (keywords: data integrity, record versioning, collection evolution, provenance tracking)
- **Government Records System** (civic tech): Manage changes to data structures without losing historical context or breaking dependent systems (keywords: long-lived records, data governance, audit trails)
- **Scientific Data Stewardship** (research): Enable research datasets to evolve while maintaining reproducibility and historical provenance (keywords: data versioning, scientific provenance, reproducible science)

**Interview Proof Story:**
"When we migrated our document system to a new schema, I designed a versioning strategy that let us gradually migrate existing projects without breaking workflows. The same challenges exist at Internet Archive—your records span decades, you have many dependent systems, and you can't just rewrite the schema overnight. The techniques are the same: version carefully, migrate in stages, verify along the way."

**Confidence:** high

**Recording Date:** 2026-04-21

**Session Context:** Internet Archive Software Engineer, critique r2 — collections integrity framing checkpoint
```

---

## How to Know If Something Is a Capability (vs. Just a Mapping)

**Mapping (too shallow):**
- "E2E automation frames as web scraping"
- "Data migration work applies to archive records"
- Just a list of domains

**Capability (good depth):**
- "Programmatic web page interaction: browser automation, dynamic content handling, state extraction. Applies to E2E testing, web scraping, AI agent interaction, semantic extraction."
- "Schema evolution: versioning strategy, safe migration, backward compatibility, verification. Applies across product, archive, civic tech, research."
- Includes the **why** (what are the shared constraints/techniques) and **how broadly** it applies

**Test:** Could you explain this capability to someone without context and they'd understand why it matters? If yes, it's a good capability evidence entry.

---

## How to Decide: High vs. Medium vs. Low Confidence

### High Confidence
- You have **direct, primary evidence** from user's work for this capability
- The capability is **central** to the projects, not peripheral
- The user has **explicitly explained** the underlying worldview
- Application to new domains is **straightforward** (doesn't require major interpretation)
- Example: E2E automation evidence for "programmatic web interaction" (core to their test work)

### Medium Confidence
- User has **demonstrated the capability**, but it was more supporting than primary
- Application to **some new domains is straightforward**, others require framing
- Capability is **real and defensible**, but not user's primary strength
- Example: Document migration work applied to archive record evolution (similar problem, different domain)

### Low Confidence
- Evidence exists but is **older, weaker, or peripheral** to the user's main work
- Application to new domains requires **significant interpretation**
- Capability is **plausible** but user hasn't explicitly confirmed the connection
- Use only if new domain explicitly matches and user approves
- Example: Speculative application to new domain without user confirmation

---

## Session File Integration Checklist

Before recording capability evidence to extraction files:

- [ ] Capability name is clear and memorable (2-3 words)
- [ ] User has explained the **underlying worldview**, not just "X maps to Y"
- [ ] Evidence section has concrete projects and extraction file references
- [ ] "Why It Matters" section explains the shared patterns/constraints across domains
- [ ] Domain Applications section lists 3+ concrete domains where capability is valuable
- [ ] Interview Proof Story is 20 seconds and grounded in user's actual work
- [ ] Confidence level is justified (high/medium/low)
- [ ] Recording Date is current
- [ ] Session Context notes which JD/checkpoint surfaced this evidence

---

## Updating Bundles with Capability Evidence

After recording capability evidence to an extraction, bundles should reference the underlying capability.

**File:** `resume_builder/bundles/bundle_[role_type].md`

**Section:** `S3: Achievement Reframing Map` OR new `## Capability Evidence Cross-Reference` section

**Update approach:**

If a bundle includes an extraction that now has capability evidence, add a note:

```markdown
| animoto2024_test_modernization_rtl.md | Frontend test automation | Programmatic Web Page Interaction capability (browser automation, dynamic content, state extraction) | Testing infrastructure [CAPABILITY: applies to web scraping, semantic extraction, AI agent interaction] |
```

Or create a new subsection if the capability spans multiple achievements:

```markdown
### Capabilities Cross-Reference (User-Discovered)

#### Programmatic Web Page Interaction
- **Core Skill:** Browser automation, dynamic content navigation, structured data extraction
- **Evidence:** animoto2024_test_modernization_rtl.md (E2E testing), animoto2025_internal_json_editor_dx.md (interactive state)
- **Applies to:** Web scraping, semantic web parsing, AI agent web interaction, civic data harvesting
- **User Worldview:** All these domains solve the same problem: navigate a system to desired state, extract data from that state. Techniques are identical; terminology and context differ.
- **Confidence:** high
- **Reference:** knowledge_base/extractions/animoto2024_test_modernization_rtl.md → Capability Evidence section
```

---

## Future JD Matching with Capabilities

When running `/make-resume` on a new JD that mentions "semantic web" or "AI agent web skills":

1. System scans extractions for **relevant capabilities**, not just direct matches
2. Session file Framing Strategy notes: "Programmatic Web Page Interaction capability applies — you have E2E automation, interactive state handling, and browser automation evidence"
3. User decision: "Does this new JD's 'web interaction' requirement map to your Programmatic Web Page Interaction capability?"
4. If yes: User is matched to higher-confidence evidence than would appear from surface keyword matching alone

---

## Summary

**Key Insight:** Capturing capabilities (the worldview + underlying skills + why it matters) makes your KB far more useful than surface mappings.

- Capabilities explain **why** different work is transferable
- Capabilities make it easy to spot new JD requirements that use the same underlying skills
- Capabilities are more defensible in interviews (you can explain the conceptual foundation)
- Capabilities are more reusable (semantic web, AI agents, gov data harvesting all use "programmatic web interaction")

**Next time you discover a framing connection:**
1. Don't just note "X frames as Y"
2. Ask: "What is the underlying capability?"
3. Explain: "Why do these seemingly different problems share the same solution?"
4. Document: "What other domains could benefit from this capability?"
# Extraction Framing Evidence Update Template

Use this template when recording user-provided context evidence to an extraction file.

**Key Principle:** Capture **capabilities and worldviews**, not just mappings. Explain the underlying skills and reasoning so that future JDs can discover this work even when they use different terminology (e.g., "semantic web parsing" or "AI agent web interaction" both relate to the same programmatic web-navigation capability).

---

## When to Update

1. User provides context during `/critique`, `/make-resume`, or `/edit-resume` checkpoint
2. Evidence is recorded in session file under `## Evidence Tracking`
3. Decision made: phrase is kept/strengthened (not removed)
4. User has explained the underlying **capability** or **worldview**, not just a surface mapping
5. Ready to make evidence persistent for future JDs

---

## Where to Add in Extraction File

Add a new section titled `## Framing Evidence (User-Provided)` after the existing provenance sections.

**Location in file hierarchy:**
```
# [Extraction Title]

## Metadata

## Source Evidence

## Technical Surface

## Non-Technical Surface

## Key Contributions & Results

## Distinguishing Signals

## Collaboration & Scope

## Provenance Notes
(existing)

## Framing Evidence (User-Provided)    ← ADD HERE
(new section)

## Confidence & Confidentiality

## Resume Bullet Seeds
```

---

## Template for Each Evidence Item

```markdown
## Framing Evidence (User-Provided)

### [Evidence Item Name — brief title of the skill/framing gap it addresses]
- **JD Gap Filled:** [What JD requirement or keyword gap does this address?]
  - Example: "Python in production workflows"
  - Example: "Web scraping capability"
- **User Context:** [Paraphrase or summary of what the user told you]
  - Keep concise — 1-2 sentences
  - Quote key phrases if user was specific
  - Example: "E2E tests use Selenium/Puppeteer to drive and validate dynamic content, which mirrors web-scraping workflows — both involve capturing dynamically-loaded content and validating structure."
- **Framing:** [How this work could be positioned in future resumes for similar JDs]
  - Be explicit about transfer boundaries (what's direct vs what's adjacent)
  - Example: "E2E test automation → web-scraping adjacent skills (dynamic content handling + validation)"
  - Example: "Platform-enablement Python tooling work — managing cross-architecture build systems and compatibility validation"
- **Proof Story:** [20-second interview explanation the user would give]
  - This is what they'd say if asked about the skill in an interview
  - Should tie back to the framing
  - Example: "In my ARM Mac migration work, I led the developer environment setup using Python build scripts and dependency validators to ensure consistent experience across Intel and M-series machines."
- **Related Keywords:** [ATS/domain keywords this evidence covers]
  - Example: `web scraping, dynamic content, E2E automation, Puppeteer, Selenium, data validation`
  - Example: `Python, platform tooling, build systems, developer experience, dependency management`
- **Confidence:** high / medium / low
  - **high** = direct corroboration + user explicitly said this
  - **medium** = adjacent/transfer skill, supported by extraction but not direct domain
  - **low** = speculative or requires significant framing leap
- **Recording Date:** [YYYY-MM-DD]
- **Session Context:** [Link to which JD/session this evidence came from]
  - Example: "Internet Archive Software Engineer, 2026-04-21, critique r2"

---

### [Second Evidence Item, if applicable]
[repeat template]
```

---

## Example: Web Scraping Bridge

```markdown
### E2E Automation → Web Scraping Bridge
- **JD Gap Filled:** "Web scraping" skill in data engineering roles
- **User Context:** "In my E2E test work, I use Selenium/Puppeteer to drive and validate dynamic content loading. That's very similar to web-scraping workflows — both involve capturing dynamically-loaded content and validating structure."
- **Framing:** "E2E test automation with dynamic content validation has overlapping skills with web-scraping (content loading, structure validation). Not direct web-scraping experience, but adjacent."
- **Proof Story:** "In my test modernization work, I built E2E tests that drive dynamic content loads and validate scraped data structures using Puppeteer — the patterns are identical to web-scraping workflows."
- **Related Keywords:** web scraping, dynamic content, E2E automation, Puppeteer, Selenium, data validation, content loading, structure validation
- **Confidence:** medium (adjacent skills; not pure web-scraping experience)
- **Recording Date:** 2026-04-21
- **Session Context:** Internet Archive Software Engineer, critique, gap-filling checkpoint
```

---

## Example: Python Platform vs. Service

```markdown
### Python Platform Tooling Clarification
- **JD Gap Filled:** "Python production experience" in backend/pipeline roles
- **User Context:** "Most of my Python work has been platform/build tooling (ARM Mac migration, dependency validators) rather than core service development. I'm stronger in JavaScript/React for main product work."
- **Framing:** "Python is legitimate platform-enablement and build-tooling work, not production-service development. Clarify scope when applying to service/pipeline roles — this is different value."
- **Proof Story:** "I led the ARM Mac developer environment migration using Python build scripts and dependency validators. That's platform enablement, not the core service work I do in JavaScript/React."
- **Related Keywords:** Python, platform tooling, build systems, dependency management, developer experience, environment setup, cross-architecture compatibility
- **Confidence:** high (clear self-assessment, well-documented in extraction)
- **Recording Date:** 2026-04-21
- **Session Context:** Internet Archive Software Engineer, critique r2, Section 5 Tier 1 improvement
```

---

## How to Decide: High vs. Medium vs. Low Confidence

### High Confidence
- User directly stated the framing
- Extraction already has strong source evidence for the underlying work
- Proof story is crisp and defensible in an interview
- No transfer framing needed — this is what the user actually did
- Example: "I built an internal JSON editor in React"

### Medium Confidence
- User explained the connection between adjacent skills
- Extraction has strong evidence for the base work
- Transfer framing is explicit ("similar patterns," "adjacent skills")
- User comfortable defending in interview but acknowledges it's not direct domain experience
- Example: "E2E automation has similar patterns to web-scraping"

### Low Confidence
- Extraction evidence exists but is older or weaker
- Transfer framing is speculative or requires significant leap
- User expressed uncertainty ("could frame as," "might apply")
- Not recommended for primary resume evidence unless gap is critical
- Example: "My SDET work might apply to cybersecurity roles?"

---

## How to Update Bundles with Framing Evidence

After recording framing evidence to an extraction, check if the bundle should reference it.

**File:** `resume_builder/bundles/bundle_[role_type].md`

**Section:** `S3: Achievement Reframing Map`

**Update approach:**

If the framing evidence suggests a **new alternative for an existing entry**, add a bracketed note:

```markdown
| animoto2024_test_modernization_rtl.md | Frontend test automation | E2E test modernization with pattern-matching skills | Testing infrastructure [USER FRAMING: dynamic content validation → web-scraping adjacent] |
```

Or create a new subsection if the evidence suggests a whole alternative reframing strategy:

```markdown
### Alternative Framings (User-Discovered)

#### E2E Automation as Web-Scraping Bridge
- **Bridge:** Web-driver E2E automation has similar systematic validation skills to web-scraping pipelines
- **Applies to:** Data engineering, web scraping, content ingestion roles
- **User Evidence:** Documented in animoto2024_test_modernization_rtl.md / Evidence section
- **Confidence:** medium (adjacent but not direct)
- **Example JDs:** Shopify data pipeline engineer, Apify web-scraping lead
```

---

## When NOT to Record Framing Evidence

- **FIXED sections:** User clarification on education, awards, dates — don't record as "framing," these are facts
- **Mechanical fixes:** Orphan corrections, char count adjustments — no framing evidence needed
- **Failed defenses:** If user couldn't defend a phrase and it was removed, don't record as evidence
- **Duplicates:** If the same framing is already documented in the extraction, don't add it again
- **Vague clarifications:** If user said "yeah that's fine" without specifics, don't record — wait for stronger evidence

---

## Session File Integration Checklist

Before closing a session with evidence collected:

- [ ] Evidence Tracking section in session file is populated
- [ ] Each evidence item has: checkpoint source, question, response, framing, confidence level
- [ ] User response is verbatim or closely paraphrased (not interpreted)
- [ ] Extraction file(s) are identified where framing will be recorded
- [ ] Bundle updates (if any) are noted in "Action Taken" checkbox
- [ ] Recording Date is current
- [ ] Next steps clarified: "Would you like me to record this to your KB for future JDs?" (ask user before recording)

---

## Future JD Matching

When running `/make-resume` or `/critique` on a future JD that has similar keywords to prior Evidence Tracking entries:

1. Check extractions for existing framing evidence
2. In Phase 0 or Phase 1, note in session file Framing Strategy: "Prior evidence: [topic] can frame as [new topic] with [confidence]"
3. Present to user in bullet-planning stage: "We discovered in [prior JD] that you can frame X as Y. Does that apply here?"
4. User decides: include, skip, or strengthen with additional detail

This closes the loop: evidence → future reuse → stronger resumes with less ambiguity.
