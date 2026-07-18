# Voice input honesty — typed pacing + freeze-on-mic (spec of record)

**Date:** 2026-07-18 · **Status:** BUILT on `claude/voice-freeze-honesty` · **Files:**
`components/VoiceInput.js`, `components/DiagnosticFlow.js`

This is the pattern the drill loop's typed escape hatch inherits
(`revise/2026-07-17-drill-grammar-spec.md`, fork 3). Whatever grades a typed answer
anywhere in the product follows these rules.

> Note: a same-named spec exists on `codex/voice-input-honesty`, written for the
> typed-only diagnostic before the recorder existed. This version covers the recorder;
> on merge, this one governs.

---

## A. Typed answers carry no pacing — absent, not null

The clock never ran, so nothing may render or reason about it.

- `mode === "typed"` metrics contain **no** `durationSec`, `wordsPerMinute`, or
  `longPauseCount` keys at all. Not zeros, not nulls — absent.
- Kept: text-derived signals only — `wordCount`, `fillerCount`, `falseStartCount`,
  `pacingMeasured: false`.
- The typed UI shows no timing line. Its one honest line:
  *"Typed answers are read for structure, not delivery speed."*
- The coach payload says it explicitly: if input=typed, **ignore any pace, duration, or
  seconds wording in the delivery criterion** — never critique a speed that was not
  observed. This guards against generated delivery keys that carry a voice-shaped bar
  (e.g. "under ~90 seconds") into a typed grade.
- Each input mode is graded against its own rubric; substance is judged from the
  confirmed transcript in both modes.

## B. Freeze-on-mic — wait 10s, then a lifeline

Per the decided freeze rule (wait 10s; tone-dialed lifeline; freeze is delivery signal;
no auto-anything):

- **Mid-answer silence ≥ 10s** (they have words on the transcript, then go quiet):
  a lifeline appears. Before 10s: nothing. No countdown, no auto-stop, no auto-submit.
- **The lifeline is a re-anchor to the question**, tone-dialed, static strings:
  - neutral: *"Pick the thread back up whenever you're ready. The question, again:"*
  - gentle: *"No rush — the thread will keep. Here's the question again, whenever you
    want it:"*
  Never "are you still there?", never a score-adjacent word. It clears itself the
  moment they speak.
- **False starts and "um" are not events.** Any speech — interim results included —
  resets the silence clock; a slow speaker or a false start never trips the lifeline.
- **The browser's own silence timeout is not allowed to end the take.** Speech
  recognition restarts on `onend` while the user is still recording; only "Stop and
  confirm transcript" ends a take. (Start-of-answer silence keeps its existing gentler
  ramp: a nudge at 6–8s, options at 19s.)
- **Freeze is delivery signal:** silences ≥ 10s are counted (`freezeCount`), shown in
  the delivery-signal line ("1 freeze over 10s"), and ride to the coach as
  `freezes_10s_plus=N` — used only for the delivery criterion, like all metrics.
- Re-record framing stays coached: "Try that again" — never "submit your best take."

## Tone dial → static strings

The dial genuinely reaches the lifeline: intake router (`/api/intake` → `tone`) →
`DiagnosticFlow` bundle → `DiagnosticQuestion` `tone` prop → `VoiceInput` `tone` prop →
string selection. `tone="gentle"` selects the gentle register; anything else falls to
neutral.

**Open (G7):** which register a user with *no* tone signal meets at Q1 is the
pre-diagnostic tone-dial gate — this build follows the product-wide default (neutral)
and does not decide that gate.

## Storage disclosure (reported, unchanged)

- Earlier voice takes (transcript + metrics, never audio) live in component state —
  this session only; last 3 ride to the coach as history. Disclosed in the UI after the
  first retake.
- The **final** confirmed answer + review + final metrics persist in
  `localStorage.lb_intake_last` (`saveDiagnosticBaseline`), with
  `audioStored: false, retakeHistoryStored: false` recorded alongside. Disclosed by the
  diagnostic's standing line: "We save your confirmed transcript and coaching signals
  for this plan. We do not store audio."
- Audio is never captured by app code at all — the browser's speech service transcribes;
  no audio object exists to store.
