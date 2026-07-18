# Implementation prompt — post-audit cleanup before drill (2026-07-18)

**For CC/Codex. You have zero context from the conversation that produced this. Read
this file, implement it, commit and push this file along with your changes.**

Four items. #1 is a draft-for-approval, not a ship. #2 is a real bug. #3 and #4 are
documentation. Do them in this order.

---

## 1. Trust copy — draft both registers, do not ship

**Goal.** The standing save line ("we save your transcript… no audio") describes a
system that is about to stop existing. Drill adds multiple takes, retained prior takes
as delivery signal, and pauses as scored data. Storybank adds a persistent per-user
material bank with its own delete doors. Per the seam rule — what a contract line
promises, every downstream component must keep — this copy gates the drill build, not
some later session.

**Draft it now and stop.** Do not replace the live copy. Output both tone registers for
approval.

**What the copy must now be true about:**
- Transcripts are saved; audio is not. Unchanged.
- Multiple takes are retained, and earlier takes carry delivery signal — they are not
  discarded when the user re-records.
- Pauses and disfluency marks are scored data (ADR-0005), not incidental.
- Storybank claims are derived from transcripts and persist in a per-user bank.
- **Plan delete is not total.** This is the part most likely to come out false. Per the
  ADR-0006 amendment (2026-07-18): the bank is per user, delete is per plan, and a claim
  survives a plan delete if it retains at least one provenance event outside that plan.
  The resume is a per-user artifact with its own separate delete path. Copy that implies
  "delete your plan" clears everything is a false promise the day storybank ships.

**Register discipline.** Two registers, per the existing tone-dial convention. The user
most likely to read this closely is the user who just gave a rough answer about a
layoff. Neither register may be brisk.

**Read first:** ADR-0002, ADR-0005, ADR-0006 including its 2026-07-18 amendment, and
`revise/2026-07-18-storybank-provenance-events.md`.

---

## 2. TriageView — the stale-restore fix is on the wrong axis

**Goal.** Commit `399d885` gated the saved-priority restore on *override-ness*: only a
user-corrected order restores. The actual failure axis is *staleness*, and the two are
not the same. Current behavior still fails:

> User completes the diagnostic, corrects the triage order, goes Back, **materially
> re-answers the diagnostic**, and returns. Interview meta is unchanged, so the storage
> key is unchanged, so their old correction restores over a fresh read of a **different
> weakness profile**. The commit hardened the persistence of precisely the thing most
> likely to now be wrong.

**Fix.** The storage key must include a fingerprint of the diagnostic read that produced
the order — not just interview meta. On fingerprint mismatch, recompute from the fresh
read.

**Behavioral question you must not answer alone:** on mismatch, does the stale correction
get discarded silently, or re-offered to the user ("you reordered these last time — same
call?"). The contract is "we interpret; you correct," which arguably means a correction
should not vanish without the user seeing it. **Stop and ask before implementing this
branch.** Everything else here is unambiguous.

**Testing.** The path is localStorage logic reached through the paid `/api/intake` door.
Do not burn paid calls. Make the fingerprint comparison a pure function and cover it in
`check-fixtures.mjs` with zero-API assertions: same read → restore, changed read →
recompute.

---

## 3. `triage-spec.md` — amend the honest-expectations plant to top-dimension only

**Goal.** The spec describes the honest-expectations plant rendering per-dimension; the
code renders it for the top dimension only. **The code is right and the spec is wrong.**
Do not "fix" the render.

Triage exists to narrow to one biggest lever. Rendering expectations across every
dimension re-broadens exactly what the stage just narrowed — the user leaves holding four
things to expect, which is the state triage was built to end.

Amend `triage-spec.md` to specify top-dimension only, and include the narrowing rationale
in the spec text so it does not get re-litigated as a rendering oversight. The per-row
`expectation` data stays in the model; it is simply not all rendered.

---

## 4. Close OPEN.md gate G7 — Q1 tone default

**Only implement this if Sissi has confirmed in the routing message. If she has not,
skip item 4 and say so.**

**Goal.** G7 (Q1 tone default) closes as **neutral** — but recorded as a rule, not as a
fallback, so it generalizes.

Rule to record: **tone dials on evidence, not on arrival.**

Q1 is the cold opener. The user has given the system nothing yet, so a warm register is
warmth unearned by anything that happened — it reads as product voice, not care. The
moments that legitimately dial tone are moments where something occurred: the freeze
lifeline, a rough answer, a delete confirmation. Arrival is not one of them. Neutral at
Q1 is correct, not a default chosen for lack of signal.

Close the gate in `OPEN.md` per CHAT-PROTOCOL.md, with that rule stated. If the closing
ritual requires a decision record rather than an OPEN.md edit, follow the protocol.

---

## Not in scope

- Do not build the ADR-0006 deletion path. It is deliberately deferred: there are now
  three doors (plan delete, resume delete, claim remove/erase), and building the plan
  door alone means designing a surface that gets redesigned when the other two land.
- Do not touch G2 (flat-line copy). It belongs to the walk-in-card renderer.
- Do not build storybank storage, schema, or UI. Its §8 forks 1–5 are undesigned.
- Do not run the Q2-relevance gate. That is Sissi's run.

## Convention

JOURNEY.md entry in the same commit as the changes.
