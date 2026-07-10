# Visual Design spec (Claude + Codex converged → Codex implements)

Agreed with Sissi 2026-07-10. Decisions locked: **serif letter IN** (briefing hook
only) · **work vocabulary IN** (Check / Example / Try / Draft; last beat displays
as **Wrap** — Claude's call, field-neutral; override with one word if disliked) ·
**palette CONFIRMED** (warm off-white / ink-navy / semantic-only accents, no new
hues).

⚠️ **Sequencing: LAST in the pipeline.** Requires `layout-foundation-spec.md`
landed (type roles, 3-gap rhythm, container flattening, app shell) — this spec
paints that skeleton and must not re-do it. Zero behavior changes.

## The thesis (Codex's, adopted verbatim)

> LabBridge should look like the first useful internal tool a smart manager would
> build for onboarding a new analyst. Quiet, precise, confidence-building. Not a
> course platform, not ChatGPT, not Notion cosplay.

---

## 1. Palette — color is vocabulary, not decoration

Define as Tailwind tokens (extend the existing `ink`/`brand` families; exact hex
is Codex's call within these constraints):

| Token | Meaning | Usage rule |
|---|---|---|
| ground | warm off-white page (warm gray/stone family, NOT cream-yellow) | the page itself |
| surface | white / faint blue-gray panels | objects only (§3) |
| ink / ink-soft / ink-faint | dark desaturated navy text ramp | all text |
| teal (existing brand) | **progress, verification, primary actions** | nothing else |
| amber | **warnings & soft flags** | nothing else |
| green (emerald) | **earned completion ONLY** (done, final, closed gaps) | nothing else |
| rose | **red flags** | nothing else |

- HARD RULES: no purple, no gradients (replace the workspace emphasis gradient —
  see §3), no decorative color. Any colored element must map to one meaning above.
- **Contrast (AA):** body + support text ≥ 4.5:1 against ground/surface. Audit
  `ink-faint` especially — muted-on-off-white is where calm becomes illegible.
  Darken the ramp as needed.

## 2. Typography

- **UI type:** an explicit system-first sans stack (`system-ui, -apple-system,
  "Segoe UI", Roboto, sans-serif`). **No webfonts** — zero font network requests
  (matches the app's zero-dependency posture and keeps first paint instant).
- **The serif letter:** a `.font-letter` system serif stack (`ui-serif, Georgia,
  "Iowan Old Style", "Times New Roman", serif`) applied ONLY to the **briefing
  hook** — larger than body, generous leading. Day one reads like a letter from
  your manager; entering the workspace snaps to clean UI type. Nowhere else —
  the contrast IS the effect.
- Everything else uses the layout-foundation type roles unchanged.

## 3. Surfaces — cards are objects, sections are space

(Assumes layout-foundation's flattening is done.)
- The **page ground** is the warm off-white. **Cards/surfaces exist only for
  objects:** a file, the moment pane, the draft editor, the receipt, the drawer.
  Section grouping happens with spacing and type — not boxes.
- **Workspace dominance without the gradient:** the stage pane is the whitest,
  most solid surface on the warm ground — dominance via surface contrast, not
  tint effects. Delete the `from-brand-50` gradient.
- Sidebar files, chips, header sit slightly quieter than the stage.

## 4. Work vocabulary (display strings ONLY — no key/storage changes)

- Moment labels: `Brief · Check · Model · Example · Try · Coach · Draft · Wrap`
  (renames: Question→Check, Visual→Example, Practice→Try, Artifact→Draft,
  Reward→Wrap; Brief/Model/Coach unchanged).
- Internal keys (`question`, `visual`, `practice`, `artifact`, `reward`) and all
  localStorage stay as-is. The sidebar "resume at {label}" reads the display
  label, so renames flow through automatically — verify old saved state still
  resumes correctly after the rename.
- Button/label sweep for school cues: "Next moment" → **"Next"**; kill any
  remaining "lesson/module/quiz/reference" strings in UI copy (grep). Keep:
  Brief, Check, Draft, Handoff, Project file, Readiness.

## 5. Component treatments

- **Draft editor as a small document** (the highest-emotion item): mono filename
  strip as the header, paper-white body, meta line from real data — "edited
  {date} · {N} words" (artifact-experience spec provides both) — and the 16px
  text from layout-foundation. It should feel like *their* file, not a form.
- **Reward (Wrap) as a work receipt:** a clean bordered slip; line items
  ("Gap closed ✓ · File updated · Next: …") with tabular numbers. No banner
  energy, no celebration graphics — the facts, typeset like a receipt.
- **File cards tangible:** status glyph + mono filename + meta line; a subtle
  `motion-safe` hover lift. No fake metadata.
- **Progress segments:** teal fill, lighter teal partial tint, quiet track.
- **Gap chips:** green only when earned; neutral otherwise.
- **Buttons:** exactly two styles — primary (teal, one shape) and quiet
  (ink-soft/ghost). Sweep all buttons into one of the two.
- **Focus states:** a visible 2px focus ring (teal or ink) on every interactive
  element — this pairs with the upcoming a11y pass; style it here.

## 6. Non-goals
Dark mode. Illustrations, mascots, confetti, gamified anything. Webfont
downloads. Gradients. Any behavior change. Any new API call.

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. Briefing hook computed `font-family` contains the serif stack; workspace body
   text is the sans stack (`preview_inspect`).
2. Page background is the warm off-white token; the stage pane is the most solid
   surface; the emphasis gradient is gone.
3. Semantic sweep documented in the commit message: teal/amber/green/rose each
   appear ONLY in their §1 meaning (spot-check: a done file is green, a warning
   note amber, progress teal, red flags rose — and nothing decorative anywhere).
4. Moment strip reads Brief/Check/Model/Example/Try/Coach/Draft/Wrap; an OLD
   saved state (pre-rename localStorage) still resumes at the right beat.
5. Contrast: body and support text ≥ 4.5:1 on their actual backgrounds
   (compute from `preview_inspect` colors; fix any failure — `ink-faint` is the
   suspect).
6. Draft editor shows the mono filename strip + real edited/word-count meta.
7. Wrap renders as the receipt treatment with content unchanged from the rewards
   spec.
8. Zero font/network requests added (`preview_network`: no new hosts).
9. Behavior smoke pass: briefing → workspace → moments → coach ticks → draft →
   wrap → export → drawer all function identically. No console errors; no
   overflow at 375/1280.

## Contract reminders
- This pass paints; it must not move. Any behavior diff = overstepped.
- Earned-state visuals (green) may never appear on unearned state — the palette
  now ENCODES the honesty rule.
