# Purpose Grammars + Timeline Budget + Time Tracker — spec

**Status: BUILT Jul 15 (phases A-C + brainstorm layer in prompt; see JOURNEY). Deferred items in TASKS.md.**
**Origin (Jul 15):** Sissi — "the structure should actually be flexible per scenario, don't always follow the same workflow; task count should come from the timeline, otherwise there's no point giving one; and I need a time tracker."
**Principle:** purpose picks the grammar; timeline sets the budget.

## Constraint the design must respect (learned the hard way)

Anthropic's structured-output compiler rejects large schemas ("compiled grammar too large", validation day). So: **one flat schema for all four purposes.** Purpose changes (a) the prompt's field SEMANTICS, (b) the render's beat labels/inclusion, (c) the capstone's stage names — never the schema.

## The four grammars (field-mapping table)

| Field | starting_role (unchanged) | interview | career_move | curious |
|---|---|---|---|---|
| unit (topic) | a first real task | a concept you'll be questioned on | an orientation/reality-check stop | one interesting idea |
| context | manager's scene-setting | why interviewers ask this | what this corner of the field is day-to-day | the hook — why this is interesting |
| conceptExplanation | the idea you need | **the crisp model answer** | the durable foundation that transfers | the one big idea |
| traps | field-tested mistakes | **where they push — follow-up traps + common wrong answers** | what people love/hate (reality check) | (light or empty) |
| workedExample | tiny case | **a strong answer, walked through** | a day-in-the-life vignette | see it vividly |
| comprehensionCheck | did it land | **rapid-fire interview question** | does your background bridge here? | optional, often empty |
| task | manager assignment → file | **rehearse: write YOUR answer into the bank** | one hands-on taste OR a talk-to-humans step | optional tiny try (may be empty) |
| draft file | project deliverable | **answer-bank entry** (`answers_topic.md`) | fit notes / contact notes | none (empty task ⇒ beat drops) |
| selfCheck | reviewer criteria | what a strong answer must contain | honest fit signals | (empty) |
| firstTask (capstone) | Readiness Project, Observe→Assist→Own | **Mock interview** — stages Warm-up→Core→Rapid-fire, timed | **Decision brief** — stages Orient→Talk to people→Decide (go/no-go + 6-month path) | NONE — a "door" instead (upgrade to career_move/starting_role) |
| accumulates | portfolio | answer bank | decision doc + contacts | nothing |

Networking module: stays gated to career_move/curious (career_move: it's load-bearing — feeds the Decide stage).

## Timeline budget (mechanic 1)

- Runway → time budget: deadline or weekly pace → available hours; each unit costs its timebox (workspace minutes). **Count = what the budget affords**, bounded by purpose sanity: curious ≤3 always; interview/career_move scale up with runway; starting_role fills the runway and on SHORT runways trims explicitly ("Cut for your 3-day window: X, Y — add back if time frees"). No timeline → purpose default (curious 2-3, others 4-6).
- Anti-middle line: "choose the count the budget demands; do not default to the middle of a range."
- Depth still sets per-unit DEPTH (landscape shallow, deep deeper) — it no longer sets count.

## Time tracker (mechanic 2)

- Track ACTIVE seconds per task: tick only while the tab is visible, the task surface is open, and there was interaction in the last 2 minutes (idle cap — signal, not surveillance). Plan-scoped storage `lb_time`.
- Display: workspace header + focus header — "23m today · 1h 40m total · of ~3h planned". If a deadline exists: a pacing word (ahead/on pace/behind) from remaining-estimate vs days-left.
- Planned total = sum of task timeboxes (parser exists: timeboxHours).
- Later (workspace spec): per-beat granularity, export with the project.

## Build phases

- **A (this session): prompt** — PURPOSE GRAMMARS semantics + capstone stages per purpose + TIMELINE BUDGET + anti-middle + explicit-trim.
- **B (this session): render** — beat labels/objectives/kickers keyed by purpose; curious drops Check/Coach/Wrap machinery when fields are empty and ends on a "door"; capstone heading label per purpose (stage strings already come from the model).
- **C (this session): tracker v1** — active-time engine + header display + pacing word.
- **D (later):** interactive mock-interview capstone (timed rapid-fire runner, scoring via /api/coach), answer-bank export polish, per-beat time analytics. Parked in TASKS.md.

## Verification

Demo personas are starting_role ⇒ demo must look unchanged (default labels). Paid tests, one each (~$0.40): purpose=interview (biggest departure — the before/after benchmark), then curious (cheapest to eyeball: 2-3 stops, no project machinery).


## Brainstorm layer (Sissi: "all of it, I love it") — built vs deferred

BUILT (prompt): Day-One Pack framing + week-zero/week-one split (starting_role); own-story + defend-the-gap units, resume-anchored behavioral answers, ask-likelihood/cram ordering, pushback drills (interview); evidence ledger + enjoyment-as-data + counterfactual stop (career_move); one-surprising-thing contract + myth-vs-reality (curious). Gap-derived count (no bands anywhere; road length = evidence of the gap analysis; explicit deferrals; never pad). Home-vocabulary rule + output-language rule.
BUILT (render): purpose beat identities (labels/objectives per goal), curious light grammar (no coach; draft only with a real try; DOOR wrap), roadmap "your background made it shorter" line, TimeMeter tracker (active-time, idle-capped, pacing word), split-pane AssistantPanel (+/api/assist, context-injected, quick actions, demo mock).
DEFERRED → TASKS.md: four visual roadmap identities (road/calendar/scale/door); interactive mock-interview runner (timed, scored); post-interview loop; cheat-sheet + Day-One Pack exports; form-free curious entry; drip pacing for career_move; purpose-ladder handoff (door regenerates with context carried); select-to-ask in the assistant; register selector UI + language form field (prompt honors steering notes today).


## Addendum (same day): within-plan variety
Scaffolding fade (full→compressed→near-pure-production across the sequence), task archetypes (learn_and_do/critique/shadow_reproduce/plot_twist, schema field + header chip, no two adjacent alike), and question genres (explain-back/predict/spot-flaw as FREE-TEXT graded via /api/coach; MCQ ≤1 per plan outside interview rapid-fire). Built + demo-verified Jul 15.
