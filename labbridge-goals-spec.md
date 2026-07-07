# LabBridge — "Your goals" Spec (build notes)

A build brief for **section 03** of the input. Pairs with the section-01 (background) and section-02 (where you're headed) specs. Written to hand to a coding step — behaviors and reasoning, no code yet.

---

## The problem this section fixes

The original single question — *"What does success look like here?"* with chips *Get oriented quickly · Become productive fast · Build deep expertise · Prepare for interview/project · Explore if this fits me* — is broken, because those five chips **answer different questions under one label:**

- "Build deep expertise" answers *how far do you want to go.*
- "Prepare for interview" answers *why are you doing this.*
- "Explore if this fits me" is barely a goal at all — it's a different *mode* of the product.

Mixing them means a user taps two that both seem right and the system can't tell what they meant, because they answered two different questions with one tap. The fix is to **split the one muddled question into the distinct axes it's secretly asking.**

---

## Axis 1 — Depth (single-select; reshapes plan *content*)

**"Where do you want to land?"** This is the axis that actually changes the plan's substance — how far up each prerequisite chain the traversal climbs.

- *Understand the landscape* — stops one rung up; orientation, not mastery.
- *Get hands-on and functional* — climbs to working competence.
- *Go deep and specialize* — climbs to the top of the relevant chains.

**Single-select, on purpose.** Depth is a *scale* — you sit at one point on it. "Just oriented" and "deep expertise" are contradictory, so allowing both is exactly the incoherence to eliminate. One tap, one point on the ladder.

This directly sets **how many rungs the traversal produces per chain**, so it is not cosmetic — it's a real input to matching. (And it stays a live dial afterward — see "Connection to collapse" below.)

---

## Axis 2 — Purpose (single-select; reshapes plan *emphasis*)

**"What's driving this?"** Orthogonal to depth: it doesn't change *how far* you go, it changes what the plan *optimizes for*. The same depth can serve any of these with different emphasis:

- *Starting a role soon* — favors the first real task and just-in-time depth.
- *Prepping for an interview* — favors breadth, talking points, likely-to-be-asked concepts.
- *Exploring a career move* — favors durable foundations.
- *Just curious* — favors a fast, low-commitment taste.

Lean **single-select** (a plan optimized for two masters usually serves neither), though this axis is less strictly contradictory than depth, so multi-select wouldn't be *wrong* — single is just cleaner.

---

## Why splitting captures MORE, not less

"Build deep expertise" was a depth answer and "prepare for interview" was a purpose answer — they were fighting for the same slot. Split into two questions, each becomes clean and non-overlapping, and the **combination is far more expressive**: *"oriented + interview prep"* and *"deep + career pivot"* are genuinely different plans, and the user can now state either precisely. **Two small questions capture more intent than five muddled chips.**

---

## "Explore if this fits me" — pull it out

This isn't a goal, it's a **different mode of the product.** A tire-kicker wants a low-effort taste — what the field is, what the day-to-day feels like, whether they'd enjoy it — *not* a rigorous prerequisite climb. Left as one chip among goals, it produces a plan that treats an explorer like a committed learner, and it feels wrong to both.

Two acceptable handlings:
- **Best:** treat "am I even sure about this?" as its own lighter, shorter branch of the product.
- **Minimum:** recognize it simply *maps to* shallowest depth + "just curious" purpose, and let those two axes represent it — rather than a standalone chip that contradicts the others.

Either way, remove it from the goal chips.

---

## Don't over-correct: two taps, not a quiz

This is a goals screen — protect the low friction. Do **not** turn one muddled question into a five-question survey. **Two single-selects (depth, purpose) is the sweet spot.** Phrase both in plain **outcomes, not jargon**, answerable by someone who's never heard of the field:

- Depth — *"Where do you want to land?"* → understand the landscape · get hands-on and functional · go deep and specialize.
- Purpose — *"What's driving this?"* → starting a role soon · prepping for an interview · exploring a career move · just curious.

---

## Infer from section 02 — don't re-ask

Some of this is **already implied by the artifacts** in section 02. Someone who pasted a job description with a start date has effectively told you the purpose (*starting a role*) and the timeline. So:

- If section 02 already yielded a role and a deadline, **infer the defaults and let the user adjust** rather than asking cold.
- The goals screen then becomes a **light confirmation** — *"Looks like you're prepping to start a role in ~6 weeks — right?"* — not a fresh question. More accurate, less work.
- Only ask what you genuinely can't infer.

---

## Connection to the collapse mechanic

Depth set here is **the same depth the collapse/adjust feature tunes later.** The depth answer sets how far the traversal initially climbs each chain; the user can then adjust per-topic — go deep on the one thing that matters, stay shallow elsewhere. So depth is a **live dial**, not a one-time pick. Keep it adjustable in the plan, seeded by this screen's answer.

---

## What this section captures (data shape)

```
goals:
  depth    – single-select: 'landscape' | 'functional' | 'deep'
             → sets how many rungs the traversal climbs per chain
  purpose  – single-select: 'starting_role' | 'interview' | 'career_move' | 'curious'
             → sets what the plan optimizes for (emphasis)
  mode     – derived: 'explore' when depth = landscape + purpose = curious
             → may route to the lighter exploration branch

pre-fill:
  depth/purpose seeded from section-02 inference (role, deadline, artifact types)
  where available; the screen confirms rather than cold-asks.
```

---

## Cautions

- **Depth = single-select** — allowing "oriented" + "deep" together reintroduces the exact incoherence this section removes.
- **Two questions max** — resist adding a third axis; friction on a goals screen is expensive.
- **Confirm, don't re-ask** — if section 02 already told you, pre-fill and let the user correct.
- **Outcomes, not jargon** — every option must be legible to someone brand new to the field.
