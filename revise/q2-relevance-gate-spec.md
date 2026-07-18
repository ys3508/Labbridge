# Q2-relevance live gate — validation protocol (still open)

**Status:** OPEN — the diagnostic is not "shipped" until this passes. Salvaged from
`codex/voice-input-honesty`'s spec `2026-07-17-voice-honesty-and-q2-gate.md` before that
branch was deleted (its Task 1 — typed-pacing honesty + freeze-on-mic — was superseded by
the recorder-aware version now on `main`; see `revise/voice-input-honesty-spec.md`). This
file preserves the part that was NOT superseded: the live validation gate.

**Owner:** Sissi (live run, ~5 Haiku intake calls, ~1–2¢ each). Not a code task.

---

## Goal

Confirm the diagnostic's second question (Q2) is genuinely posting-derived with an accurate
receipt. A weak diagnostic before the paid moment teaches the user we don't listen right
before we ask them to spend — so this gate stands between the diagnostic and calling it
shipped.

## Pass criteria (per run)

1. **Q2's substance traces to a real line in the JD provided** — not to the role title, not
   to generic field knowledge.
2. **The quoted JD receipt is verbatim** from the posting. Paraphrase wearing quotation
   marks is a fail — verify-and-drop, applied to receipts.
3. **Q2 is answerable-but-stretching** for the stated seniority. Not a gotcha, not a freebie.
4. **Permission-to-miss framing is present** and reads as permission, not as a warning.

## Vary the five inputs

- one thin JD
- one dense JD
- one JD whose title disagrees with its body
- one first-role seniority
- one senior

## Record

Each run in `revise/validation-notes.md` as run #N, with the actual Q2 and its receipt
pasted **verbatim**, pass or fail. A fail is data.

---

## Why it was gated (context, still true)

Session B (mock runner) stays HELD while this is open — building paid validation on top of
an ungated diagnostic compounds error. The parent reasoning: "a weak diagnostic before the
paid moment teaches the user we don't listen right before we ask them to spend."
