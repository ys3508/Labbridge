# Layout Foundation spec — typography, spacing, hierarchy, responsive (Claude → Codex)

Agreed with Sissi 2026-07-10. Decisions: **app-shell scroll is IN**, **reading text
at 16px is IN**, one combined spec. This is the LAST step before the visual design
pass: it builds the skeleton's discipline so the visual pass only has to paint.

⚠️ **Sequencing: implement AFTER `completion-rewards-spec.md` lands and is
reviewed** — both touch PlanView heavily; one at a time.

**Out of scope (that's the visual pass, do not touch):** color palette, font
family, brand personality, iconography, shadow/depth styling, dark mode.

---

## Part 1 — Typography & hierarchy

### 1.1 Type roles, not sizes
Replace the ~9 ad-hoc sizes (`text-[10px]`, `[11px]`, `xs`…`2xl`) with **6 named
roles**, defined once (Tailwind component classes in `globals.css` via
`@layer components`, or a small `type.js` map — Codex's call), used everywhere:

| Role | Use | Size/weight (baseline) |
|---|---|---|
| `display` | briefing hook, moment titles | `text-xl/2xl font-semibold tracking-tight` |
| `title` | card/section/file-name heads | `text-base font-semibold` |
| `body` | READING content (concept, example, task text, drafts) | **`text-base leading-relaxed`** (the 16px decision) |
| `support` | secondary/meta (why-lines, statuses, notes) | `text-sm` / `text-xs` for dense meta |
| `label` | the ONE caps micro-label style | `text-[11px] font-semibold uppercase tracking-wide` |
| `mono` | filenames, artifact names | `font-mono text-sm` |

- Arbitrary bracket sizes (`text-[10px]` etc.) are BANNED outside the role
  definitions. Acceptance: grep finds none in PlanView/components.
- **Content speaks, chrome whispers:** all teaching prose (concept explanation,
  worked example, manager request, task steps, draft textarea) moves to `body`
  (16px). Chrome (statuses, labels, buttons) stays small.

### 1.2 Measure cap
All reading prose inside the stage gets `max-w-prose` (~65ch): concept
explanation, worked example, takeaways, memo/handoff text. Containers stay wide;
text doesn't.

### 1.3 One label voice, used less
Unify every caps micro-label to the `label` role. Then DELETE labels that don't
orient anyone (audit: if removing it loses nothing, remove it). Target: roughly
half the current label count.

### 1.4 One primary per panel
Each surface (briefing, moment card, sidebar, drawer, readiness stage) has
exactly ONE `display`/`title`-weight element as its visual anchor; everything
else steps down. Squint test per panel.

### 1.5 Detail rules
- `tabular-nums` on every counter (2/8, N of M, word counts).
- Max TWO visible container levels in any area: outer = border, inner = tint —
  never border+tint+ring nested three deep. Flatten the current card-in-card-in-
  card spots (worst offenders: inside the moment card and the task block).

## Part 2 — Spacing

### 2.1 Three gaps only
All vertical rhythm picks one of:
- **tight** (`space-y-1`/`mt-1`, 4–8px) — within a group (label→text, term list)
- **group** (`space-y-3`/`mt-3`, 12–16px) — between related blocks
- **section** (`space-y-6`/`mt-6`, 24–32px) — between zones
Sweep PlanView + briefing + drawer to these three. Odd one-offs (`mt-0.5`,
`mt-1.5`, `mt-2`, `mt-4`, `mt-5`) get snapped to the nearest tier.

## Part 3 — Responsive layout

### 3.1 App-shell scroll (desktop, lg+) — the big one
- Full-height shell: `h-screen` flex column. Header row FIXED (non-scrolling).
  Below it, sidebar and stage are **independent scroll areas**
  (`overflow-y-auto` each, `min-h-0` on the flex children — the classic gotcha).
- The queue never scrolls away while reading a long moment; the stage scrolls
  alone. Drawer overlays as today.
- **Mobile/tablet (< lg): keep normal page scroll** — do NOT fight mobile
  browsers' URL-bar viewport behavior. Use `h-dvh` not `h-vh` if any full-height
  is needed on mobile.
- Briefing (State A) stays a normal scrolling page at every width, centered
  column `max-w-2xl` (a "letter" feel, even on desktop).

### 3.2 Touch targets (real bug fix)
- The moment dot strip is ~6px tall — untappable. Give each dot a padded hit
  area ≥ 40×40px (visual dot can stay small inside a larger transparent button).
- Audit all interactive elements to ≥ 40px hit area on touch: Coach checkboxes,
  sidebar file rows, chip strip, drawer close.

### 3.3 iOS zoom trap
Draft textarea (and any input) ≥ 16px font (`text-base`) so iOS doesn't
auto-zoom on focus. One line; do it everywhere an input exists.

### 3.4 Per-surface mobile behaviors
- **Drawer:** side panel on lg+, **full-screen sheet** below lg.
- **Header:** two rows on mobile — row 1 role+mission (mission truncates first),
  row 2 progress + links.
- **Chip strip (tablet, md–lg):** chips show short task titles, not just
  numbers; below md, numbers only (as today).
- **Stage padding:** tighter on mobile (`p-4` → `p-3`), `body` text unchanged.

### 3.5 Motion
`prefers-reduced-motion`: disable the segment/progress transitions and any
animated width changes (`motion-safe:` variants).

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. `grep -E "text-\[1[01]px\]" components/ app/` → only the role definition(s),
   no scattered uses. Reading prose (concept/example/steps/textarea) renders at
   16px (`preview_inspect` font-size check).
2. Concept paragraph line length ≤ ~70ch at 1280px (inspect width vs font).
3. Label count in the workspace reduced (before/after count noted in the commit
   message); all remaining labels visually identical (one style).
4. Desktop 1280px: header fixed; scrolling a long moment scrolls ONLY the stage —
   sidebar stays put; page body itself doesn't scroll (app shell). Mobile 375px:
   normal page scroll preserved.
5. Every moment dot has a ≥40px hit area (inspect boundingBox of the button, not
   the visual dot). Textarea font-size ≥16px.
6. Drawer at 375px = full-screen sheet; at 1280px = side panel.
7. No horizontal overflow at 375 / 768 / 1280 (scrollWidth == innerWidth each).
8. Counters use tabular-nums (inspect font-variant-numeric).
9. With `prefers-reduced-motion: reduce` emulated, progress transitions don't
   animate.
10. No console errors; all prior behaviors (nav, rewards, export, drawer,
    briefing) still pass a quick smoke pass — this spec must not change ANY
    behavior, only presentation and scroll mechanics.

## Contract reminders
- Zero behavior changes — if a behavior test breaks, the pass overstepped.
- No color/font-family/branding changes (visual pass owns those).
- Earned-state and honesty rules untouched by definition.
