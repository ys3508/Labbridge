# LabBridge — "Where you're headed" Spec (build notes)

A build brief for **section 02** of the input. Pairs with the section-01 (background) spec and follows the same philosophy: **the user supplies raw material, the AI does the interpreting.** Written to hand to a coding step — behaviors and guardrails, no code yet.

---

## Guiding principle (carried from section 01)

**Beginners can't name the skills they need — so don't ask them to.** Asking a newcomer to list target skills is asking the wrong person the wrong question. Instead, let them hand over artifacts (a job posting, a repo, a company page, a pipeline doc, or a plain-language description) and let AI extract the target.

**The contract is the same everywhere on the input:** *extract → show → let them edit.* Resume skills (01), artifact classification, and artifact weighting all use this one pattern. Keep it consistent — one promise to the user ("we'll interpret, you get to correct"), not three different behaviors.

---

## The unified artifact list

**One list, not three box types.** Don't build separate link boxes, upload boxes, and paste boxes — that forces the user's first decision to be "which kind of box does this go in?", which is a tax with no payoff, because the system doesn't care about the container.

- A single **"add material"** list. Each item can be a **link, a file, or pasted text**, and the app **auto-detects which** (reuse the URL-vs-text detection already built in the examples field; files come in via upload).
- **One item shown to start.** A "+" adds more; each item is **numbered**; add and delete freely.
- An artifact can be: a job description, an example of work to mimic (repo/demo), a company or lab page or name, a pipeline or research description, or a plain-language description of what they want to learn.

**On the counts (the earlier 5 / 10 / 10 idea):** these are not limits the user should ever see. Start with one, add as many as needed, delete any. Cap silently *only* if you must protect the later AI call — never surface a "you've hit the max."

---

## Classify-and-confirm (AI labels each artifact)

Don't make the user tell you what each artifact is — the system can usually tell.

- On add, the system **classifies each item's type** (repo, job posting, company page, paper, pipeline, or free description), **shows its guess**, and lets the user **correct with a tap.**
- Extract-then-edit again: it proposes, the user confirms; a wrong guess is a two-second fix. Beginners don't have to know what they uploaded.
- This classification is what powers weighting (below) — so it's not cosmetic, it's load-bearing.

---

## Keep one optional "target role" field

A role title is the **single highest-signal, lowest-effort input** on the screen — someone who knows it types it in two seconds and it anchors everything. Offer an optional **role** box. Not required (artifacts can imply it), just offered for the user who already knows.

---

## Drop "skills you want to learn"

Remove the skills-to-learn tag input. It's **absorbed by the instruction box** — "I want to get comfortable with GWAS" said in plain words is more natural for a beginner than a tag picker whose vocabulary they don't yet have. Fewer fields, more beginner-friendly, no loss of signal.

---

## The instruction box (natural-language steering)

A free-text box at the end. Once artifacts are auto-classified, this box stops needing to carry structural labels (though it still can) and becomes the layer nothing else can hold:

- **Intent and emphasis:** "I care most about the imaging part," "ignore the second repo, it's outdated," "c is the role but I'm really targeting the ML side."
- **What they want to learn,** in plain language (this is where the old skills-to-learn field goes).
- Optional structural notes if they want them: "a and b are company links, c is the role."

This is the steering layer — plain language in, weight adjustments out (see below).

---

## Weighting: how the system reads a pile

The heart of section 02. When someone dumps several artifacts, the system must **weight them, not average them.** Weight comes from **three sources, in priority order, earlier overriding later** — which puts the user in control *only where they choose to be* and lets the system do the rest.

**Layer 1 — Type-based default weights (automatic, invisible).**
The moment an artifact is classified, it inherits a default weight from its type, because types differ in what they tell you:

- Job description / role title → *the target itself* → **highest**.
- Example repo / work to mimic → **high**, but a *shape* signal (what "productive" looks like), not a *scope* signal.
- Pipeline / research description → **medium-high**, strong domain signal.
- Company / lab page → **low**, context (colors startup vs. academic lab, doesn't define the destination).

Zero user effort; this gets ~80% of the way. It's just a type → weight table.

**Layer 2 — Instruction-box overrides (explicit, plain language).**
Natural-language intent beats any structural default. The system reads "care most about X / ignore Y / really targeting Z" as **weight adjustments** — boost, mute, re-aim. The user never sees the word "weight"; they just say what they mean and the dials move. This is the layer that turns a pile into a *pointed* pile.

**Layer 3 — AI inference fills the rest (proposed, correctable, held loosely).**
Where the user hasn't spoken, the AI weights on **content evidence** — a job posting that's 80% wet-lab and 20% computational should tilt the plan wet-heavy. Softest layer; it proposes, it doesn't decide.

---

## Make weighting visible and correctable — exactly once

This is where *accurate* and *user-friendly* reconcile. The two failure modes:

- **Silent weighting** (accuracy fails): the AI averages the pile, gets it subtly wrong, the user never knows why the plan feels off.
- **Over-asking** (friendliness fails): making the user rate every artifact turns the low-effort dump back into a chore.

The resolution is a **single lightweight "here's how we read your materials" summary,** shown after generate, before the full plan:

> "We're treating the **job posting** as your main target, the **repo** as an example to match, and the **company page** as context. Focused mostly on **computational genomics**."

One glance. If it's right, the user does nothing. If it's wrong, they fix it in a tap or a sentence. **Do not** ask per-artifact, and **do not** weight silently — this one editable screen is the whole answer.

---

## Two refinements

**Separate "what to learn" from "how much it matters."** Weight should aim *direction*, not just scale volume. A heavily-weighted imaging job description shouldn't merely mean "more imaging resources" — it should change *which nodes are targets at all*. Keep two distinct effects in mind: some artifacts move the **destination** (targets), others tune **emphasis** among already-chosen nodes. Conflating them makes weighting feel blunt.

**When artifacts conflict, surface it — don't silently average.** If the job description points wet-lab and the example repo is pure computational, don't blend them into a vague middle. Notice the tension and ask **one** question: *"Your target role leans wet-lab but your example is computational — which should the plan follow?"* Conflicts are rare enough that asking is cheap, and a conflict caught is a plan saved.

---

## Honesty valve (ambiguous piles)

No weighting scheme rescues a genuinely ambiguous pile. If someone dumps five loosely-related things with no instructions, don't fake confidence — say what you did and invite correction: *"We built this around the job posting since it was the clearest target — add a note if we aimed wrong."* Visibly approximate and correctable beats confidently muddy.

---

## What this section captures (data shape)

```
target:
  role          – optional title; highest-signal anchor
  artifacts[]   – each: { id (number), source: link | file | text,
                          raw, type (classified, user-editable),
                          weight (derived from type + instructions + inference) }
  instructions  – free text; natural-language steering; also carries "what I want to learn"

derived at matching time:
  targetNodes[] – the destination (direction), from high-weight artifacts + role + instructions
  emphasis      – tuning among already-chosen nodes
  conflictFlag  – set when strong artifacts disagree → triggers the one clarifying question
```

Note: the old "skills you want to learn" tag input is removed; that intent now lives in `instructions`.

---

## Build sequencing & cautions

- **Links + paste first** — nearly free to support. **Uploads are the heaviest thing on this screen** (storage plus parsing: PDF, Word, possibly scanned docs), so treat them as a fast-follow. The screen works fully without uploads on day one.
- **Classification and weighting can start rule-based** (type table + keyword matching) and get smarter with AI later. The *"here's how we read it"* summary is the piece that makes it trustworthy from day one — build that early.
- **Auto-classification and the instruction box are not polish** — they are what make a pile *interpretable* instead of a blur. Without them, the system can only average.
- **Weighting must be shown once and correctable** — never silent, never a per-artifact interrogation.
