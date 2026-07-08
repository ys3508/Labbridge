import { client, MODEL } from "@/lib/ai";

// Produces the one "focused mostly on ___" line for the review screen.
// The type -> role mapping (job posting = main target, etc.) stays deterministic
// in lib/stubs; this only supplies the domain-agnostic focus phrase.

const SYSTEM = `You read the target materials a person gave a career-onboarding tool (a role title, some artifacts, and free-text steering notes) and name what their onboarding plan should center on.

Return a short focus phrase — 2 to 5 words — naming the specific area, in ANY field. Examples: "computational genomics", "consumer marketing analytics", "M&A financial modeling", "frontend web development", "employment litigation", "supply chain operations".

Weight the highest-signal inputs: a role title and job posting outweigh a company page. Honor the steering notes (e.g. "I care most about the ML side"). If the materials are too vague to name a focus, return an empty string.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { focus: { type: "string" } },
  required: ["focus"],
};

export async function POST(request) {
  let role = "";
  let instructions = "";
  let artifacts = [];
  try {
    const body = await request.json();
    role = (body?.role || "").toString();
    instructions = (body?.instructions || "").toString();
    artifacts = Array.isArray(body?.artifacts) ? body.artifacts : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const hasSignal = role.trim() || instructions.trim() || artifacts.some((a) => (a?.text || "").trim());
  if (!hasSignal) return Response.json({ focus: "" });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ focus: "", error: "No API key." }, { status: 500 });

  const parts = [];
  if (role.trim()) parts.push(`Role title: ${role.trim()}`);
  artifacts.forEach((a, i) => {
    const t = (a?.text || "").trim();
    if (t) parts.push(`Artifact ${i + 1} (${a.type || "material"}): ${t.slice(0, 1500)}`);
  });
  if (instructions.trim()) parts.push(`Steering notes: ${instructions.trim()}`);

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 64,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: parts.join("\n\n") }],
    });
    const block = message.content.find((b) => b.type === "text");
    const parsed = block ? JSON.parse(block.text) : {};
    return Response.json({ focus: String(parsed.focus || "") });
  } catch (err) {
    return Response.json({ focus: "", error: err?.status === 401 ? "Invalid API key." : "Focus failed." });
  }
}
