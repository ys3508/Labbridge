# CC → CC account handoff — LabBridge (2026-07-18)

**Purpose:** everything a *new* Claude Code account needs to pick up this work with no prior
context. Written because the incoming account inherits the **repo** but NOT this session's
conversation and NOT my local memory (memory lives at `~/.claude/projects/-Users-sissi-Desktop-Labbridge/memory/`
and is account/machine-local — the working preferences it holds are transcribed in §3 below).

Current tip: **`8323e60`** on `main` = `origin/main` = `claude/voice-freeze-honesty` (all in sync).

---

## 1. Read these first, in this order

1. `CLAUDE.md` + `AGENTS.md` — repo conventions and the product contract (authoritative).
2. `JOURNEY.md` — the narrative of how the product got here (read for the "why").
3. `TASKS.md` — the honest ledger of everything discussed vs actually built.
4. `OPEN.md` — undecided gates (stop-conditions). Also `decisions/ADR-*.md` (the ledger).
5. `revise/2026-07-17-drill-grammar-spec.md` — the current active build (drill), incl. the
   **Jul-18 addendum** that records every closed ruling + BUILT/REMAINING/GATED status.
6. `updates/2026-07-18_CC_drill-build-and-merge-backlog.md` — the most recent session handoff
   (what shipped, notes by audience, to-do list). This file complements it.

---

## 2. What the product is (30 seconds)

LabBridge — a personalized enterprise-onboarding + interview-prep workspace for
career-changers. Next.js 14 app at `~/Desktop/Labbridge`. **Interview mode is the front
door / acquisition wedge.** The live user workflow today:

```
Front door (paste the job) → Diagnostic (2 questions) → Triage → Question Map → Work each question
```

- **Front door** (`InterviewDoor.js`): paste JD + round/interviewer-kind/format/seniority +
  "the hardest part of this for you" + optional resume. `/api/intake` turns it into signals.
- **Diagnostic** (`DiagnosticFlow.js`): Q1 is a **fixed** opener ("walk me through your
  background — and why this role"); Q2 is **generated from the job posting** with a verbatim
  receipt. Voice or typed, confirm-transcript-before-grading, two-axis read (substance +
  delivery), no fake scores. Feeds the map (map comes AFTER, built from these answers).
- **Triage** (`TriageView.js` + pure `lib/triage.js`): ranks substance/delivery/named-thing
  by `weakness × round-relevance`; names one "start here" lever; shows evidence + limits;
  the user can reorder (correction door). Never ranks away the named dread; runway forks
  volume not warmth.
- **Question Map** (`PlanView.js`): finite list of likely questions in the interviewer's
  voice, receipt-backed, tagged (start_here / you_named_this / blind_spot), order toggle.
- **Work each question**: TODAY still a typed draft box + single-shot grade. This is the
  part the **drill** rebuilds into a live voice loop (see §7).

### The honesty contract (NON-NEGOTIABLE — check every change against it)
- **Honesty over fiction.** Earned-state-only UI (no checkmark without a real draft).
  Verify-and-drop (never show an unverified source). No `doneAsIf`.
- **Facts vs fluency.** Teach conventions flagged "confirm your team's"; never invent precise
  rules, citations, company specifics — even ones the model "knows."
- **Purpose picks the grammar; timeline sets the budget; gaps set the count.** Never a default
  task count ("always 5" was the disease we cured).
- **ONE flat generation schema.** Compiled-grammar limit forbids nesting. New fields =
  strings/ints only; prefer REINTERPRETING existing fields.
- Marketing copy obeys the same rule: no "exactly", no "ace any interview", no "every answer".

---

## 3. Who you're working with + working conventions (my memory, transcribed)

**Sissi** — product owner + designer (`sissi.sun0123@gmail.com`). Three-agent model:
**Claude chat** designs/specs/facilitates · **Codex** implements · **CC (you)** does
micro-fixes, verification, git, and — when explicitly told — end-to-end builds.

Preferences I've been operating under (these are NOT in the repo; they were my local memory):
- **Spec-and-review is the DEFAULT** — normally write specs + acceptance criteria and review
  Codex's code; only code micro-fixes/verification, to conserve shared Claude usage.
  **Exception:** on 2026-07-18 Sissi explicitly said "execute the coding work end to end" —
  that override was for that session only; the default still stands unless she says otherwise.
- **Keep `JOURNEY.md` updated** — after each meaningful phase/fix, add a concise diary entry,
  unprompted.
- **End-of-session handoff** — write `updates/YYYY-MM-DD_CC_<slug>.md` covering (1) what you
  did, (2) notes split by audience (Sissi / Codex / Claude chat), (3) a to-do list. Offer to
  commit it; don't assume.
- **Don't re-flag** the ADR ledger as missing — `decisions/` now exists on `main` (ADR-0002–0006
  + `decisions/OPEN.md`). (There's a harmless duplicate: both root `OPEN.md` and `decisions/OPEN.md`
  exist — left as-is, not worth churning.)
- Sissi tends to think out loud / ask questions — when she's asking, the deliverable is your
  assessment; don't jump to code until she asks for a change.

---

## 4. Environment — how to run things (IMPORTANT gotcha)

- **Node is NOT on `PATH`.** It lives at `/Users/sissi/.local/node-v22.23.1-darwin-arm64/bin/node`
  (that's what `.claude/launch.json` hardcodes). Prefix it:
  ```bash
  export PATH="/Users/sissi/.local/node-v22.23.1-darwin-arm64/bin:$PATH"
  ```
- **Zero-API check (run before committing code):** `node scripts/check-fixtures.mjs`
  (a.k.a. `npm run check`). Validates plan fixtures + `lib/moduleCheck.js` rules + the
  interview-map rules + the coach axis-separation lock.
- **Dev server / browser verify:** use the **preview tools**, not bash. `preview_start` with
  `{name: "labbridge-dev"}` (port 3100). Interview demo: navigate to
  `http://localhost:3100/?mock=1&persona=interview` (zero paid calls). Verify with
  `read_console_messages`, `preview_logs`, `get_page_text`. Note: `read_page` sometimes
  returns an empty tree on the seed tab — drive with `javascript_tool` clicks instead.
- Scratchpad for temp files: `/private/tmp/claude-501/-Users-sissi-Desktop-Labbridge/<id>/scratchpad`.

---

## 5. Git state + workflow

- **Current:** `main` = `origin/main` = `claude/voice-freeze-honesty` = `8323e60`. Clean tree.
- **Workflow Sissi uses:** direct push to `main`, **no PRs**. Feature branches are pushed to
  origin. The sync pattern I used all session: commit on the feature branch → `git checkout main`
  → `git merge --ff-only <branch>` → push main → checkout back → push branch. Keeps both refs equal.
- **Commit message footer:** `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Branches still around** (mostly older Codex/Claude work, some already merged): `main`,
  `claude/voice-freeze-honesty` (the drill base), `claude/checker-rules`, `claude/mock-mode`,
  `codex/planview-density-polish`, `codex/question-map-render`, `codex/checker-harness`,
  `codex/journey-archive`, `codex/agents-volatile-facts`, `codex/module-quality-checker`.
- **Deleted this session:** `codex/voice-input-honesty` (local + remote) — its voice-honesty
  code was superseded by the recorder-aware version now on `main`; its still-open Q2-gate
  protocol was salvaged to `revise/q2-relevance-gate-spec.md` first. Recovery tip: `8e772c4`.

---

## 6. What was done in the 2026-07-18 session

1. **Cleared the merge backlog.** `main` had sat at Jul 16; the whole Jul-17 arc lived on
   unmerged branches. Fast-forwarded the question map onto `main`, then merged everything
   (triage, diagnostic hardening, voice honesty, drill work) up to `8323e60`. `origin/main`
   is current.
2. **Built + verified the honesty half of the drill:**
   - **Fork 6** — removed the interview `model`/`visual` beats from `BEAT_IDENTITY` (a strong
     answer shown before you speak is the forbidden fantasy answer; it contaminates). Every
     consumer gates on the label existing, so the beats can't render even if the model emits a
     concept. Verified live.
   - **Fork 4 — coach axis separation** — grammar/accent/fluency are delivery-only and may
     never lower the substance verdict (judged as if the transcript were cleaned into fluent
     English). Backed by `fixtures/coach-axis-l2.json` + a zero-API lock in `check-fixtures`.
   - **Dig back door** — Rules 1 & 2 (hints range wide; sentences must trace to the user's own
     material; a hint never carries its answer) now live in the assistant PROMPT (`/api/assist`),
     with resume + the two diagnostic answers wired into its context.
3. **Closed the drill spec** (Jul-18 addendum) and updated TASKS/JOURNEY.
4. **Branch cleanup** — merged to `main`, deleted the stale `codex/voice-input-honesty` (Q2
   gate salvaged first).

Commits: `6833e76` voice honesty · `eef53cc` drill spec · `08f98b1` merge base · `2f9897a`
fork6+axis · `886fe43` dig honesty · `cca0d8e` close spec · `cbf4f1b`/`8323e60` handoffs ·
`28a21c0` Q2-gate salvage.

---

## 7. What's next — the drill "speak-runner" build (REMAINING)

The drill's *design* is closed (zero open forks except a cost measurement). The honesty
plumbing is built. What remains is one focused build — full detail in
`revise/2026-07-17-drill-grammar-spec.md` (§"What is BUILT vs what REMAINS"):

- Convert the interview `artifact`/`coach` beats in `PlanView.js` from a typed draft box into
  the live loop: **speak → replay + self-read → feedback → re-speak** (reuse `VoiceInput.js`,
  which already has the typed escape hatch + freeze honesty).
- **Mid-recording text-interrupt push** — one per take, fired at a natural pause, generated
  from the transcript so far. (Delivery is on-screen text, NOT voice — no TTS in v1.)
- **Multi-turn `/api/coach`** — it currently grades one static draft; the push+feedback
  exchange is a real extension (and may move the cost number).
- **Dig UI** — Keywords / Full-sentences toggle (default Keywords; STAR-from-resume behind it);
  per-item **"Say this in English"** tap with a per-tap empty-material guard; cross-question
  retrieval (dig on Q_N may reference notes from Q1..N-1).
- **Tap-to-notes** (AI-condensed bullets only), **banking gate** (bank on existence = full take
  + push response + explicit tap; badge on quality, verdict-backed), **notes → cheatsheet**.
- Audio stays in-session/in-memory only, gone on tab close; UI says so. Never persist audio.

### Decided (don't re-litigate — reasons are in the spec)
STT = browser **Web Speech** (v1, free). Push = on-screen text, one per take, fixed/dumb (no
adaptive escalation — that's gate G6, unneeded for v1). Bank-on-existence / badge-on-quality.
"Survived two pushes in one take" belongs to the non-retriable **mock** (Session B), not drills.
**Do NOT build a second pushback engine** — the drill IS the engine; Session B is orchestration.

### GATED
- **Cost probe (Codex):** measure the full loop — two takes + push + grade + one condense-tap —
  itemized with real tokens. Meter-vs-bundle UI waits on the number. **Do not start Session B
  until it lands.**

### Other open items
- **Q2-relevance live gate** (Sissi runs it, ~5 intake calls) — `revise/q2-relevance-gate-spec.md`.
  The diagnostic isn't "shipped" until it passes.
- **Open gates in `OPEN.md`:** G6 (escalation trigger — not needed for v1's fixed push),
  G7 (pre-diagnostic tone dial default at Q1). G2 decided-not-closed (flat-line copy).
- Pre-existing debts: interview baseline **deletion path** (ADR-0006), trust-copy rewrite.

---

## 8. File map (where things live)

- `app/api/plan/route.js` — the generation contract (long; a consolidation pass is calendared —
  coordinate before touching).
- `app/api/{intake,coach,assist,materials,check}/route.js` — intake router, draft grader
  (has the axis-separation rule + lock), side-panel assistant (has dig Rules 1 & 2),
  synthetic materials, plan checkers.
- `components/PlanView.js` — the workspace (HUGE; wants splitting). Holds `BEAT_IDENTITY`, the
  moment/beat assembly (`buildMoments`, `getMomentMeta`), the question map render, `AssistantPanel`.
- `components/{InterviewDoor,DiagnosticFlow,VoiceInput,TriageView}.js` + `lib/triage.js` — the
  interview front door.
- `lib/mockResponses.js` — demo-mode (`?mock=1`) canned responses, incl. the interview persona.
- `lib/moduleCheck.js` — the static product-rule checker (interview-map rules live here).
- `fixtures/` — golden inputs (`*-input.json`) + `coach-axis-l2.json` (the L2 eval case).
- `scripts/check-fixtures.mjs` — the zero-API CI smoke test.
- `revise/*.md` — every feature has a spec. `updates/*.md` — dated session handoffs.

---

## 9. Gotchas that bit me
- Node not on PATH (§4). `read_page` empty-tree on the seed tab — use JS clicks.
- `main` can silently fall days behind while work piles on feature branches — check
  `git log main..<branch>` before assuming something "isn't done."
- The drill drills the map's questions, so any drill build needs BOTH the map and the
  recorder in its base — that's why this branch merged `main` in.
- `ammunition` is NOT a live data field (folded into challenge/diagnostic); only comments
  reference it. Don't wire it expecting a source.
