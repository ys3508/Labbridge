# ADR-0004 — Mock difficulty: fixed baseline, escalation adaptive with a stop

**Status:** Accepted
**Date:** 2026-07-17
**Gate:** OPEN.md G3
**Decided by:** Sissi
**Related:** ADR-0005 (de-escalation is freeze handling, not this ADR)

## Context

Adaptive difficulty ("they nailed the behavioral, push harder; they froze, stay
and dig gently") is the real coach move. It is costlier per session and must stay
fair. Fixed-from-fields is cheaper and safer but flat.

The original fork treated adaptivity as one thing. It is two, with different
consent stories and different owners:

- **Escalation** — pushing harder when it's going well.
- **De-escalation** — softening when it isn't. This is freeze handling
  (ADR-0005), not a difficulty feature, and it can never be opt-in.

## Decision

**Baseline is fixed** from the four knobs (Round = shape · Format = modality ·
Seniority = difficulty · Challenge = warmth).

**Escalation is adaptive and default-on, with a user stop.** The system pushes
harder when the read supports it; the user can stop the push at any time.

**De-escalation is always on and never optional** — see ADR-0005.

### Forced regardless: the seam

Difficulty resolves through a resolver, never baked into question selection. A
fixed baseline is an implementation of the resolver, not a replacement for it.
Retrofitting adaptivity onto a fixed engine is a rebuild, not an upgrade — so the
seam is not waiting on anything.

## Consequences

1. **The stop is disclosed before escalation starts, not discovered after.**
   Default-on escalation with a stop the user learns about mid-push is not a
   stop; it's an apology. The control is visible from the first hard question.
2. **Using the stop is not a grading event.** Push level is a coaching decision,
   not an input to the read. A user who stops the push must not read worse than
   one who never triggered it. This is the fairness constraint and it survives
   any future change to this ADR.
3. **Escalation never crosses the warmth line.** Challenge sets the tone dial;
   escalation moves difficulty only. A gentle-tone user can be pushed on
   substance and must still be pushed gently. Difficulty and register are
   independent axes — an escalating mock that hardens its tone is a bug.
4. **Seniority still governs.** Escalation from a first-role baseline does not
   arrive at a senior baseline. The knob sets the ceiling; escalation moves
   within it.
5. **Sprint runway does not disable escalation** — the runway fork decides
   volume, never warmth, and never difficulty either.

## Cost to reverse

**With the seam: cheap** in both directions — escalation is a resolver policy.
**Without the seam: rebuild.** That asymmetry is why the seam ships first.

The stop control is *not* cheap to reverse: removing a control users have relied
on is a trust event.

## Checker rules

- No call site reads a difficulty constant directly; all go through the resolver.
- Fixture: escalated session and non-escalated session with identical answers
  produce identical reads.
- Fixture: escalation on a gentle-tone config leaves the register unchanged.
- Fixture: escalation never exceeds the seniority ceiling.
