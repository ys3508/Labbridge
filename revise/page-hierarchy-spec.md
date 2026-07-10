# Page Hierarchy spec (Claude → Codex)

Agreed with Sissi 2026-07-10 (three-way brainstorm). The section ORDER is already
correct (brief → workspace → contribution → reasoning → self-check). The problem is
**weight**: the opening is a mini-report, every card weighs the same, and small
duplications ("MISSION" box vs the ReadinessProject card, the loose "Pace:" line)
create the one-long-document feel. This pass redistributes weight — no new features.

Decisions made:
- **Slim opening**: hook + north-star mission line + one compact chip row. The two
  full columns (Already strong / Need to learn) leave the top entirely.
- **North-star sentence** up top (e.g. "Build the evidence package a new RWE analyst
  ships in their first month.") — NOT the readiness-project title. The
  "Your independent contribution" card owns the title and staging.

⚠️ **Sequencing: land this BEFORE `sidebar-workspace-spec.md`** (it moves the same
top-level furniture). Claude reviews, then the sidebar spec proceeds.

---

## Changes

### 1. Slim `MissionBrief` to a true brief
Keep, in this order, and nothing else:
- **Hook** — `plan.hook` (unchanged, 1 short paragraph).
- **North-star line** — one sentence, visually distinct (e.g. small caps label
  "Your mission" + the sentence). Source: new optional plan field `northStar`
  (see §2). Fallback when absent: `firstTask.title` (current behavior, so old
  plans don't break).
- **Compact chip row** — one wrapping row built from the first 3 of each:
  `✓ {strength.point}` chips (muted green) and `□ {gap.point}` chips (muted slate),
  point text truncated ~28 chars. No columns, no detail sentences — the full
  two-column detail already lives in "The reasoning" collapse (do NOT remove it
  there).
- Keep the existing small depth/purpose chips (they're already quiet).
Remove from the brief: the `BriefList` columns and the "MISSION" box. Delete
`BriefList` if nothing else uses it.

### 2. New optional plan field: `northStar`
- `app/api/plan/route.js` schema: top-level optional string `northStar` (NOT added
  to `required`).
- Prompt bullet (with the PRODUCE fields): *"northStar: ONE sentence naming the
  concrete thing they'll be able to ship and for whom — their mission in plain
  words (e.g. 'Build the evidence package a new RWE analyst ships in their first
  month'). Grounded in the actual plan; no invented company/dates (fidelity rules
  apply)."*
- `lib/mockResponses.js`: author it for the RWE mock —
  `northStar: "Build the evidence package a new RWE analyst ships in their first month."`
- Note: untestable against the live model until the API balance returns (same
  status as `comprehensionCheck`) — the fallback covers that.

### 3. Make the workspace visually dominant
- The "Your project workspace" card gets a distinct treatment so the eye reads it
  as the product: a subtle tinted background (brand-50-ish) or a slightly wider
  presence vs. the other cards — Codex's call on the exact device, but the test is:
  at a squint, the workspace is obviously the main surface and everything else is
  supporting.
- Do NOT restyle the inner moment flow — this is about the container's weight.
- Everything below the ReadinessProject card stays quiet/collapsed as-is.

### 4. Merge the strays
- **"Pace:" line** — delete the standalone paragraph; render `plan.timelineNote`
  inside the ReadinessProject card (small line under the phases; it's about the
  same horizon).
- The honesty notes (beginner / unreadable link) STAY above the workspace — they're
  product contract — but use their compact single-line styling.

### 5. Explicit non-goals
No section reordering (already right). No sidebar changes (next spec). No full
visual-design pass (color system/typography overhaul stays deferred) — this is
hierarchy only. No new API calls.

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. Opening = hook + "Your mission" north-star line + one compact chip row
   (✓✓✓ / □□□) + depth/purpose chips. The two columns and the MISSION box are gone
   from the top.
2. Mock shows the authored north-star sentence; with `northStar` absent from a plan
   object, the line falls back to `firstTask.title` (verify by code inspection or
   temporarily deleting the field from the mock).
3. The readiness-project title appears exactly once on the page — in "Your
   independent contribution", which also now contains the pace/timeline line; the
   standalone "Pace:" paragraph is gone.
4. At a squint (or 50% zoom), the workspace card is unmistakably the dominant
   surface; reasoning + self-check remain collapsed below the contribution card.
5. The full strengths/gaps detail is still intact inside "The reasoning" collapse.
6. `BriefList` removed if unused; no console errors; mobile stack (≤ sm) doesn't
   break — chips wrap, nothing overflows horizontally.

## Contract reminders
- `northStar` follows the fidelity rules: no invented companies, dates, or
  responsibilities; role named verbatim if named at all.
- Chip text = real `point` values from the plan, truncated honestly — never
  paraphrased into something the plan didn't say.
- Earned-state rules unchanged everywhere else.
