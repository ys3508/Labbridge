# Remaining Before Visual — demo mode, mentor mock, a11y, checker debt (Claude → Codex)

From Sissi's to-do audit 2026-07-10: everything on her list is done or already
specced EXCEPT the four items below (+ one open question). All zero API.

**Sequencing:** after `layout-foundation-spec.md` lands and is reviewed:
**§1 demo mode → §2 mentor mock → §3 a11y**, then `visual-design-spec.md` last.
**§4 (checker branch) is parallel-safe ANY time** — it touches no UI files.

---

## §1 Demo mode — promote the dev tool to a product feature

`?mock=1` already does 90% of "demo mode" (fixed RWE plan, straight into the
workspace, zero API). Make it visible:

- **Entry point:** on the input page, a quiet secondary link near the build
  button: **"Or explore a sample plan →"**. Clicking sets the existing flag
  (`lb_mock` internally is fine) and enters the flow — a fresh demo lands on the
  **briefing** first (flag `lb_briefed` unset), which is exactly the arc a
  visitor should see.
- **Copy rename (display only):** banner becomes
  **"Sample plan — explore freely · exit sample"** (not "Mock mode — no API
  calls"; that's dev-speak). `?mock=1` keeps working as the dev path.
- **Exit:** clears the flag and returns to the input page. Demo progress
  (keyed by the mock plan's `planKey`) may persist harmlessly — it never
  collides with a real plan's keys.
- The demo must never fire a network `/api/*` call end-to-end (that's the point).

**Acceptance (`?mock=1` + via the new link):** fresh visitor → link → briefing →
Enter → full workspace, banner reads "Sample plan…", exit returns to input, zero
`/api/*` network requests the whole session; normal flow untouched when flag off.

## §2 AI mentor mock — prototype the coaching UX (DEMO-GATED, honesty-critical)

Purpose: test the *feeling* of coaching and design the `/api/coach` surface
before funding it. The honesty line, non-negotiable: **canned coaching renders
ONLY in demo mode, visibly labeled as canned.** In the real flow, nothing
changes (the "AI review is coming" note stays). We refused fake-AI three times;
this is not that — it's a labeled prototype inside a labeled sample.

- **Placement:** the Coach beat, demo only: a small exchange panel under the
  self-check titled **"Sample coaching (demo)"** with the subline
  *"Canned responses to show how coaching will work — not AI."*
- **Three prompt buttons** (the same trio we once deleted as dead buttons — now
  they answer): `Check my draft` · `Give me a hint` · `Explain simpler`.
- **Canned but state-aware** (template logic over real state — even the fake is
  honest about what it reads):
  - *Check my draft:* draft empty → "Nothing here yet — write a first pass in
    Draft and I'll look." · draft < ~30 words → note it's thin + quote the first
    unticked `selfCheck.criteria`. · else → acknowledge + quote the first
    unticked criterion + one `redFlags` item as "watch for".
  - *Give me a hint:* reword the first unticked criterion as a nudge; all ticked
    → point at `doneWhen`.
  - *Explain simpler:* serve `concept.keyTerms` plainMeanings as a mini
    glossary; none → shorten `concept.explanation`'s first sentence.
- Responses render as a simple two-bubble exchange (user prompt → reply) so the
  visual pass can style a chat surface. No free-text input in v1 (canned can't
  answer free text honestly — add the input only when `/api/coach` is real).
- This panel IS the future socket: when `/api/coach` is funded, real calls
  replace the template layer; the UI stays.

**Acceptance:** panel absent in real mode (flag off) — grep + DOM check; present
in demo with the "not AI" labeling; responses visibly change with draft
length/tick state; zero network; no console errors.

## §3 Accessibility semantics (behavior — before visual; focus *styling* is visual's)

- **Keyboard:** ←/→ move between moments when the stage has focus; Escape closes
  the drawer and the file preview; dots/files/checkboxes all reachable and
  activatable by keyboard (real `<button>`s mostly exist — verify).
- **Focus management:** opening the drawer moves focus into it and traps Tab
  inside; closing returns focus to the "Why this plan?" trigger. Same
  open/return pattern for the file preview.
- **ARIA:** `aria-current` on the active task (sidebar) and active dot;
  progress bar gets `role="progressbar"` + `aria-valuenow/max`; expand/collapse
  triggers (drawer, preview, Collapse) get `aria-expanded`; landmarks: the
  header/nav/main regions marked.
- Keep it light — no aria-live storms, no redundant labels.

**Acceptance:** keyboard-only walkthrough completes a moment cycle and
opens/closes drawer+preview with correct focus return; DOM shows the ARIA
attributes above; no keyboard trap anywhere (Tab always escapes eventually).

## §4 Checker-branch debt (parallel lane — any time, no UI files)

On `codex/module-quality-checker` (never merged). Full context:
`revise/handoff-to-codex.md` §5.
1. Apply the reviewed fix: scope `checkBannedPhrases` to the ASSIGNMENT only
   (`task.title/managerRequest/steps/deliverable/givenInputs/doneWhen`) — the
   taught concept legitimately says "learn about" and must not flag.
2. Add the two remaining golden fixtures (`golden-growth-equity-input.json`,
   `golden-beginner-input.json`) matching `buildPayload`'s shape.
3. Rebase the branch on current `main`, verify the checker passes a healthy
   Shift-1 module and flags a bad one, notes → review → merge.

## §5 Small sweep — loading/error honesty

- Plan-generation failure gets a **Retry** button (today: message only).
- Verify every async surface has an honest state (resources "finding…", augment
  note, drawer while checking) — no silent spinners, no fake progress.

---

## Open question for Sissi (do NOT build until answered)

**"Progressive reveal"** from her list is undefined. Likeliest reading: moments
unlock sequentially on a task's FIRST pass (no peeking ahead via dots), with
free navigation after reaching Wrap. Waiting on her definition — if that's it,
it's a small behavior spec to slot before the visual pass.
