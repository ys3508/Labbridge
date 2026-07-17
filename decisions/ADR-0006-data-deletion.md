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
