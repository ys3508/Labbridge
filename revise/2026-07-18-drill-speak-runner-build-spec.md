# Drill speak-runner — ordered build spec + acceptance criteria (2026-07-18)

**For whoever builds (Codex or CC), and for Sissi to review against.** This turns
the REMAINING list in `revise/2026-07-17-drill-grammar-spec.md` into an ordered,
checkable build. It invents no new decisions — every ruling is already closed in
that spec and its Jul-18 addendum. Where this doc and the grammar spec disagree on
dig honesty, **this doc is right**: the "sentences must trace" rule was reversed to
the spark stance (`revise/2026-07-18-dig-spark-stance.md`, `bb23341`).

Scope (**Path A**, Sissi 2026-07-18) = the interview `speak` loop **plus** storybank
persistence + the provenance-event model, built in the same effort so the trust copy's
items 2 / 4 / 7 are true-in-code before it ships. Not the mock runner, not the walk-in card,
not the post-interview loop.

---

## Gates — both cleared; one ship-coupling remains

- **Cost probe — LANDED.** `8c22f3b` / `revise/2026-07-18-drill-cost-probe.md`: 0.76–0.85¢
  per full loop, ~0.08¢ spread → **bundle**, not a live meter. The grammar spec's hard
  *"do not start Session B until it lands"* gate is cleared, and Phase 8 is pre-decided.
- **Trust-copy register — APPROVED (Neutral).** Gentle deleted; the copy content is settled
  (`revise/2026-07-18-trust-copy-draft.md`).
- **Remaining coupling — a ship-gate, not a start-gate.** By the seam rule the trust copy
  cannot *ship* until items **2** (retained takes), **4** (per-user story bank), and **7**
  (plan-scoped grading) are true-in-code. Path A builds those here — so the build can START
  now; the copy WIRES LAST (Phase 0), once the storybank track has made 2 / 4 / 7 real.

## Non-negotiables carried into every phase (reviewer checks these first)

- **Plain JS** — no `.ts`/`.tsx`, no type annotations (AGENTS.md).
- **Anthropic only** — `MODEL` (Haiku) for the loop's calls, `output_config` json_schema,
  **no `effort` on Haiku**, key stays server-side.
- **Fork 6** — no interview `model`/`visual` beats may render. A fantasy answer shown
  before the user speaks contaminates. This is enforced in code today; keep it enforced.
- **Axis separation (fork 4)** — substance is judged as if the transcript were cleaned
  into fluent English; fluency/accent/disfluency touch **delivery only**. Already in the
  `/api/coach` SYSTEM prompt; every new coach call inherits it.
- **Dig = the spark stance** — offer sparks freely, recommend provenance, enforce nothing
  but the push. **One hard line: never assert an unclaimed fact as the user's own history.**
- **Voice honesty** — STT is browser Web Speech; **typed fallback always present**; no audio
  stored; the freeze lifeline and "Stop and confirm" behavior from `VoiceInput` are reused,
  not reinvented.
- **Push is one-per-take, fixed (v1)** — no adaptive escalation. That's **G6**, out of scope.
- **Trust copy ships WITH this build** — the seam rule. See Phase 0.

---

## Phase 0 — Trust copy wired (ships LAST, gates the release)

**Position.** Listed first because it's the release gate, but it **wires last in code**: it
may only land once the speak-runner track (item 2, retained takes) and the storybank track
(items 4 + 7) have made its clauses true. Register is **approved (Neutral)** — no content
decision remains; this phase is now purely the wiring + the seam check.

**Acceptance**
- [ ] The approved **Neutral** copy from `revise/2026-07-18-trust-copy-draft.md` is wired into
      the diagnostic/drill trust line (takes plural, pause marks, plan-scoped grading, not-total
      deletion, unchanged no-audio promise), replacing the `DiagnosticFlow.js` standing line and
      folding in the `VoiceInput.js` retake note.
- [ ] **Every clause is true-in-code at wire time** — retained takes (Phase 1/6), per-user story
      bank (S1–S2), plan-scoped grading (S3), real per-plan delete (S4). No clause asserts a
      capability not yet shipped.

**Gate:** wires only after Phases 1–7 and S1–S4 are green. Do not paraphrase or invent copy.

---

## Phase 1 — The speak loop replaces the typed draft box (the spine)

**Goal.** For interview tasks (`purpose === "interview"`), the deliverable is captured as
a spoken take, not typed prose: `speak → replay + self-read → feedback → re-speak`.

**Seams.** Reuse `components/VoiceInput.js` (`{value,onChange,onMetricsChange,onSkipQuestion,
tone,question}`, emits takes `{transcript, metrics}`, typed fallback, freeze lifeline). In
`components/PlanView.js` the interview task's draft box (`drafts[taskIndex]` via
`setTaskDraft`, ~line 850) is swapped for the loop; the **confirmed transcript becomes the
answer-bank entry** (`drafts[i]`), so existing done-marking, folder, and export keep working
unchanged.

**Acceptance**
- [ ] Interview task deliverable is captured via the speak loop; the typed box no longer
      renders for interview purpose (typed fallback still reachable inside `VoiceInput`).
- [ ] Non-interview purposes still use the typed draft box (no regression).
- [ ] The confirmed transcript persists as `drafts[taskIndex]` (plan-scoped `scopedPlanKey`)
      and marks the task done on existence, exactly as the typed draft did.
- [ ] Delivery metrics captured per take; **no audio stored**.
- [ ] Fork 6 still holds: no `model`/`visual` beat renders in the loop.
- [ ] Replay + self-read step exists between speak and feedback (the user hears/reads their
      own take before grading).

**Test.** Live at zero cost is not possible (needs the coach). Zero-API: a render test that
the interview beat mounts `VoiceInput` and the typed box for non-interview. Live: one take
end-to-end confirms transcript → `drafts[i]`.

---

## Phase 2 — Multi-turn `/api/coach`

**Goal.** `/api/coach` grades **one static draft** today. Extend it to grade a short turn
history (take 1 → push → re-speak) without losing the diagnostic's one-shot contract.

**Seams.** `app/api/coach/route.js`. Add an optional `turns` (or `priorTake` + `pushText` +
`reSpeak`) input; when absent, behave exactly as today (the diagnostic and non-interview
drafts must not change). Keep the SCHEMA and axis-separation rule.

**Acceptance**
- [ ] Route accepts a multi-turn payload and grades the exchange, not just the last string.
- [ ] Backward compatible: existing single-`draft` callers (diagnostic, typed drafts) get
      identical behavior — verified by the existing coach fixtures still passing.
- [ ] Axis separation preserved: substance judged as cleaned English (the L2 fixture
      `fixtures/coach-axis-l2.json` still passes).
- [ ] Zero-API lock in `scripts/check-fixtures.mjs` pins the multi-turn payload shape.

---

## Phase 3 — Mid-recording text-interrupt push (one per take)

**Goal.** One push per take: a single follow-up interrupt that tests whether the answer
survives pressure. Fixed-and-dumb in v1.

**Seams.** A push-generation call (Haiku, via `/api/coach` or `/api/assist`) off take 1's
transcript + the task; rendered as a **text interrupt** mid-loop; the user's response is the
re-speak (take 2). Recitation is noticed **at the push** (ruling B), not via a tap counter.

**Acceptance**
- [ ] Exactly **one** push per take — never a second, no adaptive escalation (G6 stays closed-out-of-scope).
- [ ] The push is a text interrupt (no audio), answerable by voice or type.
- [ ] The coach's read of the re-speak reflects whether the answer **survived the push**
      (the `/api/coach` interview-rehearsal branch already frames this).
- [ ] A borrowed/recited answer is caught at the push, per the spark stance — the push is
      what protects a borrowed answer, not a lock on what dig may offer.

---

## Phase 4 — Dig UI (spark stance)

**Goal.** Give the frozen user structured ways to find their own words, honestly.

**Seams.** `app/api/assist/route.js` already carries the spark stance (`INTERVIEW_DIG`) and
context (resume + the two diagnostic answers). This phase is mostly UI + two prompt-scope
changes.

**Acceptance**
- [ ] **Keywords / Full-sentences toggle**, default **Keywords**. STAR-from-resume full
      sentences are gated **behind** Full-sentences (ruling D).
- [ ] Per-item **"Say this in English"** tap (ruling B) replaces any global mode — every
      rendered sentence exists because the user asked for *that one*.
- [ ] **Per-tap empty-material guard**: a tap with no substance behind it returns
      "nothing to build from yet — answer the hint first," never a fabricated filled gap.
- [ ] **Cross-question retrieval** (ruling C): dig on question N may reference the user's
      notes from questions 1..N-1. One retrieval-scope change in the dig context.
- [ ] Honesty holds to the **spark stance**: sparks offered freely and marked as sparks;
      provenance recommended not enforced; **the one hard line** — dig never narrates an
      unstated fact as the user's history (offer-as-question is fine; assert-as-their-fact is not).

---

## Phase 5 — Tap-to-notes (AI-condensed bullets)

**Goal.** A tap condenses the current answer/hint into a short bullet the user keeps.

**Seams.** A condense call (Haiku, json_schema); bullets stored plan-scoped (`scopedPlanKey`,
alongside drafts). Feeds Phase 7.

**Acceptance**
- [ ] A tap turns the live answer into 1–3 condensed bullets in the user's own content.
- [ ] Bullets persist plan-scoped; survive reload.
- [ ] Empty guard: nothing to condense → honest "nothing here yet," no invented bullet.

---

## Phase 6 — Banking gate + verdict-backed badge (ruling A)

**Goal.** Bank on **existence**, badge on **quality** — the draft-gate pattern.

**Acceptance**
- [ ] **Bank = a full take + a push response + an explicit tap.** Weak-but-honest work banks
      (existence gate); the gate requires the work to be *real*, not good.
- [ ] **Badge = earned separately, verdict-backed** — may say "survived the push" only when
      the coach's verdict supports it.
- [ ] **Drills bank per take, one push per take.** "Survived two pushes in one take" is the
      mock's harder claim — **not built here**; leave the badge split noted for the mock.

---

## Phase 7 — Notes → cheatsheet assembly

**Goal.** Assemble banked bullets (+ their cross-references from ruling C) into a cheatsheet.
The story bank emerges from behavior — the cross-references *are* the story-bank spec, observed.

**Acceptance**
- [ ] A cheatsheet renders from the banked bullets, grouped usefully (by question/section).
- [ ] Export path exists (Markdown, consistent with the folder's existing exports).
- [ ] Nothing in the cheatsheet is content the user didn't produce or explicitly keep
      (spark-stance one-hard-line holds at assembly time too).
- [ ] *Adjacent, not required here:* the one-page "30-min-before" interview cheat-sheet and
      Day-One Pack (TASKS.md ledger) can consume this output later — don't build them now.

---

## Phase 8 — Cost UI (probe landed → BUNDLE)

**Goal.** Show the drill's cost honestly. The probe (`8c22f3b`) settled this: ~0.08¢ spread
across answer lengths is bundle territory, not meter territory.

**Acceptance**
- [ ] Cost is disclosed once as an **aggregate bundle**, not a per-drill price tag on each action.
- [ ] No paid call fires without the user's explicit action (the existing spend-armor pattern).

---

## Storybank track (Path A) — build in parallel with 1–7; gates Phase 0

Design records: `revise/2026-07-18-storybank-design.md` +
`revise/2026-07-18-storybank-provenance-events.md` + `decisions/ADR-0006-data-deletion.md`.
Do not re-derive the model — implement those. This track makes trust-copy items 4 and 7 true.

### S1 — Provenance-event model + persistence
- [ ] `ProvenanceEvent { claim_id, tier, plan_id (nullable), source, timestamp }` as an
      **append-only** log; no event is ever mutated (corrections are new events).
- [ ] Claim tier = **max(tier) over surviving events**, always computed, never stored.
- [ ] `lifted-from-resume` → `plan_id` null (per-user); `lifted-from-jd` + tiers 2–4 → plan-stamped.

### S2 — Confirmation-gated banking (per-user)
- [ ] Claims enter the bank only via confirmation (gates entry, never tier — unchanged from design §3).
- [ ] The bank is **per-user** and self-updating across plans; item 4's copy becomes true here.

### S3 — Grading on the event (item 7)
- [ ] An answer's assessment (delivery scores + substance grading) attaches to the
      **plan-stamped provenance event**, not the claim (decision recorded in the provenance spec).
- [ ] Grading shares the event's lifecycle — purged on plan delete; never follows a claim into the bank.

### S4 — Delete path (ADR-0006 + the delete-path debt)
- [ ] Plan delete deletes its events; claims with **zero surviving events** delete (real,
      per-plan, reaching retakes/grading).
- [ ] **Every writer has a deleter, CI-enforced** (OPEN.md debt #4) — or A quietly decays to B.
- [ ] Resume (per-user) has its own separate delete path (item 5's copy stays true).
- [ ] *Open, non-blocking:* re-seeding re-offer on resume replace (OPEN.md "Storybank re-offer")
      — the builder should know it's undecided; it does not block this track.

---

## Sissi's review checklist (what to check on the PR, fast)

1. **Honesty first.** Fork 6 (no fantasy answer beat), axis separation (broken English ≠ weak
   substance), dig one-hard-line (no invented fact pinned to the user), no audio stored.
2. **No silent regression** to the diagnostic or the non-interview typed-draft path (Phase 2
   backward-compat; Phase 1 non-interview untouched).
3. **Trust copy** shipped in the same build and asserts nothing not-yet-true (Phase 0).
4. **Push is one-per-take** — no adaptive escalation snuck in (that's G6, still open).
5. **Bank on existence, badge on quality** — weak-honest work still banks; badges are
   verdict-backed (Phase 6).
6. **Zero-API locks** exist for the multi-turn coach shape and any new guard, so the rules
   can't silently vanish.
7. **Delete path is real and CI-enforced** (S4) — every writer has a deleter; plan delete
   reaches events, grading, and retakes. The trust copy's delete clauses are true.
8. **Trust copy wired LAST** and asserts nothing not-yet-true — every clause has a shipped
   feature behind it (Phase 0 gate).

## Build order, one line

Two tracks, joined by the trust copy:
- **Speak-runner:** `1 speak loop → 2 multi-turn coach → 3 push → 4 dig UI → 5 tap-to-notes →
  6 banking gate → 7 cheatsheet` (`1→2→3` hard chain; `4–7` overlap once `1–3` land).
- **Storybank (Path A):** `S1 provenance model → S2 banking → S3 grading-on-event → S4 delete path`
  (parallel to the speak-runner).
- **Join:** `8 cost UI (bundle)` any time; then **`0 trust copy` wires LAST**, only once
  Phase 6 (retained takes) + S2/S3 (bank + grading) + S4 (delete) are all green.

**Scope note:** Path A is two features, not "one focused session." Consider splitting the
handoff into a speak-runner PR and a storybank PR that meet at the trust-copy wire.
