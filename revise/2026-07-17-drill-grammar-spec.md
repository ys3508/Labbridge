# Drill grammar — the redesign (Jul 17)

**Status:** design settled; Sissi ruled A-D + L2/push on Jul 17. One item remains and it is
a MEASUREMENT, not a decision: the real cost of a drill.
NOT a build prompt — see "What CC/Codex must NOT do" at the end.
**Decided with:** Sissi. Her calls unless marked otherwise.
**Parent:** `revise/interview-mode-spec.md` governs where this is silent.
**Sibling:** `revise/2026-07-17-question-map-build.md` — the map is the container; this is
what happens inside one question of it. Question Map + Drills are ONE stage.

---

## What changed, and why

The proposed grammar was:

> decode → model → build → push → feedback

Two problems killed it.

**1. `model` conflicted with a settled rule.** Parent §6 forbids fantasy model answers:
*"the save you didn't reach for — built ONLY from their own answer's material, never a
fantasy model answer."* A strong answer shown BEFORE they draft is exactly that, and worse:
it contaminates. Show someone a good answer and they rewrite it in their own words — not on
purpose, that is simply what happens. They walk into the room reciting a structure they
never built, and it collapses on the first push.

**2. `build` made it schoolwork.** Sissi: *"我不想这个面试辅导变成和做题一样."* Interviews
are spoken. A draft box is a writing exercise wearing an interview costume.

## The new grammar

> **decode → dig → speak (with push) → replay + self-read → feedback → re-speak**

`model` became `dig`. `build` was deleted and replaced by live voice. Push moved INSIDE
the speaking. Notes replaced the draft.

---

## 1. `decode`

Unchanged from the parent (§4, "the question behind the question").

> *"They're not asking about the failure; they're testing whether you own it without
> spiraling."*

The mentor-tells-you-the-secret move. Guidance without a script. This is where the teaching
lives, which is part of why `model` was unnecessary.

---

## 2. `dig` — find what they already have

**Purpose:** the user who does not know what to say. Not an example to copy — an excavation
of their own material, plus a structure to organize it.

**Three parts:**

- **AI surfaces their highlights** — from resume, pasted background, the ammunition field,
  their diagnostic answers. *"Your vaccination project — you cut turnaround from 6 weeks to
  9 days. That's a Result looking for a Situation."*
- **Notes** — they write down what they've got. Per-question, persisted, and they ride into
  the cheatsheet. **Not a draft box.** A blank draft says *produce*; a notes pane says
  *collect*. Same function, no schoolwork. This is the accommodation for the user with no
  confidence — they are never required to compose, only to gather.
- **Conversation** — they can ask the assistant how to say it better. Techniques (STAR and
  its cousins) get taught here.

### The two rules that keep dig honest

**Rule 1 — HINTS come from anywhere. SENTENCES come from them.**

These are different objects and the earlier draft of this rule wrongly banned both:

- **Hints ASK.** *"Ever have to convince someone senior who disagreed with you?"* Sourced
  from the JD, the role, the field, anywhere. They do not have to trace to anything the
  user said. **A hint is a door** — it prompts recall of material we could not have known
  about. When the user is blank, open every door available. This is the point of dig.
- **Sentences ASSERT.** Any sentence dig offers must trace to something they said, wrote,
  or pasted. Because they will say it in a room, and a sentence we invented is one they
  cannot defend under a push.

**Rule 2 — a hint must not carry its own answer.**

- ✅ *"Was there a time the data disagreed with what someone wanted?"* — a door
- ❌ *"Most epi people talk about data-quality tradeoffs with stakeholders — did you do
  that?"* — a script wearing a question mark

The second gets a **yes** whether or not it happened. Nervous people agree with the coach.
They then build a story on it, walk into the room, get pushed once, and it collapses — in
the one place that matters. This is not integrity theater; it is the exact failure the
product exists to prevent.

**Hints are questions, not suggestions.** Ask widely, ask about anything, ask ten. Just
never hand them content and let them nod.

### The output-shape toggle: Keywords / Full sentences

Sissi's call, and the parent already permits it.

Full sentences are **legal** — parent §6's forbidden thing is a *fantasy* answer, not a
complete one. "The save you didn't reach for" is itself a full sentence built from their
material. The gate is **provenance, not length.**

Same material, two encoding levels:

| mode | example |
|---|---|
| Keywords | *"turnaround: 6 weeks → 9 days. STAR: that's your Result."* |
| Full sentences | *"We cut turnaround from six weeks to nine days, and the state started calling us first."* |

Same fact, from their own transcript/resume. **Nothing invented at either level.**

**If dig has no material yet, full-sentence mode has nothing to offer — and it must say so,
not fill the gap.** Verify-and-drop applied to prose.

**Second-language users are the reason this exists.** They HAVE the content; they lack the
English. Handing them keywords withholds the only part they need — that is a tax on people
who think in another language, not integrity. The parent already decided this: *"first pass
in whichever language thinks best; the English version built together."* Full-sentence dig
IS "built together." This cashes a decision rather than making a new one.

**Framing rule: the toggle must not be a confession.** "I need help" / "I've got this" is a
self-assessment nobody wants to make in front of a coach. Label it by **output shape** —
*Keywords* / *Full sentences* — not by user capability. Same register as the trim chips.

### The conversation is the back door — guard it in the PROMPT

*"和他对话问怎么回答更好"* — the assistant will happily write the whole answer. That is the
thing we cut, arriving through a side entrance nobody is watching.

Rules 1 and 2 must reach the **assistant's prompt**, not just the dig UI. The split-pane
assistant already inherits the plan's honesty contract; this joins it.

### Mostly already built

- The split-pane assistant already carries beat + task + materials + canon.
- The Toolbox **Notes** pane is already per-task, persisted, and already rides the export.
- Parent §4 **STAR-from-resume** is dig's surfacing step, already specced.
- The ammunition field's rule — *"if their strongest resume story is missing from their own
  list, the diagnostic hands it back"* — is dig behavior, already specced.

Dig is those pieces, wired to a question, plus one prompt discipline.

---

## 3. `speak` — the live voice drill (replaces `build`)

The interviewer asks. The user answers out loud. This is the beat.

- **Answer length is set by the question**, not a global timer.
- **Re-recordable.** Framed "want to try that again?" — never "submit your best take"
  (inherited from the diagnostic's settled re-record rule).
- **The push happens DURING the recording** — mid-answer, the way a real interviewer
  interrupts. This is the signature move (parent §6, "dynamic pushback... generated from
  what they actually said").

### Audio: in-session only — DECIDED

The settled trust copy is *"We save your confirmed transcript and coaching signals. **We do
not store audio.**"* Playback needs audio. That promise cannot be quietly bent.

**The decision:** audio lives in memory — this session, this question. Playback works.
Close the tab and it is gone. **Say it out loud in the UI:** *"Yours to hear, now. We never
keep it."*

**Accepted consequences:**
- The cheatsheet cannot contain audio.
- Re-listening tomorrow is not a thing.
- Only the confirmed transcript persists.

### The push and the full-sentence user

A recited sentence collapses under a follow-up — **and that is a feature.** It happens here
instead of in the room. Which means **full-sentence users need the push more, not less.**

**Do not let the gentle tone dial quietly skip the push for them.** Push warm, but push.

---

## 4. `replay + self-read` — their read comes first

They play back their own recording and say how they think it went. **Before** any tool
feedback.

**Plus a checklist**, so the self-read has structure rather than vibes:
- Did they actually answer the question asked?
- Did they hit what the interviewer was really probing (the `decode` line)?
- Delivery — pace, tone, filler, burying the result.

**Why this is at drill level and not saved for the mock:** the parent has
reflect-on-mock as a late beat. Putting the self-read on EVERY question builds the
self-assessment skill they will actually use — alone, in the real room, with no tool. That
is the skill. Practice it eight times, not once.

It also buffers a rough take before the tool's verdict hardens it.

---

## 5. `feedback` → `re-speak`

Two-axis (substance / delivery, never blended), quoting their words, hard on the problem,
soft on the person. Unchanged from the parent.

Then they **speak it again**. The loop closes in the medium the room uses.

---

## 6. Notes → the cheatsheet

Per-question notes live in the sidebar. At the end:

**questions + notes + the tips we gave + the materials → one HTML cheatsheet.**

This is parent build item #6 (the cheat-sheet export) and its emotional twin the walk-in
card. No conflict. It is the artifact the whole arc earns.

**Notes must survive into it with no re-entry.** Same file, straight through.

---

## Tap-the-transcript-to-notes — DECIDED (Sissi, ruling C)

**Accepted, with a constraint: bulletpoints only, AI-condensed. Never the raw transcript.**

**The problem it solves:** in 90 seconds of speech, one thing lands. **They will not
remember they said it.** The transcript already exists (confirm-before-grading is built),
so the material is right there and currently thrown away.

**The mechanism:** the user taps to send a moment from their answer to notes. **The AI
condenses it into a bulletpoint.** Notes are cheatsheet material — a transcript dump is
unusable in the car outside the building, so raw speech does not go in.

**Why this is good dig:** it is material they PRODUCED, not material we surfaced.
Trivially inside Rule 1. It also inverts the loop — speaking stops being a test and becomes
**how you find your own words.** The freeze user discovers they had it already.

### The accepted tradeoff — recorded, not re-argued

Claude's position was that the user's sentence should ride along verbatim beneath the
bullet, on the grounds that the cheatsheet's payload is *their best sentences in their own
voice* — already-sayable, proven sayable by having been said — whereas a condensed fact
("reduced turnaround 6wk→9d") still has to be turned into words by a nervous person in a
parking lot.

**Sissi ruled against this twice. The decision is: AI condenses. Bulletpoints only.**

**The known cost, accepted:** the cheatsheet reads in the product's voice rather than the
user's. Nobody should re-litigate this without new evidence — e.g. a real user reading
their cheatsheet aloud and stumbling because the words are not theirs. That would be the
evidence; an opinion is not.

---

## Rulings and remaining forks

**Sissi ruled on Jul 17.** Forks 1, 3, 4, 5 are CLOSED and recorded with their reasoning
(the reasoning is the point — a gate that closes into prose gets re-litigated).
**Fork 2 (cost) is pending a measurement, not a decision.** Fork 6 is a standing guard.

### 1. Are drills mini-mocks? — DECIDED: YES (Sissi, ruling A)

Live voice + interviewer + mid-answer push + feedback **is the mock runner.** The only
difference is **retriable vs not.**

**Consequence — this is the load-bearing one:**

**Session B is no longer an engine. It is ORCHESTRATION.** Sequence, no retries, Simulated
Live voicing (the archetype from the real interviewer's background), report card, saved as
artifact.

**The drill IS the engine.** Build it once, here. Session B composes it.

Nobody builds a second pushback runner. If a Session B task description implies a new
engine, it is written against the old assumption — stop and check.

### 2. Cost — PENDING MEASUREMENT. Do not design around a number until Codex reports.

**A correction is recorded here because the first estimate in this doc was wrong and the
design nearly bent around it.**

**The bad estimate (retracted):** ~20¢ per drill, ~$1.50-2.00 per 8-question pass. The
error was reasoning "a drill is a mini-mock, therefore a drill costs what a mock costs."
But the parent's 15-30¢ is for a **whole mock** — warm-up 2 + core 4-5 with pushes +
rapid-fire 6, roughly 12 questions. One question with a push and a score is **~1.5-2.5¢**,
not 20¢.

**The current estimate:** transcription of a ~90s answer at Whisper-class rates (~$0.006/min)
is ~1¢. Push + two-axis feedback ~2-4¢. **Per drill ~3-5¢. Eight drills ~25-40¢. With
re-records, maybe 50-80¢.** That is the same order as ONE plan generation, not four times it.

**This is arithmetic, not a receipt.** A probe is queued: measure one real drill end to end
(transcription + push + feedback), itemized, with actual token counts. **If it comes back
at 20¢, everything below reopens.**

### Claude's recommendation, contingent on the measurement holding

**Bundle it. Do not meter it.**

At ~4¢ a drill, a per-drill price tag costs more in behavior than it saves in money. The
product's thesis is **repetition under pressure.** A number on every practice button taxes
exactly the behavior we sell — someone re-records twice instead of five times, and the
fifth was the one where it clicked.

**The parent's "state the cost on the button" rule was written for THE MOCK** — one big
deliberate act, 15-30¢, a real decision. **Drills are the loop, not the act.** Same rule,
wrong object.

**Where honesty is still owed: the aggregate, once, up front.**
> *"Building your map and practicing every question: about 80¢ total."*

One true number at the moment they decide, then silence while they work. This is the
established pattern — scrolling-is-free vs building-is-paid was mapped the same way, with
the number placed at the decision.

**"Runway forks volume" survives untouched.** A 3-week road costs ~40¢, a 3-day road ~20¢.
Nobody cares. The rule stays about TIME, which is what it always meant.

### Open questions the measurement will settle

- Which step dominates. If transcription is 80% of it, STT choice is the lever, not the
  prompt.
- **There is no STT decision on record.** If we have not picked one, that is its own fork.
- Whether `/api/coach` can serve the push + feedback as-is. It currently grades ONE static
  draft and has no notion of a multi-turn exchange. Extending it may change the number.

### 3. Typed escape hatch for `speak` — DECIDED: YES, but discouraged (Sissi, ruling B)

**It exists. It is never the recommended path.**

Deleting `build` means speaking cold, from nothing. For the freeze user — the one who typed
*"I freeze when they push back"* — that is the wound, and the parent's carved-in-stone rule
says **the acknowledged fear is never tested cold in the first beat.** Notes (dig) partly
answer this: nobody arrives at `speak` empty-handed. The typed path covers the rest.

**Framing follows the settled skip rule: available, framed as a LOSS, never as the smart or
fast option.** The room will not let them type.

> *"You can type it — but the room won't."*

**Two inherited constraints:**

1. **It inherits the VoiceInput honesty fix.** Typed mode currently fabricates wpm/duration
   from a hardcoded 60s. A typed `speak` path must emit **no pacing metric at all** —
   text-derived signals only (structure, hedging, filler in the written text, whether it
   opens with a claim), no timing line rendered, and the grader told explicitly that typed
   delivery is judged on structure, not speed.
2. **The push still happens.** Typed does not buy exemption from the follow-up. See fork 4.

### 4. L2 + push — DECIDED: the push stays identical (Sissi)

Full-sentence dig optimizes for second-language users. The push is where the risk sits: they
recite a good sentence built from their material, the interviewer interrupts, and now they
are improvising **in their second language, under pressure, off-script.**

**The worry was misdiagnosis** — that a language collapse would be graded as a substance
collapse, delivering a wrong verdict to the exact user full-sentence mode exists to help.

**Decision: the push does not adapt. The real room will not adapt either.**

**Why this costs nothing — the architecture already handles it.** Grading is **two-axis:
substance and delivery, never blended** (parent §5). An L2 user who knows the answer but
cannot say it fast is a **delivery** verdict, not a substance one. The grader already
distinguishes these; nothing new is required.

**What this obliges:** the two axes must genuinely stay unblended for this case. If a
delivery failure ever leaks into the substance verdict, this ruling breaks and the user
gets told they do not know something they know. That is the thing to watch in the coach
prompt, not the push.

**Not adapted, but not unsupported:** the honest limit still applies (parent, identity
fears): we cannot make the room slower. We can make every answer force the conversation onto
their evidence — that is trainable, and that is what the drills do.

### 5. STAR-from-resume — DECIDED: kept, gated behind the toggle (Sissi, ruling D)

Parent §4: behavioral answers **pre-drafted** from their real projects; *"they edit, not
compose."*

**It is legal.** It traces to their projects; nothing is invented. Sissi's full-sentence
ruling already permits it — the gate is provenance, not length.

**The question was never whether it is allowed. It was whether it is the DEFAULT.**

**Decision: the existing Keywords / Full sentences toggle governs it. Default is Keywords.**

| mode | STAR-from-resume behaves as |
|---|---|
| **Keywords** (default) | The STAR frame with their material in slots, **unassembled.** *"Vaccination project. Result: 6wk→9d. Situation? Task?"* |
| **Full sentences** (one tap) | Pre-drafted from their projects. They edit. |

**Why not default to pre-drafted — and this is efficacy, not integrity:**

A pre-drafted answer removes the only step that makes an answer survive a push. Someone who
assembles their own STAR knows **why** the Situation connects to the Result — so when the
interviewer digs, they have somewhere to go. Someone who edited ours knows the words but not
the joints. **The push finds the joints.**

The product promises *"anchored to your real background, rehearsed against pushback."*
Pre-drafted-by-default delivers the first half and quietly breaks the second.

**But it must be ONE TAP away, never buried.** L2 users, freeze users, and anyone staring at
a blank screen reach it instantly. The toggle already exists, already has non-confessional
framing, and already made this exact call for second-language users. **One toggle, two
places, same decision.**

### 6. `model` is dead — confirm nothing resurrects it

The `model` beat is CUT. `decode` teaches; `dig` supplies material; nothing shows a fantasy
answer before they speak. Any future "just show them a good example" proposal is a
re-litigation of this — the reason it lost is contamination, and the reason is recorded here.

---

## What CC/Codex must NOT do

- **Do not build a `model` beat** or any pre-answer example. It is cut. See fork 6.
- **Do not let the assistant produce a sayable sentence in dig that has no provenance.**
  Hints may come from anywhere; sentences must trace to the user's own material. This rule
  must reach the assistant's PROMPT, not just the dig UI — the conversation is the back door.
- **Do not let a hint carry its own answer.** Hints are questions, not suggestions.
- **Do not persist audio anywhere.** In-session, in-memory, gone on tab close, and the UI
  says so.
- **Do not default to Full sentences.** Keywords is the default in both dig and
  STAR-from-resume. Full sentences is one tap away, never buried, never framed as a
  confession.
- **Do not put the raw transcript in notes.** Bulletpoints, AI-condensed.
- **Do not build a second pushback engine for Session B.** The drill IS the engine;
  Session B is orchestration.
- **Do not emit pacing metrics on the typed path.** No wpm, no duration, no timing line.
- **Do not let the gentle tone dial skip the push.** Push warm, but push.
- **Do not start Session B until fork 2 (cost) has been measured.** The number decides
  whether drills are metered or bundled, and that is a UI commitment.

## Still open before build

- **Fork 2 — cost.** One fork left, and it is a measurement, not a decision. Codex probes
  one real drill end to end; the meter-vs-bundle call follows the number. **Also surfaces
  an unrecorded fork: we have no STT decision.**
