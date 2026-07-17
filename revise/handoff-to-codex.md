# Handoff to Codex — the Jul 12–16 arc (read this first)

Written by Claude for Codex, Jul 16. (The previous version of this file was a Jul-9 handoff about the moments rework — long since shipped; see git history if curious.) The product changed more in these five days than in the month before. This is the map; the full story is in JOURNEY.md (read the entries top-down from "Q: 'You've got a list based on my review right?'"), and each feature has a spec in `revise/`. Everything below is MERGED TO MAIN and pushed (`ab4dbea`).

## The one-paragraph version

Sissi + you (your reviews were relayed in throughout) ran a 101-item page-by-page review of the first paid generated plan. Fixing it produced, in order: the **honest loop** (earned checkmarks, real AI review via /api/coach, Try→Draft→Coach reshuffle), the **materials engine** (every task's "you're given" files are generated synthetic practice data with a plan-scoped world canon so entities can't drift; Opus fact-check on coding references), **four purpose grammars** (starting_role / interview / career_move / curious are different plan SHAPES — same flat schema, reinterpreted fields), **gap-derived task counts** (no more always-5; stops = the actual gaps, fitted to the time budget, deferrals explicit in `trims[]`), **within-plan variety** (scaffolding fade, task archetypes incl. critique/shadow_reproduce/plot_twist, free-text graded question genres), a **time tracker** (active-minutes, idle-capped), a **split-pane context-injected assistant** (✳ on the Toolbox rail), a **feedback layer** (purpose-aware coach tone incl. a reflective non-grading mode for career_move, a zero-cost draft linter, beat-level 👍/👎 capture, tap-a-term), and finally **interview mode as the product's front door** (two-door landing, diagnostic-first intake with an intake router and tone dial, Question Map with posting-line receipts, named-not-dreaded gap question). Vercel now deploys from main; a template-literal backtick broke the first build (fixed in `ab4dbea` — lesson: dev compiles routes lazily; only `next build` sees everything).

## Where things are (files you'll touch or read)

- `app/api/plan/route.js` — the generation contract. Heavily expanded: purpose grammars, gap-derived counts, scaffolding fade, archetypes, question genres, interview-intake rules, and `entitySheet` / `trims` / `timeEstimateMin` / `archetype` in the schema (still ONE flat schema — the compiled-grammar-limit wall stands; all new fields are strings/ints). ⚠ It's long; a consolidation pass is calendared (see Codex tasks).
- `app/api/materials|coach|assist|intake/route.js` — four new endpoints: synthetic practice materials (world canon + reference fact-check), draft grading (purpose- and tone-aware; criteria verdicts with quoted evidence), the side-panel assistant, and the interview intake router (fused-sentence splitting into contentFears/obstacles, tone ∈ playful|neutral|gentle, Q2 + grading keys, hybrid model-written contract line for vulnerable intake, per-element fallbacks).
- `components/PlanView.js` — grew a lot: TaskMaterials, CoachReview, FreeTextCheck, AssistantPanel, TimeMeter, DraftLinter, BeatFeedback, TermChips, purpose beat identities, curious door wrap, roadmap receipts/gap-marker/trims/"your background made it shorter". It wants splitting into files (good Codex task, via proposal).
- `components/InterviewDoor.js`, `components/DiagnosticFlow.js`, `app/page.js` — the landing two doors + the interview intake (chips for round/format/seniority; the challenge field is fear's single home; repeatable interviewer rows with honest LinkedIn-blocks warning) + the two-question diagnostic (Acknowledge→Adapt→Explain contract line; two-axis substance/delivery grading; the "hoping to work in" prompt after Q1).
- Specs: `revise/interview-mode-spec.md` (complete design incl. the un-built Session B), `revise/purpose-grammars-spec.md`, `revise/data-workspace-spec.md` (DuckDB workspace, deferred), `revise/review-consolidation.md` + `revise/plan-review-notes.md` (the 101-item review, resolved).
- `TASKS.md` — the honest ledger is current; everything deferred is dated there.

## Conventions that changed

- **Push with every commit now.** Five unpushed days left GitHub stale and CI blind — the backtick bug reached Vercel because CI never saw the code. Branch→main merges remain Sissi-approved (she approved all of these).
- The one-schema rule is load-bearing everywhere: purposes/archetypes/receipts all REINTERPRET existing fields. Before adding a field, ask why you can't reinterpret; if you must, strings and ints only.
- Honesty patterns now extend to: marketing copy (no "exactly", no "every answer" — see the landing-page JOURNEY entry), synthetic data (labeled, canon-consistent, reference docs must be correct), interviewer info (archetype never impersonation; paste-only), and grader promises (what the intake contract line grants — e.g. layoff-omission — the grader must honor).

## Good Codex tasks (mostly your lanes)

1. **Back-review this arc** — you have standing review rights; commits are well-messaged and chronological.
2. **Golden fixtures for interview mode** (your fixtures lane) — an interview-purpose input fixture + expected-shape checks (archetype ∈ interview kinds, why=receipt non-empty when a posting exists, gap_defense exactly once). Sissi's first interview generation will be the reference output.
3. **CI hardening** — the workflow exists (lint+check+build) but was blind for days; consider PR-gating and a badge so silence is visible.
4. **PlanView.js split proposal** — render lane is Claude's; a mechanical module-split proposal via `revise/proposal-planview-split.md` per the ownership rule would be very welcome.
5. **The prompt consolidation pass** (calendared, unstarted): plan/route.js's SYSTEM grew by accretion and stacked soft rules degrade instruction-following — the honesty/tone constraints are the ones most at risk of being dropped under load. Needs one careful rewrite + a golden-fixture regression run. Plan-generation lane is Claude's — coordinate via revise/ before touching.

## Open with Sissi

Interview-mode **Session B** is next by priority (mock runner with dynamic pushback from the actual answer, Simulated Live Interview voiced by interviewer archetypes, walk-in card, post-interview loop); the DuckDB workspace after. Her first interview-purpose generation (~$0.40) is still pending and doubles as the validation run for the entire prompt layer above. Vercel env-var check pending: the public deploy should be keyless (demo works fully; generation degrades honestly) unless she's set a spend cap.
