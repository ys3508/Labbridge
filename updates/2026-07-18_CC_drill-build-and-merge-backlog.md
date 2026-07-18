# 2026-07-18 · CC update — drill build (honesty half) + merge backlog cleared

**Author:** Claude Code (CC) · **Branch:** `claude/voice-freeze-honesty` · **`main` = branch = `28a21c0`** (all in sync, pushed)

> Updated later in the session: the branch was merged to `main`, and the stale
> `codex/voice-input-honesty` branch was deleted after salvaging its Q2 gate. See §4–5.

---

## What I did today

### 1. Cleared the merge backlog
- **Question map → `main`.** `main` had been stuck at Jul 16 (`7db8fa3`) while the whole Jul-17 arc sat on unmerged branches — that's why GitHub looked empty. Fast-forwarded the map (`c0fac5b`, "Build interview question map render") onto `main` and **pushed to origin**. `origin/main` is now current for the map.
- **Consolidated the drill build base.** Merged `main` into `claude/voice-freeze-honesty` so the branch carries map + triage + diagnostic + voice honesty together (the drill drills the map's questions, so the base needs both). **Merged, not rebased** — rebasing would have forked the five commits shared with `codex/planview-density-polish`. Two conflicts (`plan/route.js`, `JOURNEY.md`), both resolved by keeping both sides. Base verified: `npm run check` green including the interview-map rules.

### 2. Built + verified the honesty-critical half of the drill (4 commits)
- **Fork 6 — interview `model`/`visual` beats killed.** Removed the `model` ("Answer") and `visual` ("Hear it") keys from `BEAT_IDENTITY.interview` (a strong answer shown before you speak is the fantasy answer parent §6 forbids, and it contaminates). Every consumer (`getMomentMeta`, `buildMoments`) now gates on the label existing, so the beats can never render even if the model wrongly emits a concept — **enforced in code, not by trusting prompt compliance.** Verified live in the demo: interview task moments step through, no "Answer"/"Hear it" beat, no crash.
- **Fork 4 — coach axis separation.** Added a SPOKEN-ANSWER AXIS SEPARATION rule to `/api/coach`: grammar/accent/fluency/disfluency/pace are delivery-only and may **never** lower the substance verdict; substance is judged as if the transcript were cleaned into fluent English. This is the guard that lets full-sentence dig serve L2 users without a language collapse being misread as a knowledge gap. Backed by `fixtures/coach-axis-l2.json` (strong substance, broken English → substance met / delivery thin) + a zero-API lock in `check-fixtures` so the rule can't silently vanish.
- **Dig back door guarded + plumbing.** Rules 1 & 2 now live in the **assistant prompt** (`/api/assist`), scoped to interview purpose: hints range wide, sentences must trace to the user's own material, a hint never carries its own answer, no-material→ask-don't-fill. Wired resume (now persisted into `lb_intake_last`) + the two diagnostic answers into the assistant context as the sources a sentence may trace to. Verified: routes compile, assistant responds, context builder yields the expected shape.

### 3. Closed the drill spec
- Folded **every Jul-18 ruling** into `revise/2026-07-17-drill-grammar-spec.md` (new "Jul-18 addendum") with reasoning + BUILT/REMAINING/GATED status. It's now a zero-open-fork handoff. Updated `TASKS.md` and `JOURNEY.md` to match.

**Commits (on `claude/voice-freeze-honesty`, all pushed):** `6833e76` voice honesty · `eef53cc` drill spec · `08f98b1` merge main (drill base) · `2f9897a` fork6 + axis · `886fe43` dig honesty · `cca0d8e` close spec · `cbf4f1b` this handoff.

### 4. Landed the branch on `main`
- Fast-forwarded `claude/voice-freeze-honesty` into `main` and pushed. This finished the merge order: the whole Jul-17/18 arc that had been stranded on the branch — diagnostic hardening, Triage (`TriageView.js` + `lib/triage.js`), the voice recorder + freeze honesty (`VoiceInput.js`), the `decisions/` ADR ledger, and today's drill work — is now on `origin/main`. `main` and the branch both sit at `28a21c0`; the speak-runner now builds on `main`, not branch-on-branch.

### 5. Deleted the stale `codex/voice-input-honesty` branch (with a salvage)
- Claude chat flagged it as absorbed. **Mostly true:** its voice-honesty *code* (typed-pacing, freeze) was superseded by CC's recorder-aware version now on `main` — Codex built it typed-only "because there's no recorder on main," and landing both would collide. **But not fully:** its spec also carried the **Q2-relevance live gate** — a still-open validation protocol not captured anywhere on `main`. Salvaged it to `revise/q2-relevance-gate-spec.md` (referenced from TASKS.md), then deleted the branch **local + remote**. Old tip `8e772c4` recorded in the salvage commit for recovery. Nothing lost.

---

## Notes for attention

### For Sissi (decisions)
1. ~~**One open decision:** merge the branch into `main`.~~ **DONE** — merged; `main` = `28a21c0`, pushed. Speak-runner builds on `main` now.
2. ~~**`codex/voice-input-honesty` is redundant.**~~ **DONE** — deleted (local + remote) after salvaging its Q2-gate protocol to `revise/q2-relevance-gate-spec.md`. Its code was superseded by CC's recorder-aware version; nothing lost. Recovery tip: `8e772c4`.
3. **`ammunition` is not a live data field.** It was folded into the challenge/diagnostic; only comments reference it. So "add resume/ammunition/diagnostic answers to dig context" wired resume + diagnostic answers (real, persisted) but not ammunition (no source). Flag if you expected a standalone ammunition field.
4. **The Q2-relevance live gate is still yours to run** (~5 intake calls) — protocol now on `main` at `revise/q2-relevance-gate-spec.md`. The diagnostic isn't "shipped" until it passes.
5. Minor: the map commit `c0fac5b` is authored under `ryan0000731@gmail.com`, not your usual email — attribution only, nothing broken.

### For Codex (build)
1. **The cost probe is the gate.** Measure the **full loop** — two takes + push + grade + one condense-tap — itemized, with real token counts. The 3–5¢ single-take number isn't the unit. With **STT = browser Web Speech (decided)**, transcription is ~free, so the probe sizes push + feedback only. Meter-vs-bundle UI waits on this number. **Do not start Session B until it lands.**
2. **Do NOT build a second pushback engine.** The drill IS the engine; Session B (mock) is orchestration. If a task implies a new runner, it's written against the old assumption — stop and check.
3. **`/api/coach` needs a multi-turn extension** for push + feedback — it currently grades one static draft. This is real work and may move the cost number.
4. When you touch the coach prompt, the axis-separation rule is locked by `check-fixtures` — keep the "AXIS SEPARATION" / "never lower the SUBSTANCE" markers or the check fails (by design).

### For Claude chat (facilitation)
1. The drill spec is **closed** — every fork resolved except the cost *measurement* (not a decision). If a future session reopens `model`/pre-answer examples or a second engine, that's a re-litigation; the reasons are recorded in the spec.
2. **G6 (escalation trigger) is not needed for drill v1** — the push is fixed-and-dumb (one per take, from the transcript so far). Worth deciding whether to formally close/annotate G6 in `OPEN.md` (I left it untouched — CC/Codex don't close gates).
3. Environment note for anyone running CC here: **node isn't on `PATH`**; it lives at `/Users/sissi/.local/node-v22.23.1-darwin-arm64/bin/node` (that's what `.claude/launch.json` hardcodes). Prefix it to run `npm`/`node`.

---

## To-do list

### The speak-runner build (one focused session — REMAINING)
- [ ] Convert interview `artifact`/`coach` beats from the typed draft box to the live loop: `speak → replay + self-read → feedback → re-speak` (reuse `VoiceInput`; it already has the typed escape hatch + freeze honesty).
- [ ] Mid-recording **text-interrupt push** — one per take, fired at a natural pause once there's enough material, generated from the transcript so far; new push per retake.
- [ ] **Multi-turn `/api/coach`** extension (push + feedback exchange), two-axis, quoting their words.
- [ ] **Dig UI:** Keywords / Full-sentences toggle (default Keywords; STAR-from-resume gated behind it); per-item **"Say this in English"** tap with per-tap empty-material guard; cross-question retrieval (dig on Q_N may reference notes from Q1..N-1).
- [ ] **Tap-to-notes** — AI-condensed bullets only, never raw transcript.
- [ ] **Banking gate** — bank on existence (full take + push response + explicit tap); **badge** on quality (verdict-backed, separate). "Survived two pushes in one take" belongs to the non-retriable mock, not drills.
- [ ] **Notes → cheatsheet** assembly (questions + notes + tips + materials → one HTML cheatsheet).
- [ ] Audio: in-session, in-memory only; gone on tab close; UI says so. Never persist audio.

### Gated / measurement
- [ ] **Cost probe** (Codex) — the full-loop measurement above. Meter-vs-bundle UI decision follows.

### Housekeeping / decisions
- [x] Sissi: merge `claude/voice-freeze-honesty` → `main`. **Done** (`28a21c0`).
- [x] Sissi: delete the superseded `codex/voice-input-honesty` branch. **Done** (Q2 gate salvaged first).
- [ ] Sissi: run the **Q2-relevance live gate** (`revise/q2-relevance-gate-spec.md`, ~5 intake calls) before calling the diagnostic shipped.
- [ ] Claude chat: decide whether to annotate/close **G6** in `OPEN.md` given v1's fixed push.
- [ ] Carry-over (pre-existing, not drill): interview baseline **deletion path** (ADR-0006 debt).
