# ADR-0003 — Running read: flat and regression are first-class states

**Status:** Accepted — **NOT CLOSED** (`PENDING: flat-line copy`)
**Date:** 2026-07-17
**Gate:** OPEN.md G2
**Decided by:** Sissi

## Context

Each stage updates a running read on three dimensions (substance / delivery /
named-challenge). The Walk-in Card is that read, matured. A card that only ever
improves is one nobody believes by the third time.

## Options

- **A. Flat/regression first-class** — the read can not-move or go backwards, and
  the card has real copy for it: "still your soft spot, here's how to manage it
  in the room."
- **B. Progress-only rendering** — cheaper, warmer on day one, corrodes the
  product's claim to honesty.

## Decision

**A.** The running read is a **state with a direction**, not a scalar that goes
up. Valid directions: improved / flat / regressed / insufficient-signal.

`insufficient-signal` is included deliberately: it is what the read must say when
Q2 was skipped or a stage was not reached. Rendering "flat" for "we never looked"
is a small lie that the honest-labels rule already forbids.

## Consequences

1. **Flat is not a failure state.** Its copy is *management advice for the room*,
   not encouragement and not apology. Rung-below-the-floor applies: if flat
   quietly becomes the polite word for "bad", users decode it and the card dies.
2. **Every stage that writes to the read must be able to write "no movement."**
   Silence is not flat.
3. **This is a data-model decision, not a copy decision.** Direction is stored,
   not derived at render time from two numbers.

## Why this ADR is not closed

The gate closes when the flat-line copy **exists**, not when the principle is
asserted. The failure mode here is agreeing with A and then shipping a card that
has no flat-line string, at which point the renderer silently falls back to
progress language and B ships wearing A's ADR.

**Close condition:** flat-line and regression copy written for all three
dimensions, in both tone registers, and covered by a fixture.

## Cost to reverse

**A→B:** cheap but pointless.
**B→A:** expensive and structural — every stage that writes the read must be
reworked. This is precisely why A is decided before the read is built.

## Checker rules

- The read type has no representation that can only increase.
- Fixture: a plan whose delivery never improves renders a flat-line card with
  non-empty management copy in both registers.
- Fixture: a skipped Q2 renders `insufficient-signal`, never `flat`.
