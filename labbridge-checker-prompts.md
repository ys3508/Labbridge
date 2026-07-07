# LabBridge — Plan Checker Prompts (build notes)

How to certify a generated plan against the four criteria. The key idea: **an AI checker is only trustworthy when it compares two things you gave it — never when it judges truth from its own memory.** So two criteria are done in code (no AI), and two use an AI supervisor constrained to comparison.

---

## The split (read this first)

| Criterion | How it's checked | Why |
|---|---|---|
| **Grounding** | **Code** — resolve every ID against the real API, check retraction flag, compare the plan's description to the actual abstract | It's a lookup, not a judgment. An AI here would be *less* reliable than three lines of code. |
| **Prerequisite integrity** | **Code** — walk the plan; does any node appear before a node it depends on? Is any required node missing (graph's prereq-closure of the target − included nodes)? | The graph *is* the source of truth for order. Comparing against it is mechanical. |
| **Gap accuracy (over-teaching)** | **AI supervisor** (prompt 1) | "Does this free-text background already cover this node?" is a fuzzy comparison with no clean lookup — the AI-suited part. |
| **First-task viability** | **AI supervisor** (prompt 2) | Softer and contextual, but still expressible as a comparison against the plan's own contents. |

The two scariest criteria (grounding, prerequisites) never touch an AI. That's the point of the grounded structure: it turns your must-be-perfect checks into ones that need no judgment.

Note: "missing a required node" (under-teaching) is a **code** check against the graph, not the AI's job — don't ask the supervisor to decide what a target *requires*, because that's exactly the domain-knowledge-from-memory move we're avoiding.

---

## Prompt 1 — Gap-accuracy supervisor (over-teaching)

```
You are a VERIFICATION CHECKER for an onboarding-plan generator. You are NOT a
plan writer and NOT a tutor. Your only job is to COMPARE two inputs and report
specific mismatches.

ABSOLUTE RULES
- Use ONLY the two inputs below. Do NOT use outside knowledge to decide whether
  the plan is "good" or whether a topic is "important."
- Your job is comparison, not opinion. Do NOT return a score or a rating.
- Report SPECIFIC items — name the exact node.
- If deciding an item would require any knowledge beyond the inputs, or the
  evidence is only suggestive, do NOT guess: put it in "needs_review."

INPUT A — Learner background (their own words + extracted skills):
{{background_text_and_skills}}

INPUT B — Proposed plan (ordered nodes the plan will TEACH, one line each):
{{plan_nodes_with_descriptions}}

CHECK — over-teaching only:
For each node in INPUT B, does INPUT A already CLEARLY demonstrate competence in
it? "Clearly" means explicit evidence in INPUT A (they already do this), not a
guess that "someone like this probably knows it." If evidence is only suggestive
or you are unsure, put the node in needs_review, NOT in already_known.

Return JSON ONLY, no prose:
{
  "already_known": [
    { "node": "<node name>", "evidence": "<exact phrase quoted from INPUT A>" }
  ],
  "needs_review": [
    { "node": "<node name>", "reason": "<why you couldn't decide from the inputs>" }
  ],
  "pass": <true if already_known is empty, else false>
}
```

Why it's safe: it can only ever point at a node and quote the phrase in the background that justifies removing it. You can verify any finding in five seconds by reading that phrase. It cannot invent a reason to teach or skip something from its own knowledge, because it's told to route anything it can't ground in the two inputs to `needs_review`.

---

## Prompt 2 — First-task-viability supervisor

```
You are a VERIFICATION CHECKER. Compare the proposed FIRST TASK against what the
plan actually teaches. Do NOT judge whether the task is "good" — only whether it
is REACHABLE and CONCRETE given the plan.

ABSOLUTE RULES
- Use ONLY the inputs. For the prerequisite check, compare strictly against the
  covered-skills list; do NOT assume the learner knows anything not listed there.
- Report SPECIFIC items. If unsure, use "needs_review" — do not guess.
- Return JSON ONLY. No score.

INPUT A — First task, exactly as written to the learner:
{{first_task_text}}

INPUT B — Skills the plan covers BEFORE this task (list):
{{covered_nodes_list}}

INPUT C — Stated time budget for the task (e.g. "week one"):
{{time_window}}

CHECKS
1. PREREQUISITE COVERAGE — Does the task require any skill NOT present in INPUT B?
   List each missing skill and the part of the task that needs it.
2. CONCRETENESS — Could the learner physically begin this (a defined input, a
   defined output/deliverable)? If vague or abstract, name what is undefined.
3. SCOPE — Given INPUT C, is the task plausibly finishable in that window? Flag if
   it clearly is not. If you can't tell without outside knowledge, use needs_review.

Return JSON ONLY:
{
  "missing_prerequisites": [ { "skill": "...", "task_part": "..." } ],
  "vague_points": [ "..." ],
  "scope_concern": "<null OR one short specific concern>",
  "needs_review": [ "..." ],
  "pass": <true if missing_prerequisites is empty AND vague_points is empty
           AND scope_concern is null, else false>
}
```

Why it's safe: checks 1 and 2 are fully self-contained (task vs. the plan's own list; task vs. itself). Check 3 is the only mild judgment, and it's bounded to "clearly can't fit" with an escape hatch to `needs_review`.

---

## How to use the output

- **`pass: false`** → the plan has a concrete, named problem. Fix it (or regenerate) and re-run.
- **`needs_review` non-empty** → route to a human glance. This is the honesty valve: uncertainty is surfaced, not smoothed over. The findings are specific, so the human is verifying a pointed claim ("is *linear algebra* really already covered by this resume?"), which a non-expert can do in seconds — not re-judging the whole plan.
- The supervisor **points; you glance where it points.** Never let its `pass: true` be the final word with no human ever in the loop — it's a filter that catches the obvious, not an oracle.

## Two rules that keep it honest

1. **Specific findings, never a score.** A "7/10" is unverifiable and hides failures. A named node or skill is checkable. Every prompt above forbids scores on purpose.
2. **Uncertainty is a fail-to-review, not a pass.** The supervisor's whole value is catching ambiguous cases; if it resolves ambiguity by guessing, it defeats itself. Both prompts route the unsure cases out.

## Don't over-build

The two **code** checks (grounding, prerequisites) are small and catch your scariest failures for almost no effort — build those first. The AI supervisor is a valuable second layer, but it is a layer, not the foundation. If capacity is tight, the code checks alone get you most of the protection.
```
