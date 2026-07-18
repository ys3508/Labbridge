# CC session handoff — 2026-07-18 (dig reversal · diagnostic/triage audit · intake nav)

**For the next CC/Codex session. You inherit the repo, not this conversation.**

Current tip: **`9f5c01b`** on `main` = `origin/main` = `claude/voice-freeze-honesty` (all in sync).
Workflow is direct push to `main`, no PRs (commit on the feature branch → `git checkout main`
→ `git merge --ff-only` → push main → checkout branch → push branch; both refs stay equal).

## Read first (in order)
1. `AGENTS.md` (conventions — there is **no** `CLAUDE.md` despite older handoffs saying so).
2. `JOURNEY.md` tail (the last ~6 entries are this session).
3. `TASKS.md`, `OPEN.md`, `decisions/ADR-*.md`.
4. The two **untracked** specs in the working tree (see below) — one is the queued next task.

## Environment (unchanged, still bites)
- Node not on PATH: `export PATH="/Users/sissi/.local/node-v22.23.1-darwin-arm64/bin:$PATH"`.
- Zero-API check before committing code: `node scripts/check-fixtures.mjs` (now 20 checks).
- Verify in the browser via preview tools + demo mode (`?mock=1&persona=interview`), never paid calls.
  - Mock mode does **not** intercept `/api/intake`, and it short-circuits to stage `done`.
  - Zero-cost trick for the interview flow: a **role-only** intake (empty JD + empty challenge)
    returns 400 *before* the paid model call, so you can walk door → diagnostic → back → reuse
    with no spend. `read_page` is flaky on the seed tab — drive with `javascript_tool` clicks.
- Commit footer used this session: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  (the repo's older convention says "Claude Fable 5"; I signed as my real identity — Sissi may
  want history uniform, unconfirmed).

## What shipped this session (9c89968 → 9f5c01b)
- **`bb23341` Dig spark stance** — reversed the dig honesty rules from `886fe43`. `/api/assist`
  now OFFERS example sparks freely, recommends provenance, enforces nothing but the push; one
  hard line kept (never assert an unclaimed fact as the user's history). Spec:
  `revise/2026-07-18-dig-spark-stance.md`. Zero-API lock in `check-fixtures.mjs`.
- **`399d885` Diagnostic+Triage audit** — TriageView stale-cache fix (first pass), named the
  10s freeze constant (`FREEZE_MS`, ADR-0005 §5), locked ADR-0005 dial coverage.
- **`bad2418` ADR-0006 storybank reconciliation** — docs only: tier is a derived fold over
  plan-stamped provenance events. Amendment on ADR-0006 + `revise/2026-07-18-storybank-provenance-events.md`.
- **`0a1ab06` Post-audit cleanup** — TriageView stale-restore redone on the *staleness* axis
  (`diagnosticFingerprint` + `triageRestoreDecision` in `lib/triage.js`, re-offer on changed
  read); triage-spec amended (expectations plant is top-dimension only); **G7 closed neutral**
  → `ADR-0007` ("tone dials on evidence, not arrival"); trust-copy draft written (see below).
- **`0464cc3` Intake back-navigation + field persistence** — diagnostic has an in-app back to
  intake; `InterviewDoor` repopulates all fields on return; no second paid `/api/intake` unless
  JD/resume changed; on Q2 change the stale Q2 answer is **discarded but acknowledged** (Sissi's
  call). Verified live at zero cost except the discard+acknowledge line (needs 2 real JDs).
- **`9f5c01b` Footer nav** — step Back control moved to a bottom row (Back left, primary right)
  across InterviewDoor / DiagnosticFlow / TriageView, matching ReviewScreen.

## Untracked in the working tree (NOT mine to commit)
- **`revise/2026-07-18-reuse-fingerprint-and-receipt-attribution.md`** — the **queued next task**
  (a "read this file, implement it" prompt). Builds on `0464cc3`: (1) fingerprint the whole
  intake payload for the reuse guard, not just JD/resume — today changing seniority/round reuses
  a stale-calibrated Q2 silently; (2) a discard split; (3) receipt attribution (item 3, the
  important one). Point the new session at this file.
- **`revise/q2-gate-jd-fixtures.md`** — Sissi's Q2-relevance gate fixtures (runs 1–3). Her run
  material; leave untracked unless she says otherwise.

## Open / awaiting Sissi
- **Q2-relevance live gate** — still open; the diagnostic isn't "shipped" until it passes
  (`revise/q2-gate-jd-fixtures.md` + `revise/q2-relevance-gate-spec.md`). Her run.
- **Trust copy** — drafted in both registers, **not shipped**, awaiting approval:
  `revise/2026-07-18-trust-copy-draft.md`. Ships *with* the drill build.
- **ADR-0006 deletion path** — decided, deliberately deferred (three doors designed together later).
- **Drill speak-runner build** — the big remaining feature (`revise/2026-07-17-drill-grammar-spec.md`,
  Jul-18 addendum). Gated on Codex's cost probe for the meter-vs-bundle UI only.

## Notes by audience
- **Sissi:** the footer-nav + intake back-nav are live-verified; the Q2-change acknowledgment
  line and the reuse-fingerprint next task both get exercised by your Q2-gate runs. Trust copy
  needs your yes. Confirm the commit-footer identity if you care about uniform history.
- **Codex:** cost probe for the drill loop still blocks Session B. `lib/triage.js` gained two
  pure exports (`diagnosticFingerprint`, `triageRestoreDecision`) with zero-API locks.
- **Claude chat:** the dig honesty reversal + G7 close are recorded with reasoning inline so they
  don't get re-litigated; ADR-0006's storybank amendment settled per-plan-vs-per-user.

## To-do (next session)
1. Implement `revise/2026-07-18-reuse-fingerprint-and-receipt-attribution.md` (queued, builds on `0464cc3`).
2. After Sissi approves: wire the trust copy (`revise/2026-07-18-trust-copy-draft.md`) — with drill.
3. When Sissi greenlights: the drill speak-runner build.
