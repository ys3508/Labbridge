# Trust copy — draft for approval (2026-07-18)

**Status: DRAFT. Not shipped.** Per the post-audit cleanup prompt item 1: draft the copy
now, do not replace the live copy (collapsed to a single register 2026-07-18 — see below).
This copy gates the **drill build** (the
seam rule — what a contract line promises, every downstream component must keep), so it
ships *with* drill + storybank, not before.

## Why the live copy has to change

Today's standing line — *"We save your confirmed transcript and coaching signals for this
plan. We do not store audio."* (`DiagnosticFlow.js`) — plus the retake note *"I keep
earlier take transcripts and metrics for this session only… Audio is discarded."*
(`VoiceInput.js`) describe a system about to stop existing. Drill retains multiple takes
as delivery signal, scores pauses/disfluency (ADR-0005), and storybank adds a persistent
**per-user** material bank derived from transcripts. The one line most likely to become a
false promise: **plan delete is not total** — per the ADR-0006 amendment (2026-07-18) the
bank is per-user while delete is per-plan, a claim survives a plan delete if it keeps a
provenance event outside that plan, and the resume is a per-user artifact with its own
separate delete path.

## What the new copy must be true about

1. Transcripts (typed + confirmed spoken) are saved; audio never is. *(unchanged)*
2. **Every** take is kept, not just the last, and earlier takes carry delivery signal.
3. Pauses / restarts / disfluency are scored delivery data (shown and correctable), not incidental.
4. The answers you build accumulate into a **per-user story bank**, reusable across interviews, derived from your transcripts.
5. **Plan delete is real but not total:** because the bank is yours across plans, a story also grounded in another plan stays until that plan is deleted too; the resume has its own delete.
6. Nothing is kept that you can't remove.
7. The **assessment** formed from an answer — delivery scores (pace, pauses, restarts) and substance grading — is kept alongside the answer and is **plan-scoped**: it lives on the plan-stamped provenance event and is purged when that plan is deleted. Unlike the answers themselves (4), it does **not** follow a claim into the per-user story bank. *(Whether grading is shown to the user is a separate open product decision — not disclosed here either way; this item is about storage only.)*

## The draft — single register (Neutral)

Neutral is the shipping register; the Gentle draft is deleted. **Why one register:** ADR-0007
settled that tone dials on *evidence, not on arrival* — and a trust disclosure has no evidence
to dial on. The facts are identical for every user; dialing on inferred emotional state would
hand two users differently-worded accounts of the *same* data practices. Two texts also double
the seam surface: every future change to what's stored must be re-verified against both, and
drift between them is a trust bug that reads fine in each version alone and so survives review.

The copy may not be brisk; the user most likely to read this closely just gave a rough
answer about a layoff.

### Neutral

> What we keep: the words you type and say — your confirmed transcripts, every take, not
> just the last — and the delivery signals we read from them, like pace, pauses, and where
> you restart, plus the grading we form from each answer, kept with that answer for this
> plan. We never keep audio. The answers you build stay with you as a personal story
> bank you can reuse from one interview to the next. You can delete a plan's data whenever
> you want, and the delete is real — but because the story bank is yours across every plan,
> a story that also came up elsewhere stays until you delete that plan too, and your resume
> has its own separate delete. Nothing is kept that you can't remove.

## On approval (not done here)

- Replaces the `DiagnosticFlow.js` standing line and folds in the `VoiceInput.js` retake
  note (takes-plural is now in the standing disclosure, so the separate note can shorten to
  the session-vs-saved distinction or retire).
- Ship in the same change as the drill retained-takes + storybank persistence, so no clause
  is true-in-copy before it is true-in-code (the seam rule, in the other direction).
