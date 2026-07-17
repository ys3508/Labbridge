# ADR-0005 — Freeze on mic: wait 10s, silent marks, tone-dialed lifeline

**Status:** Accepted
**Date:** 2026-07-17
**Gate:** OPEN.md G4
**Decided by:** Sissi
**Related:** ADR-0004 (de-escalation lives here), ADR-0002 (marks are part of the
same disclosure)

## Context

Dead air, "um", a false start. For the freeze user this is **the case, not an
edge case** — it is what they named in intake and what the mock exists to
rehearse. Gentle-tone (layoff / freeze) users reach this before anyone else, and
they reach it at their most fragile second.

## Decision

**Wait ~10 seconds** of dead air before anything happens. The wait is the
feature; the mic stays open and nothing interrupts.

**Disfluency is marked silently and shown after.** Pauses, "um", false starts are
recorded for the delivery read and surfaced at the Read stage, where they are
correctable — never rendered live during the answer.

**A lifeline is offered** after the wait: breathe, keep going, don't drop it.

**Freeze enters the delivery read** as signal, shown and correctable like every
other read dimension.

**De-escalation is always on** (from ADR-0004): a freeze softens the mock's push
for the rest of the session. This is not optional and has no user control,
because a user who has frozen is not in a position to operate one.

## The two constraints that shape the mechanism

### 1. Silent-during is not secret

Live disfluency marking has the same shape as the hard timer we already rejected:
it makes the anxious user self-monitor, and self-monitoring is the freeze. So the
marks stay invisible in the moment.

But invisible-in-the-moment must be paired with **disclosed-in-the-contract**.
The save copy says we note pauses and takes (ADR-0002); the Read shows them; the
user can correct them. Silent in the second, open in the deal.

### 2. The lifeline is a static string and the dial must reach it

"Take a breath, keep talking, don't give it up" is an encouraging default fired
at a freeze user at their worst second. That is structurally the **"Boss fight!"
leak** — same string, wrong register — which is the highest untested risk in the
product.

Required: **at least two registers**, dial-selected by Challenge.

- Standard: *"Take a breath — keep going, don't drop it."*
- Gentle: *"No rush. I'm still here."*

The gentle variant carries no verb of effort and no implication of giving up.
"Don't give up" presumes the user is choosing to; a freeze user isn't, and being
told not to is the pressure that keeps them there.

**This lifeline is the reference test case for tone-dial coverage of static
strings.** If the dial reaches this string, the mechanism works.

## Consequences

1. Never punish. The silence is not a grading event the user didn't know they
   were taking — the disclosure is what makes the read fair.
2. The lifeline is offered, not enforced. It does not end the answer, restart the
   question, or advance anything.
3. Freeze is delivery signal, not substance signal. Grade each question against
   its own rubric.
4. A freeze recovered from is coaching material (ADR-0002): "you found it by take
   three."
5. Ten seconds is the shipped default and should be a named constant, not a
   literal. It is the number most likely to be wrong.

## Cost to reverse

**Mechanism: cheap.** Wait length, marks, lifeline copy are all tunable.
**First impression: not reversible.** This fires at the user's most fragile
moment. A cold first encounter is not undone by a later patch, and the users who
hit it first are the ones least likely to return to find out we fixed it.

## Checker rules

- Every lifeline string has a gentle-register variant; **fail the build if any
  static string reachable from a freeze path lacks dial coverage.**
- Fixture: gentle-tone config renders zero effort-verbs on the freeze path.
- Fixture: no disfluency mark is rendered before the Read stage.
- Fixture: freeze contributes to delivery only, never to substance.
