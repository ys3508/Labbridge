import { client, MODEL, PLAN_MODEL } from "@/lib/ai";

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
- THE CANON (critical — this is how a five-task project stays one world): if a CANON block is provided, every fact in it is LAW — the same data source type, the same entity identities and codes, the same ID scheme and date ranges, the same dose forms. Reuse them exactly; never re-invent an entity the canon already defines. If NO canon is provided, you are defining the world: choose one coherent set of facts and ALSO return it in the "entities" field as a compact reference block (data source type; each named entity with its codes/strengths; condition code set; patient-ID scheme; date range). Later tasks will be forced to match it.
- REFERENCE DOCUMENTS MUST BE CORRECT; DATA MAY BE MESSY ON PURPOSE. Anything the learner is told to trust as an authority — a code reference, a dictionary, a template, a published-standard excerpt — must contain only accurate pairings (a real-world code you name must carry its true meaning; if you are not certain of a real code's meaning, use a clearly-synthetic identifier instead). Deliberate flaws (the seeded traps) belong ONLY in data rows and filled drafts, never in reference documents.
- SEED THE TRAPS: the task lists known practitioner traps. Plant each one as a discoverable feature of the data (e.g. a row that exhibits the problem), NOT as a label or comment. Do not mark where they are.
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
    entities: S, // the world canon (returned when none was provided; echoed otherwise)
  },
  required: ["materials", "entities"],
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
  const canon = (body?.canon || "").toString();
  const exampleSetup = (body?.exampleSetup || "").toString();

  if (!givenInputs.length) return Response.json({ error: "No given inputs to generate." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const parts = [
    `Task: ${taskTitle}`,
    canon && `CANON (LAW — reuse these facts exactly):\n${canon.slice(0, 2500)}`,
    deliverable && `The learner must produce: ${deliverable}`,
    context && `Task context: ${context.slice(0, 600)}`,
    exampleSetup &&
      `The task's worked example uses this tiny case — your data should CONTAIN it so the example is a guided tour of the file:\n${exampleSetup.slice(0, 500)}`,
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

    // Reference documents must be CORRECT (review: generated ICD references
    // twice paired real codes with wrong meanings — E11.0 "hypoglycemia" etc.).
    // The generation-time rule alone didn't hold, so any material that looks
    // like a real-world coding reference gets one focused fact-check pass on
    // the strong model. Data files are exempt — their mess is deliberate.
    const looksLikeCodeRef = (m) =>
      /reference|phenotype|dictionar|code_?list|codeset/i.test(m.filename) &&
      /\b(icd|cpt|hcpcs|ndc|loinc|snomed)\b/i.test(m.content);
    for (let i = 0; i < materials.length; i++) {
      if (!looksLikeCodeRef(materials[i])) continue;
      try {
        const check = await client.messages.create({
          model: PLAN_MODEL,
          max_tokens: 3000,
          system:
            "You are a medical/technical coding fact-checker. The document below pairs real-world codes with descriptions. Fix ONLY factually wrong pairings (a code labeled with another code's meaning) by correcting the description or replacing the code with the right one for that description. Change nothing else — keep structure, tone, synthetic names, and formatting identical. Return the full corrected document as plain text, nothing more.",
          messages: [{ role: "user", content: materials[i].content.slice(0, 6000) }],
        });
        const fixed = check.content.find((b) => b.type === "text")?.text?.trim();
        if (fixed && fixed.length > materials[i].content.length * 0.5) materials[i].content = fixed;
      } catch {} // fact-check is best-effort; the material still ships
    }

    return Response.json({ materials, entities: (parsed.entities || canon || "").toString().slice(0, 3000) });
  } catch (err) {
    const msg = err?.status === 401 ? "Invalid API key." : "Couldn't generate materials — try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
