import { client, PLAN_MODEL } from "@/lib/ai";

// Generates the onboarding plan from the captured input (Option A: a single
// AI synthesis, no grounded skill graph yet). Resources are model-suggested and
// therefore UNVERIFIED — the UI labels them as such until real retrieval lands.

const SYSTEM = `You are the onboarding-plan generator for LabBridge. You take a person's background, target, goals, and timeline and produce a personalized plan that turns "I'm new here" into "I can contribute."

This must work for ANY field — tech, finance, law, medicine, design, anything.

Produce:
- summary: 2-3 sentences orienting them — where they're starting, where they're headed, and the shape of the path.
- transferableStrengths: what they ALREADY bring that applies to the target. Anchor each to their actual background; don't invent. If the background is empty, say they're starting fresh and keep this short.
- knowledgeGaps: what's ACTUALLY missing to reach the target — not everything they don't know. Be specific and honest.
- learningSequence: an ORDERED path. Each item: a topic, why it comes here (respect prerequisites — foundational topics before advanced ones), and 1-3 suggested resources. Length follows their depth goal: "landscape" = short/orienting, "functional" = to working competence, "deep" = thorough. Purpose tunes emphasis (interview = breadth/talking points; starting a role = just-in-time depth toward the first task; career move = durable foundations; curious = fast low-commitment taste).
- firstTask: a real, scoped task they could plausibly finish in week one, reachable using only what the learning sequence covers. If they supplied a real ticket, scope that; otherwise simulate a representative one. Give a title, why it's a good first task, and concrete steps.
- timelineNote: one honest sentence on pace/feasibility given their timeline and the plan's size.

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
  if (b.resume?.trim()) lines.push(`Resume/bio:\n${b.resume.slice(0, 6000)}`);

  lines.push("\n## TARGET (where they're headed)");
  if (t.role?.trim()) lines.push(`Target role: ${t.role}`);
  (t.artifacts || []).forEach((a, i) => {
    if ((a?.text || "").trim()) lines.push(`Artifact ${i + 1} [${a.type}]: ${a.text.slice(0, 2000)}`);
  });
  if (t.realTask?.trim()) lines.push(`Real first task/ticket they provided: ${t.realTask.slice(0, 2000)}`);
  if (t.instructions?.trim()) lines.push(`Steering notes: ${t.instructions.slice(0, 1000)}`);

  lines.push("\n## GOALS");
  lines.push(`Depth: ${g.depth || "functional"}`);
  lines.push(`Purpose: ${g.purpose || "not specified"}`);

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
