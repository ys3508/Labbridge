# CC session update — 2026-07-18 (speak-runner phases 1–3 · Path A kickoff · trust-copy edits)

Tip at write time: **`f65da11`** on `main` = `origin/main` = `claude/voice-freeze-honesty`.
Dev server running on :3100 (left up deliberately for Sissi's gate runs / demo walks).

## What I did

1. **Diagnosed the "generation failed / already in progress" screens** — dead dev server,
   nothing else. Restarted it, verified the whole flow at zero cost (role-only intake 400s,
   empty-plan guard fires, diagnostic renders, Q2 honest-generic fallback correct).
2. **G8/G9 drafted into OPEN.md** (map receipt failure posture · map gate as its own
   instrument) — later reshaped by Sissi/chat and landed by Codex as `eb2d08d`.
3. **Trust copy (Sissi's packaged prompt)** — `918a1a8`: grading-disclosure item 7 added
   (assessment is plan-scoped, on the plan-stamped provenance event), Gentle register
   deleted with the ADR-0007 rationale recorded, grading clause folded into the Neutral
   copy, decision recorded in the provenance-events spec, new OPEN fork: grading
   shown-to-user vs stored. Still gating: no green light to ship the copy; wires LAST.
4. **Ordered build spec** for the drill (`98d11b7`, then Path A rescope `4b2d314`):
   `revise/2026-07-18-drill-speak-runner-build-spec.md` — two tracks (speak-runner 1–7,
   storybank S1–S4), acceptance criteria per phase, PR-review checklist, trust copy wires
   last. Cost probe (Codex, `8c22f3b`) resolved Phase 8 → **bundle** (0.76–0.85¢/loop).
5. **Reviewed + merged Codex's storybank** (`2d269f3`) — product-rule review PASSED
   (append-only events, computed-never-stored tier, entry-gated confirmation, plan-stamped
   grading, real delete cascade + locks). API seam matches what phases 6–7 will consume.
6. **Built speak-runner phases 1–3** (my lane):
   - **`e14922a` Phase 1** — interview "Bank it" beat = live speak loop (`SpeakPanel` over
     the verified `VoiceInput`); confirmed transcript IS `drafts[i]` (folder/export/Score
     unchanged); no template button (scaffolding in a transcript box would be graded as
     words the user said); non-interview typed box untouched; signal session-only.
   - **`11f4a6e` Phase 2** — `/api/coach` accepts optional `turns` (take → push →
     re-speak), judges the WHOLE exchange with the SURVIVED/FOLDED read; single-draft
     contract byte-intact for diagnostic/typed callers; Score beat sends REHEARSAL
     DELIVERY METRICS mode-scoped, delivery-only.
   - **`f65da11` Phase 3** — `/api/push` (one per take, fixed-and-dumb, no-invented-facts
     hard line, static fallback so the drill never dies); push interrupt + response panel;
     exchange lifted to the moments shell after live-verify caught a one-per-take loophole
     (panel remount forgot the push and offered a fresh one); demo mock added BEFORE the
     button shipped (#58's paid-leak class, pre-closed).
   - Verified: 47 zero-API checks, lint clean, demo walks the full loop canned, ~2–3¢
     total live spend (one exchange grade + one push generation), zero console errors.

## Can the server show the question map / drill? (Sissi asked)

**Yes, both, right now, zero cost:** `http://localhost:3100/?mock=1&persona=interview`
- **Question Map**: Workspace Home renders sections (FIT/JUDGMENT/…), per-question
  receipts (JD/resume/diagnostic-cited), start-here / you-named-this / blind-spot tags,
  Prep order ↔ Interview order toggle. (Codex's Jul-17 build, live-confirmed today.)
- **Drill (phases 1–3)**: open any question → walk to "Bank it" → speak/type → "Face the
  push — one per take" → respond → "Score" grades the whole exchange. All canned in demo;
  the live routes are verified separately.

## Notes by audience

- **Sissi:** the drill's spine is walkable in demo now (URL above). The exchange grading
  and push generation are live-verified once each; your Q2-gate runs remain the deep live
  validation. Trust copy is content-settled but wires LAST (needs storybank surfaces +
  your ship call). One workflow hazard: Codex sessions leave the checkout on codex/*
  branches — my first Phase-1 commit landed on `codex/storybank` before I caught it;
  consider a worktree for Codex if parallel sessions continue.
- **Codex:** storybank S1–S4 reviewed and merged — clean work. Phases 6–7 will consume
  `bankClaim/getClaims/attachGrading/deletePlan/tierOf` as documented. Nothing needed
  from you until then; the meter-vs-bundle call is settled (bundle) per your probe.
- **Claude chat:** the exchange/survival prompt rules and the push's no-invented-facts
  line are locked zero-API (47 checks); the one-per-take rule is enforced in shell state,
  not component state — the reasoning is in `f65da11`'s message and JOURNEY.

## To-do (next session)

1. **Phase 4 — dig UI** (largest remaining piece): Keywords/Full-sentences toggle,
   per-item "Say this in English" tap, per-tap empty-material guard, cross-question
   retrieval. Spark stance rules already live in `/api/assist`.
2. **Phase 5 — tap-to-notes** (AI-condensed bullets, plan-scoped).
3. **Phase 6 — banking gate** (existence: take + push response + explicit tap) + badge
   (verdict-backed) — consumes storybank S2/S3.
4. **Phase 7 — notes → cheatsheet** (consumes cross-references; export as Markdown).
5. **Phase 8 — bundle cost disclosure** (number settled; UI only).
6. **Phase 0 — wire the trust copy LAST**, once 2/4/7's clauses are all true-in-code,
   with Sissi's explicit ship call.
7. Untracked and not mine: `revise/q2-gate-jd-fixtures.md` (Sissi's),
   `updates/2026-07-18-receipt-split-trust-copy.md` (appeared mid-session, author unknown).
