# Completion Rewards spec (Claude → Codex)

Agreed with Sissi 2026-07-10. In: **A** gap-closed moment, **B** before/after
mirror, **C** handoff memo, **D** heavier download, **E** welcome-back line.
Parked: **F** manager's reaction (an `/api/coach`-family socket — costs API per
completion; do NOT build until Sissi funds the balance and approves).

## The principle

A reward is **earned state, said out loud at the moment it happens** — never
theater. Every block below is assembled verbatim from existing persisted state
(`done`, drafts, `closesGapIndex`, moment positions). Explicitly rejected, on
record: confetti, sounds, streaks, XP, titles, fake urgency. If a block could
render without the user having done the work, it's a bug.

---

## A. The gap-closed moment (in the Reward beat)

Today the gap chip flips in the Briefing — a screen the user isn't looking at.
Say it to their face instead.

- At Reward render, compute with `doneAsIf = done ∪ {currentTask}` (Reward shows
  before the click that marks done — the current task counts as complete here).
- If this task has a `closesGapIndex` AND the gap was NOT closed under `done`
  but IS closed under `doneAsIf` (i.e., this completion is what closes it),
  prepend a block to Reward:
  > **You closed a gap.**
  > □ → ✓ {knowledgeGaps[g].point}
  > This stood between you and {roleName}. It doesn't anymore.
- Fallbacks: no `closesGapIndex` → no block (never infer a mapping); role absent
  → "…between you and the role." Multiple tasks per gap: block shows only on the
  LAST one (the ∪ logic gives this for free).

## B. The before/after mirror (final Reward only)

When `doneAsIf` covers ALL tasks, the last task's Reward gets one extra block —
built verbatim from plan data, no invented praise:

> **When you arrived:** {N} gaps stood between you and {roleName}.
> **Now:** {N} files in your project prove otherwise — {file names, "·"-joined}.
> Your readiness project is open ★

- Gap count = `knowledgeGaps.length`; file names = the existing
  `deliverableName` values. If gaps have no task mapping at all, use the neutral
  first line "You arrived with {N} gaps to close." (don't claim chips flipped
  that didn't).
- Order within Reward: A block (if firing) → existing Reward content → B block.

## C. The handoff memo (readiness arrival ritual)

When the Readiness project opens in the stage AND all tasks are done, prepend a
**handoff memo** above the phases:

> **Handoff.** You arrive with {D} of {N} artifacts drafted — {file names} — and
> {G} gaps closed. From here the arc is yours: Observe → Assist → Own.
> [Download my project — take your portfolio with you]

- Counts are real: D = files with non-empty drafts, G = gaps closed under `done`.
  If D < N, say so honestly (e.g., "2 of 3 artifacts drafted") — completing tasks
  without drafts is possible and the memo must not overclaim.
- The download link reuses `buildProjectMarkdown` (same data: URL pattern —
  zero network). Do not duplicate the builder; share the function.
- When tasks are NOT all done (capstone opened early via "start anyway"), no
  memo — the existing view renders unchanged.

## D. The download gets heavier

Export button label carries real weight: **"Download my project — {D} of {N}
files drafted · {W} words"** (W = total words across drafts). Disabled state and
tooltip unchanged. Counts must be live (update as drafts change).

## E. The welcome-back line

When the workspace mounts on a PAGE LOAD (not via "Enter your workspace" this
session) and there is prior progress (any done task, draft, or saved moment > 0):
one quiet line under the header:

> You left off mid-*{task title}* — {next beat label} is next.

- Derived from the first in-progress task (saved moment > 0 or draft, not done);
  if none, but tasks are done, use "Next up: {first incomplete task title}."
- No timestamps, no "welcome back!" exclamation — plain continuity.
- Disappears when the user navigates (opens any task/moment) — it's a greeting,
  not furniture. Session-scoped; reappears on next load.

## F. Manager's reaction — PARKED (socket only)

The reward users actually crave: a manager-voice paragraph reacting to their
actual draft at each Reward. This is a per-completion API call (same family as
`/api/coach`). Do not build, stub, or fake it. When funded: it slots between the
A block and the Reward body. Fake-AI rule applies until then: nothing renders.

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. Complete Task 1 → its Reward shows the **gap-closed block** naming gap #1's
   point text and the role. (Mock maps tasks→gaps 1:1, so every task fires one.)
2. Temporarily strip `closesGapIndex` from the mock → no gap block, no crash,
   nothing inferred (restore after).
3. Complete Task 3 (last) → Reward shows gap block AND the **mirror**: "3 gaps",
   all 3 file names, ★ line.
4. Open Readiness after all done → **handoff memo** with real counts (write
   drafts in only 2 tasks first → memo says "2 of 3 artifacts drafted") + a
   working download link (data: URL, no network request).
5. Open Readiness early via "start anyway" (fresh state) → NO memo.
6. Export button label shows live "{D} of {N} files drafted · {W} words" and
   updates when a draft changes.
7. Reload with an in-progress task → **welcome-back line** names that task and
   its next beat; open any task → the line is gone; reload → it returns.
8. Fresh plan (no progress) → no welcome-back line, no gap/mirror blocks
   anywhere, memo absent. No console errors; mobile no overflow.

## Contract reminders

- Every number and name rendered must be derivable from persisted state at that
  moment — no caching a claim that can go stale (e.g., the memo recounts drafts
  on every open).
- No new API calls; F stays invisible until explicitly funded and approved.
- Tone: factual, workplace-honest. The facts ARE the reward.
