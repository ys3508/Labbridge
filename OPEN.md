# OPEN.md — undecided gates

These are **stop-conditions**, not a backlog.

If your work reaches an OPEN gate, **stop and report**. Do not pick a side
because one side is easier to build, because a default is implied by the
surrounding code, or because the fork looks small at 11pm. A gate is open until
this file says CLOSED and an ADR exists in `decisions/`.

Reporting means: name the gate, say what you would have had to assume, stop.

**Who decides:** Sissi. Claude chat facilitates and writes the ADR. CC and Codex
do not close gates.

**Closing ritual.** ADR in `decisions/` (context / options / choice / cost
to reverse) → CLOSED here with link + date → `JOURNEY.md` entry → **if it can be
asserted, a rule in `lib/moduleCheck.js`.** A gate that closes into prose gets
re-litigated. A gate that closes into a test doesn't.

---

## Open

### G2 — Running-read flat-line rendering

**Status:** DECIDED, **NOT CLOSED** → [ADR-0003](decisions/ADR-0003-running-read-flat-line.md)
**Blocked on:** the copy existing
**Blocks:** the Walk-in Card renderer (not the read's data model — that's decided)

Flat / regressed / insufficient-signal are first-class states. Decided. But the
gate closes when the flat-line copy is **written**, not asserted — because the
live failure is agreeing with honesty, shipping a card with no flat-line string,
and letting the renderer fall back to progress language. That ships
progress-only wearing an honesty ADR.

**Close condition:** flat-line + regression copy for all three dimensions, both
tone registers, fixture-covered.

---

### Storybank re-offer on re-seeding
§5's tombstone behavior (delete silently, re-offer when near-identical material reappears
in a later transcript) was written for the transcript path. Replacing a resume is a
non-transcript feed that also re-extracts. Does the re-offer path cover seeding, or do
removed claims silently return on the first resume update? Behavior, not schema —
does not block the storybank build.

---

## Closed

| Gate | Decision | ADR | Date |
|---|---|---|---|
| G1 — Retake storage | Coach it openly; storing is licensed by surfacing | [ADR-0002](decisions/ADR-0002-retake-storage.md) | 2026-07-17 |
| G3 — Mock difficulty | Fixed baseline; escalation default-on with a visible stop; de-escalation always on; resolver seam mandatory | [ADR-0004](decisions/ADR-0004-mock-difficulty.md) | 2026-07-17 |
| G4 — Freeze on mic | Wait 10s; marks silent-then-shown-and-correctable; tone-dialed lifeline; freeze is delivery signal | [ADR-0005](decisions/ADR-0005-freeze-on-mic.md) | 2026-07-17 |
| G5 — Data deletion | Real deletion, per plan, reaching retakes | [ADR-0006](decisions/ADR-0006-data-deletion.md) | 2026-07-17 |
| G7 — Q1 tone default | Neutral; tone dials on evidence, not arrival | [ADR-0007](decisions/ADR-0007-q1-tone-default.md) | 2026-07-18 |

---

## Debts these decisions created

Not gates — these are decided work that must land or a shipped ADR becomes false.

1. **Trust copy rewrite** — must say takes (plural), pause marks, and deletion,
   alongside the unchanged no-audio promise. ADR-0002 + 0005 + 0006 all depend on
   one paragraph that doesn't exist yet.
2. **Tone-dial coverage for static strings** — the lifeline (ADR-0005) is the
   reference test case. This was the highest untested risk before these
   decisions; three of them now sit on top of it.
3. **The resolver seam** (ADR-0004) — ships before any mock question selection.
4. **Delete-path build rule** (ADR-0006) — every writer needs a deleter, enforced
   in CI, or A quietly decays to B.

---

## New gates opened by these decisions

### G6 — Escalation trigger threshold

**Status:** OPEN
**Blocks:** escalation policy in the resolver (not the seam)

ADR-0004 says the system escalates "when the read supports it." What read state
justifies a push is undecided. Getting it wrong pushes a struggling user, which
is the failure ADR-0005 exists to prevent — the two mechanisms meet here and
nothing currently arbitrates.

*(G7 — Pre-diagnostic tone dial — CLOSED 2026-07-18 as neutral; see the Closed
table above and [ADR-0007](decisions/ADR-0007-q1-tone-default.md). Rule: tone dials
on evidence, not on arrival.)*

### Q2 derivation — posting-only vs. collision (gap-targeted)

**Status:** OPEN
**Blocks:** Q2 derivation policy and likely the Question Map receipt/gap policy

Live gate run 2 (dense JD, 2026-07-18): Q2 was correctly posting-derived and landed on
the one posting demand the resume already covers — three-statement operating modeling,
which the user has done at unit level on a 115-unit franchisee. Freebie; criterion 3
failed. The buried quality-of-earnings / working-capital-peg line, which the resume does
not cover, went untouched.

Posting-only derivation cannot reliably satisfy "answerable-but-stretching" because it
has no way to know which posting demands the user already owns. Run 3 passed criterion 3
only because that posting body happened to have no overlap with the history — luck, not
design.

Fork: does Q2 derivation get resume-awareness in the **gap** direction — posting-anchored
receipt, gap-targeted question ("the posting has the associate owning QoE end to end;
your resume shows modeling and IC materials but no QoE — walk me through how you'd run
one")? Distinct from run 1's failure, where the resume was used *instead of* the posting
and mislabeled as it. Same question likely applies to the question map.

### G8 — Map receipt failure posture

**Status:** OPEN *(opened by the receipt-attribution work, 2026-07-18)*
**Blocks:** the map build's first hour: fallback labeling in the map surface

When a map question's receipt (`why`) fails the attribution check — the quoted line
does not appear in the source it names — fallback is chosen over silent drop.

Why: drop kept the posting-derivation promise only vacuously — fewer questions, all
traced — while making thin-JD failures invisible. That is the wrong honesty posture for
the map: a user sees a smaller map, not a surfaced loss.

Three sub-items remain open:

1. **Fallback label in the map surface** — an unlabeled fallback looks traced and is not.
   This blocks the map build's first hour.
2. **Fallback-rate ceiling** — above what rate does the honest answer move to the map
   level instead of per-question? Deferred until live map runs show the distribution.
3. **Fallback content source** — generic-for-the-role or generic-anchored-to-what-little
   the posting had? The second may feel better but risks reintroducing misattribution.

### G9 — Map gate as a separate validation instrument

**Status:** OPEN *(opened by the receipt-attribution work, 2026-07-18)*
**Blocks:** declaring the **question map** validated / shipped
**Blocks nothing today:** passing the Q2 gate says nothing about the map

The Q2-relevance gate (`revise/q2-relevance-gate-spec.md`) validates the
diagnostic's **single** Q2. The receipt guards are not shared between the intake/Q2 path
and the map path, so a Q2 gate pass carries no information about the map. The map runs
receipt attribution at ~10× surface area with different failure shapes: per-question
attribution, a receipt-density floor, section/tag correctness, and the fallback-label /
fallback-rate questions G8 leaves open. A green Q2 gate certifies none of that.

**Close condition:** the map has its **own** instrument — its own fixture runs, its
own pass criteria (attribution correct per question; no résumé line attributed to
the posting; a receipt-density floor), and its own held-until list — before the map
is called "shipped." Until then the map is built-but-unvalidated.
