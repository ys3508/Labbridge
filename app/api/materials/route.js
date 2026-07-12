import { client, MODEL } from "@/lib/ai";

// Door C (review #95): the task's "you're given" items become real. The model
// writes SMALL, internally-consistent, explicitly-synthetic practice materials
// matching the named givens — a mini data extract as a plain-text table, a
// filled example artifact, a short dictionary. Rules that keep this honest:
// materials are labeled synthetic by the UI, sized for a textarea-scale
// workspace, and deliberately seeded with the module's own traps so the traps
// get DISCOVERED in the material rather than asserted in prose.

const SYSTEM = `You produce PRACTICE MATERIALS for one task in a job-onboarding plan. The task names materials it assumes ("you're given"); your job is to write small synthetic stand-ins good enough to actually do the task against.

Rules:
- Produce one material per given input (max 3). Match each given's nature: a data file becomes a plain-text table (pipe- or comma-separated, header row, 15-30 rows); a document/template/note becomes a short filled example (under 250 words).
- Everything must be internally consistent: counts, dates, and IDs must agree across materials; numbers must add up.
- SEED THE TRAPS: the task lists known practitioner traps. Plant each one as a discoverable feature of the data/document (e.g. a row that exhibits the problem), NOT as a label or comment. Do not mark where they are.
- Purely fictional: no real people, companies, or products. Keep any domain codes plausible-looking but clearly sample-scale.
- Keep each material SMALL — this is a practice workspace, not a warehouse. 15-30 data rows maximum.
- filename: match the given's name if it has one (keep the stated extension); otherwise invent a short snake_case name.
- note: one sentence on what this stands in for and its deliberate scale ("30 rows standing in for a real extract").
- The content field is plain text/markdown only.`;

const S = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    materials: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { filename: S, note: S, content: S },
        required: ["filename", "note", "content"],
      },
    },
  },
  required: ["materials"],
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const givenInputs = Array.isArray(body?.givenInputs) ? body.givenInputs.filter(Boolean).map(String) : [];
  const steps = Array.isArray(body?.steps) ? body.steps.filter(Boolean).map(String) : [];
  const traps = Array.isArray(body?.traps) ? body.traps.filter(Boolean).map(String) : [];
  const taskTitle = (body?.taskTitle || "").toString();
  const deliverable = (body?.deliverable || "").toString();
  const context = (body?.context || "").toString();

  if (!givenInputs.length) return Response.json({ error: "No given inputs to generate." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const parts = [
    `Task: ${taskTitle}`,
    deliverable && `The learner must produce: ${deliverable}`,
    context && `Task context: ${context.slice(0, 600)}`,
    `Given inputs to materialize:\n${givenInputs.map((g, i) => `${i + 1}. ${g}`).join("\n")}`,
    steps.length && `The learner's steps (the materials must make these doable):\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    traps.length && `Traps to seed as discoverable features:\n${traps.map((t) => `- ${t}`).join("\n")}`,
  ].filter(Boolean);

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: parts.join("\n\n") }],
    });
    const block = message.content.find((b) => b.type === "text");
    const parsed = block ? JSON.parse(block.text) : {};
    const materials = (Array.isArray(parsed.materials) ? parsed.materials : [])
      .slice(0, 3)
      .map((m) => ({
        filename: (m?.filename || "practice_material.md").toString(),
        note: (m?.note || "").toString(),
        content: (m?.content || "").toString().slice(0, 12000),
      }))
      .filter((m) => m.content.trim());
    if (!materials.length) return Response.json({ error: "Generation came back empty — try again." }, { status: 502 });
    return Response.json({ materials });
  } catch (err) {
    const msg = err?.status === 401 ? "Invalid API key." : "Couldn't generate materials — try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
