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

## Open behavior (not schema)

Re-seeding: replacing a resume re-extracts claims, including near-identical ones the user
removed. §5's tombstone re-offer was specified for transcripts only. Extending it to
seeding is the obvious read but was not decided. See OPEN.md.
