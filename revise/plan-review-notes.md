# Live-plan page-by-page review — notes ledger

**Status: PHASES 1+2 IMPLEMENTED (2026-07-12, Sissi's go-ahead).** Shipped: wrap gate (#44) + gated `markDone`; beat reshuffle Try→Draft→Coach (#40); `/api/coach` + CoachReview UI with demo mock (#34); criteria/watch-fors on Try (#33); draft template button (#41); carry-forward warn/quote on Brief (#45/#47); givens as lists (#38); numbered Try steps (#28/#37); footer dedupe (#39); definitions block → glossary pointer (#51 render half); copy cheques cut (#17/#50); latent `window.focus` dots bug. **Still open: the prompt batch (#36/#42/#48/#49/#52/#53/#43/#35/#31 — one ~$0.40 re-run to verify), un-teach scan (#55), synthetic extract (#30), check-genre free-text (#24), one-page review mode (#9), page-2 conceptCore template (#11/#14 prompt half).**

Original status line: review in progress — no changes until Sissi declares it complete.
Her standing instruction: *"don't change anything until I finish the whole review. no action, just brainstorm and review the content with me, and you make notes on it."*

Artifact under review: the first paid generated plan (validation run #1, Persona 1 / RWE Analyst, `~/Downloads/labbridge-plan.md` + live UI on port 3100). Reviewers: Sissi (structural/product) + Codex (technical/domain), adjudicated and merged here.

## Coverage so far

- **Task 1 ("Profile the Drug A claims extract") — all 8 beats reviewed.**
- **Task 2 ("Build the T2D and Drug A value sets") — pages 1–3 reviewed** (Brief, Model, Example).
- Remaining: Task 2 pages 4–8, Tasks 3–5, readiness project. Sissi may sample rather than read all.

## Her final verdict on Task 1 (recorded verbatim in spirit)

**The content passed; the loop failed — three times, the same way: the app asks the user to attest to work it gave them no way to do.** Root cause: **no data and no review step.** Everything else is downstream.

Her two must-dos before showing a real user:
1. **Ship the four synthetic CSVs** — converts pages 5–7 from theater into work; traps become discoverable instead of asserted.
2. **Gate the checkmark on the draft being non-empty** — one conditional; the difference between an honest product and not.

Then: build the AI review for real, reorder beats 5/6/7 into steps → write → review, fix the lab-value error.

## Top tier (consolidation spine)

| Item | What |
|---|---|
| #44 | **Wrap gate.** `PlanView.js:1935` — `doneAsIf` fabricates completion on arriving at Wrap; `markDone` (line 148, called by Start-Task button) is unconditional. "You closed a gap ✓" renders while the same screen prints "Draft still empty · 0/3 confirmed." Violates our own earned-state-only principle. Fix: branch `GapClosedReward` on `hasDraft`/`ticked` → 3 honest states (empty → no claim, skipping allowed; partial → "here's what's thin"; met → the expensive sentence). |
| #40 | **Beat reshuffle (DESIGN DECISION — hers).** Coach-before-Draft is the designed moment grammar, and the review proved it can't work for production tasks: self-check precedes the draft box, forcing honor-system pages. Proposed: Try (steps + doneWhen + criteria + watch-fors) → Draft (write, prefilled skeleton) → Coach becomes AI Review. Same 8 beats, same page count. Fuses #29 + #33 + #34. |
| #34 | **/api/coach is load-bearing, not parked.** One grading endpoint (draft + rubric → structured feedback) serves three consumers: free-text check answers (#24), scaffold sections (#29), full-draft review. The rubric is already generated per task (`selfCheckCriteria` + `redFlags`). Kill the "AI review is coming" placeholder. Haiku ≈ pennies/review. |
| #29 | **Scaffolded artifact production.** Try/Draft becomes fill-in sections of the real deliverable. Her Option B ≡ Codex's template (independently identical). Skeleton = per-table blocks (Holds / Key fields / Cannot tell you / Observability note) + Codex's inventory columns (grain, join key, row/patient counts, date range, limitation) + bottom-line-first ("usable for ___ but not ___ because ___"). |
| #1/#30 | **Synthetic extract (designed by Sissi, record verbatim):** 4 CSVs, ~200 patients: enrollment gaps ~15%; single-code rule-out candidates; null `days_supply`; **CPT 83036 with no result column (the lab trap gets DISCOVERED, not told)**; one fill-before-diagnosis patient. Upgrades #29 from schema-reasoning to data-touching. B ships first; A layers on. |
| #55 | **Un-teach scan.** Add to the existing background checker (`/api/check`, `CheckReview`) a third dimension: *"does any page state something a senior person would have to un-teach?"* Targets the confirmed one-confident-error-per-module class. |

## Confirmed template defects (fix once, repairs every module in every plan)

- **Page-2 (Model) template** — confirmed identical on tasks 1 & 2:
  - #11: compact model buried at the bottom of a 200-word wall under a "short enough to use while working" subtitle. Fix: model first, in a box, ≤3 lines; prose as support beneath.
  - #14: prose and "Field-tested traps" restate each other (3-for-3 on task 2).
  - Definitions block is dead weight — ICD defined 3× across two tasks. #51: dedupe keyTerms at PLAN scope; kill the concept-level block (Toolbox glossary already aggregates all keyTerms); inline terms = schema-level only (`from_dt`, `days_supply`).
- **Page-3 (Example) template** — confirmed on tasks 1 & 2 (#20/#21 upgraded): examples are too clean; "the learner watches a decision get made; they never make one." Rule: every worked example contains exactly ONE decision defensible either way; the takeaway names the tradeoff instead of resolving it. Task-2 instance: combination product (Drug A + metformin) or authorized generic — in or out?

## Module technical errors found (the un-teach class)

1. **Task 1, page 3:** lab-claims/lab-value conflation — claims show the HbA1c was *ordered* (CPT 83036), not the result.
2. **Task 2, page 3, step 3:** "first fill = start" without washout/lookback — prevalent-user bias, the defining flaw of new-user designs. Fix sentence: *"first fill after a clean lookback window — e.g. ≥6 months continuous enrollment with no Drug A claims."* Also the missed payoff moment: this is where Task 1's enrollment/observability thread should have been explicitly recalled (→ cross-task callback rule, #53).

Both are the same species: *a simplification that's fine for a lesson and dangerous on the job.* → #55.

## Prompt-contract additions (universal, field-agnostic — batch into ONE ~$0.40 verification re-run)

- #36 **Cross-field coherence contract**: every step has a criterion that verifies it; the check tests the concept taught; the example exercises the traps listed. (Found: page 6 rubric silently dropped page 5's observability step.)
- #42 **Givens-honesty**: a task may only require facts the user can actually obtain. No materials → scope the deliverable to a pre-access artifact (data-readiness assessment — legit real-world genre; access-lag is realistic week-1). #30 upgrades later.
- #48 **Module spine = highest-judgment decision** — teach where the misclassification/errors live (e.g. the case-definition algorithm: 1 code vs 2 codes ≥30d vs code+fill), not the vocabulary mechanics.
- #49 **Prior-art rule**: if the field maintains validated artifacts (VSAC/OHDSI/HEDIS/CCW-class), teach find → evaluate → adapt → defend; build-from-scratch is the explicit fallback. Hand-rolling teaches a habit the lead corrects in week 1.
- #52 **Never name a hard question without answering it**: (a) name the 2–3 real conventions, flagged confirm-locally; (b) name the validated artifacts; (c) name the canonical sources (RxNorm / FDA NDC directory-class). Model supplies domain instances — the rule is universal.
- #53 Index-event definitions require lookback qualifiers; **cross-task callbacks** at payoff moments (later task explicitly invokes the earlier concept it depends on).
- #35 Rubric operationalization: grain per table; join-key/patient-ID consistency; "key fields" not "each field"; missing-variables criterion must name expected domain examples.
- #43 `doneWhen` exemplar: codify the reader-perspective functional shape (*"another analyst could read your memo … without opening the files"* — best criterion in the plan) as the prompt's quality bar.
- #31 Steps quality: unbundle compound steps; join-key checks for linked data; inline examples sit at the ambiguity, not the obvious (NDC→drug is a giveaway; `days_supply` = intended-not-consumed teaches).

## Render changes (free, demo-verifiable)

- #33 Criteria + watch-fors visible on the Try page (data already generated; becomes #29's visible rubric).
- #41 Draft skeleton prefill — code-built from `givenInputs` (no new generated field); placeholder rewritten bottom-line-first; "Use template" button as the soft variant.
- #45/#47 **Task-boundary state reconciliation / carry-forward**: task N+1's Brief must branch on the REAL prior draft — empty → honest warning + proceed-anyway choice; written → QUOTE a line from their memo (first moment it feels like a project). Coach endpoint receives prior drafts as context. Generation is correct here (chaining is intentional); render must reconcile.
- #28 Try beat currently zero-interaction; #37 identical □ affordance across Try (inert) and Coach (interactive) — can't share style with split behavior.
- #38 `givenInputs` renders as comma-spliced run-on ("…pharmacy_claims, A partial data dictionary") — structure as a list; future slot for scaffold/extract downloads.
- #32 Option C fallback if grading deferred: typed commitments ("row count you found: ___") instead of bare ticks.
- #39 Footer center-label repeats the beat header on every page.
- #9 One-page review mode (from earlier batches).

## Copy audit (#17, grown)

Rule: every hardcoded kicker/subtitle must pass *"does the page beneath this line deliver it?"* Caught cheques: "Small action, real project"; "Everything you need to do this is above" (false for empirical facts); "retrieving" on the check page; #50 "Start with the job, not the lesson" repeats verbatim on all five module briefs — cut or vary.

## Earlier batches (items 1–27, task-1 pages 1–4 — summary form; full detail in session transcript)

#1 fake givens (`claims_extract` doesn't exist) → synthetic extract; #9 one-page review mode; #11 conceptCore box; #12 context/concept collision (page-1 seam: brief already taught the model); #14 traps merge; #16 first-artifact-by-page metric; #17 kicker audit; #19 inversion-error / epistemic-precision principle (precision softenings: dx-code ≠ disease, pharmacy-benefit caveat); #20 messy examples; #21 micro-exemplar (3-line artifact fragment — later became the scaffold's shape); #24 check-genre upgrade (free-text meeting question, model-graded; joke distractors out; real distractor set as MCQ fallback). Plus: open/closed claims should be TAUGHT not asserted; enrollment warning placement; lesson-creep pacing; duplicate "Readiness Project:" label; 4/8 pages with no word written (pre-reshuffle symptom).

## What's consistently GOOD (don't spend prompt effort here)

Bridges (measles → code sets; sensitivity/specificity as "a tradeoff you already know") and **askYourTeam** blocks are reliably the best generated content. Insider lines to promote, not rewrite: "registry with three catches," "patient counts differ wildly between tables," "the value set is where the disagreement lives," the reader-perspective doneWhen. Handoffs between tasks are concrete and project-like.

## Decisions needed from Sissi at consolidation

1. #40 beat reshuffle (her grammar — her call; recommended yes).
2. Synthetic extract (#30) now vs. after the B-scaffold ships.
3. Sampling plan for the unreviewed surface (task 2 remainder, tasks 3–5, readiness project) — task 2 was the direct dependent; the readiness project is where everything converges.

## Consolidation plan (when she calls the review done)

Split into: (1) **close-the-loop features first** (her ordering directive: "stop tuning prose, build page 6 for real") — wrap gate, coach endpoint, reshuffle, skeleton, carry-forward; (2) **prompt edits** batched into one ~$0.40 verification re-run; (3) **template/render fixes** verified free in demo mode; (4) decision items above.

## Round 2 (2026-07-12): mock-mode confusion + the live role-only run

**Context:** Sissi's browser had `lb_mock=1` persisting from old demo links, so her first "role-only" screenshots were the canned sample being served against real inputs (no generation, no hallucination — the epi background was Persona-1 demo content). She then ran a REAL role-only generation (~$0.40): the cold-start test #56, answered early.

**#56 RESULT — cold-start largely PASSED live:** no invented background ("✓ Starting fresh"), no invented employer, horizon explicitly "assumed default." The residue is #60.

| # | Finding | Class | Status |
|---|---|---|---|
| 56 | Cold-start honesty | test | **run — passed core; residue → #60** |
| 57 | "Coming from" selector before generating (Codex Option 2) — gives every bridge a real footing | feature | open |
| 58 | Mock-leak UX: real form inputs while `lb_mock=1` silently serve the sample (burned Sissi); louder banner or auto-exit on real submission | render | open |
| 59 | Demo: introduce Meridian as a stand-in; "2 questions" needs a worked example (#21 instance) | copy/prompt | open |
| 60 | "You today" chips are assertions ("✓ **If** you have ANY spreadsheet experience" — a conditional wearing a checkmark). Make them unticked clickable inputs, pointing the existing I-already-know-this mechanism at the top node | render+feature | open |
| 61 | **Dependency-order bug in role-only run**: cohort definition (stop 2) before codes/value sets (stop 3) — a cohort def IS a value set + temporal rule. Prompt: stop-order contract ("no stop requires an artifact a later stop produces") + a dependency-check dimension for the plan checker | prompt + checker | open — prompt batch |
| 62 | Hardcoded roadmap promise "Nothing on this road assumes anything you don't already have" — false for a fresh starter facing confounding adjustment at stop 4 | copy | **FIXED** — scoped down to "each stop is built from the one before it" |
| 63 | Beginner depth calibration: starting-fresh plans need a confounding-from-zero stop before adjustment/balance stops, and timeboxes calibrated to the STATED background (stop-4 "1–2 days" is epi-calibrated, not beginner-calibrated) | prompt | open — prompt batch |
| 64 | **Double-bill on mid-generation refresh**: gen cache saves only on completion; refreshing during the ~2-min generation refires a full paid call (her role-only run logged twice). Needs an in-flight guard or generation-started marker | render | open |

**Spend armor added the same day:** (a) `/api/plan` now 400s on effectively-empty payloads before billing (a stray '{}' fetch from testing cost ~2 generations — my error, now impossible); (b) the restore gate lists ALL saved plans (picker with date/hook/task count), not just the newest, so Persona-1 and the role-only plan coexist loadable.
