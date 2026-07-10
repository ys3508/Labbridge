# Single-Surface Workspace spec (Claude + Codex merged → Codex implements)

Agreed 2026-07-10 after Sissi rejected the stacked five-section page ("5 parts still
on the same page"). Combines Codex's step-shell proposal (one screen at a time,
brief as doorway, workspace = home) with Claude's app-shell design (minimal chrome,
drawer, badge). **Supersedes the layout assumptions of `sidebar-workspace-spec.md`**
— that spec's content (file states, draft preview, export) still applies, but inside
this shell, and is implemented AFTER this lands.

## The principle

Stop being a page. Become an app. There is **one place to work** (the workspace)
and some reference material — the UI must say exactly that. No stacked sections,
and no 5-slot navigation that recreates them sideways: the Contribution already
lives in the sidebar queue, and the self-check is not a primary destination.

## The two states

### State A — Briefing (the doorway; Codex's Step 1)
Full-screen, shown on **first arrival** for a given plan:
- The hook (`plan.hook`), the "Your mission" north-star line, the compact ✓/□ chip
  row, the depth/purpose chips — i.e. today's slimmed brief, alone on the screen.
- The honesty notes (beginner assumption / unreadable job link) render HERE, in
  full — this is their primary home.
- One primary button: **"Enter your workspace →"**.
- On click: set a per-plan flag (`lb_briefed_<planKey>` — same `scopedPlanKey`
  helper) and switch to State B.
- **Refresh behavior:** if the flag is set, land directly in State B (workspace =
  home; the brief is a doorway, not the product). First arrival only shows A.
- Revisitable any time via the header link (does NOT clear progress/state).

### State B — Workspace (home; the app)
The workspace fills the screen. Nothing renders below it. Structure:

```
┌────────────────────────────────────────────────────────┐
│ Toward {role} · {mission, truncated}      ▓▓░ 1/3      │
│                        [Briefing] [Why this plan? (•)] │
├──────────────┬─────────────────────────────────────────┤
│ queue        │                                         │
│ 01 ✓ memo    │            moment stage                 │
│ 02 ● spec    │      (Brief → … → Reward, as today)     │
│ 03 ○ table   │                                         │
│ ────────     │                                         │
│ ★ Readiness  │                                         │
└──────────────┴─────────────────────────────────────────┘
```

- **Header (one line + links):** role + mission (truncated), the tasks progress
  bar, and two quiet links: **Briefing** (reopen State A) and **Why this plan?**
  (opens the drawer, §3). If an unreadable-link warning exists, show a compact
  dismissible one-line banner under the header (honesty stays visible in the
  workspace, not only in the briefing).
- **Sidebar queue:** exactly as the nav spec built it (states, dimmed-but-openable,
  capstone last). Unchanged here.
- **Moment stage:** unchanged.
- Existing footer utilities ("← Back to edit", "Show what the generator received")
  move into a small overflow spot (bottom of the drawer, or a tiny footer row —
  Codex's call; they must not read as a page section).

## 3. The Contribution — a queue destination, not a section or nav slot
- Remove the standalone `ReadinessProject` card from below the workspace.
- Clicking **★ Readiness project** in the queue renders the ReadinessProject
  content **in the main stage** (same panel where moments play) — title, horizon
  chip, deadline chip, phases, pace line, horizonAssumed note, all as today.
- Gating unchanged: dimmed-but-openable until all tasks done (nav spec behavior).
  This IS Codex's "shown after explicit open / after enough progress".

## 4. "Why this plan?" drawer — reasoning + self-check together
- One right-side drawer (or slide-over panel) opened from the header link:
  - **The reasoning** — the full strengths/gaps detail (exactly the current
    Collapse content).
  - **Plan self-check** — the current failures-first content. When clean, one
    quiet line: "✓ Self-check passed — no blocking gaps found."
- **Badge:** when the self-check has genuine failures (the existing `failures`
  count), the header link shows a small amber dot; clean = no dot. Silence must
  never mean "didn't check" — the drawer always states the result.
- No separate pages for these. One drawer, zero pixels until requested.

## 5. What we explicitly REJECTED (so it doesn't creep back)
- A persistent 5-slot top navigation (`Start | Workspace | Contribution |
  Reasoning | Self-check`) — it recreates the five sections horizontally,
  double-lists the Contribution (already in the queue), and elevates a debug
  surface to primary navigation.
- Any stacked content below the workspace.

## 6. Mobile (keep it working, not polished)
- State A stacks naturally (it's one column already).
- State B: the queue renders as the horizontal chip strip above the stage (as
  already planned in the nav spec); header wraps to two lines. No horizontal
  page overflow. Visual polish deferred to the responsive pass.

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. Fresh plan (clear `lb_*` state): arrival shows ONLY the briefing — no workspace,
   no queue visible. "Enter your workspace →" switches to the workspace.
2. After entering, **refresh lands in the workspace** (not the briefing). The
   [Briefing] header link reopens it; returning loses no progress.
3. The workspace screen contains NO stacked sections below it — DOM check: the
   ReadinessProject card, reasoning Collapse, and CheckReview no longer render
   under the workspace.
4. Clicking ★ Readiness project in the queue shows the readiness content in the
   main stage (title, phases, horizon/deadline chips, pace line). Dimming/confirm
   behavior unchanged.
5. [Why this plan?] opens the drawer with reasoning + self-check; mock (clean-ish
   check) shows no amber dot but DOES show the explicit "passed" line. (To see the
   dot: temporarily add a failure to the mock CHECK — verify, then revert.)
6. Honesty notes: full text in the briefing; unreadable-link note also appears as
   the compact dismissible banner in the workspace header area.
7. "Back to edit" and "Show payload" still reachable, not as page sections.
8. Mobile (~390px): both states usable, no horizontal overflow.
9. No console errors; all new flags keyed by `planKey` (`lb_briefed_…`).

## Sequencing & contract
- This spec lands FIRST; `sidebar-workspace-spec.md` (file states / draft preview /
  export) follows inside this shell. Its content is unaffected.
- Earned-state rules unchanged (queue states, Reward, dimming).
- Honesty rules unchanged: the unreadable-link warning must remain discoverable in
  the workspace, not buried in a one-time briefing; the self-check result is always
  stated explicitly in the drawer.
- No new API calls anywhere.
