import { client, MODEL } from "@/lib/ai";

const SYSTEM = `You condense a speaker's own interview-practice material into notes they chose to keep.

Rules:
- Condense ONLY what the text says, in the speaker's own content.
- NEVER invent a bullet to fill the gap.
- If the text carries no substance, return [].
- Return 1-3 short bullets when there is substance; each bullet must be grounded in the text, not in outside advice or what a stronger answer could have said.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bullets: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
  },
  required: ["bullets"],
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (body?.text || "").toString().trim();
  const question = (body?.question || "").toString().trim();
  if (!text) return Response.json({ error: "Nothing to condense." }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ bullets: [], degraded: true });

  const user = [
    question && `Question this came from:\n${question.slice(0, 1000)}`,
    `Text to condense:\n"""\n${text.slice(0, 5000)}\n"""`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 250,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: user }],
    });
    const block = message.content.find((b) => b.type === "text");
    const parsed = block ? JSON.parse(block.text) : {};
    const bullets = (Array.isArray(parsed.bullets) ? parsed.bullets : [])
      .map((bullet) => bullet.toString().trim())
      .filter(Boolean)
      .slice(0, 3);
    return Response.json({ bullets });
  } catch {
    return Response.json({ bullets: [], degraded: true });
  }
}
