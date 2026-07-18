# ADR-0006 — Data deletion: real deletion, per plan

**Status:** Accepted
**Date:** 2026-07-17
**Gate:** OPEN.md G5
**Decided by:** Sissi
**Related:** ADR-0002 (deletion must reach retakes)

## Context

"We do not store audio" is promised and kept. But a stored transcript of a rough
layoff answer is sensitive, and an honesty-first product should let the user
delete a plan's data for real. Deletion is a schema-shaped decision, not a
button — it is nearly free to decide before the storage layer exists, and
expensive after.

The storage layer does not exist yet. This is decided now for that reason.

## Options

- **A. Real deletion** — user-triggered, actually removes the data.
- **B. No path** — data persists for the plan's life; defensible only if said
  plainly, up front, in the same breath as the no-audio promise.

## Decision

**A.** A user can delete a plan's data, and the delete is real.

**Scope of a delete:** confirmed transcripts (all takes, per ADR-0002), grading,
delivery metrics and disfluency marks (ADR-0005), the running read, whether Q2
was skipped. Everything the diagnostic and mock wrote.

**Granularity:** per plan. A plan is the unit the user understands and the unit
the trust copy already speaks about.

## Consequences

1. **Nothing is stored that cannot be deleted.** Any derived artifact that
   outlives the delete must be listed here explicitly with a reason, or it must
   not be derived. Silent survivors are the failure mode.
2. **Retakes are in scope.** A delete that leaves takes behind makes ADR-0002 and
   this ADR contradict each other on two shipped surfaces — the exact
   "no surface may contradict another" violation.
3. **The "before" snapshot dies with the delete.** The progress moment ("day one
   your result arrived at second 70; now it's in the first 20") depends on stored
   diagnostic data. If the user deletes, that moment is gone. This is correct and
   must be said at the delete confirmation — honestly, as a loss, not as a
   deterrent. Same discipline as the Q2 skip: framed as a loss, never as the
   wrong choice.
4. **Delete copy is tone-dialed.** The user most likely to delete is the user who
   gave the rough layoff answer. A brisk confirmation dialog is the wrong
   register for the person most likely to see it.
5. **Delete is not a grading event and not a coaching moment.** Don't ask why.

## Cost to reverse

**Deciding A now: ~free.** Storage is unbuilt.
**B→A later: expensive** — if the layer assumes nothing ever leaves, deletion
becomes schema surgery across every writer.
**A→B: not available.** Removing a shipped deletion path is a trust event, not a
scope cut.

## Checker rules

- Every persisted field has a delete path; **fail the build on a writer with no
  corresponding delete** (this is the rule that keeps A true over time).
- Fixture: post-delete, no read of the plan's data returns anything.
- Fixture: delete confirmation copy names the lost "before" snapshot, in both
  registers.

## Amendment — 2026-07-18 (storybank reconciliation)

**Reason:** Storybank derives claims from transcripts this ADR deletes. Consequence 1
forbids silent survivors, so claims must be in scope or explicitly reasoned. Granularity
also collided: delete is per plan, the bank is per user.

**Resolution: tier is derived, not stored.**

A claim's provenance tier is a fold over plan-stamped provenance events, computed at
read time as max(event.tier) — not a field on the claim. Deleting a plan deletes that
plan's events; tier recomputes downward because the record that observed it is gone.
This is the only tier movement storybank §3 permits: a user cannot confirm their way up
and cannot argue their way down.

**Scope of a delete — additions:** storybank provenance events belonging to the plan,
and any claim left with zero surviving events.

**Consequence 1 — survivor rule.** A claim survives a plan delete if and only if it
retains at least one provenance event outside that plan. Otherwise it deletes with the
plan. This is a rule, not a carve-out: survival requires independent grounding, and the
grounding is stateable.

**Consequence 3 — extension.** The delete confirmation names lost claims and their
count, alongside the lost "before" snapshot. Same register: loss, not deterrent.

**Consequence 6 — plan delete is erase-strength.** Plan delete purges; it does not
tombstone and does not re-offer. This ADR exists for the rough layoff answer, and a
delete that quietly returns the material later breaks its own premise. Storybank's
`remove` (soft, tombstoned, re-offerable) remains claim-scoped only.

**Consequence 7 — resume is a per-user writer.** The resume is attached to the user,
not to a plan. `lifted-from-resume` events carry a null plan and survive every plan
delete; `lifted-from-jd` stays plan-stamped and dies with its plan. Therefore:
- The resume requires its own user-reachable delete path. Deleting every plan does not
  delete the resume — without this, a user who deletes everything they can see still
  has resume text on file, which is Consequence 1's failure mode in a new place.
- Resume delete cascades: resume-lifted claims hold exactly one event each, so under the
  survivor rule they die with it. Same confirmation discipline as Consequence 3.

**Checker rules — additions.** These gate the storybank build, not this commit:
- Fixture: a claim with events in plans A and B survives a delete of A, with tier
  recomputed from B's events only.
- Fixture: a claim with events only in plan A returns nothing after A is deleted.
- Fixture: resume delete removes resume text and all null-plan events.
- Fixture: plan-delete confirmation copy names lost claim count, in both registers.
