# Storybank — provenance as events (2026-07-18)

Supersedes storybank design record §3's implied model (tier as a stored label).

## The model

Provenance is an append-only event log, not a field.

    ProvenanceEvent { claim_id, tier, plan_id (nullable), source, timestamp }

Tier 1 `lifted-from-resume` → plan_id null (resume is per-user).
Tier 1 `lifted-from-jd`, tiers 2–4 → plan_id stamped.

Claim tier = max(tier) over surviving events. Never written, always computed.

## Why

Bank is per user; delete is per plan. Both are right and neither should move — the bank
is a self-updating library, and a plan is the unit the user understands. Events stamped
with a plan are the join that lets the two coexist.

It also makes downward tier movement legitimate for the first time. A claim that reached
tier 4 in a deleted plan drops not because anyone edited an observed fact, but because
the observation no longer exists.

## Rules

- Deletion of a plan deletes its events. Claims with zero surviving events delete.
- No event is ever mutated. Corrections are new events or nothing.
- Confirmation still gates entry into the bank, never tier — unchanged from §3.

## Grading on the event — DECIDED (2026-07-18)

An answer's **assessment** — delivery scores (pace, pauses, restarts) and substance grading —
attaches to the **plan-stamped provenance event**, not to the claim. It is therefore
plan-scoped: deleting a plan deletes its events and their grading with them, so item 6's
completeness claim (nothing kept you can't remove) stays true with no new delete door.

Why not on the claim: cross-plan scoring would buy a cross-interview improvement-tracking
capability that has no design yet, and it would force a new delete door — remove a score
without removing the claim — which the completeness claim would otherwise make false. Grading
rides the plan-stamped event and shares its lifecycle. If cross-interview improvement tracking
is later wanted, this is the decision to revisit.

(Disclosure scope: the trust copy discloses that grading is *stored* and plan-scoped. Whether
grading is *shown* to the user is a separate open product decision — see OPEN.md.)

## Open behavior (not schema)

Re-seeding: replacing a resume re-extracts claims, including near-identical ones the user
removed. §5's tombstone re-offer was specified for transcripts only. Extending it to
seeding is the obvious read but was not decided. See OPEN.md.
