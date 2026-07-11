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
