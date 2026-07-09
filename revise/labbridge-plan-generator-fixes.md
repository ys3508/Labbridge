# LabBridge — Plan Generator Fixes (build spec for Claude Code)

Consolidated from two review passes on the same generated plan (MPH Epidemiologist → Pharma RWE Analyst). Deduplicated and ordered by impact. Each item says WHAT is wrong, WHY it matters, and the CONCRETE change. Everything here improves the *fluent/pedagogical* half — the grounding/verify pipeline stays as-is.

---

## P1 — Header must equal the target role (BUG, fix first)

**What:** The plan renders `Toward Data Scientist`, but the target role is **Real World Evidence Analyst** — correct everywhere else in the body. "Data Scientist" appears nowhere in the input; it was invented for the header only.

**Why:** The header is the first thing the user reads. A wrong title makes them think "the AI didn't understand me" before reading a single correct line. This is the same bug class as an earlier test that echoed a raw URL as the header — the body grounds correctly, the header doesn't.

**Fix:**
- The header title must be **derived directly from the target role** (`target.role`, or the extracted job-posting role), never re-generated or re-categorized by the model.
- Rule: `Target role → output title`, verbatim. Do NOT let the model map it to a generic career category.
- Suggested format: `Toward {role}` with an optional subline `{current background} → {role}`. E.g. `Toward Real World Evidence (RWE) Analyst` / `MPH Epidemiologist → Pharma RWE Analyst`.
- Audit every other header-like/summary field for the same re-categorization leak.

---

## P2 — "What you already bring" should SUBTRACT, not just praise

**What:** This section is the strongest part (it re-interprets the user's existing assets — the core LabBridge value). But it reads as encouragement ("You said your skills list includes Statistics…") rather than an onboarding decision.

**Why:** The value of onboarding is *reducing redundant learning*. The section should explicitly tell them what to **skip**, not just what they have.

**Fix:** Restructure from prose-praise into a decisive three-part block:
```
Already productive — skip these:
  ✓ Cohort study design
  ✓ Confounding framework
  ✓ Regression interpretation
Do NOT spend your first month on:
  ✗ Basic statistics
  ✗ Intro epidemiology
Your highest-ROI gaps:
  → Claims/EHR data structure
  → Pharma study protocol
  → Causal inference implementation
```
The framing shifts from "you already know X" to "**therefore skip X, focus on Y**." Add to the generation prompt: *"For transferable strengths, state explicitly what the person should SKIP because they already have it — the value is eliminating redundant learning, not praise."*

---

## P3 — Modules should be real work assignments, not course lessons

**What:** Module 1 is "Write a one-page RWE question map" — a *learning* task. Real onboarding starts from a *manager's request*.

**Why:** Onboarding teaches you to enter a **workflow**, not to study a subject. The plan currently reads like an advanced epidemiology course, not a pharma job.

**Fix:** Reframe each module as a real assignment triggered by a stakeholder ask. Pattern:
```
Current:  "Where RWE sits in drug development"
Better:   "Understand why your manager asks RWE questions"
          Scenario — Your medical team says:
            "We need evidence on long-term effectiveness of Drug A."
          Deliver:
            1. Research question   2. Study design
            3. Data-source choice  4. Business rationale
```
Prompt addition: *"Frame each module as a realistic on-the-job assignment that begins with a stakeholder request, not as a topic to study. The deliverable is what a new hire would actually hand their team."*

---

## P4 — Give data, don't tell them to "find data"

**What:** Module 2 (the strongest module — building an analysis-ready cohort) says *"Obtain or simulate a claims-style dataset."*

**Why:** A real new hire is *handed* data (MarketScan, Optum, Medicare, an EHR extract). "Go find a dataset" is a learning-exercise tell, not a workflow.

**Fix:**
```
You are given:  claims_extract.csv
Your task:      Convert transactional medical records into a
                patient-level analytic cohort.
```
Prompt addition: *"Assume the person is given realistic named inputs (files, datasets, tickets) as they would be on the job — don't ask them to source their own practice material."*

---

## P5 — Add the pharma environment: stakeholders per module

**What:** The plan analyzes but never situates the work among the people who consume it.

**Why:** An RWE analyst constantly interfaces with Medical Affairs, Clinical Development, Regulatory, HEOR, Epidemiology. Missing that makes it feel academic, not corporate.

**Fix:** Add a "**Who cares about this output?**" line to each module:
```
Medical:     Does this answer the clinical question?
Regulatory:  Is the methodology defensible?
Business:    Does this change a decision?
```
Prompt addition: *"For each module, name which stakeholders consume the output and what each needs from it — situate the work inside the organization."* (General principle: adapt the stakeholder set to the target field, not just pharma.)

---

## P6 — Reframe the capstone as a 30-60-90, not a week-one deliverable

**What:** "Your first contribution" is a full end-to-end RWE package (cohort + propensity + estimate + summary + reproducibility). The self-check already flagged this as too big for week one AND as depending on module outputs not yet built.

**Why:** Two problems: (a) it's a graduation project sized as a first task; (b) it's logically incoherent — presented as week-one work but references "the cohort you built (module 2)" and "the propensity analysis (module 4)," i.e. work not done yet. Companies think in **30-60-90** for exactly this reason.

**Fix:** Don't delete it — **rename and stage it** as a readiness arc:
```
Day 30:  Understand the RWE workflow; reproduce an existing analysis
Day 60:  Modify an existing analysis
Day 90:  Own a small RWE question end-to-end   ← the current capstone lives here
```
Rename "first contribution" → "**90-day readiness project**." This resolves the checker's logic flag: the capstone explicitly comes *after* the modules instead of pretending to be week one.

---

## P7 — Resources must answer "why THIS, why NOW" (and confirm timeline isn't invented)

**What:** Resources are real and (in this academic domain) relevant, but presented as a reading list — title + generic blurb.

**Why:** LabBridge's resource value is *justified selection*, not a bibliography. Each resource should say why it's here and what to skip.

**Fix:** Every resource carries:
```
Gap it closes:  You know epidemiology but not how pharma/FDA define RWE value.
Why this one:   Orients which questions RWE answers vs. trials.
Read only:      The role-of-RWE chapter — skip the statistical chapters.
```
Prompt addition: *"For each resource, state the gap it closes, why this specific source, and which part to read/skip — never present it as a general reading list."*

**Also (verify, likely a second invented value):** the timeline note says *"With a deadline in August 2026…"* — confirm that date came from the timeline input and wasn't invented like the header (P1). If the user didn't supply it, it's the same hallucination class and must be gated the same way (present → specific; absent → don't state a date).

---

## Self-check items — resolutions (all three flags were correct)

- **Cohort-building not covered before it's used** → add a pre-Module-2 primer on the RWD data model (patient table, encounter table, diagnosis codes, medication claims, index date) so the cohort task has its prerequisite.
- **Balance-check not explicitly covered** → split the propensity module task into: (1) create propensity score, (2) check balance / interpret SMD, (3) interpret estimate — so the balance check is taught, not assumed.
- **End-to-end capstone too big / depends on unbuilt modules** → resolved by P6 (stage as 30-60-90, place capstone at Day 90).

---

## What NOT to change (keep these)

- The **module-with-embedded-task format** (deliverable + time estimate + "done when") — it's better than the prior reading-list format; retrofit older plan types to match it.
- The **background-aware bridges** ("you already think in exposure/outcome/bias — that's 80% of the job") — this is the core value; P2 sharpens it, doesn't replace it.
- The **honesty valve** ("add the specific company's job description to sharpen the target") — correct behavior, keep it.
- The **grounding/verify pipeline** — untouched; all fixes here are pedagogical/framing, not factual.

---

## Priority order for Claude Code

1. **P1 header bug** — small, findable, visibly wrong on every plan. Do first.
2. **P6 capstone → 30-60-90** + self-check splits (P6 resolutions) — fixes a real logic incoherence the checker caught.
3. **P2 skip-framing** + **P3 assignment-framing** + **P4 given-data** — prompt edits that make it feel like onboarding, not a course. Biggest "feel" upgrade.
4. **P5 stakeholders** + **P7 resource justification** — depth/realism polish.
5. Verify **P7 timeline-date** isn't invented (same gate as P1).

Everything except P1 and the P7 date-check is a **generation-prompt edit**; those two are **template/gating** fixes. Do the prompt edits together, re-run the RWE and Blackstone examples, and compare.
