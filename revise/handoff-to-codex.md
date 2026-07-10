# Handoff to Codex — Moments rework + what's next

Written by Claude for Codex. Context: we agreed a division of labor — Claude
designs + specs + reviews; Codex implements. This is the spec + status so you can
pick up the remaining work. Full contract in `AGENTS.md`; moment design in
`revise/moments-spec.md`.

---

## 1. Current state (read first)

- **Branch:** `codex/planview-density-polish` (Codex's PlanView redesign).
- **Uncommitted** on that branch right now (Claude's moments work, NOT pushed):
  - `components/PlanView.js` (+337/−163) — the Moments rework
  - `app/api/plan/route.js` (+12) — `comprehensionCheck` schema + prompt
  - `lib/mockResponses.js` (+31) — `comprehensionCheck` in the 3 mock modules
  - `revise/moments-spec.md` (new) — the agreed spec
- **Verified** working offline in **mock mode** (`?mock=1`, zero API). See §3.
- Nothing here is committed yet — Sissi will decide when to commit and merge.

### Branch map (avoid confusion — none merged to main)
| Branch | What | State |
|---|---|---|
| `main` | at `2671301` (collab setup) | baseline |
| `codex/planview-density-polish` | your workspace redesign **+ Claude's moments rework (uncommitted) + a local merge of mock mode** | local only |
| `claude/mock-mode` | offline mock mode (MockGate + mockResponses) | **pushed**, off `main` |
| `codex/module-quality-checker` | your static checker | pushed; **has a pending review fix** (see §5) |

---

## 2. What Claude changed (this session)

Implemented `revise/moments-spec.md` in `components/PlanView.js`:

- **Rewrote `buildMoments`** into the fixed-grammar / variable-inclusion model:
  `Brief → Question → Model → Visual → Practice → Coach → Artifact → Reward`.
  Code assembles the beats a task has content for (always: Brief, Coach, Artifact,
  Reward; conditional: Question/Model/Visual/Practice). The model never chooses.
- **Coach is honest by construction** — the fake-AI buttons ("Check my answer" etc.)
  are gone. Coach is now **user-ticked checkboxes** against `selfCheck.criteria` +
  a "Watch for" list + a dashed "AI review is coming" note. Nothing auto-responds.
- **Reward reads live state** — `checks` (ticked count) + `draft` (saved?) + the
  real next task title. Coach's ticks feed Reward's "Self-check: N/M confirmed".
- **Question** = a real per-task MCQ from a new `comprehensionCheck` field.
- **Model** shows the **full, un-truncated** concept (+ keyTerms + misconception + bridge).
- **Visual** = the worked example as a clean card.
- **Restored `plan.hook`** in `MissionBrief` (it was being generated but not rendered).
- **Removed `MentorPanel`** (the sidebar fake-AI panel) and its render.
- Plumbing: `checks`/`toggleCheck` state in `MomentFlow`; `nextLabel` threaded
  PlanView → Module → MomentFlow → buildMoments.

In `app/api/plan/route.js`: added `comprehensionCheck { question, options[],
answerIndex, explanation }` to the module schema (**optional** — not in the module
`required` list) and a prompt bullet describing it.

In `lib/mockResponses.js`: authored a `comprehensionCheck` for each of the 3 RWE
mock modules so the Question beat renders offline.

---

## 3. How to verify (offline, no API)

`http://localhost:3100/?mock=1` → build → walk a task through the 8 moments.
Confirmed by Claude: 8 beats render; hook restored; MCQ gives correct/incorrect
feedback; Coach criteria tick; **Reward shows the live ticked count** (tick 2 of 3 →
Reward reads "2/3 confirmed"); no console errors.

Dev server: `.claude/launch.json` → `labbridge-dev` on port 3100 (Node at
`~/.local/node-v22.23.1-darwin-arm64/bin`).

---

## 4. Remaining work for Codex (specced, prioritized)

### A. Dead-code cleanup (do first — pure removal, low risk)
These are now defined but **never rendered** in `components/PlanView.js` (leftovers
from earlier iterations). Remove their definitions:
`QuickWin`, `LearningLayer`, `CoachChecklist`, `WorkPath`, `FlowBox`, `FlowArrow`,
and then `ModulePanel` + `SubLabel` (which only `LearningLayer` used).
- **Acceptance:** `grep -c "function <Name>"` = 0 for each; app compiles; `?mock=1`
  still renders all 8 moments with no console errors.
- **Watch:** remove in dependency order (LearningLayer before ModulePanel before
  SubLabel; WorkPath before FlowBox/FlowArrow) so you don't leave a dangling ref.

### B. Verify `comprehensionCheck` against the live model (when API balance is back)
The UI + schema + prompt are done, but the model has **not** actually generated a
`comprehensionCheck` yet (Claude authored the mock ones by hand).
- Regenerate a plan; confirm the model emits, per module: a question tied to the
  concept, 3–4 options with **plausible** distractors, a correct 0-based
  `answerIndex`, and an explanation.
- If weak, tune the prompt bullet in `app/api/plan/route.js`.
- **Acceptance:** a fresh real plan shows the Question beat with a sensible MCQ.

### C. `/api/coach` — the real AI review socket (LATER; costs API per submission)
The Coach beat currently ends with "AI review is coming." When Sissi greenlights
spend: add a route `POST /api/coach { draft, criteria, redFlags, task }` →
returns structured feedback (which criteria the draft meets/misses, one concrete
suggestion). Wire it **above** the self-check in the Coach beat ("…or ask LabBridge
to check it") — do not remove the self-check.
- **Do not build until Sissi approves the API cost.** Honesty rule: never show
  AI-looking output that didn't run a real call.

### D. Variable-inclusion demo (optional)
All 3 mock modules currently have every field, so all show 8 moments. If useful for
testing, add a thin mock module (no `comprehensionCheck`, no `workedExample`) to
prove a 5–6 moment task renders correctly.

---

## 5. Separate: your checker branch has a pending review fix

On `codex/module-quality-checker`, Claude's review found one blocker (documented
when it was reviewed): **`checkBannedPhrases` scans the whole module**, so a healthy
concept that says "learn about…" gets flagged as an `error` (→ `checkPlan.ok=false`).
- **Fix:** scope the banned-phrase scan to the **task assignment** only
  (`task.title`, `managerRequest`, `steps`, `deliverable`, `givenInputs`,
  `doneWhen`) — not the taught `concept`/`workedExample`.
- Then finish the other two golden fixtures (`golden-growth-equity-input.json`,
  `golden-beginner-input.json`) per `TASKS.md`.

---

## 6. Contract reminders (keep code aligned)

From `AGENTS.md` — the non-negotiables your code must preserve:
- **Grounding / verify-and-drop** — never show an unverified resource.
- **Facts vs fluency** — generated teaching prose must not invent precise
  clinical/coding/regulatory specifics.
- **Fidelity** — role verbatim; UI owns the factual deadline; horizon derived.
- **Honest Coach** — no auto-responding fake AI offline.
- **Code assembles Moments**, the model doesn't choose the flow.
- **Reward reads live state** — never a canned "you're done" banner.
