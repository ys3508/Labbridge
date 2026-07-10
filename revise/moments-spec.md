# LabBridge — Moments spec (agreed: Sissi · Claude · Codex)

The unit of the plan UI is a **task**, and each task is walked as a short sequence
of **Moments**. A Moment is not a lesson page — it's one beat of a manager walking
beside you while you produce one work artifact. Every Moment answers exactly one
emotional question.

## The grammar (fixed order, variable inclusion)

```
Brief → Question → Model → Visual → Practice → Coach → Artifact → Reward
```

| Moment | Emotional question | Shown when | Source |
|---|---|---|---|
| **Brief** | Why am I here? | always | `task.managerRequest`, `task.deliverable`, `givenInputs`, `stakeholders` |
| **Question** | Can I try first? | `comprehensionCheck` exists | `comprehensionCheck {question, options[], answerIndex, explanation}` |
| **Model** | What's the idea? | `concept.explanation` exists | `concept` (full, **not truncated**) + `keyTerms` + `misconceptionToAvoid` + `bridgeFromBackground` |
| **Visual** | What does it look like? | `workedExample.setup` exists | `workedExample` rendered as a clean **card** (card now, structured table later) |
| **Practice** | Can I do it myself? | `task.steps` exists | `task.steps`, `givenInputs` |
| **Coach** | Am I right? | always | `selfCheck.criteria` + `redFlags` as a **user-ticked** self-check |
| **Artifact** | What did I produce? | always | draft the user writes (persisted) + `deliverable` filename |
| **Reward** | What changed in my project? | always | **live** state: draft saved?, checklist ticked count, next task title |

## Rules

1. **Fixed rhythm, variable inclusion.** Order never changes; number of Moments does
   (4–8 per task). Predictable rhythm, right-sized depth.
2. **Code assembles the flow — the model never chooses Moments.** The model provides
   task *content*; the UI decides which beats to render from what content exists.
   Cheaper, deterministic, debuggable, degrades gracefully.
3. **Coach is honest by construction (offline).** It does **not** auto-respond — no
   canned "AI feedback." It's checkboxes the user ticks against the criteria/red-flags.
   Wording makes the state clear: *"Self-check first — your draft is ready for AI
   review when…"*. The future `/api/coach` slots in **above** the self-check
   (*"…or ask LabBridge to check it"*) without removing it. No fake-AI, ever.
4. **Reward reads live state, or it's theater.** "3/5 complete · memo saved · Next:
   build the code set" must be *true* — wired to the actual ticked count, the actual
   draft, and the real next task. Coach's ticks and Artifact's draft *feed* Reward.
5. **Soft-gate, don't trap.** The user can reach Reward without finishing the
   checklist; Reward just reflects the truth. Reaching Reward marks the task done in
   the existing progress bar / localStorage.

## Ownership / build order

- `components/PlanView.js` is Claude's lane; Claude implements, **Codex reviews** for
  product-rule alignment (mirrors Claude's review of the redesign).
- Order (all offline, verified in mock mode — no API):
  1. Reframe Moments into the grammar above.
  2. Make inclusion conditional in code.
  3. Replace the fake-Coach buttons with the user-ticked self-check.
  4. Add the Reward/Unlock beat reading live state.
  5. Render `plan.hook` (stop dropping it); un-truncate the concept; delete dead
     components (`QuickWin`, `LearningLayer`, `MentorPanel`, `WorkPath`).
  6. Add `comprehensionCheck` to the plan schema + mock (Question content).
  7. Leave real `/api/coach` as a future socket.

## Not now (future sockets)

- `/api/coach` — real AI feedback on the user's draft (the magic; costs API/submission).
- Structured `workedExample` rows for a true Visual table.
