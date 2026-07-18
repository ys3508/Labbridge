# ADR-0007 — Q1 tone default: neutral (tone dials on evidence, not arrival)

**Status:** Accepted
**Date:** 2026-07-18
**Gate:** OPEN.md G7
**Decided by:** Sissi
**Related:** ADR-0004 (opened G7), ADR-0005 (the freeze lifeline whose register this selects)

## Context

The tone dial reaches the freeze lifeline (ADR-0005) via the intake-extracted
`tone`. But Q1 is the cold opener: the user has told us "nerves" in a text box and
nothing more, and the lifeline can fire at their most fragile second before any
coaching signal exists. G7 asked which register the lifeline uses at Q1 when the
signal is thinnest.

## Options

- **A. Neutral.** The no-signal register is neutral; gentle is reserved for
  moments where the intake text actually carried vulnerability.
- **B. Gentle default.** Open warm, on the theory that the fragile user should
  always meet warmth first.

## Decision

**A — neutral.** Recorded not as a fallback chosen for lack of signal, but as a
rule that generalizes:

**Tone dials on evidence, not on arrival.**

A warm register at Q1 is warmth unearned by anything that happened — it reads as
product voice, not care. The moments that legitimately dial tone are moments where
something occurred: the freeze lifeline, a rough answer, a delete confirmation.
Arrival is not one of them. Neutral at Q1 is *correct*, not a default.

Note this is not "always neutral until the diagnostic": the intake router already
extracts `gentle` from a challenge that carries real vulnerability (layoff pain,
visa, distress) — that IS evidence, and it dials. The rule governs only the
**no-signal** case: absent such evidence, the register is neutral.

## Consequences

1. The intake router's no-signal fallback `tone` is `neutral`, and stays there.
   Gentle is earned by extracted vulnerability, never granted on arrival.
2. `playful` is likewise evidence-gated (an intake that reads as energizing), never
   a default.
3. This rule is the general form behind ADR-0005's lifeline registers: the gentle
   string exists for when evidence justifies it, not as the opener.

## Cost to reverse

**Cheap.** It is a default register selection — one value in the intake fallback
plus the dial-selection branch. But reversing *toward* an unearned-warm default
reintroduces exactly the "product voice mistaken for care" leak this closes.

## Checker rules

- The intake router's no-signal fallback `tone` is `neutral` (asserted zero-API in
  `check-fixtures.mjs`; a change to `gentle`/`playful` fails the build).
- The freeze lifeline keeps both registers (already locked, ADR-0005): neutral is
  the default branch, gentle the evidence-gated one.
