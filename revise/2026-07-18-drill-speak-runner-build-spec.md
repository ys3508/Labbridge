# Drill speak-runner — ordered build spec + acceptance criteria (2026-07-18)

**For whoever builds (Codex or CC), and for Sissi to review against.** This turns
the REMAINING list in `revise/2026-07-17-drill-grammar-spec.md` into an ordered,
checkable build. It invents no new decisions — every ruling is already closed in
that spec and its Jul-18 addendum. Where this doc and the grammar spec disagree on
dig honesty, **this doc is right**: the "sentences must trace" rule was reversed to
the spark stance (`revise/2026-07-18-dig-spark-stance.md`, `bb23341`).

Scope = the interview `speak` loop only. Not the mock runner, not the walk-in card,
not the post-interview loop.

---

## The one gate

**The cost probe must land before build starts.** The grammar spec: *"do not start
Session B until it lands."* Codex measures the full loop; the number decides **only**
Phase 8 (meter-vs-bundle UI). Phases 1–7 are unblocked by the number itself but
should not begin until the probe confirms the loop is affordable at all. If the
probe returns and the loop is affordable, build 1→7 in order; wire 8 last.

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

## Phase 0 — Trust copy landed (blocking; awaiting Sissi)

**Why first.** This build makes three copy clauses true-in-code for the first time:
multiple takes retained, pauses scored, deletion no longer total. The standing save
line becomes false the moment the loop ships. Per the seam rule, no clause may be
true-in-copy before it's true-in-code — so the approved copy lands in the same build.

**Acceptance**
- [ ] The approved register from `revise/2026-07-18-trust-copy-draft.md` is wired into the
      diagnostic/drill trust line (takes plural, pause marks, deletion, unchanged no-audio promise).
- [ ] No clause asserts a capability a later phase hasn't shipped yet.

**Gate:** Sissi picks the register. Do not paraphrase or invent copy.

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

## Phase 8 — Meter-vs-bundle cost UI (GATED on the probe)

**Goal.** Show the drill's cost honestly, in whichever form the probe's number supports.

**Acceptance**
- [ ] Cost surface matches the probe's read: a live **meter** if per-loop cost is variable,
      a fixed **bundle** if it's stable (Codex's cost-probe note makes this call with data).
- [ ] No paid call fires without the user's explicit action (the existing spend-armor pattern).

**Gate:** blocked until `revise/2026-07-18-drill-cost-probe.md` lands.

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

## Build order, one line

`0 trust copy → 1 speak loop → 2 multi-turn coach → 3 push → 4 dig UI → 5 tap-to-notes →
6 banking gate → 7 cheatsheet → 8 cost UI (gated)`. Phases 4–7 can overlap once 1–3 land;
1→2→3 is a hard chain.
