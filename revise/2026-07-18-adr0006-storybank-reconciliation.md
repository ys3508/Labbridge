# Implementation prompt — ADR-0006 storybank reconciliation (2026-07-18)

**For CC/Codex. You have zero context from the conversation that produced this. Read
this file, implement it, commit and push this file along with your changes.**

## Goal

Storybank derives claims from the same transcripts ADR-0006 deletes, and the two
artifacts have incompatible granularity (bank is per user, delete is per plan). This
lands the reconciliation as a decision record: tier becomes a derived fold over
plan-stamped provenance events rather than a stored field, so the bank can stay
per-user while delete stays per-plan.

**This is a documentation-landing task. Do not build the storybank storage layer.**
No storage layer exists; the decisions below are being recorded now precisely because
they are near-free to decide before it does. The new checker fixtures are specified
here as required-at-build-time, not as tests to write today against code that does not
exist.

## Affected files

- `decisions/ADR-0006-data-deletion.md` — append amendment block, do not rewrite the
  existing Decision/Options/Consequences sections
- `revise/2026-07-18-storybank-provenance-events.md` — new file
- `OPEN.md` — add one fork, remove two closed ones
- `JOURNEY.md` — one entry, same commit (repo convention)

## 1. `decisions/ADR-0006-data-deletion.md`

Append verbatim, after the existing `## Checker rules` section:

```markdown
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
```

## 2. `revise/2026-07-18-storybank-provenance-events.md`

New file, verbatim:

```markdown
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
```

## 3. `OPEN.md`

**Add:**

```markdown
### Storybank re-offer on re-seeding
§5's tombstone behavior (delete silently, re-offer when near-identical material reappears
in a later transcript) was written for the transcript path. Replacing a resume is a
non-transcript feed that also re-extracts. Does the re-offer path cover seeding, or do
removed claims silently return on the first resume update? Behavior, not schema —
does not block the storybank build.
```

**Remove if present** (both closed 2026-07-18 by the amendment above):
- Storybank scope, per-plan vs per-user — settled: per user.
- Deletion-model unification — settled: plan delete is erase-strength; storybank's
  `remove`/`erase` stay claim-scoped.

**Leave untouched:** storybank fork #1 (global delete vs. per-question demote). Still
open, still schema-shaped, still blocks the storybank build's first hour.

## 4. `JOURNEY.md`

One tail entry, same commit as the changes.

## Do not

- Do not build storybank storage, schema, or UI.
- Do not write the new fixtures yet — no code exists to test.
- Do not resolve storybank §8 forks 1–5. If implementing any of the above would require
  guessing at one, stop and ask.
- Do not touch the Triage stale-restore logic in this commit; it is a separate open item.
