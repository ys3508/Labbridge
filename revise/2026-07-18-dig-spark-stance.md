# Dig — the spark stance (supersedes Rules 1 & 2)

**Date:** 2026-07-18 · **For:** CC · **Decided with:** Sissi (Jul 18)
**Supersedes:** the dig honesty rules shipped in `886fe43` on `claude/voice-freeze-honesty`
**Parent:** `revise/2026-07-17-drill-grammar-spec.md` §2 (`dig`) — this REPLACES its Rules 1 & 2.
**Scope of THIS job:** the rule reversal + its guards only. Dig UI (Keywords/Full-sentences
toggle, "Say this in English", tap-to-notes, cross-question retrieval) is a LATER job,
gated on the storybank design. Do not build the UI here.

---

## Goal

Reverse a guard we shipped four commits ago. `886fe43` put the old dig Rules 1 & 2 into
`/api/assist`: *"hints range wide, sentences must trace to the user's own material, a hint
never carries its own answer."* Sissi has decided that prohibition is wrong — it blocks the
freeze user it was meant to help. Replace it with a STANCE, not a lock. This is a
deliberate reversal, not an extension. Do not try to reconcile the two; the old rule loses.

---

## Why it's being reversed (the reasoning is the point — record it, don't re-litigate it)

The old rule banned two different things with one hammer:

1. **Invented sentences attributed to the user** — "you cut turnaround 6wk→9d" when they
   never did. This stays banned. It's a lie they can't defend.
2. **Examples offered as inspiration** — "here's how someone might answer 'why this field'
   — does any of this spark something true for you?" Banning THIS is what leaves the freeze
   user staring at a blank screen. This was wrong.

The gate was never supposed to be "no examples." The real line is **provenance at the
moment of banking vs. offering** — and even that is a RECOMMENDATION, not a lock.

Sissi's ruling, verbatim in spirit: *we don't encourage them to copy examples, but if an
example or idea genuinely fits them and they find it useful, it is their RIGHT to use it.
We suggest; we don't enforce.*

This aligns dig with the settled skip philosophy (empty-draft amber state): **skipping is
legal, weak work still happened and belongs to them.** Borrowing is legal too. We don't
block — we tell the truth about the state, and the push tests it.

**Locking the bank would HIDE the cost.** If we forbid banking a borrowed sentence, the
user never learns it was fragile — they never get to meet the push that would have broken
it. The honest design is the opposite: let them borrow, then show them the push, *here, in
practice, not in the room.*

---

## The new rule (this is what goes in the assistant prompt AND the drill spec)

> **Dig offers freely. It recommends provenance. It enforces nothing except the push.**
>
> - Dig may offer anything as a **spark**: examples, other people's answers, suggested
>   motivations, STAR frames with material in slots. These are marked as sparks — *someone
>   else's, offered to prompt yours* — never handed over as "yours to recite."
> - Dig **recommends** the user make what they bank their own, and says why in one plain
>   line: a borrowed answer breaks under a push. This recommendation is visible at the
>   moment of banking, not buried, not a nag, not a block.
> - **Banking is the user's right.** If an example or idea genuinely fits them and they find
>   it useful, they may bank it as-is. We never prevent the borrow; we never hide what it
>   costs.
> - **What protects them is not a lock — it's that the push is real.** A recited answer
>   meets the same follow-up the room would throw, before the room does. The coach notices
>   recitation *at the push*, never by policing what dig offered or what the user banked.

### What stays banned (the one hard line that survives)

**Dig must never write a claim into the user's notes/cheatsheet AS FACT that the user did
not state.** "You reduced turnaround 6wk→9d" written as their history, when they never said
it, is a fabrication they can't defend — that's the lie, and it's different from offering an
example. Suggested motivations are fine AS QUESTIONS the user claims or rejects
("a lot of people making this move are chasing impact over publications — does that ring
true, or is yours different?"); they are NOT fine narrated into notes as the user's stated
motivation.

The test: **who owns the sentence.** An example the user reads, likes, and chooses to keep
is theirs by choice. A motivation dig asserts into their record without them claiming it is
a fabrication. Offer as a spark = always fine. Assert as their fact = never fine.

---

## The two guards this obliges (the safety story — both are load-bearing)

1. **The push cannot go soft for these users.** If borrowing is a right, the push is the
   ONLY thing between a recited answer and a room collapse. The drill spec already says
   full-sentence users need the push *more*, not less — this makes it non-negotiable. **The
   gentle-tone dial must not quietly soften or skip the push for a nervous/borrowing user.**
   Doing so would hand them a fragile answer AND remove the one signal that it's fragile.
   (This reinforces the existing "Do not let the gentle tone dial skip the push" guard —
   now it's protecting borrowed answers specifically.)

2. **The recommendation must be visible, once, plainly.** "Make it yours — here's why"
   surfaced at the moment they're about to bank a borrowed sentence. Same register as the
   Triage honest-expectations plant: tell them what it can and can't do, then let them
   choose. Not a block, not repeated policing.

---

## Affected files

- **`app/api/assist/route.js`** — this is where `886fe43` installed the old rules, scoped
  to interview purpose. Replace the "sentences must trace to the user's own material / a
  hint never carries its own answer" block with the new stance rule above. Keep the one hard
  line (never assert an unclaimed fact into the user's record). The provenance sources wired
  in `886fe43` (resume from `lb_intake_last` + the two diagnostic answers) STAY — they're
  what sparks draw from; they're just no longer a wall.
- **`revise/2026-07-17-drill-grammar-spec.md`** — §2 `dig`, "The two rules that keep dig
  honest." Mark Rules 1 & 2 **SUPERSEDED (Jul 18)** with a one-line pointer to this file,
  and record the new stance + its reasoning inline so the next session doesn't re-litigate.
  Also update the "What CC/Codex must NOT do" list: the line "Do not let the assistant
  produce a sayable sentence in dig that has no provenance" is now WRONG — replace it with
  "Do not let dig assert an unclaimed fact into the user's notes/cheatsheet as their own
  history; sparks are free, asserted-as-theirs fabrications are not."
- **`fixtures/` + `lib/moduleCheck.js` (or the `/api/assist` check, wherever `886fe43`'s
  guard is locked)** — if a fixture or check locks the OLD "sentences must trace" behavior,
  it now tests the wrong thing. Update it to lock the NEW line instead: an assistant reply
  may offer an example spark; it may NOT narrate an unstated fact as the user's history.
  If no such lock exists, add a minimal one so the new stance can't silently regress.
- **`JOURNEY.md` + `TASKS.md`** — tail entry (the reversal, plainly: old rule blocked the
  freeze user, replaced with a stance, push is the real enforcer) + ledger status.

## Explicitly OUT of scope for this job (do not build)

- The Keywords / Full-sentences toggle.
- The per-item "Say this in English" tap.
- Tap-to-notes.
- Cross-question dig retrieval (notes 1..N-1).
- Storybank itself — its format (questions/hints/clicks) and cross-question memory are
  still being designed with Sissi. Nothing here builds a storybank surface.

These are compatible with the new stance and land after the storybank design is settled.

## Verify

- `/api/assist`, interview purpose: the assistant WILL now offer an example answer as a
  spark when asked; it will recommend the user make it theirs; it will NOT assert an
  unstated fact as the user's history. Demo mode (`?mock=1`), zero paid calls for the
  behavior smoke; at most one ~1¢ live `/api/assist` call to confirm the reply shape.
- The updated check/fixture is green and locks the NEW line, not the old one.
- Spec, JOURNEY, TASKS updated in the same commit. Push with the commit.
