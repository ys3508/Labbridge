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

## Closed

| Gate | Decision | ADR | Date |
|---|---|---|---|
| G1 — Retake storage | Coach it openly; storing is licensed by surfacing | [ADR-0002](decisions/ADR-0002-retake-storage.md) | 2026-07-17 |
| G3 — Mock difficulty | Fixed baseline; escalation default-on with a visible stop; de-escalation always on; resolver seam mandatory | [ADR-0004](decisions/ADR-0004-mock-difficulty.md) | 2026-07-17 |
| G4 — Freeze on mic | Wait 10s; marks silent-then-shown-and-correctable; tone-dialed lifeline; freeze is delivery signal | [ADR-0005](decisions/ADR-0005-freeze-on-mic.md) | 2026-07-17 |
| G5 — Data deletion | Real deletion, per plan, reaching retakes | [ADR-0006](decisions/ADR-0006-data-deletion.md) | 2026-07-17 |

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

### G7 — Pre-diagnostic tone dial

**Status:** OPEN
**Blocks:** the freeze path's register selection at Q1

Challenge (intake, open text) sets the dial. But the freeze path is live during
the **diagnostic**, which is where the dial's input is thinnest — the user has
told us "nerves" in a text box and nothing more. Which register does the lifeline
use before any coaching signal exists? Defaulting to standard means the gentle
user meets the wrong string first, which is precisely the leak ADR-0005 names.
