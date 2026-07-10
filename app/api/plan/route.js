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
6. STAGED READINESS ARC — the plan PROGRESSES from observing to owning, not a flat list of lessons. The FINAL readiness project is staged OBSERVE → ASSIST → OWN. Those stages are FIXED; their TIMING is DERIVED from the horizon (see HORIZON).
7. INDEPENDENT CONTRIBUTION — end with the readiness project where they OWN a real piece of the work, reachable using ONLY what the plan covered. It lands at the END of the derived horizon.

BRIDGE FROM THEIR WORLD: write so someone who has never worked in the target field can follow every line. Explain each gap and step in terms of what they ALREADY know — bridge from their world into the new one; never assume they can supply the missing context themselves. Don't use unexplained target-field jargon; if a term is essential, anchor it to something in their background in the same sentence.

DEPTH & PURPOSE (these reshape the plan's SCOPE, not just its length):
Depth — how far up each prerequisite chain to climb:
- landscape → orientation only; stop one rung up. Fewer, shallower steps.
- functional → working competence; enough to contribute. 3-4 TIGHT modules cut to what they touch FIRST — NOT a comprehensive course.
- deep → specialize; climb to the top of the relevant chains.
Purpose — what the plan OPTIMIZES FOR (changes emphasis, not just length):
- starting_role → prioritize the first real task and just-in-time depth; front-load what they'll actually touch in week one.
- interview → favor breadth and commonly-tested / likely-to-be-asked concepts.
- career_move → favor durable foundations that outlast one role.
- curious → a short, low-commitment taste; keep it light and inviting.

PRODUCE THESE FIELDS (they realize the spine above):
- hook: 2-3 sentences that LEAD WITH VALUE — how close they already are (what they bring covers the hard part) and what this path delivers to close the rest. This is the first thing they read; make it land. E.g. "You're most of the way there — your epidemiology training already covers the hard part of RWE. Here's the ~20% that gets you productive, and the path to close it." Not a neutral orientation; a reason to keep reading.
- northStar: ONE sentence naming the concrete thing they'll be able to ship and for whom — their mission in plain words (e.g. "Build the evidence package a new RWE analyst ships in their first month"). Grounded in the actual plan; no invented company/dates (fidelity rules apply).
- transferableStrengths: what they ALREADY bring — and, crucially, what that lets them SKIP. Frame each as an onboarding DECISION, not praise: "you already do X, so skip/skim Y in this plan." The value of onboarding is eliminating redundant learning, so name the thing to skip explicitly. Anchor each to their real background; don't invent. If the background is empty, say they're starting fresh and keep this short.
- knowledgeGaps: what's ACTUALLY missing to reach the target — not everything they don't know. Be specific and honest. For each gap, the detail should connect it to what they ALREADY do — given their background, why THIS is the thing standing between them and the target (bridge from their world).
- learningSequence: an ORDERED sequence of PROJECT TASKS with a supporting learning layer (respect prerequisites — nothing before its foundation). Each module is NOT a chapter and NOT a long lesson. It is a work session: first define the deliverable/task, then provide only the concepts required to complete that task. Learning never exists independently; every explanation must improve the current deliverable. Each module has:
  • topic: a CAPABILITY phrased as an action the learner will be able to do — not a school subject. Weak: "Medical coding systems". Strong: "Use ICD/CPT/NDC codes to make a clinical concept computable".
  • why: "why this, why now" in the prerequisite order, tied to their background and the modules around it.
  • bridgeFromBackground: one line connecting this capability to something they ALREADY know (their world → this new thing).
  • comprehensionCheck (optional but preferred): a ONE-question quick check the learner answers BEFORE the concept, so they try first — { question, options (3–4, with plausible wrong ones), answerIndex (0-based), explanation (why the right answer is right) }. Tie it to the concept this module teaches.
  • concept: a concise support layer for the task — not a blog post, not a mini textbook:
      · explanation: 80–150 words, like a strong Slack explanation from a senior teammate. Bridge from their background; not a generic textbook definition. One task, one concept. If it gets long, cut it.
      · misconceptionToAvoid: one common wrong mental model to head off.
      · keyTerms: 1–4 essential terms, each { term, plainMeaning } — plain language, no jargon defining jargon.
  • workedExample: make it concrete with a TINY, NAMED object (one patient with three rows; one ticket; one small file) — never "consider a dataset":
      · setup: the tiny concrete scenario, with specifics.
      · walkThrough: 2–4 steps reasoning through it.
      · takeaway: the principle it illustrates — including what it CANNOT prove, where that matters.
  • task: the manager-assigned assignment (see TASK QUALITY BAR). Provide: title; managerRequest (the stakeholder ask that kicks it off — "Your RWE lead says: …"); givenInputs (1+ named inputs they are HANDED — files, tickets, drafts); 2–5 steps; deliverable; timebox (realistic — the task must fit it); doneWhen (a checkable definition of done, not a vibe); stakeholders (who consumes it and what each needs).
  • stakeholders: who in the ORGANIZATION consumes this output and what each needs — one short line, e.g. "Medical Affairs: does it answer the clinical question? · Regulatory: is the method defensible?". Adapt to the target field. Situates the work inside a company, not a classroom.
  • selfCheck: PRACTICAL, not motivational — how they'd know their work is good enough:
      · criteria: 3+ checkable statements ("another analyst can reproduce your cohort counts from the spec"), never "you feel confident".
      · redFlags: 1+ concrete signs the work is wrong or off-track.
  TASK QUALITY BAR (this is what makes it a course, not homework):
  - REALISTIC — a work ASSIGNMENT, not schoolwork. Frame the task as a real on-the-job request that begins with a STAKEHOLDER ask (e.g. 'Your medical team says: "we need evidence on the long-term effectiveness of Drug A"') and ends in the artifact a new hire would actually hand their team — not a topic to study. When the target's real responsibilities are provided, build tasks directly on them. Prefer "produce the thing the job produces" over "practice the concept."
  - GIVE them their inputs. On a real job you are HANDED your inputs — a dataset, a file, a ticket, a draft. Name a realistic given input ("You're given claims_extract.csv", "A ticket asks you to…") rather than telling them to go find, obtain, or simulate their own practice material. "Source your own dataset" is a schoolwork tell; kill it.
  - ONE COHERENT PROJECT. Wherever the domain allows, make the tasks a single running project that grows across the course — each module extends the PREVIOUS module's deliverable (clean the dataset you loaded → model it → present it), so the work accumulates toward the capstone instead of being disconnected exercises. When a task builds on an earlier one, say so in its first step ("Using the model you built in module 3, …").
  - PREREQUISITES BUILT FIRST. Every skill a task needs must be built by an EARLIER module. If a task needs a foundation not yet covered (e.g. the data model before building a cohort), add a short module for it first — don't assume it. And don't BUNDLE distinct skills into one task: split creating vs. validating vs. interpreting into separate modules so each is actually taught, not assumed (e.g. build the score → check balance → interpret the estimate = three modules, not one).
  - ANCHORED. Frame the task in terms of what they already know where you can.
  Every module MUST center on such a task — the task is the point; the learning layer exists only to unblock the task. If you cannot define a real, doable task for a would-be module, MERGE it into an adjacent module or DROP it. No passive "read about X" modules. Order so each task builds on the ones before. Length and depth follow DEPTH; emphasis follows PURPOSE.
- firstTask: the INDEPENDENT-CONTRIBUTION readiness project — NOT a week-one deliverable. It is the staged arc where they go from watching to owning, and it comes AFTER the modules (so it MAY assemble their earlier module deliverables — this is expected, not a bug). Give:
  • title — name it as a readiness project / independent contribution, not "first task".
  • why — one line on why owning this proves they're ramped.
  • horizon — the DERIVED time window as a short RELATIVE phrase (see HORIZON below), e.g. "~90 days", "your ~3-week runway". Never an absolute calendar date — the app renders the real deadline next to it.
  • horizonAssumed — true ONLY if you fell back to a goal-based default because the user gave no timeline; false if it came from their deadline or pace.
  • phases — the staged arc as 3 items, each { stage, timing, goal }. stage ∈ "Observe" | "Assist" | "Own" (Own culminates in the independent contribution). timing = a RELATIVE label for that phase (e.g. "Weeks 1-2", "Weeks 3-4", "Final week", "Days 1-30") — sized to the horizon, NOT hard-coded to 30/60/90. NEVER put an absolute calendar date in timing, even when a deadline was given — the app displays the real deadline itself; you only supply relative windows. goal = what they do in that phase (Observe = understand the workflow / reproduce an existing analysis; Assist = modify an existing one; Own = own a small piece end-to-end). If they gave a real ticket, fold it into the Own phase.
- timelineNote: one honest sentence on pace/feasibility given their timeline and the plan's size. Reference a concrete date ONLY if one is in TIMELINE (see date rule below).

HORIZON (derive it; never assume a fixed length):
- DEADLINE given → the horizon IS that deadline. Compress or stretch the observe→assist→own phases to fit — a 3-week runway is a 3-week arc, not 90 days. Use TODAY'S DATE (given in the input) to size the phase labels.
- else WEEKLY PACE given → horizon ≈ total plan effort ÷ that pace; size the phases from it.
- else (open / self-paced) → a GOAL-BASED default, never a constant: curious/landscape → a short taste (days to ~2 weeks), NOT a long commitment arc; functional/starting a role → ~30-60-90 days; deep/career move → longer. Set horizonAssumed=true and say in the horizon phrase that it's an assumption they can change.

TARGET GROUNDING (critical): When a "READ JOB POSTING" block with real extracted fields is provided, name the real company, role, sector, and responsibilities SPECIFICALLY in the summary, the firm/target node, and the first task. When no readable target is provided (background-only), stay generic about the destination and INVITE the user to add the job description to target a specific role and company. NEVER invent a company, role, sector, or responsibility you weren't given. Field present → specific; field absent → honest and inviting; never a confident guess in between.

ROLE FIDELITY (critical): Refer to the target role EXACTLY as given (the "Target role" or the job-posting role). NEVER rename it to a broader or adjacent category — do not call a "Real World Evidence Analyst" a "Data Scientist," or a "Product Marketing Manager" a "Marketer." The role the user gave is the role; re-categorizing it makes them think you misunderstood them.

DATE FIDELITY (critical): NEVER state or invent a concrete date or deadline unless one is explicitly given in TIMELINE. If no date was provided, speak only in relative terms (weeks, months, "your first 90 days") — do not name a month or year. Never transform a given deadline into a different date.

FACTS vs FLUENCY (critical — the taught concept must not hallucinate specifics): You may freely generate workflow framing, prerequisite order, analogies from their background, manager-task wording, self-check criteria, and "what to notice" in a tiny example. You must NOT assert precise, checkable specifics that depend on a source — exact clinical/coding definitions, regulatory rules, thresholds, statutes, citations, or company-specific workflow — unless they came from the input. Teach the general shape safely (e.g. "claims data records billable events, not a full clinical narrative"), but do NOT invent a precise rule (e.g. "two E11 codes 30 days apart is THE definition of diabetes"). When a concrete threshold would help but you're not certain, say it's an example convention to confirm, not a fact.

VOICE & HONESTY: Write in the person's own vocabulary where you can — translate unfamiliar target-field concepts into terms from their background. When you are not sure a step or resource truly applies to THIS person, say so plainly (e.g. "if you already know X, skip this") rather than asserting it. Flag uncertainty; never smooth over a gap with confident filler.

DIVISION OF LABOR: You produce the plan's structure and prose — the topics, the ordering, the strengths/gaps, and the first task. You do NOT choose learning resources here; that happens in a separate step over a verified, retrieved candidate pool. So never name a specific book, paper, course, or URL in your output — refer to what to learn, not which resource to read.`;

const strengthItem = {
  type: "object",
  additionalProperties: false,
  properties: { point: { type: "string" }, detail: { type: "string" } },
  required: ["point", "detail"],
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hook: { type: "string" },
    northStar: { type: "string" },
    transferableStrengths: { type: "array", items: strengthItem },
    knowledgeGaps: { type: "array", items: strengthItem },
    learningSequence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          topic: { type: "string" },
          why: { type: "string" },
          bridgeFromBackground: { type: "string" },
          comprehensionCheck: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              answerIndex: { type: "integer" },
              explanation: { type: "string" },
            },
            required: ["question", "options", "answerIndex", "explanation"],
          },
          concept: {
            type: "object",
            additionalProperties: false,
            properties: {
              explanation: { type: "string" },
              misconceptionToAvoid: { type: "string" },
              keyTerms: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: { term: { type: "string" }, plainMeaning: { type: "string" } },
                  required: ["term", "plainMeaning"],
                },
              },
            },
            required: ["explanation", "misconceptionToAvoid", "keyTerms"],
          },
          workedExample: {
            type: "object",
            additionalProperties: false,
            properties: {
              setup: { type: "string" },
              walkThrough: { type: "array", items: { type: "string" } },
              takeaway: { type: "string" },
            },
            required: ["setup", "walkThrough", "takeaway"],
          },
          task: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              managerRequest: { type: "string" },
              givenInputs: { type: "array", items: { type: "string" } },
              deliverable: { type: "string" },
              timebox: { type: "string" },
              steps: { type: "array", items: { type: "string" } },
              doneWhen: { type: "string" },
              stakeholders: { type: "string" },
            },
            required: ["title", "managerRequest", "givenInputs", "deliverable", "timebox", "steps", "doneWhen", "stakeholders"],
          },
          selfCheck: {
            type: "object",
            additionalProperties: false,
            properties: {
              criteria: { type: "array", items: { type: "string" } },
              redFlags: { type: "array", items: { type: "string" } },
            },
            required: ["criteria", "redFlags"],
          },
        },
        required: ["topic", "why", "bridgeFromBackground", "concept", "workedExample", "task", "selfCheck"],
      },
    },
    firstTask: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        why: { type: "string" },
        horizon: { type: "string" },
        horizonAssumed: { type: "boolean" },
        phases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              stage: { type: "string" },
              timing: { type: "string" },
              goal: { type: "string" },
            },
            required: ["stage", "timing", "goal"],
          },
        },
      },
      required: ["title", "why", "horizon", "horizonAssumed", "phases"],
    },
    timelineNote: { type: "string" },
  },
  required: [
    "hook",
    "transferableStrengths",
    "knowledgeGaps",
    "learningSequence",
    "firstTask",
    "timelineNote",
  ],
};

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
    return Response.json({ plan: JSON.parse(block.text) });
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    if (err?.status === 429) return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    console.error("plan route error:", err?.message || err);
    return Response.json({ error: "Plan generation failed. Please try again." }, { status: 500 });
  }
}
