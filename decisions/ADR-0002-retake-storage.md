# ADR-0002 — Retake storage: coach it openly

**Status:** Accepted
**Date:** 2026-07-17
**Gate:** OPEN.md G1
**Decided by:** Sissi
**Related:** ADR-0006 (deletion — must reach retakes), ADR-0005 (freeze marks are
part of the same disclosure)

## Context

Re-recording in the diagnostic is coached, not silent ("want to try that
again?"). Earlier takes carry real delivery signal: how many attempts, where the
freeze sat, whether the second take found it. Keeping them silently is
surveillance the user never agreed to — against the product's core contract
("we interpret; you correct").

## Options

- **A. Coach it openly** — store earlier takes and use them out loud.
- **B. Don't store** — last take only; signal lost, promise trivially kept.

## Decision

**A.** Earlier takes are stored *and surfaced as coaching*: "you found it by take
three — let's land it first next time."

The storing is licensed by the surfacing. Retakes exist in the save list because
they are said back to the user, not because they are useful to us.

## Consequences

1. **The trust copy changes.** Current: "We save your confirmed transcript and
   coaching signals for this plan. We do not store audio." It now keeps takes,
   plural, and must say so. The no-audio promise is unchanged and still true —
   confirmed transcripts of each take, never audio.
2. **Retakes are coach-visible by construction.** If a stored take is never
   eligible to be spoken back, it should not be stored. There is no silent
   middle: "we keep them but never mention them" is this option with the honesty
   removed, and is out of contract.
3. **Retake count enters the delivery read**, and like every read dimension it is
   shown and correctable.
4. **Deletion must reach retakes** (ADR-0006). A delete that leaves takes behind
   makes two shipped surfaces contradict each other.
5. **Tone dial reaches the retake copy.** "You found it by take three" is a
   static string. Fired at a freeze/layoff user it can read as a tally. It needs
   a gentle register and the dial must reach it.

## Cost to reverse

**A→B: cheap** — stop writing, delete existing.
**B→A: expensive** — would require walking back shipped trust copy, which is the
exact failure this product exists against. Reversing *toward* honesty is cheap;
away from it is not really available.

## Checker rules

- `moduleCheck`: no take is persisted without a coach-surface path that can
  reference it.
- Trust copy fixture asserts the takes-plural disclosure and the no-audio line
  co-occur.
- Retake copy has a gentle-tone variant; assert dial coverage (see ADR-0005).
