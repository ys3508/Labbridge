# ADR-0001 — One shared schema across all four purposes

**Status:** Accepted (retroactive — this ADR records a constraint already load-bearing)
**Date:** 2026-07-17
**Gate:** none — this was never open; it is written down because it is the
invariant most likely to be violated by a reasonable-looking commit.

## Context

LabBridge generates plans for four **purposes**: starting-a-role, interview,
career-move, curious.

The obvious design is four schemas. **We tried that. It hit a hard wall:
"compiled grammar too large."** Structured output (`output_config` →
`json_schema`) compiles the schema into a grammar, and four purpose-specific
container schemas exceeded what the API would compile. This is not a preference,
a style choice, or a simplification we made for elegance. It is a ceiling we hit.

## Decision

**One flat schema. All four purposes reinterpret the same fields.**

Purpose changes **semantics and rendering**. It never changes the schema.

Variation is expressed through exactly three mechanisms:

1. The **existing fields**, reinterpreted.
2. A **mode value** carried in the payload.
3. **Leaving unused fields null.**

That is the whole toolkit. There is no fourth mechanism.

## The rule, stated so it can be checked

> **Never add purpose-specific fields.**

If a field would only ever be non-null for one purpose, it is a purpose-specific
field wearing a general name, and it is forbidden. `interviewRound` is forbidden.
So is `round`, if only the interview purpose ever fills it.

The test isn't the field's name. It's whether more than one purpose can populate
it meaningfully.

## Why this ADR exists at all

Adding a field is the most natural-looking commit in the world. It passes review.
It looks like progress. Nothing in the code says no, and the reason it's
forbidden — a grammar ceiling we hit months ago, in an experiment that left no
artifact in the repo — is invisible at the call site.

So the failure mode is not disagreement. It's **a future agent, or a future
Sissi, adding one reasonable field, then another, and re-hitting a wall whose
cause has been forgotten.** By then the fix is a schema migration across every
purpose and every route.

This document is the artifact that experiment didn't leave.

## Consequences

1. **The four interview knobs live in the flat schema.** Round / Format /
   Seniority / Challenge do not get their own fields. They are mode values and
   reinterpretations. (Round = shape · Format = modality · Seniority = difficulty
   · Challenge = warmth — four knobs, not four fields.)
2. **Null is meaningful and must be handled everywhere.** A field null for this
   purpose is normal, not an error, not missing data, and never a fabrication
   prompt. "This field is empty so I'll fill it" is how you get invented
   biography.
3. **`max_tokens` pressure is permanent.** One container schema carrying four
   purposes is large; the plan route sits at 16384 and guards on
   `stop_reason === "max_tokens"`. Growing the schema pushes toward truncation
   (`Unterminated string in JSON`) *and* toward the grammar ceiling. Both symptoms
   have the same cause: the schema is the shared budget.
4. **Renderers carry the purpose weight.** Since semantics shift by purpose, the
   complexity has to go somewhere — it goes into rendering and prompting, not
   into the shape.

## Cost to reverse

**Effectively not reversible.** Reversal means four schemas, which is the thing
that did not compile. Any future attempt must first prove the ceiling moved —
with a real compile, not an assumption — and that proof belongs in an
ADR-0001-superseding, not in a commit body.

## Checker rules

- `moduleCheck`: fail on any schema field populated by exactly one purpose across
  the golden fixtures.
- Fixture coverage: each purpose renders a valid plan from the same container
  schema.
- Schema changes require ADR reference in the commit body.

## Agent guidance

**Codex:** do not touch the schema. Ever. Not to add, rename, or reorder.
**CC:** a schema change is a stop-and-report event, same weight as an OPEN.md
gate. If a feature seems to need a new field, the feature is wrong, or a mode
value is missing — say so, don't add the field.
