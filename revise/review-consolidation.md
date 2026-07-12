# Review consolidation — the 101-item ledger, resolved

Source: two-reviewer live-plan review (Sissi structural/product, Codex technical/domain), 100% coverage — briefing, 5 tasks × 8 beats, readiness project, on a live role-only generation. Full ledger: `revise/plan-review-notes.md` (items 1–70) + appended rounds (71–101).

**Codex's closing verdict:** content good enough to ship (T2/T4/T5 model pages interview-grade); integrity architecture done and holding; four small defects + one substantive gap — *"the teaching is done; the only thing left in this product is the data."*

**Sissi's closing verdict (#101):** the plan sells job-world time (90 days) for a workspace-time product (~3 hours). Fix the clock.

## The three decisions, resolved as follows

1. **Inputs (#70/#95) → Door C, model-generated on demand.** No synthetic dataset. A "Generate practice materials" action per task produces small, internally-consistent, explicitly-labeled synthetic artifacts (a mini extract as a table, a filled spec, an imbalanced Table 1…) seeded with the module's own traps. Field-agnostic because the model writes them per plan; honest because they're labeled synthetic; cheap because Haiku + user-triggered + cached. The plan's own Observe phase ("read a completed spec, reproduce the counts") endorsed exactly this (#100). Hand-authored fixture artifacts remain an option for the demo personas later.
2. **Check rebuild (#75/#94/#97) → prompt-side, on the two in-product exemplars.** Scenario-classification stems (definition prongs stated, learner recognizes the pattern), length-matched distractors each tempting to a smart reader (one adjacent-task concept, one good-sounding-but-insufficient), never options the page just forbade.
3. **Prompt batch → applied in full** (~25 contract rules + pinned keepers, below). Verification = ONE paid Retry run on Persona-1 inputs, done by Sissi.

## Applied in this batch

**Prompt contract (app/api/plan/route.js):** workspace-time timeboxes (#101); dependency-order contract (#61); cross-field coherence incl. goal↔teaching (#36/#71); givens-honesty — no phantom files, materials come from the workspace (#42/#70); spine = highest-judgment decision (#48); prior-art rule (#49); hard questions answered with named conventions/instruments/thresholds/sources (#52/#90); method-limit motivates next method (#91); canonical artifact shapes shown (#92); index-event lookback + explicit cross-task callbacks (#53/#81/#82); example ambiguity + qualifiers-ride-with-claims + signal-strength honesty (#20/#84/#74); check rebuild (#75/#94/#97); criteria↔watch-for matched pairs, anti-pattern naming, runnable doneWhen (#89/#43); skeptical-adversary self-test step (#93); askYourTeam non-redundancy + job-derived floor (#87/#69); professional-term naming (#72); "task" vocabulary (#83); cold-start register (#56/#67).

**Code (components/PlanView.js + routes):** deliverable-type-aware template/placeholder/button (#85); all drafts .md (#76); Coach watch-for dedupe (#79); prediction-framing checkboxes (#78); final-task wrap strings state-aware (#98/#99); concept traps wired into coach review (#80); "no extra reading" line cut (#77); resource names surfaced (#86); **/api/materials** + per-task materials panel, demo-mocked (#95); in-flight generation lock — no double-bill on mid-generation refresh (#64); un-teach scan added to /api/check (#55).

## Deliberately left open (need her input or design time)

- #57/#60 "coming from" selector + clickable You-today chips (input-layer feature; needs UX design)
- #58 mock-leak loudness (small; decide the desired demo/real boundary behavior)
- #9 one-page review mode; #24 free-text check answers (coach endpoint is ready for it)
- #30 full synthetic CSV (superseded by Door C unless she wants downloadable files)
- Sonnet upgrade for /api/coach if trap-wiring (#80) leaves recall short

## Verification protocol (her single paid run)

Load Persona-1 inputs → gate → **Generate new (paid)** → check against this list: hours-not-days road (#101); no phantom files in givens (#70); value-sets/codes stop before cohort stop (#61); criteria cover every step (#36); scenario-style checks (#75); washout taught in body (#53/#81); named instruments (SMD etc., #90); materials button works on task 1 (#95); coach catches all three seeded errors with traps wired (#80).
