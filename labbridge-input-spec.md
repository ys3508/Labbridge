# LabBridge — Input Screen Spec (build notes)

A build brief for the **input screen only**. Pairs with the main design spec. Written to be handed to a coding step: it says *what each field does and why*, with no code yet. Where an AI step is involved, the guardrails are part of the spec — don't drop them.

---

## Guiding principles (apply to every field)

**Never a wall.** Every field is optional. An empty form still produces a plan — the full path from zero. Fields exist to *sharpen* the plan, never to *gate* entry.

**Empty means beginner — and say so.** If a field (or the whole section) is left blank, assume the user is a beginner there. But the assumption must be **visible and correctable in the plan**, not silent: e.g. *"We're assuming you're starting fresh here — tell us what you already know to trim this."* A silent wrong assumption is the failure mode to avoid.

**Defaults are curated by who our users are, not by alphabetical order.** Alphabetical feels neutral but is random relative to what helps. The first screen is where a non-traditional entrant (nurse, MPH grad, clinician, not just engineers) decides *"is this tool for me?"* — so the first chips must say *"yes, whatever your background."*

---

## 01 — Your background

The whole section is **optional**. Blank ⇒ treat as beginner (see principles).

### Resume paste → live AI analysis

The resume box runs AI analysis **live, as the user pastes** (this is the chosen behavior). Implementation notes: debounce (~800ms after they stop typing/pasting), show a subtle "analyzing…" state, cache the last result so identical text isn't re-analyzed, and make every output **editable** by the user.

The analysis has **two distinct jobs** — keep them separate, because they carry different risk:

**Job 1 — Extract skills as keywords (safe: extract, never invent).**
- Read the resume and pull out skills/experience as keywords.
- **Keep the raw resume text** — don't flatten to tags too early. One line ("built ETL pipelines") should be able to light up *several* skill-graph nodes later; collapsing it to a single tag loses that.
- Store both the extracted keywords *and* the raw text; the mapping of keywords → skill-graph nodes happens later, at matching time.
- **Show the extracted skills back to the user as editable chips.** A wrong read becomes a two-second fix instead of a silent error in their plan.

**Job 2 — Bridge the background + translate hard concepts (the differentiator, and the riskiest part).**
- If the user comes from a very different background, provide a good orienting intro so they can understand the domain better.
- For hard concepts, **translate into the user's own field's language** — a concrete analogy in terms they already know (e.g. "a GWAS is like running a diff across millions of files").
- Guardrails: the **decision** to make an analogy, and **which concept** needs one, stays on the *system's* side — driven by the node's difficulty and the size of the gap between the user's field and this one. Ground the factual half of every analogy in the real material, same discipline as citations. A wrong analogy is confidently misleading, so **this is the part to test hardest.**
- Timing: Job 2 mostly *delivers* inside the plan/onboarding (that's where concepts appear). At input time we just *capture the background* well enough to power it. Input captures; plan translates.

### Fallback — "No resume handy? Fill this in instead"

Behind progressive disclosure, as now. Two fields:

**Field of study or work**
- Keep it a free-type field **with suggestions**. Seed the suggestion pool with the full college-majors list so matches appear as the user types.
- If showing chips *before* they type, show the ones **most relevant to our wedge** — software engineering, statistics, biology, clinical medicine, public health, chemistry, physics — **curated by relevance, not alphabetical.** (Reject "alphabetical, first five": that surfaces Accounting / Aerospace / African Studies — noise, not help.)
- Free-form entry allowed. Every chip **deletable**.

**Skills you already have**
- Default chips must be **plain-language, cross-disciplinary "things people do"** — not "Python / R / SQL," which makes a clinician or MPH grad feel the tool isn't for them.
- Starting set (tune freely): *working with data · reading research papers · statistics · writing code · lab experiments · clinical experience · project management · teaching or explaining.*
- Users add their own, free-form. Every chip **deletable**.
- Technical specifics (which language, which method) should **emerge from the resume or from what the user types**, not be pre-decided by the default list.

---

## What this section captures (data shape)

```
background:
  resume            – raw text (kept, not just parsed)
  extractedSkills[] – keywords from Job 1, user-editable
  field[]           – field(s) of study/work (fallback), deletable
  skillsHave[]      – skills (fallback + user-added), deletable
isBeginner          – derived true when the section yields nothing usable
```

The matching step later maps `extractedSkills` + `skillsHave` + `field` onto skill-graph nodes to compute the entry point. `isBeginner` drives the visible "starting fresh" note in the plan.

---

## Open decisions / cautions to carry into build

- **Live-analysis cost & latency:** it calls the model on paste. Debounce, cache the last analysis, and only re-run on a meaningful change — don't fire on every keystroke.
- **Always show extracted results, always editable.** The user seeing and correcting Job 1's output is what keeps a misread from silently poisoning the plan.
- **Job 2 is the one to stress-test.** Analogies are the magic and the liability; validate them against real material before trusting them in front of a newcomer.
