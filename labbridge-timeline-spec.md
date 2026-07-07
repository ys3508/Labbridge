# LabBridge — "Timeline" Spec (build notes)

A build brief for **section 04** of the input. Pairs with the section-01/02/03 specs and the main design spec. Written to hand to a coding step — behaviors and reasoning, no code yet.

Much of the hard timeline thinking is already settled in the main design spec (store a date not a duration; derive the hours; the effort ÷ time = pace triangle; the tracker with its three levers). This brief covers only what the **input section** does.

---

## The core idea: which vertex of the triangle is the user holding?

The triangle has three quantities — **effort, time, pace** — and effort always comes from the plan, never the user. So the user supplies at most *one* of the other two, and **which one they fix defines the timeline's whole mode:**

- **Deadline-driven** — they have a hard date (interview in 3 weeks, start Monday). They fix **time**; the system derives required **pace**. This is where the date genuinely matters and the tracker earns its keep.
- **Pace-driven** — no deadline, but they know their bandwidth ("maybe 5 hours a week"). They fix **pace**; the system derives the finish **date**.
- **Open / self-paced** — neither. The system shows total **effort**, they go at their own speed, and the tracker stays dormant until they later opt into a target.

**The section's entire job is to find out which vertex they're holding — usually one tap.**

---

## Correction to an earlier rule

The main spec says *"derive the hours, never ask them."* That's right **only for the deadline-driven case.** In the **pace-driven** case, weekly hours *are* the legitimate input, because there's no date to derive pace from. The accurate rule:

> Ask for **a date, OR a rough weekly pace, OR neither** — and derive whatever they didn't give. One of the three, never all three.

---

## Storing the answer

- When there's a date, **store an absolute date** (a duration entered as "X months Y weeks" resolves to and stores a concrete date — a duration is only meaningful relative to when it was entered). Offer both a duration entry and an exact-date picker; both resolve to a stored date.
- When there's a pace, store the weekly hours; derive and display the projected finish date.
- When there's neither, store nothing; show total effort only.

---

## The reality check belongs at input time — and it negotiates against depth

If the user gives a date, **derive the required pace right there** and surface it immediately. If it's brutal ("that'd be ~20 hrs/week"), say so **now**, not three weeks into falling behind.

Offer the three levers at that moment: **push the date · lower the weekly-hours expectation · reduce depth.** That last lever is the **depth dial from section 03** — an impossible deadline isn't a dead end, it's a depth negotiation:

> "You can't go *deep* and finish by Friday — want to aim for *functional* instead?"

This is the honest, useful moment, and it links section 04 to section 03 cleanly. Tone: options, not guilt (same as the tracker).

---

## Shape follows purpose (from section 03)

How heavy this section looks should follow the **purpose** captured in goals:

- **Interview / starting a role** → the date matters — ask or confirm it.
- **Exploring / just curious** → no clock at all; consider **hiding the section entirely.** Showing a hard-deadline field to a tire-kicker signals "serious homework" and scares off exactly the person you want to keep.

Section 03 tells section 04 how heavy to be.

---

## Infer from section 02 — don't cold-ask

A pasted job description often **contains a start date.** If an artifact yielded one, **prefill the deadline and let the user confirm** — don't ask for something they already handed you inside an artifact. Same infer-don't-re-ask contract as the rest of the input.

---

## "No clock" is first-class, not a fallback

Plenty of career-explorers and casual learners genuinely have no deadline. Forcing a date on them manufactures fake pressure and makes the tool feel like a bootcamp. **"I'm not on a clock"** must sit as a comfortable, equal option — not a greyed-out afterthought. When chosen, the tracker stays dormant and can be switched on later if the user adopts a target.

---

## What this section captures (data shape)

```
timeline:
  mode      – 'deadline' | 'pace' | 'open'
  deadline  – stored absolute date (mode = deadline; may be prefilled from section 02)
  weeklyHrs – rough hours/week (mode = pace)
  # effort is NOT stored here — it comes from the plan at matching time

derived (shown at input, recomputed by the tracker later):
  requiredPace  – effort ÷ time      (deadline mode)
  projectedDate – effort ÷ pace      (pace mode)
  feasibility   – flag when required pace is brutal → triggers the depth negotiation
```

---

## Cautions

- **Ask one of {date, pace, neither} — never all three.** Effort is derived, not entered.
- **Reality-check at input, not mid-plan.** A brutal pace should surface the instant the date is set, with the three levers (including reduce-depth) offered right there.
- **Let purpose hide this section.** Curious/exploring users shouldn't see a deadline field at all.
- **Prefill from artifacts; confirm, don't re-ask.**
- **"No clock" is a real, equal choice** — no fake urgency.
