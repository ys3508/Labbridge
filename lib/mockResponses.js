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
      comprehensionCheck: {
        question: "Which table tells you whether a patient was observable during a given month?",
        options: ["The enrollment table", "The diagnosis claims", "The pharmacy claims", "The data dictionary"],
        answerIndex: 0,
        explanation:
          "Enrollment defines the observation window — outside it you're blind, no matter what other claims say.",
      },
      why:
        "Everything downstream (cohorts, outcomes, tables) assumes you can navigate the raw tables. This comes first because it's the foundation the other three modules build on.",
      bridgeFromBackground:
        "You already profile a new dataset before trusting it — same instinct, new table shapes.",
      concept: {
        explanation:
          "Claims data records billable events, not a clinical story. One patient shows up across an enrollment table (when they're observable), medical claims (diagnoses/procedures with dates), and pharmacy claims (fills). Nothing is written for research — a code appears because someone billed for it, so absence of a code isn't absence of disease. Your job is to link rows by patient and time, and to always ask what the data can and can't see. Think of it as census-tract linkage work: real signal, but you respect the seams.",
        misconceptionToAvoid:
          "Treating a diagnosis code as proof the patient has the condition — it's a billed clue, not a confirmed fact.",
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
      bridgeFromBackground:
        "You've defined cohorts in epi — here you operationalize them with codes and index dates instead of survey criteria.",
      concept: {
        explanation:
          "A cohort definition is a precise, reproducible recipe: who's in, from when, and how you define the exposure and outcome — all in terms a machine can execute against claims. The pieces are an index date (the clock-start, often first treatment), inclusion/exclusion windows, and code-based definitions for conditions and events. The discipline is the same rigor you already apply to study design; what's new is expressing it as computable rules and pre-committing to them so results aren't cherry-picked.",
        misconceptionToAvoid:
          "Defining the cohort loosely and 'seeing what the data says' — that bakes in bias. Pre-specify.",
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
      comprehensionCheck: {
        question: "Besides describing patients, what second job does a baseline table do?",
        options: [
          "Surfaces data-quality problems before any outcome is run",
          "Proves the drug works",
          "Replaces the outcome analysis",
          "Impresses medical affairs with volume",
        ],
        answerIndex: 0,
        explanation:
          "Impossible ages and heavy missingness show up in Table 1 — catching them here prevents a broken outcome analysis later.",
      },
      why:
        "The first real deliverable a new RWE hire ships. It comes third because it runs on the cohort from module 2.",
      bridgeFromBackground:
        "You've made 'Table 1's before — same idea, now sourced from claims and read by medical, not reviewers.",
      concept: {
        explanation:
          "A baseline (Table 1) describes the cohort at index: age, sex, comorbidities, prior treatment. In RWE it does double duty — it characterizes patients and it surfaces data-quality problems (impossible ages, missingness) before anyone runs an outcome. The skill isn't the statistics you already know; it's choosing variables medical affairs cares about and presenting them so a non-statistician trusts the cohort at a glance.",
        misconceptionToAvoid:
          "Padding the table with every variable you can compute — relevance and trust beat completeness.",
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

// A tiny verified-looking resource pool + selections (only two modules get a
// resource; the others are hands-on, exercising both UI states).
const RESOURCES_BY_INDEX = {
  0: [
    {
      title: "Using Big Healthcare Data for observational research",
      url: "https://openalex.org/W2000000000",
      source: "OpenAlex",
      kind: "paper",
      use: "Closes the 'what is claims data' gap. Read the data-sources section; skip the methods appendix — you already know the stats.",
    },
  ],
  2: [
    {
      title: "Descriptive analysis in the health sciences",
      url: "https://openlibrary.org/works/OL0000000W",
      source: "Open Library",
      kind: "book",
      use: "Only the 'presenting a Table 1' chapter — for choosing variables a clinical audience trusts, not the statistics.",
    },
  ],
};

// Fixed, clean-ish plan check (a couple of soft notes so the self-check UI shows).
const CHECK = {
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
export function resolveMock(url, body) {
  if (url.includes("/api/plan")) return { plan: RWE_PLAN };
  if (url.includes("/api/candidates")) {
    return { candidates: topicsFrom(body).map((t) => ({ index: t.index, pool: RESOURCES_BY_INDEX[t.index] || [] })) };
  }
  if (url.includes("/api/select")) {
    return { selections: topicsFrom(body).map((t) => ({ index: t.index, resources: RESOURCES_BY_INDEX[t.index] || [] })) };
  }
  if (url.includes("/api/augment-web")) return { augments: [] };
  if (url.includes("/api/check")) return CHECK;
  if (url.includes("/api/analyze")) return ANALYZE;
  if (url.includes("/api/classify")) return { type: "job_posting" };
  if (url.includes("/api/focus")) return { phrase: "targeting a Real World Evidence Analyst role" };
  if (url.includes("/api/read-link")) return { ok: false, reason: "Mock mode — live link reading is disabled. Paste the text instead." };
  return undefined;
}

export const MOCK_PLAN = RWE_PLAN;
