# Question Map — build prompt

**Date:** 2026-07-17 · **For:** CC (or Codex) · **Status:** buildable except §7, which is BLOCKED

---

## Goal

Build the **Question Map** — build-sequence item #4 of `revise/interview-mode-spec.md`
("Question Map render: receipts, coverage meter, named-not-dreaded gap stop").

This document does not replace that spec. It is item #4's detail, plus one repair to a
routing rule that item #5 (the mock runner / Session B) also depends on.

**Read `revise/interview-mode-spec.md` first. It is the parent. Where this document is
silent, that spec governs.**

The Question Map is the list of questions this specific interview will likely ask, in the
interviewer's voice. It converts "I don't know what they'll ask" into a finite, visible
list. It is also the container: the drills drill *these* questions; the mock asks *these*
questions.

---

## What this document changes in the parent spec

**One replacement, one repair. Everything else in the parent stands unchanged.**

### 1. REPLACES the Question Map grouping (parent §3)

Parent spec grouped questions as: `concept drills · behavioral · your story · THE GAP
QUESTION · questions-you-ask-them`.

**Replaced by a taxonomy of what the question PROBES:**

| section | probes |
|---|---|
| `fit` | why you, why us, why now |
| `track_record` | what they've actually done — behavioral lives here |
| `capability` | can they do the job — JD-derived |
| `judgment` | what they'd do with an ambiguous call |

**Why:** the old grouping mixes question-kind, topic, and one specific question. The new
one is universal — no round can ask outside these four. A one-round interview asks all
four. A VP asks fit + judgment heavily. An engineer asks capability. Nothing "belongs to a
later round," so nothing can be asked early and make us look wrong. It also avoids fixed
containers the model pads to fill (the "always 5 tasks" disease).

**Two things survive the replacement and must be preserved:**
- **THE GAP QUESTION** is not a section — it is a **tag** (see §4). Parent's
  "named, not dreaded" rule and its dedicated-stop behavior are unchanged.
- **Questions-you-ask-them** is not a section — it is not a probe, it is an output. It
  stays exactly as the parent specs it (reuses the `askYourTeam` generator, per-interviewer
  where interviewer background was pasted). Render it as its own block after the map, not
  as a fifth section.

**Judgment is the section most products skip and it is where senior candidates are won or
lost. If the mix trims to three, judgment stays.**

#### `section` REPLACES `archetype` for interview purpose — they do not coexist

The live prompt (`route.js:32`) already reinterprets `archetype` for interview purpose as a
question-kind taxonomy: `concept | behavioral | story | gap_defense | ask_them`.

**Do not run both. Do not derive one from the other.** Two taxonomies on one unit is the
bug, not a relationship to define — the model will be inconsistent across generations and
the "no padding" checker rule becomes unwritable.

- **Interview purpose: `archetype` is retired. `section` is the taxonomy.**
- **The other three purposes keep `archetype` unchanged** (`learn_and_do` / `critique` /
  `shadow_reproduce` / `plot_twist`). Those are task SHAPES — a different thing entirely,
  and they stay exactly as they are.

Because they never coexist, no relationship needs stating. `section` is reasoned
independently from the mix; a zero-weight section renders nothing. That makes the checker
rule writable.

#### Retire `ask_them` in the same edit

`interview-mode-spec.md:69` already decided questions-you-ask-them reuses the `askYourTeam`
generator — but the live prompt still lists `ask_them` as an interview archetype, the
mechanism that decision replaced. Nobody dropped it.

It falls out of the archetype retirement anyway. Kill it while the prompt block is open;
do not leave two mechanisms live.

### 2. REPAIRS the round→shape rule — AND the round chip set itself

Current rule: round picks the mock's shape (recruiter = X, hiring manager = Y).

**This is wrong and produces a visible failure:** if round one is a VP, or the industry
has one round total, a round-keyed lookup assigns questions to the wrong round and the
product looks broken.

`round` is jamming three independent things into one field. The live chip set
(`InterviewDoor.js:17`) proves it:

`["Recruiter screen", "Hiring manager", "Technical", "Case / exercise", "Final panel", "Not sure yet"]`

That is WHO (recruiter, hiring manager) mixed with WHAT-KIND (technical, case) mixed with
WHICH-STEP (final panel). There is no breadth axis in there to stand on.

**Do not paper a label→breadth/depth mapping table over this. The chip set is the bug.
Split it into the three signals it is actually carrying.**

**This is an explicit build step. It does not fall out of the prompt/schema repair.**

#### The new intake chips

| field | chips | sets |
|---|---|---|
| `round` | `First round` · `Middle` · `Final` · `Not sure` | **breadth vs depth.** First = shallow across all four sections. Final = deep in two. Now it genuinely is a step axis. |
| `interviewer_kind` **(new chip)** | `Recruiter` · `Hiring manager` · `Engineer / peer` · `Exec` · `Panel` · `Not sure` | **shape.** The cheap floor — one tap. |
| `format` | unchanged | modality |

**`Technical` and `Case / exercise` are CUT.** They describe content flavor, and content now
derives from `interviewer_kind` + `interviewers` + the JD. Keeping them means two mechanisms
deciding the same thing — the exact disease this repair exists to cure.

#### Shape comes from WHO, at two fidelities

This is the parent spec's own graceful-degradation ladder (§"interviewer layer" rule 4),
now with a floor under it:

- **nothing** → generic round persona
- **`interviewer_kind` chip** → light calibration (the floor; always available, one tap)
- **`interviewers` rows pasted** (name/title/about) → full calibration

`interviewers` rows are heavyweight and optional. The chip is what makes shape work for
every user, not just the diligent ones.

"VP in round one" is `first × exec`. Legal, not a contradiction — which was the whole point.

This is MORE personalized than the rule it replaces, not less.

**Session B note:** the mock runner is parameterized by the four knobs. This repair changes
that parameterization. Do not build the runner against the old rule.

---

## The knobs set the MIX, not the sections

Sections are stable and recognizable. Content and proportions change per person. A section
whose weight is zero does not render — because the mix said zero, not because a table said
so.

| knob | sets |
|---|---|
| `interviewers` | **weights.** VP → judgment-heavy. Engineer → capability-heavy. Recruiter → fit. |
| `round` | **breadth vs depth.** |
| `seniority` | **difficulty within each section.** Junior → track_record-lite. Senior → judgment-heavy (juniors have no judgment to probe yet — that is real, not a rule). Senior gets no "tell me about yourself" at full weight. |
| `format` | modality (unchanged from parent) |
| `challenge` | warmth + its own dedicated block (unchanged from parent's tone dial + dedicated units) |

### Per-question interviewer attribution — kept, scoped to panels

The parent spec's "interviewer lens — questions tagged by who'd ask" is NOT dropped. It is
scoped:

- **Aggregate section-weighting is the mechanism in all cases.**
- **Per-question attribution renders only when there is more than one interviewer.**

One person asks everything; attributing each question to them is noise. A panel is three
question styles, and knowing which is which IS the prep — that is the parent's actual
point. Attribution is a render-time detail for rooms with more than one seat.

---

## 3. Ordering — worry-driven by default, two orders, user-owned

**Generate slightly ABOVE the timeline's budget and let skip absorb the excess.** Everyone
wants more prep; the user holds the volume knob rather than us guessing. This also makes
skip useful rather than an escape hatch.

- **Default view = worry order** — what to prepare first. Prep is the job.
- **Toggle = interview order** — what the room actually feels like. Same questions, same
  tags, one tap. Seeing the room's shape is itself rehearsal value; worry order destroys
  that ordering, so both exist rather than fighting over one axis.
- Sections group. Worry sets priority within and across.

**Hard rule: never SILENTLY re-sort** as the running read updates. Re-sorting is legal;
doing it without saying so and why is the Triage hole (a confident call the user never got
to correct).

**Timeline sets volume, never warmth.** Short runway → the excess is deferred BY NAME via
the existing `trims[]` pattern (deferred, never dropped, never hidden). The freeze user's
road is short, not brisk. Do not dim deferred items into a "not for you" register — name
the short road and mark what is in it.

---

## 4. Tags — three, and only three

- `start_here` — the Triage's call. **Exactly one per map.** Renders as a marker on the
  list, never as a re-sort. Carries the Triage's correction link.
- `you_named_this` — from the challenge field, quoted in their words.
- `blind_spot` — the diagnostic reads weak, they did not flag it. This is the one thing
  nobody else tells them.

**THE GAP QUESTION** uses `you_named_this` plus the parent spec's existing
named-not-dreaded treatment. It does not get a fourth tag.

---

## 5. Skip

- **Untagged questions: skippable.** Primarily the senior case.
- **Tagged questions (`you_named_this`, `blind_spot`): NOT skippable.** Otherwise skip
  becomes the escape hatch from exactly the questions that matter. Blind spot especially —
  they do not fear it, and it is the most valuable thing in the product.
- **Skip is always framed as a loss, never as the smart shortcut** (inherited from the
  diagnostic's settled skip rule). For senior, the honest version:
  *"You don't need to practice this — but you will be asked. Skip?"*

---

## 6. Verify-and-drop applies to questions

Every question traces to something real: a quoted JD line, a stated round convention, or
their own resume/pasted interviewer background. Receipts are already specced in the parent
("a chip citing the posting line it derives from").

*"Meridian always asks about X"* is a fabrication and the product dies on it. Applies even
when the model is confident — parent's company-honesty rule: frame as the user's to verify.

**The framing line is load-bearing:**
> *The questions this round is likely to ask. Not a guarantee — but nothing here is
> guessed; each one traces to something real.*

If the map implies "these are the questions" and the room asks something else, we broke the
contract on the highest-stakes day of their life. Never "we predict their exact questions"
(parent's explicit DON'T).

---

## 7. BLOCKED — do not build

Sissi proposed a per-question beat grammar: **decode → model → build → push → feedback**.

`decode`, `build`, `push`, `feedback` all match the parent spec and are fine.

**`model` conflicts with the parent spec and is not resolved.** Parent §6 forbids fantasy
model answers: *"show 'the save you didn't reach for' — built ONLY from their own answer's
material, never a fantasy model answer."* A model answer shown BEFORE they draft is exactly
that, and worse: it contaminates the draft. They will write it back in their own words.

**Do not implement the `model` beat. Do not invent a compromise.** Sissi decides.
Build the map (§1–6) without it; the drill beats land after her call.

**Also unresolved: what earns a question's ✓.** The parent has the coverage meter ("7 of 12
answers banked", `interview-mode-spec.md:63` — **already rendering at `PlanView.js:1558`,
reuse it**) and the "survived 2 pushes" badge (`interview-mode-spec.md:67`). Use those; do
not invent a new completion rule. If they do not cover a case, stop and ask rather than fabricating a ✓.
Earned-state-only is non-negotiable.

---

## Schema

**One flat generation schema. Compiled-grammar limit forbids nesting. Strings and ints only.
Prefer reinterpreting existing fields.**

Reuse (all already exist and are verified in `app/api/plan/route.js:144-163`):
- question ≡ **`task`**
- price ≡ **`timeEstimateMin`** (int)
- deferred ≡ **`trims[]`**

**Genuinely new: two strings on the existing task unit.**
- `section` — `fit` | `track_record` | `capability` | `judgment`
- `tag` — `start_here` | `you_named_this` | `blind_spot` | empty

Nothing else. If it cannot be expressed as tasks-plus-two-strings, the design is wrong, not
the constraint.

---

## Honest scope — read this before estimating

Two strings is the SCHEMA cost. It is not the build cost. Per Codex's code survey:

- **There is no generic tag/marker renderer to extend.** The only analogue is a hardcoded
  `gap_defense` chip tied to one archetype (`PlanView.js:3975`). The three tags have zero
  hits in the codebase. This is **net-new rendering**, built by analogy to one-off chips
  like the JD-quote receipt line.
- **The Round repair is new LOGIC, not just a field re-read.** `round` and `interviewers`
  are currently concatenated into one free-text prompt blob (`app/page.js:99-103`). Neither
  does anything structural today; the model may ignore them. Turning `interviewers` into
  actual section weights and giving `round` an explicit breadth/depth rule is new
  interpretation logic on top of what is presently flavor text.
- **`round` is single-select today, and stays single-select.** First/middle/final is one
  value, not a sequence. Do not build a round-sequence concept. But the chip VALUES change
  (§2) — that is an intake UI change, not just a re-read.
- **The `interviewer_kind` chip is new.** One more field on a form that already exists;
  cheap, but it is not zero.

---

## Affected files

- `app/api/plan/route.js` — interview-purpose prompt: the four sections, the mix rules, the
  ordering rule, receipts-on-questions, `section`/`tag` emission; **retire `archetype` for
  interview purpose; retire `ask_them`**
- `app/page.js` — stop concatenating `round`/`interviewers` into a blob; pass them as
  structured routing signals
- `components/InterviewDoor.js` — **the chip-set split (§2): re-cut `round` to
  first/middle/final, add the `interviewer_kind` chip, cut Technical and Case/exercise.**
  `interviewers` rows become a routing signal, not a note.
- `components/PlanView.js` — Question Map render: receipt header, Triage call line, the
  list, tag chips, the two-order toggle, skip affordances, coverage meter (already renders
  at `PlanView.js:1558` — reuse, do not rebuild)
- `lib/mockResponses.js` — **there is no interview-purpose persona at all. Author one from
  scratch.** This is its own piece of work, not a line item. Interview mode is the
  acquisition wedge, and a wedge with no demo is a form that asks for a JD before it has
  earned anything — plus zero-API demo is how every build gets verified. Without it,
  interview mode costs $0.40 per test.
- `fixtures/` — **no interview-purpose fixture exists.** Add one.
- `lib/moduleCheck.js` — **zero rules touch `archetype`/`section`/`tag`.** Add rules:
  every question has a receipt; exactly one `start_here`; tagged questions are not
  skippable; no section is padded to fill.

---

## Verify

- Demo mode (`?mock=1`), zero paid calls.
- The four knobs visibly change the map: same background + same goal, different
  `interviewers` → different section weights.
- Spec line in `TASKS.md`, dated.
- Push with the commit.
