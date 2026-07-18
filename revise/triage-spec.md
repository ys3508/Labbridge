# The Triage — build spec (post-diagnostic stage)

Designed by Claude (brain) for Codex (hands), Jul 17. Sits between the diagnostic (2 questions) and the generated Question Map. The moment the diagnostic visibly pays off: it converts the two-axis read into an ORDERED, CORRECTABLE plan of attack. Do not build it as a display of results — build it as a call the user can overrule.

## Why it exists
A wrong triage is worse than a flat map, because narrowing steers the user AWAY from something they might need. So the Triage's spine is Call → Basis → Correction: it makes a confident coach's call, states the evidence AND its limits, and hands the user a real control to reorder. "We interpret; you correct" (the homepage promise) at the highest-stakes moment.

## Inputs
- Diagnostic verdicts: q1 {substance, delivery}, q2 {substance, delivery} (met|thin|missing per axis, from /api/coach).
- Intake bundle: challenge text, tone (playful|neutral|gentle), contentFears[], obstacles[].
- Round + format + seniority (chips).
- Runway (the date field → days-until).

## The five beats
1. The read — three dimensions with status: substance (from Q2), delivery (from Q1), the-named-challenge (from the challenge field). Two bars + the named fear. NEVER a blended score.
2. The call — "Your biggest lever is X — so we start there." One thing.
3. The basis — "From two answers, so it's a first read." Names evidence + its limits.
4. The correction door (LOAD-BEARING) — the three dimensions as REORDERABLE rows (up/down or drag). On override, acknowledge: "Got it — you know yourself. Starting with X." That acknowledgment is the trust payoff. This is a real control, not copy.
5. The commit — "Here's your order →" into the map, built in that sequence.

## Ranking: leverScore = weakness × round-relevance
- weakness: missing=1.0, thin=0.6, met=0.1 (per dimension, from verdicts).
- round-relevance weights (dimension: substance/delivery/story):
  - recruiter_screen: 0.1 / 0.5 / 0.4
  - technical: 0.7 / 0.3 / 0.0
  - hiring_manager: 0.4 / 0.3 / 0.3
  - case: 0.5 / 0.5 / 0.0
  - final_panel: 0.3 / 0.4 / 0.3
  - not_sure: even (0.34/0.33/0.33)
- Sort descending. NAMED CHALLENGE force-included regardless of score: if it maps to a ranked dimension, boost that dimension; if it's personal (accent/nerves/layoff), it's its own row with honest framing ("you named this — it's #2, here's why it's workable"). Never rank the user's stated dread off the list.

## Two invariants (from the review, carve in)
- RUNWAY forks VOLUME, never WARMTH. Runway and challenge are orthogonal: runway sets how much (tomorrow → one lever + one mock + card; few days → top 2-3; weeks → full map), the tone dial sets how kind. A fragile tomorrow-user gets "we don't have long, so we'll be focused — one thing at a time, and kind about it." Fast ≠ cold. Never let the sprint drop the warmth dial.
- HONEST-EXPECTATIONS PLANT. The Triage names — **for the top dimension only** — what the runway can and cannot move ("delivery we'll shift a lot; your accent we won't change and won't try to — we'll make it a non-issue"). This is the sentence the walk-in card pays off later; only the Triage is positioned to set it. Setting it here is what lets the card show a FLAT LINE at the end without it reading as failure (review point #3).

  **Top dimension only — not per dimension (amended 2026-07-18; the code was right, this spec was wrong).** The plant renders for the biggest lever alone. Triage exists to NARROW to one lever; rendering an expectation across every dimension re-broadens exactly what the stage just narrowed — the user leaves holding four things to expect, which is the state triage was built to end. The per-row `expectation` data stays in the model (later stages may consume it); it is simply not all rendered. This is a deliberate design decision, not a rendering oversight — do not "fix" it to per-dimension.

## Output contract
- `priority[]`: { dimension, rank, rationale, source: "computed" | "user-override" }.
- Rides into generation via the existing instructions block (same mechanism as DIAGNOSTIC RESULTS today) — NO new plan schema.
- ALSO persists as MUTABLE priority state (localStorage, plan-scoped) that later stages (drills, mock, reflect) can re-rank. This mutability is the ADAPTIVE SEAM: v1 sets priority from fields once; within-session adaptation ("they nailed behavioral → push harder there") is a later feature-flag on the same state, not a rebuild. Architect for it now; don't build it in v1.

## The four knobs (context for the whole downstream, not just Triage)
Round picks the MOCK's shape · Format picks its MODALITY (phone → audio-only mock, notes-allowed; video → camera; take-home → deliverable, not a live mock) · Seniority picks its DIFFICULTY (first-role → foundational + gap-defense; same-level-new-field → translate expertise, the career-changer case; senior → leadership/tradeoffs) · Challenge picks its WARMTH.

## The full post-diagnostic sequence (for orientation)
Read → **Triage (this doc)** → Map → Drills (difficulty by seniority, modality by format) → Mock (parameterized by all four knobs; dynamic pushback; Simulated Live archetypes) → **Reflect-on-mock (their self-read first, then confirm/correct — stage 5.5, the buffer that turns a rough mock into "here's the save you didn't reach for" instead of "you failed")** → Walk-in Card (the running read, matured; honest enough to show a flat line).

## What Codex builds for v1
- `components/TriageView.js` — the five-beat stage, reorder control, runway-forked volume, tone-dialed copy.
- A pure ranking helper (leverScore) — unit-testable, no API.
- Wire between DiagnosticFlow's onDone and plan generation in app/page.js: Triage consumes the diagnostic summary, emits priority[] into the instructions block + localStorage.
- No new /api/plan schema fields. No mock runner yet (that's Session B).
- Honesty checks: basis line always present; named challenge always shown; runway never overrides warmth; top-dimension expectations plant rendered (not per-dimension — see the plant invariant above).
