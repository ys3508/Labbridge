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

---

# Rounds 2-final (items 71-101) — merged from session notes

# Ledger additions during no-touch review (write to revise/plan-review-notes.md at batch time)

Context: Sissi reviewing the NEW 5-stop role-only plan (task 1 of 5, "Profile a claims extract and write a data-shape memo"). ~6 real generations billed to date (2 hers intended, ~2 refresh-leak #64, 2 mine accidental—guarded). No repo writes until she declares review done.

## Items 71–75 (71–73 from briefing/brief round, already in chat)

- 71: Goal↔teaching coherence — goal demands "three stated limitations," brief teaches one. The three: billing-vs-truth, enrollment/observability, missingness. → #36 contract.
- 72: Professional vocabulary must survive — "grain" dropped this run. Prompt: name the professional term when teaching its concept.
- 73: Run-to-run structural variance — stops appear/disappear (codes module in 6-stop run, absent in 5-stop), quality fluctuates. Single-run review can't distinguish fixed from lucky. Mitigations: dependency-order contract, checker enforcement, consider lower temperature.
- 74: **Metformin corroboration error (un-teach error #4).** Example step 2 teaches "drug fill corroborates diagnosis" — metformin is non-specific (prediabetes, PCOS, off-label). Codex's fix rewrite recorded: "suggestive... narrows possibilities; doesn't confirm... why cohort definitions require code AND fill, or repeated codes." General rule for prompt: teach signal strength honestly; weak-signal stacking ≠ confirmation. Plants seed for cohort-def stop.
- 75: **#24 addendum — distractor quality bar.** Current check: correct answer is the only option in the plan's vocabulary and the longest. Rules: length-match options; every distractor tempting to a smart reader. Codex's exemplar set: (correct) someone billed for service w/ that code · (subtle) a clinician evaluated the patient for diabetes that date · (tempting) active diagnosis in chart that date (rule-outs, copy-forward) · (plausible nonsense) seen by a provider who has diabetes patients. Also kill "Answer from what you just read" kicker when genre upgrades.

## Standing decisions awaiting Sissi at batch time
- #70 THE FILE (now blocking-severity per Codex round 3): build seeded diabetes_claims_extract.csv + data_dictionary.pdf (~400 patients; rule-out dx rows, metformin-only patients, lab CPT w/o result col, enrollment gaps, service-vs-billing date drift, fills before first dx) — Codex offered to build; Claude can equally; zero API. OR rescope givens to pre-access readiness memo (#42). "Every improvement to the frame increases the distance the user falls when they reach for the file."
- #40-class: none new.

## Keepers/exemplars to pin in prompt batch
Receipts analogy ("guess what someone cooked — receipts are real, don't tell you the full meal"); "it proves someone billed for it"; privacy/data-access askYourTeam question; reproducibility-as-acceptance-criterion phrasing; "not vague hand-waving" criterion phrasing; billing-vs-service-date trap.

## Attribution note (for consolidation)
Render fixes (Try job+bar page, numbered steps, glossary pointer, wrap gate, coach UI) = code = stable every run. Content quality = variance until prompt batch lands. Codex's "fixed" credits in rounds 2–3 mostly = code fixes (stable) or dice (EHR wording, confounding stop).

## Items 76–83 (Draft/Coach/Wrap/Task-2 rounds)
- 76: Draft filename extension honesty — .pdf/.docx labels on textarea-produced markdown; drafts should be .md (also cohort_spec_template.docx phantom).
- 77: Cut "No extra reading attached to this task" line.
- 78: Coach checkboxes → predictions ("Tick what you think holds; the review will tell you if you're right") — calibration lesson.
- 79: Watch-for duplicated on Try + Coach; keep on Try only.
- 80: Wire concept.traps into /api/coach red-flag input (fluent-but-wrong test: caught metformin, half-caught HbA1c, missed "drugs took"; traps data exists in plan, just not sent). Sonnet fallback if recall short.
- 81: "Asked but not taught" confirmation — Task 2 lead says "NEW metformin starters"; the newness definition (clean lookback, no prior fills) lives in askYourTeam, not the teaching body. Instance of #52/#53.
- 82: Cross-task silent correction — Task 2 teaches multi-code convention that contradicts Task 1 Example's metformin lesson without acknowledging it; later corrections must be explicit callbacks (#53 family).
- 83: Vocabulary consistency — generated text says "module 1," UI says "task"; prompt should pin "task."

## Keepers added
Recipe/two-cooks analogy (reproducibility); "vague rules destroy trust" stakes line; attrition table as deliverable (best goal in any version — CONSORT-style, criterion-cost visible); washout + code-count askYourTeam pair.

## Codex's closing verdict (review effectively terminal)
"The scaffolding is finished. The center is empty." All remaining findings will be variations of #70 until the file exists or the naming stops. Repairs credited across the cycle: hallucinated background, criteria ordering, checkbox theater, self-check-before-draft inversion, fake completion, phantom state inheritance, EHR error, lab-value conflation, missing confounding stop.

## Task-2 Model/Example/Check/Try round
- 84: Skimmer-safety rule — Example step 1 states the naive rule ("index date = first fill in the data") as if final; step 3 corrects it. Qualifiers must ride WITH the claim they qualify, not arrive two steps later. Intra-page cousin of #82.
- #75 updated: Check page = the ONLY component with zero improvement across every run/rebuild (5th confirmation). Second exemplar distractor set from Codex: single-code-may-be-rule-out (right) / ICD versions change (true, irrelevant) / insurers audit single-code claims (authoritative, wrong) / one code can't establish index date (conflates two ideas). Elevate within batch.
- #83 confirmed again ("module 1" vs task; .pdf).
- Washout NOW correct this run (Example step 3 exclusion + look-back) — variance, but proves prompt-reachable; #53 pins it.

## Keepers added (pin in prompt batch)
"Write the spec BEFORE you touch the data — deciding rules while looking at results invites bias" (Codex: most important sentence in the plan); trap "look-back silently drops short-history patients — note how many you lose"; the full spec exemplar sentence ("aged 18+, 2+ dx codes ≥30 days apart, 6 months prior data, first metformin fill = index"); attrition takeaway ("series of defensible choices... each removal counted and justified"); adversarial criterion "spec was written before inspecting any outcomes" + its watch-for.

## Codex verdict on Task 2: strongest task in product; Model page "would survive a hiring manager"; blocked entirely by the missing file (attrition table is pure counting).

## Task-2 Draft/Coach/Wrap round
- 85: Draft placeholder + "memo shape" button label are HARDCODED (my copy) and Task-1-flavored — wrong artifact prompt for task 2+ (spec+attrition ≠ memo). Note: draftTemplate skeleton DOES adapt (sections from task steps); the fixed framing (bottom-line memo language, placeholder, button label) doesn't. Fix: derive framing from task.deliverable; spec-style skeleton when deliverable is a spec. High-leverage one-liner.
- 86: NodeResources "1 analyst-vetted source" — architecture answer: REAL, verify-and-drop (OpenAlex/OpenLibrary/oEmbed server-verified; model never authors resources; links open to the catalog). Codex suggestion: name the source inline instead of behind a disclosure (minor render).
- #76 confirmed + resolution: ext inferred from title ("memo"→.pdf, "specification"→.md) — force .md for all drafts.
- #70 SHARPENED by task 3 ("Calculate incidence rates" — numerator/person-time, pure computation, no paper version exists): Option A ship extract; Option B' (Codex, new): restructure compute-tasks into no-data job-shaped artifacts — critique a supplied flawed calculation / pre-register analysis decisions / write limitations section for supplied results. Deliberate design, not fallback. Decision forced before task 3 is reviewable.

## Task-3 round (Brief/Model/Example/Check)
- 87: askYourTeam non-redundancy rule — task 3 asks about censoring, which the Model page just taught. Ask blocks must ask only what the plan CANNOT know (team-specific); never duplicate the teaching.
- 88: Warning-stacking — carry-forward ambers chain (task 3 warns about task 2's empty file which warned about task 1's). Design assumed a user who CHOSE to skip; with no data it's the default state for everyone. Resolves with #70; render note: consider collapsing repeat warnings.
- #70 B' instantiated for task 3 (Codex): supply an error-seeded results table, learner finds defects; seed the 3 Model-page traps (A counted full 12 months; rate w/o raw numerator; ratio w/o base rates). "QC-ing a colleague's table is most of the job." Harder than the arithmetic, needs no data.
- #75: 6th confirmation. Codex ultimatum: real distractors or DELETE the Check beat (a check that can't fail anyone = 1/8 of every task spent on nothing).
- Keepers: 3-patient person-time worked example (best-executed page in product — keep permanently); "a doubling of a tiny risk is still tiny" (most commercially relevant line); "report raw counts alongside the rate"; censoring taught explicitly.
- Cliff confirmed: task 3 deliverable = all computed cells; no reasoning path; tasks 1-2 had document fallbacks, task 3 has none.

## Task-3 Try/Draft/Coach/Wrap round
- 89: NEW PATTERN to pin — criterion and watch-for as MATCHED PAIRS (test + its failure mode): "person-time stops at event/exit" ↔ "your person-time counts full follow-up even for early events." First clean instance; make it the prompt's rule for generating criteria/redFlags.
- #85 extended: template must be deliverable-TYPE-aware — memo skeleton / spec skeleton (index date, in/exclusion, windows, attrition) / TABLE skeleton (markdown table: Cohort|Events|Person-years|Rate + censoring-rules line). Placeholder verbatim-identical across 3 different artifact types = confirmed hardcoded bug (mine).
- #79 confirmed verbatim duplication (Try + Coach watch-fors).
- #86 pushed again: surface the vetted source inline (it IS architecturally real — verify-and-drop).
- Keepers: "Done when: the rate can be recomputed by hand from the counts you show" (best done-when in plan — a test a reader can RUN); "you report a rate with no counts, so no one can check it" (unverifiability phrasing).
- #70 final framing (Codex): "There is no first keystroke available to an honest user." / "The honesty is working perfectly. What it's honestly reporting is that nothing can be done." Door A (data) vs Door B (error-seeded QC artifacts) vs A+B'. Door B shippable immediately, preserves all teaching; A better; neither = most polished pages are the ones nobody can act on.

## Task-4 round (Brief/Model/Example)
- 90: Name the instrument — "measure the imbalance" taught without naming SMD or the 0.1 convention. Universal rule (cousin of #52): when teaching "do X," name the standard metric/tool/threshold a lead will ask for by name.
- 91: Motivate the next method by the current one's limit — stratification's empty-cell explosion is WHY propensity scores exist; plan names PS without the problem it solves. Universal: never introduce an advanced method without the failure that motivates it. One line fixes.
- 92: Show the canonical artifact shape once — "Table 1" named, never shown (rows=covariates, cols=groups, mean(SD)/n(%), SMD column). Kin of #21/#85. Universal: named-artifact deliverables get their conventional layout displayed.
- Phantom file #6: "a comparator cohort file" (never previously mentioned). Chain now 4 deep (T4→T3 rates→T2 cohort→T1 memo→CSV that never existed).
- #70 Task-4 Door-B instantiation (best yet): supply a COMPLETED, badly imbalanced Table 1 (age 71 vs 46, SMD 1.2, raw RR 2.4) → learner writes the note: why the lead can't publish 2.4, which confounders visible/invisible in claims, what next. Real analyst memo, zero data, exercises every model-page concept.
- Keepers: mediator/overadjustment trap ("ahead of most published tutorials"); "measure the imbalance before you try to fix it"; "no adjustment can fix a confounder you didn't measure... stated with humility"; premium-shoppers analogy (mechanism not vibe); two-part confounder definition; "who reviews covariate balance before results go out?" ask question.
- Codex overall: Task 4 teaching = best in plan, "better than most graduate methods courses"; also the single most unbuildable task.

## Task-4 back half (Check/Try/Draft/Coach)
- 93: Sensitivity-analysis habit as standing pattern — Try step 4 ("re-run with different age banding; does your conclusion hold?") is the smartest instruction in the plan (Codex). Prompt rule: every Try whose deliverable rests on arbitrary choices includes one "re-run under a different choice" self-test step.
- 94: CHECK PAGE FINALLY WORKS (first in 4 tasks) — capture WHY as the #75 fix's exemplar: (a) scenario-classification stem, not recall; (b) both definition prongs stated in the stem, learner recognizes the pattern; (c) one distractor from an ADJACENT task's concept ("censoring event" tempts the Task-3 half-learner). Prompt batch can point at this in-product exemplar: "generate checks like this one."
- #76/#85 ESCALATED: extension chaos confirmed (.pdf/.md/.md/.csv across tasks) — .csv promised on a plain textarea with a prose placeholder and "memo shape" button = three artifact types promised in 200px. Mixed deliverables (table + note) need type-aware structure: markdown-table skeleton + prose section, all .md.
- #86 again (2 sources now): canonical real sources exist for this topic (Austin PS papers, STROBE/RECORD, ISPE/ISPOR) — pipeline is verify-and-drop real (RECORD already in demo resources); render should name them inline.
- Keepers: "Each named confounder meets both parts of the definition" criterion; mediator watch-for restated.
- Codex structural verdict FINAL: "The teaching is done. It's good. The only thing left in this product is the data — every additional page you polish increases the gap between how good it looks and what it can do."

## Task-5 round + Codex global verdict (all 5 tasks now reviewed)
- 95: **DOOR C — supplied-artifact strategy** (Codex's cheapest path): don't ship a dataset; ship FOUR FILLED example artifacts (data memo, cohort spec, rate table, imbalanced Table 1). Task 5 (writing) is fully doable today with them; run the plan backwards (T5 first, highest-value); T4/T3 become critique-the-artifact; T1-2 mostly work already. "A day of writing, not an engineering project."
  ⚠ CLAUDE'S ADJUDICATION NOTE for consolidation: Codex reviews the RWE instance, but plans are field-agnostic and generated per-user. Hand-authored artifacts only work for fixtures/demo. For live plans the artifacts must be MODEL-GENERATED per plan — either (a) at plan time (more output tokens) or (b) on-demand per task ("Generate my starting materials" button, pennies, cached, labeled synthetic). Numbers in synthetic artifacts are internally-consistent fiction, which is fine WHEN LABELED — aligns with honesty architecture. This is the key design question for Sissi's #70/#95 decision.
- 96: Task-5 placeholder almost-right by coincidence (limitations-flavored) — still the #85 bug, 5th confirmation. findings_summary_template.docx = phantom file #7.
- Keepers (Model page = strongest single page in product): "reviewers trust you MORE when you name limitations"; associated-with vs caused rule; translate-technical-to-clinical w/ the two-codes example (= a WORKING cross-task callback, exemplar for #53); "a busy physician reads it once and knows what you found and how much to believe it" (acceptance test); "clarity plus calibrated humility"; Example takeaway "the same finding stated without limitations would be misleading, even if the numbers were identical"; sign-off + statistical-detail ask questions.
- CODEX FINAL GLOBAL VERDICT: teaching better than most paid RWE training (T2/T4/T5 model pages interview-grade); integrity work complete and holding; exactly one problem left (inputs don't exist) and it's cheaper than assumed (artifacts, not data).

## REVIEW STATE: all 5 tasks reviewed on live role-only plan. Readiness project un-reviewed (optional). Consolidation ready on Sissi's word.

## Task-5 back half (Check/Try/Draft/Coach) — REVIEW OF ALL 5 TASKS COMPLETE
- 97: Task-5 Check = worst in plan ("a loyalty test" — distractors are behaviors the plan just forbade). Codex's scenario replacement = SECOND check exemplar (with #94): "RR 0.6 but Table 1 shows 12-yr age gap — which revision is required?" incl. the subtle distractor "add a confidence interval" (good-sounding, insufficient). Check rebuild uses #94+#97 as the pattern pair.
- Keepers: "reread as if you were a skeptical physician and flag any claim stronger than your evidence; revise" (crown jewel — adversarial self-review with a named adversary; the #93 habit's strongest form); done-when "no claim exceeds what the method supports"; criterion that NAMES THE ANTI-PATTERN ("not generic disclaimers") — pin as criterion-writing pattern; "no causal language unless design justifies it" (binary, checkable); cherry-picking as an INTEGRITY watch-for alongside technical ones.
- Phantom artifact tally final: 8 (incl. findings_summary_template.docx, "deliverables from modules 1-4").
- CODEX FINAL PUNCH LIST ("none of it is a rebuild; it's a week"): (1) un-hardcode draft placeholder [#85]; (2) rebuild 4 Check pages on the Task-4 scenario pattern [#75/#94/#97]; (3) supply the four upstream artifacts — replaces the synthetic dataset entirely [#95 Door C + Claude's field-agnostic generation note]; (4) verify-or-remove analyst-vetted sources [#86 — architecturally real; render should name inline].

## Readiness project + final wrap — 100% COVERAGE (briefing + 5 tasks x 8 beats + project)
- 98: Final-task wrap bug (MY hardcoded string): amber warning says "the next task builds on this file" on task 5/5, directly above "That's the last task." Fix: condition on nextLabel — last task gets capstone phrasing (Codex's copy: "This is your capstone deliverable and it's empty. Nothing downstream depends on it — but it's the artifact you'd actually show someone.")
- 99: "That's the last task — your project is assembled" — hardcoded claim, false at 0/5 files. Make state-aware: assembled only when files exist; honest variant otherwise.
- 100: **The plan describes its own fix**: Observe phase = "read a COMPLETED cohort spec and findings summary, REPRODUCE one analyst's patient counts from their spec." That IS Door C's supplied artifacts, named by the generator as the correct first-month activity. Build them → the Observe phase becomes the product itself instead of a hypothetical employer arrangement. (Strongest argument for #95.)
- Keepers: Observe→Assist→Own arc (best structural idea in product); reproduce-a-colleague's-counts as the rite of passage; "Illustrative — a representative arc" disclosure (honesty at top level); pace note attributing the horizon to the missing input.
- CODEX FULL-PLAN VERDICT (all 40 pages + bookends): content good enough to ship; integrity done and holding; four small defects (placeholder #85, four Check pages #75/#94/#97, final-wrap string #98/#99, sources #86) + one substantive gap (#70/#95: nothing exists to work on) — "every path out runs through the same door, and the plan itself just told you where it is."

## LEDGER FINAL COUNT: 100 items. Awaiting Sissi's "review complete" to consolidate.

- 101 (SISSI, final item + GO signal): "I don't like current plan personally — I don't even feel like it needs 90 days, only 3 hours is enough." → DUAL-CLOCK defect: tasks priced in job-world time (half-days, 90-day arc) while the experience is workspace time (~30-60 min/task ≈ 3h total). Fix: timeboxes = honest in-app production time; roadmap sums to hours; 90-day arc demoted to job-ramp context footnote. Her go-ahead: "after I come back, we changed everything based on review."

---

# Verification-run review (Jul 14-15) + second action batch — RESOLVED

The full-persona run confirmed the prompt batch (hours timeboxes, dependency order, honest cold-start AND persona bridges, washout centerpiece, scenario checks) and surfaced the materials-layer bugs (entity drift: Drug A = metformin/gemcitabine/three dose ladders; claims-vs-EHR world drift; E11.0+E11.2 wrong code pairings; E13 in a T2D list). Codex's fluent-wrong coach test passed 4/4 on M002.

**Batch 2 shipped (Jul 15):** plan-scoped world CANON for materials (entity sheet — first generation writes it, every later task reuses it; verified live: NDC family/brand/strengths/IDs all held) · reference-docs-must-be-correct rule + Opus fact-check pass on coding references (verified live: all 12 E11 subcodes correct after the pass) · auto-generate materials on Try/Draft arrival + Brief pointer + download links + CSV renders as a real table · draft template button prefers the plan's own generated template · Model beat: compact-model hoist box + "From the field" verified anchor surfaced (was buried in the Draft drawer — the "thin and boring" fix) · WEB_AUGMENT back on + select-stage "prefer the anchor" rule · coach receives the cached materials (empirical claims now checkable) · regenerate guard when a draft exists · "(from task N)" givens annotated with the real file + state · check length-tell + stem-keyword rules in the prompt · plan-scoped materials cache (the stale-leak bug).

**Deferred with specs:** in-browser data workspace (revise/data-workspace-spec.md), video pipeline (needs Sissi's free YouTube key), and the TASKS.md honest-ledger additions.
