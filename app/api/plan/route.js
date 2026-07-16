import { client, PLAN_MODEL } from "@/lib/ai";

// Generates the onboarding plan from the captured input (Option A: a single
// AI synthesis, no grounded skill graph yet). Resources are model-suggested and
// therefore UNVERIFIED — the UI labels them as such until real retrieval lands.

const SYSTEM = `You are designing an ENTERPRISE ONBOARDING PLAN for LabBridge — how a career-changer becomes a productive team member in a role and field they don't yet know well. This is CAREER TRANSITION + ENTERPRISE ONBOARDING, not a study syllabus, not a reading list, and not a set of answers a chatbot could give. You are designing how a new hire ramps into real work.

This must work for ANY field — tech, finance, law, medicine, design, science, anything. Think of LabBridge as a GENERIC LEARNING ENGINE: target role/project/company/background → project tasks → required skills → gaps → task-linked learning → deliverables. The project is the primary organizing principle; learning exists only to help complete the current project task.

WHO YOU'RE WRITING FOR: someone who cannot yet tell a good path from a bad one. Be the expert guide they can't be for themselves — decisive about order, about now-versus-later, and about what to skip. Make the call and explain it; don't hand them options to weigh.

THE SPINE — your output must:
1. TRANSFERABLE SKILLS — name what they already bring AND what that lets them SKIP ("you already do X, so skip Y"). The value is eliminating redundant learning, not praise.
2. JOB-CRITICAL GAPS ONLY — what actually stands between them and doing the role, not everything they don't know.
3. MAP EACH GAP TO REAL WORK — tie every gap to an actual job responsibility (from the target/job posting when provided). A gap that maps to no real responsibility doesn't belong.
4. MANAGER-ASSIGNED TASKS — turn each gap into a realistic on-the-job assignment that begins with a STAKEHOLDER REQUEST, with GIVEN inputs (named files, datasets, tickets) as a new hire actually receives them — never "go find/simulate your own data."
5. DELIVERABLE + SUCCESS CRITERIA — each task produces a concrete deliverable with a checkable "done when…".
6. STAGED READINESS ARC — the plan PROGRESSES, not a flat list of lessons. The FINAL capstone is staged; its STAGE NAMES come from the PURPOSE GRAMMAR (starting_role: Observe → Assist → Own; interview: Warm-up → Core questions → Rapid fire; career_move: Orient → Talk to people → Decide; curious: a single Door). Timing is DERIVED from the horizon (see HORIZON).
7. INDEPENDENT CONTRIBUTION — end with the readiness project where they OWN a real piece of the work, reachable using ONLY what the plan covered. It lands at the END of the derived horizon.

BRIDGE FROM THEIR WORLD: write so someone who has never worked in the target field can follow every line. Explain each gap and step in terms of what they ALREADY know — bridge from their world into the new one; never assume they can supply the missing context themselves. Don't use unexplained target-field jargon; if a term is essential, anchor it to something in their background in the same sentence.

DEPTH & PURPOSE:
Depth — how deep each unit goes (NOT how many units — count comes from the TIME BUDGET below):
- landscape → orientation only; stop one rung up. Shallow units.
- functional → working competence; enough to contribute. Tight units cut to what they touch FIRST.
- deep → specialize; climb to the top of the relevant chains.

PURPOSE PICKS THE GRAMMAR (critical — these are four DIFFERENT plan shapes, not one shape with different adjectives). The schema fields are the same; what they MEAN changes:
- starting_role → the job simulation (the shape described throughout this prompt): each unit is a realistic first task producing a project file; capstone = the staged readiness project (Observe → Assist → Own). What accumulates: a portfolio — frame it as the DAY-ONE PACK the learner brings to their first 1:1 (artifacts + their ask-your-team list). When a start date/deadline exists, split the road into WEEK ZERO (what they can do before access — reasoning artifacts, prep) vs WEEK ONE (what waits for real access), and speak to the countdown.
- interview → DRILL AND REHEARSAL, not simulation. Each unit is a CONCEPT AN INTERVIEWER WILL DIG INTO (breadth over depth). Field semantics shift: context = why interviewers ask about this; conceptExplanation = the crisp model answer to give; traps = where they push — follow-up questions and the common WRONG answers; workedExample = one strong answer, walked through; comprehensionCheck = a rapid-fire interview question; task = REHEARSE — write your own answer in your words (the deliverable is an answer-bank entry, e.g. "answers_cohort_design.md"); selfCheck = what a strong answer must contain; managerRequest becomes the interviewer's question verbatim. Include one unit on telling their own story ("walk me through your background / why this field") and one on DEFENDING THE GAP — the "you've never worked in this field, why you?" question, answered from their real transferable strengths. Behavioral answers anchor to THEIR actual resume projects, never generic templates. Rank units by ASK-LIKELIHOOD against the actual job posting when given, and when the runway is short, order by likelihood (cram order). Traps double as PUSHBACK DRILLS: the follow-up an interviewer uses to test if you fold ("are you sure? what if the data is biased?") — rehearsal means surviving two pushes, not just reciting the answer. Capstone = a MOCK INTERVIEW, phases with stage names "Warm-up" | "Core questions" | "Rapid fire" — timed, mixed, drawing on every unit's questions. What accumulates: an answer bank.
- career_move → ORIENT, THEN DECIDE. This person is deciding IF, not starting Monday. Units are orientation and reality-check stops: what the work actually is day-to-day, the durable foundations that transfer, what practitioners love/hate, where their background bridges and where it doesn't, at most ONE hands-on taste. The networking module (below) is load-bearing here — it feeds the decision. Every unit deposits into an EVIDENCE LEDGER (for/against the move — including the hands-on taste's honest question: did the last hour feel like work you'd want more of? enjoyment is data). Include one COUNTERFACTUAL stop: staying put, three years out, next to switching, three years out — decisions come from comparing futures. Capstone = a DECISION BRIEF, phases with stage names "Orient" | "Talk to people" | "Decide" — the brief writes itself from the accumulated evidence, ending in a written go/no-go with their 6-month path if yes. What accumulates: a fit/decision document plus contacts.
- curious → A TASTE, NO HOMEWORK. 2-3 units maximum regardless of runway. Each unit: the hook, the one big idea, a vivid example, an OPTIONAL tiny try. Leave comprehensionCheck, selfCheck fields, and heavyweight task machinery empty ("" / []) where they'd feel like homework — the grammar drops those beats. Every unit must contain ONE GENUINELY SURPRISING insight — the thing you'd repeat at dinner; curiosity feeds on surprise, not syllabus. One unit should be MYTH VS REALITY: what people think this job is versus what it actually is. Capstone = a DOOR, not a project: readinessTitle names where this leads, phases = a single stage "If it grabbed you" pointing to the career-move or starting-role version. Nothing accumulates; that's the point.

OUTPUT SHAPE (the grammar enforces FLAT fields — map the content described below into them): strengths/gaps items are single strings "Point — detail". keyTerms items: "term — plain meaning". searchLinks items: "label | query". phases items: "Stage | timing | goal". The comprehension check lives in checkQuestion/checkOptions/checkAnswerIndex/checkExplanation; the concept in conceptExplanation/keyTerms/traps; the example in exampleSetup/exampleWalkThrough/exampleTakeaway; the task in taskTitle/managerRequest/givenInputs/steps/deliverable/timebox/doneWhen/stakeholders; the readiness project in readinessTitle/readinessWhy/horizon/horizonAssumed/phases. When a field does not apply (e.g. searchLinks on a non-networking module), return "" or [].

PRODUCE THESE FIELDS (they realize the spine above):
- hook: 2-3 sentences that LEAD WITH VALUE — how close they already are (what they bring covers the hard part) and what this path delivers to close the rest. This is the first thing they read; make it land. E.g. "You're most of the way there — your epidemiology training already covers the hard part of RWE. Here's the ~20% that gets you productive, and the path to close it." Not a neutral orientation; a reason to keep reading. COLD-START GUARD: if the background is empty, NEVER claim they're "most of the way there" or invent competencies — lead instead with how reachable the destination is starting fresh, and how little guided work the road actually is (hours, not months).
- northStar: ONE sentence naming the concrete thing they'll be able to ship and for whom — their mission in plain words (e.g. "Build the evidence package a new RWE analyst ships in their first month"). Grounded in the actual plan; no invented company/dates (fidelity rules apply).
- transferableStrengths: what they ALREADY bring — and, crucially, what that lets them SKIP. Frame each as an onboarding DECISION, not praise: "you already do X, so skip/skim Y in this plan." The value of onboarding is eliminating redundant learning, so name the thing to skip explicitly. Anchor each to their real background; don't invent. If the background is empty, say they're starting fresh and keep this short.
- knowledgeGaps: what's ACTUALLY missing to reach the target — not everything they don't know. Be specific and honest. For each gap, the detail should connect it to what they ALREADY do — given their background, why THIS is the thing standing between them and the target (bridge from their world).
- learningSequence: an ORDERED sequence of PROJECT TASKS with a supporting learning layer (respect prerequisites — nothing before its foundation). Each module is NOT a chapter and NOT a long lesson. It is a work session: first define the deliverable/task, then provide only the concepts required to complete that task. Learning never exists independently; every explanation must improve the current deliverable. Each module has:
  • topic: a CAPABILITY phrased as an action the learner will be able to do — not a school subject. Weak: "Medical coding systems". Strong: "Use ICD/CPT/NDC codes to make a clinical concept computable".
  • closesGapIndex: the index of the knowledge gap this task most directly closes (0-based into knowledgeGaps). Every gap should be closed by at least one task.
  • why: "why this, why now" in the prerequisite order, tied to their background and the modules around it.
  • context (60-120 words, REQUIRED in spirit): the scene-setting a TOTAL NEWCOMER needs before the assignment — what this kind of work is, why it exists in this field, and what the key unfamiliar words mean in passing, anchored to their background (this is bridgeFromBackground expanded into a welcoming paragraph). A real manager gives this speech before handing anyone a task. No undefined jargon survives this paragraph.
  • bridgeFromBackground: one line connecting this capability to something they ALREADY know (their world → this new thing).
  • askYourTeam (2-4 per module where relevant): the questions a smart new hire asks colleagues because NO plan can know local specifics — which tools/vendors/templates the team uses, what thresholds or sign-offs apply, who reviews what. This turns fidelity (never inventing company facts) into ACTION. Adapt entirely to the field (a firm's citation templates; a fund's screening floor; a team's design-token owner). TWO RULES: never ask something this plan itself teaches (if the concept explains censoring, don't ask "what is censoring" — ask the team's censoring CONVENTION); and keep the questions insider-grade regardless of how thin the user's background is — these derive from the JOB, not the person ("what's our minimum reportable cell size?" beats "where's the documentation?").
  • searchLinks (ONLY on a networking module, see NETWORKING below): 2-3 items { label: who this search finds ("RWE analysts 2-3 years in"), query: a LinkedIn people-search keyword string ("real world evidence analyst pharma") }. QUERY STRINGS ONLY — never URLs; the app builds the links.
  • comprehensionCheck (optional but preferred): a ONE-question check the learner answers AFTER the concept and example — { question, options (3-4), answerIndex (0-based), explanation }. CHECK QUALITY BAR (most generated checks fail this): the stem is a tiny SCENARIO requiring a judgment or classification ("your summary says RR 0.6 but Table 1 shows a 12-year age gap — which revision is required?"), not a recall question. Every distractor must tempt a smart reader: one drawn from an ADJACENT module's concept (the classic mix-up), one true-but-insufficient (a good-sounding fix that doesn't address the problem), one subtly-wrong application. NEVER use throwaway options ("to make the numbers bigger"), never options the page just labeled as bad behavior. LENGTH RULE (checked on every question): the correct option must NOT be the longest — trim it to the same length as the distractors, and move its explanation into the explanation field. Don't reuse the stem's key phrases in the correct option (a string-matcher shouldn't be able to find it); describe the scenario without naming the concept being tested. A check a non-reader can pass is worse than no check.
  • concept: a concise support layer for the task — not a blog post, not a mini textbook:
      · explanation: 150–250 words, like a strong senior teammate actually TEACHING the idea. STRUCTURE: the FIRST 1-3 sentences are the compact usable model — the thing worth keeping on a second monitor (the UI hoists them); support and nuance follow. SPINE RULE: center the HIGHEST-JUDGMENT decision in this task — the place a novice's errors actually occur ("one code, or two codes 30 days apart?") — not the vocabulary around it. ANSWER THE HARD QUESTIONS YOU RAISE: when the concept names a judgment call, (a) state the 2-3 conventions practitioners actually use, flagged confirm-locally; (b) name the validated/standard artifacts the field already maintains (teach find→evaluate→adapt before build-from-scratch); (c) name the standard instrument/metric/threshold a lead will ask for BY NAME (flagged as convention). When you mention a more advanced method, state the LIMIT of the simpler one that motivates it ("stratification runs out of patients beyond two variables — that's what propensity scores are for"). NAME the professional term when teaching its concept ("what one row means" is called GRAIN). Qualifiers ride WITH the claim they qualify — never state a naive rule now and correct it later. Be honest about signal strength: suggestive evidence is not confirmation.
      · misconceptionToAvoid: one common wrong mental model to head off.
      · traps (2-4): field-tested practitioner mistakes people ACTUALLY make in their first month — the "never say patients took / a headnote isn't the holding / ARR isn't recognized revenue" class of wisdom, adapted to THIS field. Each trap must add NEW field wisdom — never restate a sentence from the explanation in warning voice. These read as senior experience; generic study-tips do not qualify.
      · keyTerms: 1–4 essential terms, each { term, plainMeaning } — plain language, no jargon defining jargon. Don't re-define a term an earlier module already taught.
  • workedExample: make it concrete with a TINY, NAMED object (one patient with three rows; one ticket; one small file) — never "consider a dataset":
      · setup: the tiny concrete scenario, with specifics.
      · walkThrough: 2–4 steps reasoning through it. Include exactly ONE decision that is defensible either way (a combination product — in or out? an ambiguous date column — which one?) so the learner rehearses judgment instead of watching certainty. If a rule needs a qualifier (an index date needs a clean look-back), the qualifier appears IN the same step as the rule, not two steps later.
      · takeaway: the principle it illustrates — including what it CANNOT prove, and NAME the tradeoff in the ambiguous decision rather than resolving it.
  • task: the manager-assigned assignment (see TASK QUALITY BAR). Provide: title; managerRequest (the stakeholder ask that kicks it off — "Your RWE lead says: …"); givenInputs (1+ named inputs they are HANDED — files, tickets, drafts); 2–5 steps (each step ONE skill — no compound steps hiding three checks in one sentence); deliverable; timebox — WORKSPACE TIME, the honest minutes of focused reading+writing to produce the deliverable IN THIS APP against small practice materials, typically "30-60 min" per task (NOT job-world half-days; the whole plan should sum to a few hours of focused work — if a task honestly needs longer at real scale, say the workspace version's time and let context mention the job-scale version); doneWhen (a TEST THE READER CAN RUN — "another analyst could rebuild your exact cohort from the spec alone and get the same count", never a vibe); stakeholders (who consumes it and what each needs).
  • stakeholders: who in the ORGANIZATION consumes this output and what each needs — one short line, e.g. "Medical Affairs: does it answer the clinical question? · Regulatory: is the method defensible?". Adapt to the target field. Situates the work inside a company, not a classroom.
  • selfCheck: PRACTICAL, not motivational — how they'd know their work is good enough:
      · criteria: 3+ checkable statements ("another analyst can reproduce your cohort counts from the spec"), never "you feel confident". COVERAGE RULE: together the criteria must cover EVERY step of the task (a step with no criterion verifying it is a silent drop) and every element the deliverable/goal demands (if the goal says "three limitations," a criterion checks for three). A criterion may NAME the anti-pattern it excludes ("limitations name specific fields, not generic 'data may be messy'").
      · redFlags: 1+ concrete signs the work is wrong. MATCHED PAIRS: each red flag should be the failure mode of a specific criterion ("person-time stops at each event" ↔ "your person-time counts full follow-up even for early events") — that's how a reviewer's checklist actually works.
  TASK QUALITY BAR (this is what makes it a course, not homework):
  - REALISTIC — a work ASSIGNMENT, not schoolwork. Frame the task as a real on-the-job request that begins with a STAKEHOLDER ask (e.g. 'Your medical team says: "we need evidence on the long-term effectiveness of Drug A"') and ends in the artifact a new hire would actually hand their team — not a topic to study. When the target's real responsibilities are provided, build tasks directly on them. Prefer "produce the thing the job produces" over "practice the concept."
  - GIVE them their inputs. On a real job you are HANDED your inputs — a dataset, a file, a ticket, a draft. Name a realistic given input ("You're given claims_extract.csv", "A ticket asks you to…") rather than telling them to go find, obtain, or simulate their own practice material. "Source your own dataset" is a schoolwork tell; kill it. GIVENS ARE MATERIALIZED (critical): the workspace generates a SMALL synthetic stand-in for each given on demand — so every given must be realizable at practice scale (a 15-30-row extract, a one-page template, a short note, a filled example artifact). Never name a given that can't be synthesized small (a live database, an internal wiki, "your company's Snowflake") — name the small-file version of it instead.
  - ONE COHERENT PROJECT. Wherever the domain allows, make the tasks a single running project that grows across the course — each module extends the PREVIOUS module's deliverable (clean the dataset you loaded → model it → present it), so the work accumulates toward the capstone instead of being disconnected exercises. When a task builds on an earlier one, say so in its first step ("Using the model you built in module 3, …").
  - PREREQUISITES BUILT FIRST. Every skill a task needs must be built by an EARLIER module. If a task needs a foundation not yet covered (e.g. the data model before building a cohort), add a short module for it first — don't assume it. And don't BUNDLE distinct skills into one task: split creating vs. validating vs. interpreting into separate modules so each is actually taught, not assumed (e.g. build the score → check balance → interpret the estimate = three modules, not one). DEPENDENCY ORDER IS A HARD RULE: no task may require an artifact or skill that a LATER module produces. When a deliverable is COMPOSED of sub-artifacts (a cohort definition IS code lists + temporal rules; a brief IS research + argument), the sub-artifact's module comes first. Check the whole sequence for this before finishing.
  - EXPLICIT CALLBACKS. When a later task depends on or refines an earlier task's concept, SAY SO by name ("in task 1 you saw why a single code is weak evidence — here that becomes the two-code rule"). Never silently correct or contradict an earlier module; the correction IS the teaching moment.
  - ANCHORED. Frame the task in terms of what they already know where you can.
  - SELF-TEST (every module whose deliverable rests on choices): include one step that attacks the learner's own work — re-run the deliverable under a changed assumption and note whether the conclusion holds, or reread AS a named skeptical reviewer ("reread as the skeptical physician / opposing counsel / the partner who hates hand-waving — flag any claim stronger than your evidence, revise it"). Adapt to field. Self-falsification is the craft.
  - COHERENCE (check the module before finishing it): the comprehension check tests the concept THIS module teaches; the worked example exercises the traps THIS module lists; everything the goal/deliverable demands is taught above it. A module whose parts don't reference each other is a syllabus, not a work session.
  Every module MUST center on such a task — the task is the point; the learning layer exists only to unblock the task. If you cannot define a real, doable task for a would-be module, MERGE it into an adjacent module or DROP it. No passive "read about X" modules. Order so each task builds on the ones before. Length and depth follow DEPTH; emphasis follows PURPOSE.
- firstTask: the INDEPENDENT-CONTRIBUTION readiness project — NOT a week-one deliverable. It is the staged arc where they go from watching to owning, and it comes AFTER the modules (so it MAY assemble their earlier module deliverables — this is expected, not a bug). Give:
  • title — name it as a readiness project / independent contribution, not "first task".
  • why — one line on why owning this proves they're ramped.
  • horizon — the DERIVED time window as a short RELATIVE phrase (see HORIZON below), e.g. "~90 days", "your ~3-week runway". Never an absolute calendar date — the app renders the real deadline next to it.
  • horizonAssumed — true ONLY if you fell back to a goal-based default because the user gave no timeline; false if it came from their deadline or pace.
  • phases — the staged arc, each item { stage, timing, goal }. Stage names come from the PURPOSE GRAMMAR: starting_role → "Observe" | "Assist" | "Own" (3 items); interview → "Warm-up" | "Core questions" | "Rapid fire" (3 items, the mock interview); career_move → "Orient" | "Talk to people" | "Decide" (3 items); curious → ONE item, stage "If it grabbed you" (the door). timing = a RELATIVE label for that phase (e.g. "Weeks 1-2", "Weeks 3-4", "Final week", "Days 1-30") — sized to the horizon, NOT hard-coded to 30/60/90. NEVER put an absolute calendar date in timing, even when a deadline was given — the app displays the real deadline itself; you only supply relative windows. goal = what they do in that phase (for starting_role: Observe = understand/reproduce existing work; Assist = modify existing work; Own = own a small piece end-to-end — if they gave a real ticket, fold it into Own. Other purposes: goals per their grammar above).
- timelineNote: one honest sentence on pace/feasibility given their timeline and the plan's size. Reference a concrete date ONLY if one is in TIMELINE (see date rule below).

HOW MANY UNITS (critical — this is where personalization becomes VISIBLE): the count is DERIVED, never defaulted.
1. GAPS SET THE COUNT. One unit per real gap between THIS background and THIS goal — split a gap only when it needs a prerequisite chain, merge gaps only when they are trivially one lesson. NO band, NO quota, NO middle to default to: a near-expert is 2 gaps from the goal and gets a 2-stop road ("you're two stops away — done Thursday"); a total beginner gets 8. Two users with different backgrounds MUST get different-length roads — the road's length is itself evidence that you read their background. If you find yourself producing the same count you'd produce for anyone, re-derive from the gaps.
2. TIME FITS THE GAPS, honestly, in both directions. The runway is a TIME BUDGET (deadline or weekly pace → available hours; each unit costs its timebox). Gaps exceed the budget → keep the most job-critical units and DEFER the rest EXPLICITLY: name each cut gap in the timelineNote-adjacent prose ("your 3-day window covers gaps 1-3; gaps 4-5 are real but deferred — here's what to do about each after"). Budget exceeds the gaps → NEVER pad with filler units; say plainly that the road is short and the remaining runway belongs to the capstone arc. Finishing early is a feature.
3. PURPOSE CAPS apply only where the purpose demands them: curious ≤ 3 always. Other purposes take whatever the gaps × budget produce.

TWO CLOCKS (do not conflate them): the plan's guided work is measured in WORKSPACE TIME — each task 30-60 focused minutes. The HORIZON below is job-ramp context — how those capabilities spread across a real role's first weeks. Timeboxes and the road always speak workspace time; only the capstone's phases speak horizon time, clearly framed as the on-the-job arc. Never price a workspace task in job-world half-days.

HORIZON (derive it; never assume a fixed length):
- DEADLINE given → the horizon IS that deadline. Compress or stretch the observe→assist→own phases to fit — a 3-week runway is a 3-week arc, not 90 days. Use TODAY'S DATE (given in the input) to size the phase labels.
- else WEEKLY PACE given → horizon ≈ total plan effort ÷ that pace; size the phases from it.
- else (open / self-paced) → a GOAL-BASED default, never a constant: curious/landscape → a short taste (days to ~2 weeks), NOT a long commitment arc; functional/starting a role → ~30-60-90 days; deep/career move → longer. Set horizonAssumed=true and say in the horizon phrase that it's an assumption they can change.

CANONICAL ARTIFACT REVIEW (optional pattern): where the field has canonical public artifacts (published studies, public filings, landmark rulings, design systems), ONE module's task may be a critical read of ONE such artifact producing a structured extraction (its question/claims/method/limitations — field-equivalent). Phrase the task so the SPECIFIC artifact comes from the verified resources attached in a later step — never name one yourself.

ORIENTATION: unless the background clearly covers it, the plan's early content must situate the role inside the organization's larger machine — who consumes this function's work, where it sits in the lifecycle, and any professional ground rules of the field (e.g. separations, sign-offs, confidentiality norms — flagged as orientation, adapted to field). A module or the first module's concept may carry this.

NETWORKING (purpose-gated): When PURPOSE is career_move or curious, include EXACTLY ONE module early in the sequence (second-ish) titled around talking to people doing the job. Explorers need evidence from humans before investing hours: concept = informational interviews as evidence-gathering (the 20-minute structure, why practitioners say yes); workedExample = one real-shaped outreach message and the reply it earns; task = shortlist 3 people via the searchLinks, send 2 personalized messages (drafts written in THEIR voice from THEIR real background), hold 2 calls, capture notes; doneWhen = two conversations held and the notes answer "is the day-to-day what I imagined?". Include searchLinks (label + query only). No closesGapIndex on this module. For all OTHER purposes, do NOT include a networking module.

TARGET GROUNDING (critical): When a "READ JOB POSTING" block with real extracted fields is provided, name the real company, role, sector, and responsibilities SPECIFICALLY in the summary, the firm/target node, and the first task. When no readable target is provided (background-only), stay generic about the destination and INVITE the user to add the job description to target a specific role and company. NEVER invent a company, role, sector, or responsibility you weren't given. Field present → specific; field absent → honest and inviting; never a confident guess in between.

ROLE FIDELITY (critical): Refer to the target role EXACTLY as given (the "Target role" or the job-posting role). NEVER rename it to a broader or adjacent category — do not call a "Real World Evidence Analyst" a "Data Scientist," or a "Product Marketing Manager" a "Marketer." The role the user gave is the role; re-categorizing it makes them think you misunderstood them.

DATE FIDELITY (critical): NEVER state or invent a concrete date or deadline unless one is explicitly given in TIMELINE. If no date was provided, speak only in relative terms (weeks, months, "your first 90 days") — do not name a month or year. Never transform a given deadline into a different date.

FACTS vs FLUENCY (critical — the taught concept must not hallucinate specifics): You may freely generate workflow framing, prerequisite order, analogies from their background, manager-task wording, self-check criteria, and "what to notice" in a tiny example. You must NOT assert precise, checkable specifics that depend on a source — exact clinical/coding definitions, regulatory rules, thresholds, statutes, citations, or company-specific workflow — unless they came from the input. Teach the general shape safely (e.g. "claims data records billable events, not a full clinical narrative"), but do NOT invent a precise rule (e.g. "two E11 codes 30 days apart is THE definition of diabetes"). IMPORTANT NUANCE — flagged conventions: when a standard-practice convention would materially help (a common default window, threshold, floor, or format), TEACH IT, explicitly flagged as a convention to confirm locally ("commonly X — confirm your team's value"), rather than omitting it. A flagged convention is more useful than silence; an unflagged one presented as universal fact is forbidden.

VOICE & HONESTY: Write in the person's own vocabulary — and make it mechanical, not aspirational: derive their HOME VOCABULARY from the background (an epidemiologist's: cohort, registry, case definition; a nurse's: charting, orders, handoff; a salesperson's: pipeline, quota, discovery) and express every NEW concept once in home terms before using it natively. OUTPUT LANGUAGE: if the steering notes or materials clearly indicate the user prefers another language, write the plan's PROSE in that language while keeping field terms in English with a native gloss ("队列定义 (cohort definition)") — workplaces and interviews use the English terms, so hiding them is a disservice. When the background is EMPTY, bridges use the universal register ("this is the move any analyst makes when a new dataset lands"), never an invented past ("like you did at the health department"). When you are not sure a step or resource truly applies to THIS person, say so plainly (e.g. "if you already know X, skip this") rather than asserting it. Flag uncertainty; never smooth over a gap with confident filler. VOCABULARY: user-facing text says "task 1", "task 2" — never "module"; the UI calls them tasks.

DIVISION OF LABOR: You produce the plan's structure and prose — the topics, the ordering, the strengths/gaps, and the first task. You do NOT choose learning resources here; that happens in a separate step over a verified, retrieved candidate pool. So never name a specific book, paper, course, or URL in your output — refer to what to learn, not which resource to read.`;

// SCHEMA notes: the API's structured-output grammar requires every object to be
// strict (additionalProperties:false, fully enumerated) AND rejects large
// compiled grammars — our rich nested schema hit that wall. So generation uses a
// FLAT shape (strings + string-arrays are grammar-cheap; nested objects are
// not), and toRichPlan() below adapts it to the nested shape the app consumes.
const S = { type: "string" };
const I = { type: "integer" };
const ARR = { type: "array", items: { type: "string" } };
const MODULE = {
  type: "object",
  additionalProperties: false,
  properties: {
    topic: S, closesGapIndex: I, why: S, context: S, bridgeFromBackground: S,
    askYourTeam: ARR, searchLinks: ARR,
    checkQuestion: S, checkOptions: ARR, checkAnswerIndex: I, checkExplanation: S,
    conceptExplanation: S, keyTerms: ARR, traps: ARR,
    exampleSetup: S, exampleWalkThrough: ARR, exampleTakeaway: S,
    taskTitle: S, managerRequest: S, givenInputs: ARR, steps: ARR,
    deliverable: S, timebox: S, doneWhen: S, stakeholders: S,
    selfCheckCriteria: ARR, redFlags: ARR,
  },
  required: ["topic","closesGapIndex","why","context","bridgeFromBackground","askYourTeam","searchLinks","checkQuestion","checkOptions","checkAnswerIndex","checkExplanation","conceptExplanation","keyTerms","traps","exampleSetup","exampleWalkThrough","exampleTakeaway","taskTitle","managerRequest","givenInputs","steps","deliverable","timebox","doneWhen","stakeholders","selfCheckCriteria","redFlags"],
};
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hook: S, northStar: S,
    transferableStrengths: ARR, knowledgeGaps: ARR,
    learningSequence: { type: "array", items: MODULE },
    readinessTitle: S, readinessWhy: S, horizon: S,
    horizonAssumed: { type: "boolean" }, phases: ARR, timelineNote: S,
  },
  required: ["hook","northStar","transferableStrengths","knowledgeGaps","learningSequence","readinessTitle","readinessWhy","horizon","horizonAssumed","phases","timelineNote"],
};

// Adapt the flat generated shape to the rich nested plan the whole app consumes.
function splitPair(str, sep) {
  const i = (str || "").indexOf(sep);
  return i === -1 ? [str || "", ""] : [str.slice(0, i), str.slice(i + sep.length)];
}
function pointDetail(arr) {
  return (arr || []).filter(Boolean).map((x) => {
    const [point, detail] = splitPair(x, " — ");
    return { point: point.trim(), detail: detail.trim() };
  });
}
function toRichPlan(f) {
  return {
    hook: f.hook,
    northStar: f.northStar || "",
    transferableStrengths: pointDetail(f.transferableStrengths),
    knowledgeGaps: pointDetail(f.knowledgeGaps),
    learningSequence: (f.learningSequence || []).map((m) => ({
      topic: m.topic,
      closesGapIndex: m.closesGapIndex,
      why: m.why,
      context: m.context,
      bridgeFromBackground: m.bridgeFromBackground,
      askYourTeam: (m.askYourTeam || []).filter(Boolean),
      searchLinks: (m.searchLinks || []).filter(Boolean).map((x) => {
        const [label, query] = splitPair(x, " | ");
        return { label: label.trim(), query: (query || label).trim() };
      }),
      comprehensionCheck: m.checkQuestion
        ? { question: m.checkQuestion, options: m.checkOptions || [], answerIndex: m.checkAnswerIndex || 0, explanation: m.checkExplanation || "" }
        : undefined,
      concept: {
        explanation: m.conceptExplanation || "",
        keyTerms: (m.keyTerms || []).filter(Boolean).map((x) => {
          const [term, plainMeaning] = splitPair(x, " — ");
          return { term: term.trim(), plainMeaning: plainMeaning.trim() };
        }),
        traps: (m.traps || []).filter(Boolean),
        misconceptionToAvoid: (m.traps || [])[0] || "",
      },
      workedExample: { setup: m.exampleSetup || "", walkThrough: (m.exampleWalkThrough || []).filter(Boolean), takeaway: m.exampleTakeaway || "" },
      task: {
        title: m.taskTitle, managerRequest: m.managerRequest,
        givenInputs: (m.givenInputs || []).filter(Boolean), steps: (m.steps || []).filter(Boolean),
        deliverable: m.deliverable, timebox: m.timebox, doneWhen: m.doneWhen, stakeholders: m.stakeholders,
      },
      selfCheck: { criteria: (m.selfCheckCriteria || []).filter(Boolean), redFlags: (m.redFlags || []).filter(Boolean) },
    })),
    firstTask: {
      title: f.readinessTitle, why: f.readinessWhy, horizon: f.horizon || "", horizonAssumed: !!f.horizonAssumed,
      phases: (f.phases || []).filter(Boolean).map((x) => {
        const parts = x.split(" | ");
        return { stage: (parts[0] || "").trim(), timing: (parts[1] || "").trim(), goal: parts.slice(2).join(" | ").trim() };
      }),
    },
    timelineNote: f.timelineNote,
  };
}

const DEPTH_MEANING = {
  landscape: "understand the landscape — orientation, not mastery (stop one rung up)",
  functional: "get hands-on and functional — reach working competence",
  deep: "go deep and specialize — climb to the top of the relevant chains",
};
const PURPOSE_MEANING = {
  starting_role: "starting a role soon — favor the first real task and just-in-time depth",
  interview: "prepping for an interview — favor breadth and likely-to-be-asked concepts",
  career_move: "exploring a career move — favor durable foundations",
  curious: "just curious — favor a fast, low-commitment taste",
};

function buildPrompt(p) {
  const b = p.background || {};
  const t = p.target || {};
  const g = p.goals || {};
  const tl = p.timeline || {};
  const lines = [];

  lines.push("## BACKGROUND (where they're starting)");
  if (b.isBeginner) lines.push("They left background blank — treat as a beginner starting fresh.");
  if (b.field?.length) lines.push(`Field(s): ${b.field.join(", ")}`);
  if (b.sector?.length) lines.push(`Sector(s) they come from: ${b.sector.join(", ")}`);
  if (b.skills?.length) lines.push(`Skills they have: ${b.skills.join(", ")}`);
  if (b.skillEvidence?.length) {
    lines.push("Where those skills come from (their own words — anchor strengths to these):");
    b.skillEvidence.forEach((s) => lines.push(`- ${s.skill}: "${s.evidence}"`));
  }
  if (b.resume?.trim()) lines.push(`Resume/bio:\n${b.resume.slice(0, 6000)}`);

  lines.push("\n## TARGET (where they're headed)");
  if (t.role?.trim()) lines.push(`Target role: ${t.role}`);
  (t.artifacts || []).forEach((a, i) => {
    if ((a?.text || "").trim()) lines.push(`Artifact ${i + 1} [${a.type}]: ${a.text.slice(0, 4000)}`);
  });
  if (t.realTask?.trim()) lines.push(`Real first task/ticket they provided: ${t.realTask.slice(0, 2000)}`);
  if (t.instructions?.trim()) lines.push(`Steering notes: ${t.instructions.slice(0, 1000)}`);

  if (t.jobFields) {
    const jf = t.jobFields;
    const jl = [];
    if (jf.company) jl.push(`Company: ${jf.company}`);
    if (jf.role) jl.push(`Role: ${jf.role}`);
    if (jf.sector) jl.push(`Sector: ${jf.sector}`);
    if (jf.seniority) jl.push(`Seniority: ${jf.seniority}`);
    if (jf.responsibilities?.length) jl.push(`Responsibilities: ${jf.responsibilities.join("; ")}`);
    if (jf.requiredSkills?.length) jl.push(`Required skills: ${jf.requiredSkills.join("; ")}`);
    if (jl.length) lines.push("\n## READ JOB POSTING — real extracted fields (name these specifically):\n" + jl.join("\n"));
  }
  if (!t.hasTarget) {
    lines.push(
      "\n## NOTE: No readable job posting or target was provided. Build from BACKGROUND ONLY — stay generic about the destination and explicitly invite the user to add a job description to target a specific role/company. Do NOT invent a company, role, sector, or responsibility."
    );
  }

  lines.push("\n## GOALS");
  lines.push(`Depth: ${DEPTH_MEANING[g.depth] || g.depth || "functional"}`);
  lines.push(`Purpose: ${PURPOSE_MEANING[g.purpose] || g.purpose || "not specified"}`);

  lines.push("\n## TIMELINE");
  lines.push(`Today's date: ${new Date().toISOString().slice(0, 10)} (use this to size a deadline horizon).`);
  if (tl.mode === "deadline") lines.push(`Has a deadline${tl.deadline ? `: ${tl.deadline}` : ""}. Derive the horizon FROM this deadline.`);
  else if (tl.mode === "pace") lines.push(`Self-paced at ~${tl.weeklyHrs || "?"} hrs/week. Derive the horizon from plan effort ÷ this pace.`);
  else lines.push("No fixed deadline — self-paced. Use a GOAL-BASED default horizon and mark it assumed.");

  lines.push("\nGenerate the onboarding plan.");
  return lines.join("\n");
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Spend guard: this is the expensive route. An effectively empty payload
  // (no background, no target, no artifacts) can only come from a bug, a bot,
  // or a stray fetch — never from the real form. Refuse before billing.
  const bg = payload?.background || {};
  const tg = payload?.target || {};
  const hasSignal =
    (bg.resume || "").trim() ||
    (bg.field || []).length ||
    (bg.skills || []).length ||
    (tg.role || "").trim() ||
    (tg.artifacts || []).length ||
    (tg.realTask || "").trim();
  if (!hasSignal) {
    return Response.json({ error: "Empty input — nothing to build a plan from." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "No API key configured on the server." }, { status: 500 });
  }

  try {
    const message = await client.messages.create({
      model: PLAN_MODEL,
      // Shift 1 makes each module a teaching CONTAINER (concept + worked example +
      // self-check), so the JSON is much larger. Give generous headroom — 8192 would
      // truncate a full 4-5 module plan.
      max_tokens: 16384,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: buildPrompt(payload) }],
    });
    const block = message.content.find((b) => b.type === "text");
    if (!block) return Response.json({ error: "Empty response." }, { status: 500 });
    // If the model still hit the cap, the JSON is incomplete — fail with a clear reason.
    if (message.stop_reason === "max_tokens") {
      console.error("plan route: response hit max_tokens; plan too large to fit.");
      return Response.json({ error: "Plan was too long to finish. Try again, or narrow the scope." }, { status: 500 });
    }
    const plan = toRichPlan(JSON.parse(block.text));
    if (!Array.isArray(plan.learningSequence) || !plan.learningSequence.length || !plan.learningSequence.every((m) => m && m.topic && m.task?.title)) {
      console.error("plan route: shape check failed on learningSequence");
      return Response.json({ error: "The plan came back malformed. Retry — this one didn't bill correctly-shaped output." }, { status: 500 });
    }
    return Response.json({ plan });
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    if (err?.status === 429) return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    console.error("plan route error:", err?.message || err);
    return Response.json({ error: "Plan generation failed. Please try again." }, { status: 500 });
  }
}
