# LabBridge — Working Notes / Project State

A running memory of what we've decided, what's built, and what's next — so nothing gets lost between sessions. Two parts: **Part A** is the durable state (decisions, artifacts, open threads). **Part B** is the active work: Shift 1.

---

# PART A — Project state

## What LabBridge is (positioning)
An **enterprise onboarding / career-transition** product — NOT an "AI learning-path generator." It takes someone moving into a new field (engineer→biotech, analyst→investing, clinician→pharma), reads their background and target, and produces a personalized plan that turns "I'm new here" into "I can contribute." Wedge = the individual making the leap; orgs/labs are the later expansion.

## The core contracts (these run through everything)
1. **Extract → show → let them edit.** Anything AI infers (skills, artifact type, weighting) is shown and correctable. Used for resume skills, artifact classification, weighting.
2. **Infer, don't re-ask.** If an earlier section already told us something (a pasted JD has a start date), pre-fill and confirm — don't ask again.
3. **Field present → specific; field absent → honest and inviting; never a confident guess.** The rule behind the header bug, the invented date, the derived horizon.
4. **AI arranges given material; it never speaks from memory on facts.** Retrieval/verification owns facts; the model owns fluent connective prose. (retrieval-then-select for citations; grounded+DAG-checked map; checker compares-not-judges.)
5. **Two levels of certification:** the MAP (skill graph — built at generation, must be DAG-checked + eventually seeded-from-artifact) and the PLAN (the four checker criteria).

## The input (fully specified — 5 briefs)
- **01 Background:** optional; blank = beginner (say so). Resume paste → live AI analysis, two jobs: (a) extract skills as keywords WITH evidence phrases, editable; (b) background-bridge/field-translation (deferred/deprioritized — analogies dropped as risky). Fallback fields curated by relevance, plain-language cross-disciplinary skill chips (not "Python/R/SQL").
- **02 Where you're headed:** one unified "add material" list (link/file/text auto-detected), classify-and-confirm, optional target-role field, instruction box (absorbs "skills to learn"). Weighting: type-default → instruction override → AI inference; one "here's how we read it" review; conflict → one question.
- **03 Goals:** two single-selects — **depth** (landscape/functional/deep, reshapes content) and **purpose** (starting_role/interview/career_move/curious, reshapes emphasis). "Explore" pulled out as a lighter mode. Infer from 02.
- **04 Timeline:** ask ONE of {deadline, weekly pace, neither}; derive the rest (effort÷time=pace triangle). Store an absolute date. "No clock" is first-class. Feasibility check negotiates against depth.

## The matching engine (specified)
Per-domain graph, built + cached on first demand (user waits, then reused for all). Entry point from background; targets from weighted artifacts; gap = prereq-closure(targets) − satisfied; topo-sort → sequence; depth sets rungs, purpose sets emphasis; effort → timeline. **Build order: prove Parts B–G against ONE hand-checked graph first; add graph-generation (Part A) second.**

## Verification (specified + partial code)
- **Code checks (no AI):** grounding (resolve IDs against Open Library/OpenAlex/Crossref, drop retracted), prerequisite integrity (DAG-check — working `certifyGraph` written).
- **AI supervisors (constrained to comparison, output specific findings not scores, uncertainty→review):** gap over-teaching, first-task viability. Prompts written.

## Known bugs / findings from live tests
- **Header re-categorization bug:** rendered "Toward Data Scientist" when role was "RWE Analyst"; earlier echoed a raw URL. Rule: **header = target role, verbatim; never re-generate.** Audit all header/summary fields for this leak. (Also check invented dates same way.)
- **Job-link ingestion:** LinkedIn can't be fetched (auth wall + CORS). Must fetch **server-side**, validate you got real content, and **fail honestly to a paste box** — never silently degrade to resume-only. Unread link = zero target weight. Code written.
- **Resource relevance is domain-dependent:** great in citable/academic fields (epi→RWE got STROBE, Rosenbaum-Rubin), weak in practitioner fields (growth equity got *Fooled by Randomness* instead of a16z/Bessemer writeups). Verification catches fake titles, not wrong-but-real picks. → strongest argument for **retrieval-first** (feed candidates in, switch "suggest" → "select from these").
- **Plans feel like syllabi, not onboarding** (friend's review + ours): fixed via the enterprise-onboarding prompt spine — skip-framing, manager-assigned tasks, given-data, stakeholders per module, 30-60-90/observe→assist→own, resource justification. Capstone renamed "readiness project," horizon DERIVED from timeline (deadline → pace → goal-default, stated as assumption).
- **Current experiential problem (active):** plan is correct but boring/thin; "why does it take 4 weeks?" = content-thinness signal → **Shift 1** (below).

## Current generation setup (as of last check)
`app/api/plan/route.js`: one `messages.create`, `claude-opus-4-8`, `max_tokens 4096`, structured JSON output. System prompt + `buildPrompt()` user message. **No retrieved resources or graph in the prompt** — the model invents resource titles from memory, then a downstream `/api/ground` + `/api/reground` verify-and-drop pass catches fakes. No skill graph yet (unbuilt Slice 4).

## Prompt fixes decided (fluent-half only; factual half stays with retrieval)
1. Audience frame (writing for a career-changer who can't self-assess).
2. Per-gap + per-step **background bridges** (needs SCHEMA change: `whyItRelates`, `why`).
3. Depth/purpose reshape emphasis, not just length; expand enums inline in the prompt.
4. Resources: prefer real + checkable-source; don't pad.
5. Interpolation fix: carry skill **evidence phrases**; expand depth/purpose enums.
6. Enterprise-onboarding **spine** (7 steps: transferable→skip, job-critical gaps, map to responsibilities, manager-assigned tasks, deliverables+success criteria, observe→assist→own, independent contribution). Horizon derived.
- **Retrieval-first refactor** = separate, bigger build (the real fix for resource relevance).

## Layout re-architecture decided (information architecture, NOT visual design)
Order: **hook** (2-3 sentences, lead with value) → **course, featured** → **assessment (what you bring/what's missing) collapsed** → **readiness project (derived horizon)** → **self-check collapsed, failures-only.** Lead with value, defer verification. Visual polish (color/type) deferred to last.

## Artifacts produced (files)
Design: `labbridge-design-spec`, `labbridge-input-spec` (01), `labbridge-where-headed-spec` (02), `labbridge-goals-spec` (03), `labbridge-timeline-spec` (04), `labbridge-matching-engine-spec`.
Verification/fixes: `labbridge-checker-prompts`, `labbridge-grounding-map-certification`, `labbridge-job-link-ingestion`, `labbridge-plan-field-wiring`, `labbridge-revised-generation-prompt`, `labbridge-plan-fixes-and-board-handoff`, `labbridge-plan-generator-fixes`, `labbridge-onboarding-reframe-and-layout`.
Working code: `labbridge-form.html`, `labbridge-onboarding.html`, `labbridge.html` (merged form→onboarding + live OpenAlex grounding test).

## Open threads (not yet done)
- **Shift 1** (active — see Part B): make modules *contain* content, not point to it.
- **Shift 2:** stateful tracked journey (modules/chapters, schedule, progress, milestones, competency, observe→assist→own made visible, saved state). Real app engineering. AFTER Shift 1.
- **Shift 3:** feedback loops on deliverables (AI evaluates learner work). Hardest + riskiest — same grounded/compare-not-judge discipline. LAST.
- Board page: plan→board handoff wiring; grounded AI bot (answers only from page material); notes panel (easy/safe).
- Retrieval-first refactor (fixes resource relevance).
- Map generation + certification (Part A of matching engine).

## Sequencing principle (applies to everything)
**Prove one full unit feels great before building the machinery to have fifty.** Content/structure before visual polish. Fluent half is safe to enrich; factual half stays grounded. Don't build a tracker around empty modules, or a bot with nothing to ground it in.

---

# PART B — Shift 1: from "pointer" to "container" (ACTIVE WORK)

## The problem, precisely
A module today is a **pointer**: a task title + a link ("go read this doc, go build this thing" — elsewhere). So the page feels empty even when the plan is correct, and the duration ("4 days") feels arbitrary because nothing on the page would take 4 days. **This is a generation problem before a UI problem** — if the generator only emits a title + link, no interface makes it feel full.

## The goal
A module should **contain** the learning, not point to it. Each module holds, in order:
1. **A short taught concept** — the specific idea this module teaches, explained in the learner's own terms (bridged from their background), grounded in real material. Not a link to a concept — the concept itself, concisely.
2. **A worked example** — one concrete instance showing the concept applied (e.g. tracing one patient across claims tables), so the learner sees it done before doing it.
3. **The hands-on task** — the manager-assigned assignment (already present), with given inputs, deliverable, and "done when."
4. **A self-check** — how the learner knows they did it right (criteria they can apply themselves; the human-owned reflection, not a gate).
5. **The scoped resource** — kept, but now a *supporting* detail under real content, not the headline.

That sequence — concept → example → task → check — is what turns a pointer into a course module and fills the time honestly.

## Why this first (not the tracker or feedback)
Most of the "boring/thin/why-4-weeks" feeling is the pointer-vs-container gap, not missing progress bars. Fixing it is a **generation-prompt change** — cheap relative to Shift 2/3, and it's the thing actually causing the boredom. Tracking or grading empty modules just decorates the emptiness.

## The generation change (what to build)
Extend the plan schema + prompt so each `learningSequence` module produces embedded content, not just a task + link:
```
module = {
  title,
  why,                 // why this, why here (bridge — already added)
  concept: {           // NEW — the taught content, concise
    explanation,       // the idea, in the learner's terms, grounded
    workedExample      // one concrete applied instance
  },
  task: { assignment, givenInputs, steps, deliverable, doneWhen, stakeholders },  // already good
  selfCheck,           // NEW — criteria the learner applies to their own work
  resource             // kept, now supporting
}
```
Prompt addition (sketch): *"For each module, first TEACH the concept concisely in the learner's own terms (bridged from their background), then show ONE worked example applying it, THEN give the hands-on task, THEN a short self-check the learner can apply to their own output. The taught content must be substantive enough to stand on its own — the learner should not need to leave the module to understand the concept. Ground factual claims in the provided/known material; do not pad with generic filler."*

## The test that decides everything
Build this for **ONE module of the RWE plan** (module 1 — "real-world data structure and clinical coding" is a good candidate). Render concept + worked example + task + self-check + resource, embedded. Then look: **does that one full module feel engaging and worth 3-4 days?** If yes → Shift 1 works, roll it across all modules, then consider Shift 2. If no → more infrastructure won't save it; rethink the module shape cheaply, before building any tracker.

## Guardrails carried in
- Concept explanation is **grounded**, not free-generated facts — same discipline as everywhere.
- Self-check is **reflection, not a gate** — criteria the learner applies, invited not required (ties to the notes/reflection feature).
- Keep the resource, demote it to supporting.
- Don't build the tracker (Shift 2) or feedback (Shift 3) yet — one full module first.

## Immediate next step
Spec "embedded module content" concretely for RWE module 1 — exact concept text shape, worked-example shape, and the prompt/schema change — then build just that one module and judge it.
