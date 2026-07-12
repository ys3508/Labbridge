# Validation notes — coverage triangulation (living doc)

Method (for non-experts): take a credible expert-made curriculum/primer, list its
beats, compare against our plan's stops + gaps. You compare tables of contents,
not science. Repeat per domain/persona.

## #1 — IQVIA "Real World Evidence Studies: Getting started" (2020, 4 senior authors) vs our RWE sample plan — 2026-07-11

**Their beats:** (1) RWD/RWE definition vs RCT, generalizability rationale;
(2) data-quality caveats of non-controlled collection (missing, inconsistent,
patient-reported); (3) WHERE RWE fits the drug lifecycle — pre-launch (disease
burden, trial design, HTA/payers, rare-disease comparator arms), post-launch
(treatment patterns, conditional approval, pricing), line extensions;
(4) credibility criteria: Relevance · Reliability · Reporting · Transparency ·
**Common data model** · Gaps.

**Coverage verdict:**
- ✅ Strongly covered by us: (2) — our Stop 1 (claims as billed events, enrollment
  windows, codes-as-clues, limitations memo) IS their reliability/completeness
  theme, taught hands-on rather than described.
- ✅ Justified skip: (1) — an MPH epidemiologist doesn't need "what is RWE vs
  RCT"; our skip-framing exists for exactly this. (For a non-epi persona the
  model should generate this stop — worth checking at live-model validation.)
- ⚠️ **Real gap #1: lifecycle/stakeholder context (3).** Where RWE sits
  (pre/post-launch, HTA, payers, regulators) is thin in our sample. Note: the
  original Phase-8 model output HAD this module ("where RWE sits in drug
  development") — the 3-stop hand-authored mock compressed it away, so this is
  partly a mock artifact. Action: at live validation, confirm the model still
  produces lifecycle context; if not, one prompt line.
- ⚠️ **Real gap #2: common data model (OMOP/CDM) never appears.** It's a real
  workplace concept for an RWE analyst (safe under facts-vs-fluency as workflow
  orientation, no invented specifics). Action: candidate keyTerm/concept for
  Stop 1 at live validation.
- Their gaps vs us: zero hands-on anything (it's an orientation blog) — the two
  artifacts don't compete; they layer. Confirms the free-resource role: primers
  like this belong in our verified-resource layer, not absorbed into the plan.

**On "content too short":** the article's depth is orientation breadth, not task
depth. Our fix remains opt-in depth (go-deeper expansions, depth-scaled
concepts) + richer free resources — not longer default prose.


## #2 — Claude one-shot plan (same Persona-1 input, chatbot generation) — 2026-07-11

Sissi generated an onboarding plan by giving raw Claude the same persona input.
**Honest verdict: better teaching density than our sample.** A practitioner-voice
plan: week-by-week against the real deadline dates, an honest gap table,
claims-specific traps ("a fill is dispensing, not ingestion"), a Medical-vs-
Commercial compliance rule, sensitivity analyses ("attack your own numbers"), a
QC checklist. Notably ZERO resources (smart dodge — nothing to hallucinate) and
zero interactivity/state/verification. It also asserts standard-practice
thresholds our facts-vs-fluency rule would have suppressed — but often correctly
flagged ("assume until told otherwise"), which taught us the flagged-convention
upgrade.

**Absorbed into the contract (all as universal patterns):** askYourTeam ·
traps[] · flagged conventions · UI calendar weeks · self-falsification step ·
richer capstone QC (via selfCheck guidance) · functional cap 3-4 → 4-6.

## #3 — ChatGPT plan (same input, PDF) — 2026-07-11

A curriculum: 8 modules + capstone with named deliverables. Broader coverage
(RWE landscape module — CONFIRMS the IQVIA lifecycle finding, now a requirement;
RxNorm/LOINC; covariate balance; an evidence-review module) but: no timeline
math for a 4-week window, no teaching inside modules, thin personalization, no
resources/verification/state.

**Absorbed:** ORIENTATION requirement (2 independent confirmations) ·
canonical-artifact review pattern (read ONE verified public artifact, structured
extraction — connects our resource layer to a task).

**What both lack (the moat, twice confirmed):** verification, state/artifacts,
progress, user control (trims), honesty guarantees across runs, and (ChatGPT)
personalization. Their content depth + our contract and workspace = the target.

## #4 — LIVE VALIDATION RUN #1 (Persona 1, real model, 2026-07-11) — **PASS**

First paid generation under the full contract (after the grammar-limit fix).
Judged against the pre-registered rubric:

- **Teaching density:** concepts ~185-200 words each, genuinely teaching, in her
  voice ("treat the extract like a registry with three catches"). ~2x the mock.
- **Traps:** senior-grade, matching the one-shot's best ("a pharmacy claim means
  dispensed, not taken"; "one product spans many NDCs; missing some silently
  drops patients"; "don't set index after outcomes").
- **Flagged conventions WORKING:** never asserts n<11 or washout lengths as fact —
  every threshold is "confirm the team's convention." More honest than the
  one-shot, equally useful.
- **Fidelity:** role verbatim; Meridian named (given); deadline 2026-08-07 used
  untransformed; phases relative and COMPRESSED TO HER 4-WEEK RUNWAY (Week 1 /
  Weeks 2-3 / Final week — not 30-60-90). Horizon derivation confirmed live.
- **New fields all landed:** context (newcomer scene-setting) ✓ · askYourTeam
  (excellent: "open vs closed claims?", "monthly rows vs start/end dates?") ✓ ·
  comprehensionChecks answerable-from-taught ✓ · self-falsification steps in
  tasks 4-5 ✓ · searchLinks correctly ABSENT (purpose=starting_role — gating
  works) ✓ · worked examples on tiny named objects (P001, P002/P003) ✓.
- **Coherent project:** each task's Given references prior modules' outputs;
  capstone = her actual ticket, verbatim intent.
- **The flat→rich adapter worked first try** (roadmap totals parsed day-level
  timeboxes into ~48-96 hrs; calendar span rendered from the real deadline).

**Open nits (non-blocking):** duplicated "Readiness Project:" in the capstone
title (model included the label; strip in prompt or UI) · lifecycle/pre-post-
launch context still thin (IQVIA gap #1 partially open; audiences covered,
lifecycle not) · OMOP/CDM still absent (gap #2) · closesGapIndex not visible in
the export — verify via briefing chips as tasks complete.

**Verdict: the content question is answered.** Live output exceeds the mock
~2x in teaching density, matches the one-shot's practitioner wisdom, and keeps
every honesty gate the one-shot lacked. First run, zero tuning.