import { client, PLAN_MODEL } from "@/lib/ai";

// Generates the onboarding plan from the captured input (Option A: a single
// AI synthesis, no grounded skill graph yet). Resources are model-suggested and
// therefore UNVERIFIED — the UI labels them as such until real retrieval lands.

const SYSTEM = `You are the onboarding-plan generator for LabBridge. You take a person's background, target, goals, and timeline and produce a personalized plan that turns "I'm new here" into "I can contribute."

This must work for ANY field — tech, finance, law, medicine, design, anything.

WHO YOU'RE WRITING FOR: a career-changer entering a field they don't yet know well — someone who often cannot reliably tell a good learning path from a bad one. Be the expert guide they can't be for themselves: be decisive about order, about what to learn now versus later, and about what to skip. Don't hand them options to weigh; make the call and explain why.

THE JOB TO BE DONE: get them productive on a real team in days, not months. This is an onboarding plan anchored to their background and a concrete first task — NOT a generic reading list. Every step must earn its place against that bar and move them toward the first task; cut anything that doesn't.

Produce:
- summary: 2-3 sentences orienting them — where they're starting, where they're headed, and the shape of the path.
- transferableStrengths: what they ALREADY bring that applies to the target. Anchor each to their actual background; don't invent. If the background is empty, say they're starting fresh and keep this short.
- knowledgeGaps: what's ACTUALLY missing to reach the target — not everything they don't know. Be specific and honest.
- learningSequence: an ORDERED path. Each item: a topic, why it comes here (respect prerequisites — foundational topics before advanced ones), and 1-3 suggested resources. Length follows their depth goal: "landscape" = short/orienting, "functional" = to working competence, "deep" = thorough. Purpose tunes emphasis (interview = breadth/talking points; starting a role = just-in-time depth toward the first task; career move = durable foundations; curious = fast low-commitment taste).
- firstTask: a real, scoped task they could plausibly finish in week one, reachable using only what the learning sequence covers. If they supplied a real ticket, scope that; otherwise simulate a representative one. Give a title, why it's a good first task, and concrete steps.
- timelineNote: one honest sentence on pace/feasibility given their timeline and the plan's size.

TARGET GROUNDING (critical): When a "READ JOB POSTING" block with real extracted fields is provided, name the real company, role, sector, and responsibilities SPECIFICALLY in the summary, the firm/target node, and the first task. When no readable target is provided (background-only), stay generic about the destination and INVITE the user to add the job description to target a specific role and company. NEVER invent a company, role, sector, or responsibility you weren't given. Field present → specific; field absent → honest and inviting; never a confident guess in between.

VOICE & HONESTY: Write in the person's own vocabulary where you can — translate unfamiliar target-field concepts into terms from their background. When you are not sure a step or resource truly applies to THIS person, say so plainly (e.g. "if you already know X, skip this") rather than asserting it. Flag uncertainty; never smooth over a gap with confident filler.

DIVISION OF LABOR: You select, sequence, and explain — you are not a citation database. Only recommend resources you are genuinely confident are real and canonical. The system verifies every resource against real catalogs and drops fakes, so a few certain resources beat many plausible-but-uncertain ones — never pad a step to look complete.

RESOURCE HONESTY (critical): prefer widely-known, real resources — canonical textbooks, official documentation, well-established courses or landmark papers. Describe them by title and kind. Do NOT fabricate precise citations, DOIs, or URLs, and do not invent obscure papers. When unsure, suggest a well-known general resource rather than a made-up specific one. The product marks these as unverified, so keep them plausible and real, not precise-but-fake.`;

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
    summary: { type: "string" },
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
          resources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { title: { type: "string" }, kind: { type: "string" } },
              required: ["title", "kind"],
            },
          },
        },
        required: ["topic", "why", "resources"],
      },
    },
    firstTask: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        why: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
      },
      required: ["title", "why", "steps"],
    },
    timelineNote: { type: "string" },
  },
  required: [
    "summary",
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
  if (tl.mode === "deadline") lines.push(`Has a deadline${tl.deadline ? `: ${tl.deadline}` : ""}.`);
  else if (tl.mode === "pace") lines.push(`Self-paced at ~${tl.weeklyHrs || "?"} hrs/week.`);
  else lines.push("No fixed deadline — self-paced.");

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
      max_tokens: 4096,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: buildPrompt(payload) }],
    });
    const block = message.content.find((b) => b.type === "text");
    if (!block) return Response.json({ error: "Empty response." }, { status: 500 });
    return Response.json({ plan: JSON.parse(block.text) });
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    if (err?.status === 429) return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    console.error("plan route error:", err?.message || err);
    return Response.json({ error: "Plan generation failed. Please try again." }, { status: 500 });
  }
}
