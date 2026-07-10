# Task Navigation spec (Claude → Codex)

Agreed with Sissi 2026-07-10. Decision made: future tasks are **dimmed-but-openable**
(honest nudge, no trap) — not hard-locked. Companion to `revise/moments-spec.md`;
all work is in `components/PlanView.js` (verify offline via `?mock=1`, zero API).

## The principle

**Navigation state is earned state.** The sidebar is the *map* (for revisiting);
the Reward beat is the *engine* (for advancing). One navigator, not two. Everything
the sidebar shows (resume points, states, completion) must come from real tracked
state — never a canned label.

---

## Changes

### 1. Kill `TaskPager` — Reward drives forward motion
- Delete the `TaskPager` component and its render (the Previous/Next buttons under
  the moment card). It competes with the sidebar and with Reward.
- In the **Reward** beat, the primary button becomes the navigation:
  - If a next task exists: **"Start Task {n+1} →"** — marks current task done
    (existing `onComplete`), sets `activeIndex` to n+1, scrolls the moment card
    into view (the new task's Brief).
  - If it's the last task: **"Finish — review your project →"** — marks done and
    scrolls to the ReadinessProject card.
  - Back-navigation inside a task stays as-is (the Back button on moments).

### 2. Persist per-task moment position (resume where you left off)
- New localStorage entry alongside the existing `done` persistence, keyed by the
  same `planKey(seq)`: `lb_moments_<planKey>` → `{ [taskIndex]: momentIndex }`.
- Save on every moment change. On task open, restore that task's saved moment
  (default 0). **Remove/replace the current `useEffect` that resets moment to 0 on
  `moduleIndex` change** — that reset is the bug this fixes.
- On plan load, set `activeIndex` to the **first incomplete task** (first index not
  in `done`), not 0. If all complete, last task.
- Note: `checks` (Coach ticks) and `drafts` are currently in-memory only. Persist
  both in the same keyed pattern (`lb_checks_`, `lb_drafts_`) — Reward reads them,
  so they must survive refresh or Reward lies after reload. (Drafts may be long;
  that's fine for localStorage.)

### 3. Sidebar (`ProjectFolder`) shows real state per task
Each item gets a status line derived from live state:
- **✓ Complete** — in `done`.
- **● In progress — resume at {beatName} ({m}/{total})** — has a saved moment > 0
  or a non-empty draft, and not done. Beat name = the moment's `label` (Brief,
  Question, Model, Visual, Practice, Coach, Artifact, Reward).
- **○ Not started** — otherwise.
Keep the existing artifact-filename styling; the status is a small second line.
Clicking a completed/current/in-progress task opens it directly (unchanged).

### 4. Dimmed-but-openable future tasks (the agreed model)
A task is "future" if its index > (first incomplete index).
- Render dimmed (e.g. reduced opacity, muted text) with a one-line dependency hint:
  **"Builds on Task {k}'s {deliverable-short-name}"** (use the previous task's
  artifact filename or deliverable; plain truth, not a guess).
- Clicking a future task does NOT open it immediately. Show a small inline confirm
  (in the sidebar item, not a modal): **"We recommend finishing Task {k} first —
  start anyway?"** with [Start anyway] [Go to Task {k}].
- [Start anyway] opens it normally; remember the override for the session (don't
  re-ask for the same task). [Go to Task {k}] jumps to the first incomplete task.
- Never block. This is a nudge, not a lock (product rule: soft-gate, don't trap).

### 5. Name the beat, not the number
- In the moment header, replace "Moment {n} of {m}" with **"{label} — {objective}"**
  (e.g. "Coach — Am I right?"). Keep a small "{n}/{m}" on the right where the
  percent currently is (keep or drop the percent, Codex's call — one of the two).
- The dot strip stays; each dot gets `title={label}` (hover) and its aria-label
  already exists — keep it.

### 6. Capstone joins the queue
- Append a final item to the sidebar list: **"Readiness project"** (icon/style it
  slightly differently from task files). Same dimmed-but-openable treatment until
  all tasks are done; hint: "Builds on all {N} tasks".
- Clicking it scrolls to the existing ReadinessProject card (it does not open in
  the moment panel — it's a different surface; just scroll + a brief highlight).

### 7. Mobile (fold into the responsive pass)
- Below `lg`, the sidebar renders as a horizontal scrollable chip strip above the
  moment card (task number + state glyph only; tap = same behavior incl. the
  dimmed-but-openable confirm). Defer visual polish to the responsive-layout item;
  just don't ship a broken stack.

---

## Acceptance criteria (verify all in `?mock=1`, zero API)

1. `TaskPager` gone; no Previous/Next buttons below the card.
2. Walking Task 1 to Reward and clicking "Start Task 2 →" marks Task 1 done
   (progress bar 1/3), opens Task 2 at Brief, scrolls the card into view.
3. Leave Task 2 at Coach, switch to Task 1, come back → Task 2 reopens **at Coach**.
   Refresh the page → still at Coach; Coach ticks and draft text survive reload.
4. On reload with Task 1 done, the workspace opens on Task 2 (first incomplete).
5. Sidebar: Task 1 shows ✓, Task 2 shows "● resume at Coach (6/8)", Task 3 dimmed
   with "Builds on Task 2's …" hint.
6. Clicking dimmed Task 3 shows the inline confirm; [Start anyway] opens it and
   doesn't re-ask this session; [Go to Task 2] jumps to Task 2.
7. Moment header reads "{label} — {objective}"; dots show labels on hover.
8. Sidebar ends with "Readiness project" (dimmed until all tasks done); clicking
   it scrolls to the ReadinessProject card.
9. No console errors; `localStorage` keys are namespaced by `planKey` (a different
   plan gets fresh state).

## Contract reminders
- Reward must keep reading **live** state (ticked count, draft) — now persisted.
- No fake AI anywhere; the confirm copy is a recommendation, not a warning.
- All state is per-plan (`planKey`) — consistent with the existing `done` pattern.
