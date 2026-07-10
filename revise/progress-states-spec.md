# Progress States spec (Claude → Codex)

Agreed with Sissi 2026-07-10. Decisions: **partial-fill segments are IN** (with the
honesty rule below), and **live gap chips are IN now** (mock-authored mapping +
optional schema field; it's the highest-meaning progress signal in the app).

⚠️ **Sequencing: implement AFTER `sidebar-workspace-spec.md` lands.** This spec
touches the workspace header and the Briefing — not `ProjectFolder` — so collisions
are unlikely, but after is safer and keeps one review at a time.

## The principle

Progress measures **work accumulated, not content consumed**. Files built, gaps
closed — never percent-of-plan-read. And one hard honesty rule throughout:

> **THE HONESTY RULE: only Reward increments any counted number.** Moment position
> and draft text may add *visual texture* (a partial tint), but no count, percent,
> or ✓ anywhere may change from anything except the user completing a task via
> Reward. Visiting moments is not progress; producing work is.

---

## Changes

### 1. Progress speaks in files, not percent
- Header counter: "1 of 3 tasks complete · 33%" → **"1 of 3 project files built"**.
  Drop the percent readout entirely.
- Applies to the workspace header bar (the `ProgressBar` label). Sidebar and
  Reward copy already speak in artifacts — leave them.

### 2. Segmented bar with honest partial credit
- Replace the continuous bar with **one segment per task**, in task order.
- Segment states:
  - **empty** — not started (no saved moment, no draft, not done).
  - **partial tint** — in progress: saved moment > 0 OR non-empty draft, and not
    done. Tint proportional to saved moment position, or a fixed half-tint —
    Codex's call; it must be clearly distinct from the filled state.
  - **filled** — task in `done` (i.e., completed via Reward).
- Per the HONESTY RULE: the tint never changes the "N of M" count.

### 3. Live gap chips in the Briefing (the meaningful one)
- New optional module field **`closesGapIndex`** (0-based index into
  `knowledgeGaps`) in `app/api/plan/route.js` — schema (NOT in `required`) +
  prompt bullet: *"closesGapIndex: the index of the knowledge gap this task most
  directly closes (0-based into knowledgeGaps). Every gap should be closed by at
  least one task."*
- `lib/mockResponses.js`: author it — the 3 RWE modules close gaps 0, 1, 2
  respectively (they already align 1:1).
- Briefing behavior: a gap's chip renders **□** until EVERY task with that
  `closesGapIndex` is in `done`, then flips to **✓** (muted green, same chip).
  Under the mission line, add one quiet line when ≥1 gap is closed:
  **"2 of 3 gaps closed."**
- **Fallback:** if no module carries `closesGapIndex` (old/live plans until the
  model is verified), chips stay static — no guessing a mapping in code.
- Same live-model caveat as `northStar`/`comprehensionCheck`: untestable against
  the real model until the API balance returns; mock + fallback cover it.

### 4. The 100% moment hands off, not ends
- When all tasks are done (`done.size === modules.length`), the header line
  becomes: **"All {N} files built — your readiness project is open ★"** (the ★
  Readiness queue item is already un-dimmed at this point per the nav spec).
- No confetti, no modal. The progress system's last act is pointing at the door.

### 5. Non-goals (explicit)
No streaks, daily goals, time-spent, animations beyond the existing bar
transition, or any counter not derived from `done`/drafts/moments. No new API
calls.

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. Fresh plan: header reads **"0 of 3 project files built"**, bar shows 3 empty
   segments, no percent anywhere.
2. Open Task 1 and advance a few moments (no Reward): segment 1 shows the partial
   tint; the counter **still reads 0** (HONESTY RULE).
3. Write a draft in Task 2 without completing: segment 2 tints too; counter still 0.
4. Complete Task 1 via Reward: segment 1 fills; counter reads "1 of 3 project
   files built"; revisiting the **Briefing** shows gap chip #1 flipped to ✓ and
   the "1 of 3 gaps closed" line.
5. Temporarily strip `closesGapIndex` from the mock: chips stay static □, no
   crash, no invented mapping (then restore).
6. Complete all 3: bar full, header line = "All 3 files built — your readiness
   project is open ★".
7. Refresh at any point: segments, counter, and chips all restore from persisted
   state.
8. No console errors; mobile (~390px) — segments wrap/scale without overflow.

## Contract reminders
- The HONESTY RULE is the spec: if any counted number can change without Reward,
  it's a bug.
- `closesGapIndex` fallback = static chips; never infer a gap↔task mapping in code.
- All state derived from the existing persisted stores (`done`, `lb_moments_*`,
  `lb_drafts_*`) — no new sources of truth.
