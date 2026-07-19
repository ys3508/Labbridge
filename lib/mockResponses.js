// Offline "mock mode" data — lets the whole app run with ZERO API calls so the
// UI can be developed while the Anthropic balance is unpaid. Enabled by visiting
// `?mock=1` (see components/MockGate.js). Every value here is hand-authored to
// match the live schemas; nothing here calls Claude. Not shipped behavior —
// purely a dev aid, gated behind an explicit flag.

// A complete plan matching app/api/plan/route.js SCHEMA (Shift-1 container shape).
const RWE_PLAN = {
  hook:
    "You're most of the way there — your epidemiology training already covers the hard part of Real World Evidence: exposures, outcomes, bias, and cohort thinking. What's missing is the pharma plumbing: how claims data is shaped, and how evidence gets packaged for medical affairs. This path closes that ~20% through four short, hands-on assignments.",
  northStar: "Build the evidence package a new RWE analyst ships in their first month.",
  transferableStrengths: [
    {
      point: "Cohort and study design",
      detail:
        "You already think in exposure → outcome → confounding. In RWE that IS the job — so skip any 'intro to study design' material and go straight to applying it on claims data.",
    },
    {
      point: "Bias and confounding instincts",
      detail:
        "Your reflex to ask 'what's distorting this?' transfers directly. Skip the epidemiology-methods refresher; you'll only need the RWE-specific vocabulary (new-user design, index date), not the concepts.",
    },
    {
      point: "Stakeholder memos",
      detail:
        "You've written for program managers who aren't statisticians. That's exactly the medical-affairs audience — reuse that muscle; don't relearn 'how to write for non-technical readers.'",
    },
  ],
  knowledgeGaps: [
    {
      point: "How claims data is actually shaped",
      detail:
        "You know survey and registry data; claims are billing records — one patient across many rows, coded for reimbursement, not research. This is the concrete thing between your epi skills and a usable RWE analysis.",
    },
    {
      point: "Coding systems as data, not medicine",
      detail:
        "You read ICD/CPT/NDC codes as clinical facts; here they're noisy computable clues you assemble into a cohort. Learning to treat them as data (with error) is the gap.",
    },
    {
      point: "Packaging evidence for medical affairs",
      detail:
        "Your output was academic; RWE deliverables are protocol-driven and audience-tuned for medical/regulatory readers. The analysis you can already do — the packaging is new.",
    },
  ],
  learningSequence: [
    {
      topic: "Read a claims extract like an analyst, not a clinician",
      closesGapIndex: 0,
      comprehensionCheck: {
        question: "Which table tells you whether a patient was observable during a given month?",
        options: ["The enrollment table", "The diagnosis claims", "The pharmacy claims", "The data dictionary"],
        answerIndex: 0,
        explanation:
          "Enrollment defines the observation window — outside it you're blind, no matter what other claims say.",
      },
      why:
        "Everything downstream (cohorts, outcomes, tables) assumes you can navigate the raw tables. This comes first because it's the foundation the other three modules build on.",
      context:
        "In pharma, teams buy huge datasets of insurance paperwork — 'claims' — records of every doctor visit, diagnosis code, and prescription an insurer paid for. It's the closest thing to watching millions of patients live their medical lives, except nobody collected it for research. Before anyone builds a study on an extract like this, someone has to open it and establish what it can and cannot answer. At Meridian, that someone is the newest analyst — you — and it's the same move you made every time a new dataset landed at the health department.",
      bridgeFromBackground:
        "You already profile a new dataset before trusting it — same instinct, new table shapes.",
      concept: {
        explanation:
          "Claims data records billable events, not a clinical story. One patient shows up across an enrollment table (when they're observable), medical claims (diagnoses/procedures with dates), and pharmacy claims (fills). Nothing is written for research — a code appears because someone billed for it, so absence of a code isn't absence of disease. Your job is to link rows by patient and time, and to always ask what the data can and can't see. Think of it as census-tract linkage work: real signal, but you respect the seams.",
        misconceptionToAvoid:
          "Treating a diagnosis code as proof the patient has the condition — it's a billed clue, not a confirmed fact.",
        traps: [
          "A pharmacy fill is dispensing, not ingestion — never write 'patients took'.",
          "A missing enrollment span reads as 'no comorbidities' when you simply couldn't see the patient.",
          "Rule-out diagnoses ride on lab orders and inflate prevalence if you count them naively.",
        ],
        keyTerms: [
          { term: "enrollment span", plainMeaning: "the window you can actually observe a patient; outside it you're blind" },
          { term: "claim line", plainMeaning: "one billed item (a diagnosis, a procedure, a fill) with a date" },
        ],
      },
      workedExample: {
        setup:
          "Patient 104: continuous enrollment Jan–Dec; two E11 (type 2 diabetes) diagnosis claims in March and June; one metformin pharmacy fill in April; one endocrinology visit in May.",
        walkThrough: [
          "Link all rows by patient id, then order them by date.",
          "Check the events fall inside the enrollment span (they do — Jan–Dec).",
          "Ask what this supports: likely treated type 2 diabetes. Ask what it can't show: lab control (no lab values), or anything before January.",
        ],
        takeaway:
          "Codes plus dates plus enrollment give you a defensible picture — but only within what was observable. Name the blind spots out loud.",
      },
      task: {
        title: "Data-orientation memo for a new claims extract",
        managerRequest:
          "Your RWE lead says: \"Before we scope anything, tell me what this extract can and can't support — one page.\"",
        givenInputs: ["claims_sample.csv", "a draft data dictionary"],
        deliverable: "A one-page memo: tables present, grain of each, key limitations, and 2 questions the data could answer.",
        timebox: "3–4 hours",
        steps: [
          "Profile each table: row grain, keys, date coverage.",
          "Trace one patient end-to-end to sanity-check the joins.",
          "List the top 3 limitations a stakeholder must know before trusting any analysis.",
        ],
        doneWhen: "Another analyst could reproduce your table-by-table summary from the memo alone.",
        stakeholders:
          "RWE lead: can we scope a study on this? · Data engineering: are the joins as documented?",
      },
      askYourTeam: [
        "Which claims asset is this (vendor), and how much lookback do we actually have?",
        "Is there an approved T2D or Drug A code list already in use here?",
        "Does an analysis need written sign-off before I run it — and from whom?",
        "What's our minimum reportable cell size?",
      ],
      selfCheck: {
        criteria: [
          "Every table has a stated grain (what one row means).",
          "Limitations name specific fields, not generic 'data may be messy'.",
          "A reader who's never seen the file knows what it can answer.",
        ],
        redFlags: [
          "You described codes as clinical truth rather than billed clues.",
          "You didn't mention the enrollment window at all.",
        ],
      },
    },
    {
      topic: "Turn a clinical question into a cohort definition",
      closesGapIndex: 1,
      comprehensionCheck: {
        question: "What makes a cohort a 'new-user' cohort?",
        options: [
          "A washout window with no prior use of the drug before index",
          "Including everyone who ever has the diagnosis",
          "Choosing whichever definition gives the largest N",
          "Using each patient's most recent fill as index",
        ],
        answerIndex: 0,
        explanation:
          "New-user design requires a clean pre-index washout, so you're studying patients starting therapy — not prevalent users.",
      },
      why:
        "This is the RWE analyst's core move. It comes second because it needs the data-shape fluency from module 1.",
      context:
        "Every RWE study starts by deciding exactly who counts as 'in' — which patients, from which date, under which rules. In epi you did this with survey criteria; in pharma it's done with billing codes and dates, written so precisely that a computer (and a skeptical reviewer) can re-run it. That recipe is called a cohort definition, and drafting one is the most classic assignment a new RWE analyst gets.",
      bridgeFromBackground:
        "You've defined cohorts in epi — here you operationalize them with codes and index dates instead of survey criteria.",
      concept: {
        explanation:
          "A cohort definition is a precise, reproducible recipe: who's in, from when, and how you define the exposure and outcome — all in terms a machine can execute against claims. The pieces are an index date (the clock-start, often first treatment), inclusion/exclusion windows, and code-based definitions for conditions and events. The discipline is the same rigor you already apply to study design; what's new is expressing it as computable rules and pre-committing to them so results aren't cherry-picked.",
        misconceptionToAvoid:
          "Defining the cohort loosely and 'seeing what the data says' — that bakes in bias. Pre-specify.",
        traps: [
          "Prevalent-user cohorts bake in survivor bias — new-user design is the default for a reason.",
          "Patients indexed near the end of the data look like discontinuers — check the follow-up runway.",
        ],
        keyTerms: [
          { term: "index date", plainMeaning: "the anchor date that starts each patient's clock (e.g. first Drug A fill)" },
          { term: "washout window", plainMeaning: "a clean period before index used to confirm 'new user'" },
        ],
      },
      workedExample: {
        setup:
          "Question: adults starting Drug A for type 2 diabetes. Draft: index = first Drug A fill; require ≥1 E11 claim in the 6 months prior; require 6 months of enrollment before index (washout).",
        walkThrough: [
          "Index date = first Drug A pharmacy claim per patient.",
          "Apply the pre-index E11 requirement to enforce the diabetes context.",
          "Apply the 6-month washout so you're studying new users, not prevalent ones.",
        ],
        takeaway:
          "The recipe is defensible because each rule maps to a stated clinical intent — and it's fixed before you look at outcomes.",
      },
      task: {
        title: "Draft a cohort spec for Drug A new users",
        managerRequest:
          "Medical affairs asks: \"Can we define a clean new-user cohort of Drug A patients from this extract?\"",
        givenInputs: ["claims_sample.csv", "the drug's NDC list", "your module-1 orientation memo"],
        deliverable: "A cohort spec: index date, inclusion/exclusion, code lists, washout — with a rough N.",
        timebox: "half a day",
        steps: [
          "Write the index-date rule and the code-based inclusion criteria.",
          "Add exclusions and the washout window, each with a one-line rationale.",
          "Estimate the cohort size and flag where it might be too small.",
        ],
        doneWhen: "A second analyst applying your spec to the same data lands within ~5% of your N.",
        stakeholders:
          "Medical affairs: does this answer the clinical question? · Biostatistics: is the definition sound?",
      },
      askYourTeam: [
        "Which washout length does this team default to — 6 or 12 months (commonly either — confirm)?",
        "Who challenges cohort definitions here before they're final?",
      ],
      selfCheck: {
        criteria: [
          "Index date is a single unambiguous rule.",
          "Every inclusion/exclusion has a stated intent.",
          "You reported an N and a concern about it.",
        ],
        redFlags: [
          "Outcomes influenced how you set the entry criteria.",
          "Code lists are described in words but not actually listed.",
        ],
      },
    },
    {
      topic: "Produce a baseline table medical affairs can trust",
      closesGapIndex: 2,
      // Free-text (explain-back) genre — demos the graded typed answer.
      comprehensionCheck: {
        question:
          "Explain to your lead, in two sentences, what a baseline table does BESIDES describing the patients.",
        options: [],
        answerIndex: 0,
        explanation:
          "A strong answer says Table 1 also surfaces data-quality problems (impossible ages, heavy missingness, tiny subgroups) before any outcome analysis runs — it's the first quality gate, not just a portrait.",
      },
      why:
        "The first real deliverable a new RWE hire ships. It comes third because it runs on the cohort from module 2.",
      context:
        "Once a cohort exists, the first thing anyone asks is: who are these patients? The answer is a baseline table — ages, sexes, conditions, prior treatments at the moment each patient entered. It's the same 'Table 1' every published study opens with, but here its reader is a medical affairs team deciding what to do next, not a journal reviewer. It's also where data problems surface first, which is why it comes before any fancier analysis.",
      bridgeFromBackground:
        "You've made 'Table 1's before — same idea, now sourced from claims and read by medical, not reviewers.",
      concept: {
        explanation:
          "A baseline (Table 1) describes the cohort at index: age, sex, comorbidities, prior treatment. In RWE it does double duty — it characterizes patients and it surfaces data-quality problems (impossible ages, missingness) before anyone runs an outcome. The skill isn't the statistics you already know; it's choosing variables medical affairs cares about and presenting them so a non-statistician trusts the cohort at a glance.",
        misconceptionToAvoid:
          "Padding the table with every variable you can compute — relevance and trust beat completeness.",
        traps: [
          "Cost fields are plan-negotiated, not list prices — never compare them across payers naively.",
          "A percentage without its stated denominator will be the first question you get.",
        ],
        keyTerms: [
          { term: "comorbidity flag", plainMeaning: "a yes/no built from codes in a pre-index window (e.g. hypertension)" },
        ],
      },
      workedExample: {
        setup:
          "Your Drug A cohort of ~1,200 patients. You compute age at index, sex, and a hypertension flag from pre-index claims.",
        walkThrough: [
          "Derive age at index from birth year and index date — check for impossible values.",
          "Build the hypertension flag from I10 codes in the 12 months pre-index.",
          "Lay out counts and percentages, and footnote how each row was defined.",
        ],
        takeaway:
          "A trustworthy Table 1 shows its work: every number traceable to a rule and a window.",
      },
      task: {
        title: "Baseline characteristics table + one-paragraph read",
        managerRequest:
          "Your lead says: \"Give medical affairs a baseline table for the Drug A cohort and tell them what it says.\"",
        givenInputs: ["your module-2 cohort spec", "claims_sample.csv"],
        deliverable: "A baseline table (age, sex, ≥2 comorbidity flags) plus a plain-language paragraph interpreting it.",
        timebox: "half a day",
        steps: [
          "Compute the variables from the cohort at index, validating ranges.",
          "Format the table with definitions footnoted.",
          "Write one paragraph a non-statistician can act on.",
        ],
        doneWhen: "A medical-affairs reader can restate who these patients are without asking you a question.",
        stakeholders:
          "Medical affairs: is this the right patient picture? · QA: are the derivations auditable?",
      },
      askYourTeam: [
        "Which baseline variables does medical affairs here actually act on?",
        "Is there a standard Table 1 template the team expects?",
      ],
      selfCheck: {
        criteria: [
          "Every row is traceable to a code list and a window.",
          "You checked for and handled impossible values.",
          "The paragraph states an implication, not just numbers.",
        ],
        redFlags: [
          "A percentage has no denominator stated.",
          "Variables were included because they were easy, not because they matter.",
        ],
      },
    },
  ],
  firstTask: {
    title: "90-day readiness project: own a first-pass RWE evidence summary",
    why:
      "Owning one small evidence question end-to-end — from extract to a summary medical affairs reads — is what proves you're ramped, not just trained.",
    horizon: "your ~4-week runway",
    horizonAssumed: false,
    phases: [
      {
        stage: "Observe",
        timing: "Week 1",
        goal: "Reproduce an existing Drug A cohort and its baseline table from a colleague's spec, matching their counts.",
      },
      {
        stage: "Assist",
        timing: "Weeks 2–3",
        goal: "Modify that analysis for a new sub-question (e.g. add a comorbidity restriction) and document what changed and why.",
      },
      {
        stage: "Own",
        timing: "Final week",
        goal: "Own a small evidence summary end-to-end: cohort, baseline, limitations, and a one-page read for medical affairs.",
      },
    ],
  },
  timelineNote:
    "Four short modules plus the readiness project is a realistic month at ~10 hrs/week — front-loaded so you can contribute to real cohort work well before the end.",
};


// Second demo persona: strategy consultant → Growth Equity Analyst. Module 3 is
// deliberately THIN (no comprehensionCheck, no workedExample) so the demo also
// exercises the variable-inclusion path (a 6-moment task) and the no-resource
// hands-on state — both invisible in the RWE persona.
const GROWTH_PLAN = {
  hook:
    "You're closer than the job posting makes it look — market sizing, unit economics, and executive-ready storytelling are the consulting muscles growth equity runs on. What's missing is the investor's lens: SaaS metrics as decision inputs, and the memo discipline funds use to argue a deal. Three short assignments close that gap.",
  northStar: "Write the screening memo a growth-equity analyst hands their partner.",
  transferableStrengths: [
    {
      point: "Market sizing and competitive teardowns",
      detail:
        "You've built top-down and bottom-up sizings for clients. That's the market section of every investment memo — skip any 'how to size a market' material entirely.",
    },
    {
      point: "Excel modeling under time pressure",
      detail:
        "Your consulting models transfer directly; you only need the SaaS-specific layer (cohort revenue, retention curves), not modeling fundamentals.",
    },
    {
      point: "Executive communication",
      detail:
        "You present to C-levels monthly. A partner memo is the same skill with a sharper verdict — skip writing courses; learn the memo format instead.",
    },
  ],
  knowledgeGaps: [
    {
      point: "SaaS metrics as investor decisions",
      detail:
        "You can compute ARR and churn; the gap is knowing what a 95% NRR MEANS for a deal — which numbers kill an investment and which just shape price.",
    },
    {
      point: "Screening: kill fast, kindly",
      detail:
        "Consulting optimizes for thoroughness; sourcing optimizes for fast, defensible no's. Screening discipline is a new muscle, not a new concept.",
    },
    {
      point: "The investment memo form",
      detail:
        "Your decks recommend actions; a memo argues a position against a skeptical partner. Same rigor, different genre — and genre is the gap.",
    },
  ],
  learningSequence: [
    {
      topic: "Read a SaaS metrics pack like an investor, not an operator",
      closesGapIndex: 0,
      comprehensionCheck: {
        question: "A company has 120% net revenue retention. What does that tell an investor by itself?",
        options: [
          "Existing customers grow their spend even before new sales — durable growth",
          "The company is profitable",
          "Churn is zero",
          "The sales team is efficient",
        ],
        answerIndex: 0,
        explanation:
          "NRR isolates expansion vs. shrinkage of the existing base — it says nothing about profit, logo churn specifics, or sales efficiency on its own.",
      },
      why: "Every screen and memo downstream reads these numbers; the investor's interpretation layer comes first.",
      context:
        "Growth equity funds buy minority stakes in software companies that are already working — the job is deciding which ones. The raw material is a 'metrics pack': a page of numbers (revenue, retention, cost of sales) a company shares when it wants investment. Consultants read numbers to advise; investors read the same numbers to price risk with their own money. Learning that shift in reading is the first real skill of the role, and it starts with one pack.",
      bridgeFromBackground: "You already read client KPIs for 'so what' — same move, new vocabulary.",
      concept: {
        explanation:
          "Operators read metrics to run the business; investors read them to price risk. The same ARR number means different things depending on NRR (do customers grow?), gross margin (does revenue convert to capacity?), and CAC payback (how expensive is growth?). An investor's first pass is triage: which two or three numbers, if true, carry the thesis — and which single number, if bad, kills it. You're not auditing; you're deciding what has to be believed for this to be a good deal.",
        misconceptionToAvoid: "Treating a big ARR number as quality — composition and retention beat size.",
        traps: [
          "ARR is not recognized revenue — confirm which one the teaser is quoting.",
          "A marquee logo can hide revenue concentration — check the top-5 customer share.",
        ],
        keyTerms: [
          { term: "NRR", plainMeaning: "revenue this year from LAST year's customers, as a % — expansion vs shrinkage" },
          { term: "CAC payback", plainMeaning: "months of gross profit to earn back the cost of winning a customer" },
        ],
      },
      workedExample: {
        setup: "NovaMetrics: $18M ARR, growing 55%; NRR 118%; gross margin 71%; CAC payback 19 months.",
        walkThrough: [
          "Growth quality: 118% NRR means over a fifth of growth needs no new sales — durable.",
          "Margin says revenue converts to real capacity; 71% is healthy SaaS.",
          "19-month payback is the wobble: growth is somewhat bought. Price it, or probe sales efficiency.",
        ],
        takeaway: "Three numbers built a view; one number set the diligence question. That's investor reading.",
      },
      task: {
        title: "One-page metrics read on a screening target",
        managerRequest: 'Your VP says: "We got NovaMetrics\' data room teaser. Tell me in one page whether the metrics support a look."',
        givenInputs: ["novametrics_teaser_metrics.xlsx", "the fund's screening criteria one-pager"],
        deliverable: "A one-page metrics read: 3 thesis-carrying numbers, 1 kill-risk, and a look / no-look call.",
        timebox: "2-3 hours",
        steps: [
          "Rank the pack's metrics by thesis weight, not by order given.",
          "Write one sentence per key metric: what it implies for the deal.",
          "End with a call and the single question diligence must answer.",
        ],
        doneWhen: "A partner could disagree with your call but not with what the numbers say.",
        stakeholders: "Deal partner: is this worth a meeting? · Ops team: which metric gets verified first?",
      },
      askYourTeam: [
        "What's the fund's growth floor and check size — where do we simply pass?",
        "Is there a metrics-pack template partners expect?",
      ],
      selfCheck: {
        criteria: [
          "Every claim traces to a specific number in the pack.",
          "The kill-risk is named, not hedged.",
          "The call is one sentence and takes a side.",
        ],
        redFlags: ["You summarized every metric instead of ranking what matters.", "ARR size did the arguing."],
      },
    },
    {
      topic: "Talk to two people doing the job",
      comprehensionCheck: {
        question: "What's the real goal of an informational interview?",
        options: [
          "Evidence about the day-to-day, from someone living it",
          "Getting a referral",
          "Impressing a future interviewer",
          "Confirming what you already believe",
        ],
        answerIndex: 0,
        explanation:
          "You're gathering evidence, not favors. Referrals sometimes follow — but asking for one up front is why most cold messages die.",
      },
      why:
        "You're exploring a move, not prepping a start date — thirty minutes with someone living this job is worth more than a week of reading. Do it before you invest deep hours.",
      context:
        "Before sinking forty hours into a career switch, the smartest move is the cheapest one: talk to two people already doing the job. In investing this is doubly true — the day-to-day (sourcing calls, screens, memo grind) surprises most people who imagined it from the outside. Practitioners take these calls more often than you'd think; the craft is asking small and specific.",
      bridgeFromBackground:
        "It's a stakeholder interview — you run those for clients; this time the scope is your own career.",
      concept: {
        explanation:
          "An informational interview is evidence-gathering, not favor-asking. The 20-minute structure: two minutes on who you are (one line of your background, why this field), fifteen on THEIR day-to-day (what they actually do all week, what surprised them, what they'd tell someone coming from your world), three on where to look next. Practitioners say yes at surprising rates when the ask is specific, small, and clearly about their experience rather than a job. You are not behind for asking — analysts remember being where you are.",
        misconceptionToAvoid: "Treating it as a stealth job application. The moment it smells like one, honesty and usefulness both collapse.",
        keyTerms: [{ term: "the small ask", plainMeaning: "20 minutes, their experience, no favor — the shape of ask that gets a yes" }],
      },
      workedExample: {
        setup:
          "Message: 'I've spent 3 years in strategy consulting (market sizing, unit economics) and I'm seriously exploring growth equity. Could I take 20 minutes to hear what your week actually looks like as an analyst? Not asking about openings — just trying to understand the day-to-day before I commit to the switch.'",
        walkThrough: [
          "One line of real background — specific enough to be credible, short enough to respect their time.",
          "The ask is 20 minutes about THEIR experience — small, flattering, answerable.",
          "'Not asking about openings' removes the awkwardness that kills most replies.",
        ],
        takeaway: "Specific + small + about them = replies. Your background does the credibility work if you name it plainly.",
      },
      task: {
        title: "Hold two 20-minute conversations with people in the seat",
        managerRequest:
          "You, three months from now, need to know: \"is this field actually what I imagine — before I've spent 40 hours on it?\"",
        givenInputs: ["the search links below", "your outreach draft (write it in Draft using the example)"],
        deliverable: "Two sent messages, two held calls, and a notes file: what the day-to-day really is, what surprised you.",
        timebox: "2-3 hours across a week",
        steps: [
          "Shortlist 3 people via the searches below — prioritize career-changers like you.",
          "Personalize and send 2 messages (write them in Draft — your background, the small ask).",
          "Hold the calls; write down what surprised you while it's fresh.",
        ],
        doneWhen: "Two conversations held, and your notes answer: is the day-to-day what I imagined?",
        stakeholders: "You: is this move right? · Your future team: they remember who did the homework.",
      },
      searchLinks: [
        { label: "Growth equity analysts, 1-3 years in", query: "growth equity analyst" },
        { label: "Ex-consultants now in growth equity", query: "growth equity former consultant" },
        { label: "Investors who post about breaking in", query: "growth equity investing careers" },
      ],
      selfCheck: {
        criteria: [
          "Your message names YOUR specific background — it couldn't have been sent by anyone else.",
          "You asked about their real workday, not about openings.",
          "Your notes contain at least one thing that genuinely surprised you.",
        ],
        redFlags: ["Both calls confirmed everything you already believed — you interviewed for comfort, not evidence."],
      },
    },
    {
      topic: "Screen a company in 30 minutes and defend the 'no'",
      closesGapIndex: 1,
      comprehensionCheck: {
        question: "What makes a screening 'no' defensible?",
        options: [
          "It names the specific criterion the company fails and the evidence",
          "It lists everything imperfect about the company",
          "It matches what other funds decided",
          "It took less than 30 minutes",
        ],
        answerIndex: 0,
        explanation: "Screens exist to allocate attention. One failed must-have with evidence beats ten hedged concerns.",
      },
      why: "Sourcing is the analyst's actual week-one job; the metrics lens from task 1 is what makes 30 minutes enough.",
      context:
        "Funds see far more companies than they can study — hundreds of 'teasers' arrive for every deal done. Screening is the discipline of deciding, fast, which deserve real attention: check a few non-negotiables, stop at the first failure, and write the 'no' so a partner trusts it. It's the volume work analysts own, and being trusted with it is how you earn the interesting deals.",
      bridgeFromBackground: "It's a red-flag-first client scan — you've done this under a different name.",
      concept: {
        explanation:
          "A screen is not a small diligence; it's a different act. You check the few must-haves the fund actually underwrites (growth rate floor, retention floor, market size, ownership fit) and stop at the first failure. The craft is writing the 'no' so a partner trusts it without redoing your work: criterion, evidence, one line of nuance. Speed comes from refusing to evaluate what the fund wouldn't buy anyway.",
        misconceptionToAvoid: "Being thorough. A screen that takes a day has already failed.",
        traps: [
          "Screens are about floors, not averages — one failed must-have ends it, however good the rest looks.",
        ],
        keyTerms: [{ term: "must-have", plainMeaning: "a criterion whose failure ends the conversation regardless of everything else" }],
      },
      workedExample: {
        setup: "Fund floor: 40%+ growth at $10M+ ARR. Target: $14M ARR growing 28%, NRR 130%, beloved product.",
        walkThrough: [
          "Growth 28% fails the 40% floor — that's the screen, done.",
          "The 130% NRR is genuinely great; note it in one clause so the 'no' is fair.",
          "Verdict: pass, revisit if growth re-accelerates. Two sentences, defensible.",
        ],
        takeaway: "The great NRR did not rescue the failed must-have. Screens are about floors, not averages.",
      },
      task: {
        title: "Screen three inbound targets against the fund's criteria",
        managerRequest: 'The sourcing lead says: "Three teasers came in overnight — which, if any, deserve a meeting this week?"',
        givenInputs: ["three_teasers.pdf", "the fund's screening criteria one-pager", "your task-1 metrics read as the method"],
        deliverable: "Three verdicts, each ≤4 sentences: criterion-based call + the one number that decided it.",
        timebox: "half a day",
        steps: [
          "Apply must-haves in order; stop at first failure per company.",
          "Write each verdict: call, deciding criterion, evidence, one fairness clause.",
          "Flag the single best 'yes' (or least-bad 'revisit') for the meeting slot.",
        ],
        doneWhen: "The sourcing lead can forward your verdicts unedited.",
        stakeholders: "Sourcing lead: allocate the week's meetings · Partners: trust that no's don't hide a miss.",
      },
      askYourTeam: [
        "What were the fund's last three 'no's — and which criterion killed each?",
      ],
      selfCheck: {
        criteria: [
          "Each verdict names the deciding criterion explicitly.",
          "No verdict exceeds four sentences.",
          "At least one 'no' acknowledges what was good anyway.",
        ],
        redFlags: ["A verdict says 'mixed picture' and takes no side."],
      },
    },
    {
      topic: "Draft the screening memo a partner reads",
      closesGapIndex: 2,
      why: "The memo is the artifact this role ships — it assembles the metrics read and screen into an argument. Hands-on: the form is learned by writing it against your own earlier work.",
      context:
        "When a company clears the screen, someone has to argue the case — in writing, to partners who will attack it. That document is the investment memo, and it's the fund's actual unit of decision-making: two pages that say what we believe, which numbers carry it, and what would kill it. Analysts who write clear memos get staffed on live deals; this is the artifact your whole road builds toward.",
      bridgeFromBackground: "Your best client deck, rewritten as prose that argues instead of presents.",
      concept: {
        explanation:
          "A screening memo argues a position to a skeptical reader in two pages: thesis up front, the three numbers that carry it, the risk that kills it, and what diligence must prove. Unlike a deck, nothing hides in a footnote — the partner reads it alone, so the memo must anticipate the pushback you'd normally answer live. Use your task-1 read as the evidence base and your task-2 discipline to keep it decisive.",
        misconceptionToAvoid: "Writing a balanced overview. Memos take a position; diligence exists to test it.",
        traps: [
          "A balanced overview is a failed memo — take a position; diligence exists to test it.",
        ],
        keyTerms: [{ term: "thesis", plainMeaning: "the one-sentence claim about why this deal makes money" }],
      },
      workedExample: { setup: "", walkThrough: [], takeaway: "" },
      task: {
        title: "Two-page screening memo on your strongest task-2 target",
        managerRequest: 'Your VP says: "Write it up — if the partners bite, we open diligence Monday."',
        givenInputs: ["your task-1 metrics read", "your task-2 verdicts", "the fund's memo template outline"],
        deliverable: "A two-page memo: thesis, three carrying numbers, kill-risk, diligence question.",
        timebox: "half a day",
        steps: [
          "Write the thesis sentence first; everything else defends it.",
          "Pull the three carrying numbers from your metrics read, one paragraph each.",
          "Name the kill-risk plainly and what diligence must prove within two weeks.",
        ],
        doneWhen: "A partner can state your thesis and your kill-risk from memory after one read.",
        stakeholders: "Partners: the go/no-go audience · Diligence team: inherits your open question.",
      },
      askYourTeam: [
        "Can I read two recent screening memos the partners rated well?",
      ],
      selfCheck: {
        criteria: [
          "The thesis is one sentence and appears in the first three lines.",
          "Every number in the memo appeared in your task-1 or task-2 work.",
          "The kill-risk section names what would change your mind.",
        ],
        redFlags: ["The memo reads like a company summary instead of an argument."],
      },
    },
  ],
  firstTask: {
    title: "Readiness project: own one inbound deal end-to-end",
    why: "Metrics read → screen → memo on a live inbound, unassisted, is the whole analyst loop — owning one proves you're ramped.",
    horizon: "~6 weeks at your pace",
    horizonAssumed: false,
    phases: [
      { stage: "Observe", timing: "Weeks 1-2", goal: "Reproduce a recent screening memo from its data room; match the partner's call or argue your delta." },
      { stage: "Assist", timing: "Weeks 3-4", goal: "Run first-pass screens on live inbound with the sourcing lead reviewing your verdicts." },
      { stage: "Own", timing: "Weeks 5-6", goal: "Take one inbound from teaser to partner-ready memo, solo." },
    ],
  },
  timelineNote: "Three tight assignments at ~8 hrs/week is about a month, leaving the readiness arc realistic at six weeks.",
};

const INTERVIEW_PLAN = {
  hook:
    "This map turns the RWE Analyst interview into a finite set of likely questions. It starts from the posting, your public-health background, and the room signal you gave — not a promise of exact questions, but a prep list with receipts.",
  northStar: "Walk into the interview with answer-bank entries for the questions most likely to test your RWE readiness.",
  transferableStrengths: [
    {
      point: "Epidemiology vocabulary",
      detail: "You already know cohorts, bias, and confounding — use that as your bridge instead of pretending to be new to study design.",
    },
    {
      point: "Public-health stakeholder writing",
      detail: "You have translated messy health data into program decisions; reuse that story for medical-affairs communication questions.",
    },
  ],
  knowledgeGaps: [
    {
      point: "Claims-data translation",
      detail: "The posting asks for claims/EHR/registry work; you need answers that translate your registry background into claims concepts honestly.",
    },
    {
      point: "RWE judgment under ambiguity",
      detail: "The room will test how you handle limits, code noise, and evidence strength rather than just whether you know definitions.",
    },
  ],
  learningSequence: [
    {
      topic: "Why this role, why now",
      archetype: "",
      section: "fit",
      tag: "start_here",
      closesGapIndex: 0,
      why: "Resume: county health department analytics + posting: \"support observational research projects\"",
      context:
        "This question tests whether your move sounds intentional. The strong version does not apologize for coming from public health; it names the shared work: defining populations, reading imperfect data, and communicating evidence to non-technical stakeholders.",
      bridgeFromBackground: "Your vaccination-access memo is the bridge from public health analytics to RWE evidence summaries.",
      askYourTeam: [
        "What would success in the first 90 days look like for this analyst?",
        "Which teams consume the evidence summaries most often?",
      ],
      searchLinks: [],
      comprehensionCheck: {
        question: "What should the first sentence of this answer do?",
        options: ["State the through-line from public health to RWE", "Explain every job change", "Apologize for not having pharma experience"],
        answerIndex: 0,
        explanation: "Lead with the through-line; the gap is real, but it should not own the opening.",
      },
      concept: {
        explanation:
          "Fit answers are not biography. They are a claim about why your past work makes this next room make sense. For this posting, the claim is that you have already done the reasoning shape: define a population, respect bias, analyze messy health data, and write the implication for a stakeholder. The missing layer is pharma data plumbing, which you can name without making it sound disqualifying.",
        misconceptionToAvoid: "Reciting your resume chronologically and hoping the interviewer infers the fit.",
        traps: ["Do not let the answer become a confession about everything you lack.", "Do not say 'I am passionate' before naming evidence."],
        keyTerms: [{ term: "through-line", plainMeaning: "the one sentence that makes the career move coherent" }],
      },
      workedExample: {
        setup: "Weak opener: 'I have a public health background and I want to move into pharma.' Strong opener names the shared work.",
        walkThrough: [
          "Claim: 'My public-health analytics work already trained the evidence habit this role needs.'",
          "Evidence: vaccination-access analysis, messy health data, stakeholder memo.",
          "Bridge: claims data and medical affairs are the new context, not a new reasoning muscle.",
        ],
        takeaway: "The answer lands when the interviewer can repeat why this move makes sense.",
      },
      task: {
        title: "Answer bank: why this RWE role",
        managerRequest: "Walk me through your background — and why this Real World Evidence Analyst role.",
        givenInputs: ["your resume", "the RWE Analyst posting"],
        deliverable: "An answer-bank entry with a 20-second opening and two proof points.",
        timebox: "20-30 min",
        timeEstimateMin: 25,
        steps: ["Write the one-sentence through-line.", "Add two proof points from your background.", "End by naming the RWE layer you are here to learn."],
        doneWhen: "The answer reaches the role in the first two sentences.",
        stakeholders: "Recruiter: coherent move · Hiring manager: evidence that the bridge is real",
      },
      selfCheck: {
        criteria: ["Opening names the career through-line.", "Two proof points come from the real resume.", "The pharma/RWE gap is named without spiraling."],
        redFlags: ["The first minute is chronology.", "The answer sounds like any public-health candidate could say it."],
      },
    },
    {
      topic: "Cohort definition from claims",
      archetype: "",
      section: "capability",
      tag: "",
      closesGapIndex: 0,
      why: "JD: \"Translate clinical questions into cohort definitions, index dates, inclusion/exclusion criteria\"",
      context:
        "This is the technical center of the posting. They are testing whether you can turn an RWE question into computable rules and whether you know what claims data can and cannot prove.",
      bridgeFromBackground: "You have defined epi cohorts; this is the claims-code version of the same reasoning.",
      askYourTeam: ["Does the team have approved code lists for common diseases?", "Which washout windows are standard here?"],
      searchLinks: [],
      comprehensionCheck: {
        question: "What is the safest answer shape?",
        options: ["Define index, inclusion/exclusion, and limits", "Start with SQL syntax", "Say claims data proves diagnosis"],
        answerIndex: 0,
        explanation: "The interviewer needs the reasoning recipe, not code theater.",
      },
      concept: {
        explanation:
          "A cohort answer should sound like a recipe: who enters, on what date, under which inclusion/exclusion rules, and what limitations remain. In claims data, codes are computable clues, not clinical truth. A strong answer names the rules and the uncertainty together.",
        misconceptionToAvoid: "Treating claims codes as confirmed clinical diagnoses.",
        traps: ["Forgetting continuous enrollment makes the lookback invisible.", "Naming a code list without saying who validates it."],
        keyTerms: [{ term: "index date", plainMeaning: "the date that starts each patient's study clock" }],
      },
      workedExample: {
        setup: "Question: define new users of Drug A among type 2 diabetes patients.",
        walkThrough: [
          "Index on first Drug A fill.",
          "Require diabetes evidence before index and continuous enrollment for lookback.",
          "Name what claims cannot see: labs, adherence, care outside coverage.",
        ],
        takeaway: "The recipe is strong because it is computable and humble about the data.",
      },
      task: {
        title: "Answer bank: claims cohort definition",
        managerRequest: "How would you define a patient cohort from claims data for a Drug A RWE study?",
        givenInputs: ["the cohort-definition posting line", "your diagnostic Q2 answer"],
        deliverable: "A 60-90 second answer with the rule sequence and limits.",
        timebox: "30-40 min",
        timeEstimateMin: 35,
        steps: ["Draft the rule sequence.", "Add one limitation sentence.", "Add one confirm-locally question."],
        doneWhen: "The answer states index, inclusion/exclusion, and one data limitation.",
        stakeholders: "Engineer/peer: can you reason with claims? · Hiring manager: can you be trained fast?",
      },
      selfCheck: {
        criteria: ["Index date is explicit.", "Rules are computable.", "Limitations are named without over-apologizing."],
        redFlags: ["The answer says claims prove disease.", "The answer hides uncertainty until the end."],
      },
    },
    {
      topic: "The gap question",
      archetype: "",
      section: "fit",
      tag: "you_named_this",
      closesGapIndex: 0,
      why: "Challenge field: \"I freeze when they ask why I have not worked in pharma\"",
      context:
        "This is named, not dreaded. The question is answerable because the gap is not the whole story: you have adjacent evidence work, and the missing layer is a learnable domain context.",
      bridgeFromBackground: "Public-health evidence work is not pharma, but it is not unrelated.",
      askYourTeam: [],
      searchLinks: [],
      comprehensionCheck: {
        question: "What should this answer avoid?",
        options: ["A long apology", "A plain statement of the gap", "A bridge to evidence work"],
        answerIndex: 0,
        explanation: "Name the gap plainly, then move to the bridge and learning plan.",
      },
      concept: {
        explanation:
          "A gap answer has three moves: name the gap without flinching, name the adjacent evidence you do have, and explain how you close the domain layer. The tone is calm. You are not asking them to ignore the missing pharma experience; you are showing them why it is the right missing piece, not a fatal one.",
        misconceptionToAvoid: "Trying to make the gap disappear.",
        traps: ["Over-explaining makes the gap sound larger.", "Generic enthusiasm cannot replace evidence."],
        keyTerms: [{ term: "bridge", plainMeaning: "the evidence that makes the gap smaller and trainable" }],
      },
      workedExample: {
        setup: "Weak: 'I know I don't have pharma experience, but I'm a fast learner.'",
        walkThrough: [
          "Name: 'I have not worked inside pharma yet.'",
          "Bridge: 'I have done population-level health-data analysis and stakeholder memos.'",
          "Close: 'The ramp is claims/RWE workflow, which is exactly why I am drilling cohort and limitations answers.'",
        ],
        takeaway: "The gap gets smaller when it is specific and paired with proof.",
      },
      task: {
        title: "Answer bank: the pharma gap",
        managerRequest: "You have not worked in pharma before. Why should we trust you in this role?",
        givenInputs: ["your challenge field", "your vaccination-access project"],
        deliverable: "A calm gap answer with one bridge story.",
        timebox: "25-35 min",
        timeEstimateMin: 30,
        steps: ["Write the one-sentence gap acknowledgment.", "Add the bridge story.", "End with the specific ramp you are already working on."],
        doneWhen: "The answer names the gap once and spends most of its time on evidence.",
        stakeholders: "Hiring manager: trainability · Recruiter: risk reduced without spin",
      },
      selfCheck: {
        criteria: ["The gap is named plainly.", "The bridge story is specific.", "The answer ends on readiness, not apology."],
        redFlags: ["The answer repeats the gap more than once.", "The bridge story is generic."],
      },
    },
    {
      topic: "Evidence limitations judgment",
      archetype: "",
      section: "judgment",
      tag: "blind_spot",
      closesGapIndex: 1,
      why: "Diagnostic: Q2 named cohort rules but missed limits; JD: \"Document assumptions, limitations, and data-quality concerns clearly\"",
      context:
        "This question tests judgment, not vocabulary. A senior interviewer wants to hear whether you can protect the team from overclaiming when the data is imperfect.",
      bridgeFromBackground: "Your epi training already taught bias; now say it in stakeholder language.",
      askYourTeam: ["Which limitations must be named in every claims-data summary here?"],
      searchLinks: [],
      comprehensionCheck: {
        question: "What makes this a judgment answer?",
        options: ["It names what the data cannot support", "It lists more variables", "It avoids uncertainty"],
        answerIndex: 0,
        explanation: "Judgment is calibrated uncertainty: useful, specific, not evasive.",
      },
      concept: {
        explanation:
          "A limitation answer should protect the decision. In claims, the common move is to distinguish billed events from clinical truth, then say how that affects the conclusion. The interviewer is not asking you to be negative; they are asking if you can keep a stakeholder from believing more than the data supports.",
        misconceptionToAvoid: "Listing limitations as boilerplate instead of tying each one to the decision.",
        traps: ["Saying 'missingness' without naming the field.", "Using cautious language so vague it no longer guides anyone."],
        keyTerms: [{ term: "calibrated claim", plainMeaning: "a conclusion sized to the evidence behind it" }],
      },
      workedExample: {
        setup: "A cohort has high Drug A fills but no lab results in the claims extract.",
        walkThrough: [
          "Supported: treatment patterns from fills.",
          "Not supported: glycemic control or adherence.",
          "Stakeholder phrasing: 'This supports utilization, not clinical response.'",
        ],
        takeaway: "The answer wins when the limitation changes what the stakeholder believes.",
      },
      task: {
        title: "Answer bank: what claims cannot prove",
        managerRequest: "What limitations would you flag before medical affairs uses a claims-based summary?",
        givenInputs: ["the limitations posting line", "your diagnostic Q2 read"],
        deliverable: "A judgment answer with two limitations and one implication.",
        timebox: "30-40 min",
        timeEstimateMin: 35,
        steps: ["Name two concrete limitations.", "Tie each to a decision risk.", "Rewrite the final claim at the right strength."],
        doneWhen: "Each limitation changes the interpretation, not just the mood.",
        stakeholders: "Exec/VP: business risk · Medical affairs: claim discipline",
      },
      selfCheck: {
        criteria: ["Two limitations are concrete.", "Each limitation has an implication.", "The final claim is calibrated."],
        redFlags: ["Limitations read like generic disclaimers.", "The answer overclaims after naming caveats."],
      },
    },
    {
      topic: "Vaccination access story",
      archetype: "",
      section: "track_record",
      tag: "",
      closesGapIndex: 1,
      why: "Resume: \"vaccination access analysis\" and JD: \"Create concise evidence summaries\"",
      context:
        "This is the behavioral proof point. The room wants to know whether you have already shipped work that changed a stakeholder's decision.",
      bridgeFromBackground: "Your county-health memo is the story that proves you can turn analysis into action.",
      askYourTeam: [],
      searchLinks: [],
      comprehensionCheck: {
        question: "What should the story prove?",
        options: ["You changed a stakeholder decision with evidence", "You used every method you know", "You worked hard"],
        answerIndex: 0,
        explanation: "Behavioral answers need a decision and your role in changing it.",
      },
      concept: {
        explanation:
          "Track-record answers should not be generic teamwork stories. Pick the story that proves the job's core artifact: evidence summary for a stakeholder. Use situation, action, result, but keep the result tied to the decision the analysis changed.",
        misconceptionToAvoid: "Choosing the most impressive-sounding project instead of the most job-shaped one.",
        traps: ["Forgetting to say what YOU did.", "Ending with output instead of impact."],
        keyTerms: [{ term: "artifact match", plainMeaning: "the past work product that looks most like this role's work product" }],
      },
      workedExample: {
        setup: "Project: vaccination access analysis combining appointment data with demographics.",
        walkThrough: [
          "Situation: program managers needed outreach priorities.",
          "Action: cleaned and joined messy data, found low-access areas.",
          "Result: memo directed outreach priorities.",
        ],
        takeaway: "The story works because the artifact matches the role: evidence to decision.",
      },
      task: {
        title: "Answer bank: evidence-to-action story",
        managerRequest: "Tell me about a project where your analysis changed a stakeholder decision.",
        givenInputs: ["your vaccination-access project", "the evidence-summary posting line"],
        deliverable: "A STAR answer that names your role, artifact, and decision impact.",
        timebox: "25-35 min",
        timeEstimateMin: 30,
        steps: ["Write the result first.", "Add only the setup needed to understand the decision.", "Name your specific analytical move."],
        doneWhen: "The interviewer hears your role and the decision impact before the method details.",
        stakeholders: "Recruiter: credible story · Hiring manager: work-product match",
      },
      selfCheck: {
        criteria: ["Result appears early.", "Your individual role is explicit.", "The artifact maps to the RWE posting."],
        redFlags: ["The story is mostly team background.", "The answer never says what changed because of the work."],
      },
    },
    {
      topic: "Ambiguous data-quality call",
      archetype: "",
      section: "judgment",
      tag: "",
      closesGapIndex: 1,
      why: "Interviewer kind: Engineer / peer; JD: \"data-quality concerns\"",
      context:
        "A peer interviewer may push on messy details. This question tests whether you can make a defensible call when no rule is perfect.",
      bridgeFromBackground: "You have handled messy public-health data; now make the tradeoff explicit.",
      askYourTeam: ["Who signs off when a data-quality rule changes the cohort size materially?"],
      searchLinks: [],
      comprehensionCheck: {
        question: "What makes the call defensible?",
        options: ["State the tradeoff and document the rule", "Pick the larger N", "Avoid deciding until someone else does"],
        answerIndex: 0,
        explanation: "Ambiguity is normal; the craft is a documented, reviewable choice.",
      },
      concept: {
        explanation:
          "Judgment questions are won by naming the tradeoff. If a patient has a fill before a confirming diagnosis, you can include, exclude, or flag depending on the study intent. The answer should say what you would do first, what risk it creates, and who you would confirm with locally.",
        misconceptionToAvoid: "Pretending there is always one universal rule.",
        traps: ["Changing rules after seeing outcomes.", "Not counting how many patients the decision affects."],
        keyTerms: [{ term: "sensitivity check", plainMeaning: "rerun under another reasonable rule to see if the conclusion changes" }],
      },
      workedExample: {
        setup: "A patient has Drug A fill on March 1 and diabetes diagnosis on March 30.",
        walkThrough: [
          "Option A includes them as a likely treated patient; risk: weak disease confirmation at index.",
          "Option B excludes them; risk: drops real patients whose coding lags.",
          "Defensible move: pre-specify the rule, count affected patients, and sensitivity-check.",
        ],
        takeaway: "The win is not certainty; it is a rule another analyst can audit.",
      },
      task: {
        title: "Answer bank: ambiguous inclusion call",
        managerRequest: "What would you do if the data support two reasonable cohort rules?",
        givenInputs: ["the data-quality posting line", "the peer-interviewer signal"],
        deliverable: "A judgment answer with decision, tradeoff, and sensitivity check.",
        timebox: "30-40 min",
        timeEstimateMin: 35,
        steps: ["State the decision.", "Name the tradeoff.", "Add the sensitivity or escalation step."],
        doneWhen: "The answer makes a call and shows how it would be audited.",
        stakeholders: "Engineer/peer: reproducibility · Hiring manager: judgment under ambiguity",
      },
      selfCheck: {
        criteria: ["A decision is made.", "The tradeoff is named.", "The audit/sensitivity step is explicit."],
        redFlags: ["The answer says 'it depends' and stops.", "The rule changes after results."],
      },
    },
  ],
  firstTask: {
    title: "Mock interview: RWE Analyst question map",
    why: "The map is useful only when the answers can survive the room.",
    horizon: "your interview runway",
    horizonAssumed: false,
    phases: [
      { stage: "Warm-up", timing: "First pass", goal: "Answer fit and track-record questions cleanly." },
      { stage: "Core questions", timing: "Middle pass", goal: "Answer capability and judgment questions with receipts and limits." },
      { stage: "Rapid fire", timing: "Final pass", goal: "Mix the map under light time pressure." },
    ],
  },
  trims: ["Ask-them questions — rendered after the map, not as a fifth section — reuse the askYourTeam prompts."],
  timelineNote: "The map is slightly larger than one sitting so you can skip untagged questions without losing the named gap or blind spot.",
};

function clonePlan(plan) {
  return JSON.parse(JSON.stringify(plan));
}

function interviewerKindFrom(body) {
  const text = [
    body?.interviewer_kind,
    body?.interviewerKind,
    body?.target?.instructions,
    body?.target?.realTask,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  if (/engineer|peer|technical/.test(text)) return "peer";
  if (/exec|vp|chief|final/.test(text)) return "exec";
  if (/recruiter/.test(text)) return "recruiter";
  if (/panel/.test(text)) return "panel";
  return "hiring";
}

function interviewPlanFor(body) {
  const plan = clonePlan(INTERVIEW_PLAN);
  const kind = interviewerKindFrom(body);
  const byTopic = Object.fromEntries(plan.learningSequence.map((m) => [m.topic, m]));
  const orders = {
    recruiter: ["Why this role, why now", "The gap question", "Vaccination access story", "Cohort definition from claims", "Evidence limitations judgment"],
    peer: ["Cohort definition from claims", "Ambiguous data-quality call", "Evidence limitations judgment", "Vaccination access story", "Why this role, why now", "The gap question"],
    exec: ["Evidence limitations judgment", "Ambiguous data-quality call", "Why this role, why now", "Vaccination access story", "Cohort definition from claims"],
    panel: ["Why this role, why now", "Cohort definition from claims", "Vaccination access story", "Evidence limitations judgment", "Ambiguous data-quality call", "The gap question"],
    hiring: ["Cohort definition from claims", "Vaccination access story", "Evidence limitations judgment", "Why this role, why now", "The gap question"],
  };
  plan.learningSequence = (orders[kind] || orders.hiring).map((topic) => byTopic[topic]).filter(Boolean);
  plan.timelineNote =
    kind === "peer"
      ? "Engineer / peer room: capability and judgment carry the most weight; fit stays present but lighter."
      : kind === "recruiter"
        ? "Recruiter room: fit and the named gap carry the most weight; capability stays as a receipt-backed check."
        : kind === "exec"
          ? "Exec room: judgment and business-risk framing carry the most weight."
          : "Hiring-manager room: capability, track record, and judgment stay balanced.";
  return plan;
}

// A tiny verified-looking resource pool + selections (only two modules get a
// resource; the others are hands-on, exercising both UI states).
const RESOURCES_BY_INDEX = {
  0: [
    {
      title: "What is Real-World Evidence?",
      url: "https://www.youtube.com/watch?v=yuzuBChwCx8",
      source: "YouTube",
      kind: "video",
      by: "AbbVie",
      use: "Three minutes of orientation before you open the extract — what RWE is for, from a company that runs on it. Watch once; the memo task needs no more.",
    },
    {
      title: "Misclassification in Administrative Claims Data: Quantifying the Impact on Treatment Effect Estimates",
      url: "https://openalex.org/W2050187883",
      source: "OpenAlex",
      kind: "paper",
      by: "Michele Jönsson Funk",
      year: 2014,
      use: "Closes the 'codes are clues, not facts' gap with real numbers. Read the introduction and discussion; skip the estimation math.",
    },
  ],
  2: [
    {
      title: "The REporting of studies Conducted using Observational Routinely-collected health Data (RECORD) Statement",
      url: "https://openalex.org/W2163278718",
      source: "OpenAlex",
      kind: "paper",
      by: "Eric I. Benchimol",
      year: 2015,
      use: "The checklist reviewers hold your Table 1 against. Skim the checklist items about population and variables; skip the rationale sections.",
      keyPoint:
        "RECORD was created as an extension to the STROBE statement to address reporting items specific to observational studies using routinely collected health data. RECORD consists of a checklist of 13 items related to the title, abstract, introduction, methods, results, and discussion section of articles.",
    },
  ],
};

// Fixed, clean-ish plan check (a couple of soft notes so the self-check UI shows).
const CHECK = {
  unteach: { findings: [], pass: true },
  overteaching: {
    already_known: [],
    needs_review: [
      { node: "Bias and confounding instincts", reason: "Your background suggests deep familiarity — confirm this module isn't over-teaching it." },
    ],
    pass: true,
  },
  firstTask: {
    missing_prerequisites: [],
    vague_points: [],
    scope_concern: "",
    needs_review: [],
    pass: true,
  },
};

// Input-page endpoints, so the flow works offline too.
const ANALYZE = {
  field: ["Epidemiology", "Public Health"],
  sector: ["County health department"],
  skills: [
    { skill: "study design", evidence: "comfortable with study design basics, bias/confounding, cohort definitions" },
    { skill: "stakeholder memos", evidence: "wrote short reports for program managers" },
    { skill: "messy health data", evidence: "combined clinic appointment data with census tract demographics" },
  ],
};

function topicsFrom(body) {
  return Array.isArray(body?.topics) ? body.topics : [];
}

// Route a request to its canned response. Returns undefined for anything we
// don't mock (the caller then falls through to the real network).
function activePersona() {
  try {
    const persona = typeof window !== "undefined" ? localStorage.getItem("lb_persona") : "";
    return ["rwe", "growth", "interview"].includes(persona) ? persona : "rwe";
  } catch {
    return "rwe";
  }
}

// Demo coach review: canned but state-honest — it reads the actual draft the
// visitor typed (length + which criteria words appear) so the demo shows the
// real product behavior without pretending to be AI. Labeled as a sample.
function mockCoach(body) {
  const draft = (body?.draft || "").toString().trim();
  const criteria = Array.isArray(body?.criteria) ? body.criteria : [];
  const words = draft ? draft.split(/\s+/).length : 0;
  const filledBullets = (draft.match(/^- \S/gm) || []).length;
  const bare = words < 40 || filledBullets === 0;
  const verdicts = criteria.map((c, i) => {
    if (bare) return { status: i === 0 ? "thin" : "missing", note: "Demo sample — the draft doesn't cover this yet; the live review reacts to your actual text." };
    return {
      status: i === 0 ? "met" : "thin",
      note: i === 0 ? "Demo sample — the draft addresses this directly." : "Demo sample — attempted, but a real reviewer would want more specifics here.",
    };
  });
  return {
    review: {
      overall: bare
        ? `This is a demo sample review, not AI. Your draft is ${words} words — mostly outline so far. The live version reads every line and grades it against these exact criteria.`
        : `This is a demo sample review, not AI. At ${words} words with sections filled in, this draft is reviewable — the live version would quote your actual sentences back at you.`,
      criteria: verdicts,
      redFlagHits: [],
      nextEdits: bare
        ? ["Fill the template sections with what you actually found.", "Write the bottom line first — one sentence each way."]
        : ["Tighten the bottom line to one claim per sentence.", "Name what you could NOT determine, explicitly."],
    },
  };
}

// Demo practice materials: a real (tiny) synthetic extract so the demo shows
// the Door-C behavior honestly — traps seeded in the rows, not asserted.
function mockMaterials(body) {
  const givens = Array.isArray(body?.givenInputs) ? body.givenInputs : [];
  const wantsData = givens.some((g) => /csv|extract|data|file/i.test(String(g)));
  const materials = [];
  if (wantsData) {
    materials.push({
      filename: "claims_sample.csv",
      note: "18 rows standing in for a real claims extract — small on purpose.",
      content: [
        "patient_id,svc_date,dx_code,ndc,days_supply,enroll_start,enroll_end",
        "P001,2024-01-03,E11.9,,,2023-06-01,2024-12-31",
        "P001,2024-02-01,,00093-7267-01,30,2023-06-01,2024-12-31",
        "P001,2024-02-15,Z13.1,,,2023-06-01,2024-12-31",
        "P002,2024-01-10,E11.9,,,2024-01-01,2024-03-31",
        "P002,2024-02-20,E11.65,,,2024-01-01,2024-03-31",
        "P003,2024-03-05,,00093-7267-01,30,2023-01-01,2024-12-31",
        "P003,2024-04-02,,00093-7267-01,,2023-01-01,2024-12-31",
        "P004,2024-01-22,E11.9,,,2023-11-01,2024-06-30",
        "P004,2024-01-22,83036,,,2023-11-01,2024-06-30",
        "P005,2024-02-14,I10,,,2023-01-01,2024-12-31",
        "P005,2024-03-01,E11.9,,,2023-01-01,2024-12-31",
        "P005,2024-03-30,,00378-0053-05,90,2023-01-01,2024-12-31",
        "P006,2024-01-05,E11.9,,,2024-01-01,2024-02-28",
        "P007,2024-02-09,,55111-0467-30,30,2023-05-01,2024-12-31",
        "P007,2024-02-25,E11.9,,,2023-05-01,2024-12-31",
        "P008,2024-03-12,E11.9,,,2023-01-01,2024-12-31",
        "P008,2024-04-15,,00093-7267-01,30,2023-01-01,2024-12-31",
      ].join("\n"),
    });
  }
  materials.push({
    filename: "data_dictionary.md",
    note: "A partial dictionary — 'partial' is part of the exercise.",
    content: [
      "# Data dictionary (partial)",
      "- patient_id — anonymized member ID",
      "- svc_date — date on the claim line (billing or service date; source varies)",
      "- dx_code — ICD-10-CM diagnosis code, or CPT code on lab-order rows",
      "- ndc — national drug code for pharmacy fills",
      "- days_supply — days dispensed (may be null)",
      "- enroll_start / enroll_end — coverage span for the member",
    ].join("\n"),
  });
  return {
    materials,
    entities:
      "CANON: Data source = commercial CLAIMS extract (fills, not prescriptions; no lab values). Condition = Type 2 diabetes, ICD-10 E11.x only. Drug A = metformin-class oral tablet, NDC family 00093-7267. Patient IDs P001-P008. Dates within 2023-06-01..2024-12-31.",
  };
}

export function resolveMock(url, body) {
  const persona = body?.goals?.purpose === "interview" ? "interview" : activePersona();
  const growth = persona === "growth";
  const interview = persona === "interview";
  if (url.includes("/api/plan")) return { plan: interview ? interviewPlanFor(body) : growth ? GROWTH_PLAN : RWE_PLAN };
  if (url.includes("/api/coach")) return mockCoach(body);
  if (url.includes("/api/push")) {
    // The drill's one-per-take push. Canned but answer-shaped enough to demo the
    // exchange; the live route generates from the actual answer.
    return {
      push:
        "Are you sure about that definition? If I told you enrollment gaps are common in this population, which part of your answer still holds?",
    };
  }
  if (url.includes("/api/materials")) return mockMaterials(body);
  if (url.includes("/api/intake")) {
    return {
      contentFears: ["the technical deep-dive"],
      obstacles: ["nerves under pressure"],
      tone: "neutral",
      q2: "Walk me through how you would define a patient cohort from claims data.",
      q2Receipt: "define patient cohorts, translate clinical questions",
      q1SubstanceKey: "Connects their background to this role with specific evidence, not adjectives.",
      q1DeliveryKey: "Result reached early; under ~90 seconds; ends pointed at this job.",
      q2SubstanceKey: "Shows the core cohort idea (codes + dates + rules) and names its limits.",
      q2DeliveryKey: "Answer first, reasoning second; no hedging spiral.",
      contractLine: "",
    };
  }
  if (url.includes("/api/assist")) {
    const q = (body?.messages || []).filter((m) => m.role === "user").pop()?.content || "";
    return {
      reply: `(Demo sample — not AI.) You asked: “${String(q).slice(0, 80)}”. In the live version I read this exact page, your materials, and your draft, and answer from them — flagging anything team-specific as a convention to confirm locally.`,
    };
  }
  if (url.includes("/api/candidates")) {
    // Growth persona ships no catalog resources — exercises the honest hands-on state.
    return { candidates: topicsFrom(body).map((t) => ({ index: t.index, pool: growth ? [] : RESOURCES_BY_INDEX[t.index] || [] })) };
  }
  if (url.includes("/api/select")) {
    return { selections: topicsFrom(body).map((t) => ({ index: t.index, resources: growth ? [] : RESOURCES_BY_INDEX[t.index] || [] })) };
  }
  if (url.includes("/api/augment-web")) return { augments: [] };
  if (url.includes("/api/check")) return CHECK;
  if (url.includes("/api/analyze")) return ANALYZE;
  if (url.includes("/api/classify")) return { type: "job_posting" };
  if (url.includes("/api/focus")) {
    const persona = activePersona();
    return {
      phrase:
        persona === "interview"
          ? "prepping for a Real World Evidence Analyst interview"
          : persona === "growth"
            ? "targeting a Growth Equity Analyst role"
            : "targeting a Real World Evidence Analyst role",
    };
  }
  if (url.includes("/api/read-link")) return { ok: false, reason: "Mock mode — live link reading is disabled. Paste the text instead." };
  return undefined;
}

export const MOCK_PLAN = RWE_PLAN;
