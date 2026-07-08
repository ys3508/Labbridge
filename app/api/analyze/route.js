import { client, MODEL } from "@/lib/ai";

// Server-side only — the API key never reaches the browser.

const SYSTEM = `You extract a person's transferable skills and their field from resume or bio text, for a career-onboarding tool.

This must work for ANY professional background — finance, law, engineering, medicine, public health, design, marketing, logistics, academia, the trades, anything. Do not assume the person is in science or tech.

Rules:
- Extract ONLY skills genuinely evidenced in the text. Never invent a skill the text doesn't support. This is the most important rule — a wrong extraction poisons the plan.
- Each skill is a short, plain-language, TRANSFERABLE strength (2-4 words): e.g. "financial modeling", "data analysis", "team leadership", "regulatory compliance", "clinical care", "contract negotiation", "user research". Prefer the transferable capability over a specific tool ("data analysis", not just "Excel").
- For each skill, give a short evidence phrase quoted or closely paraphrased from the text showing where it came from.
- Identify the person's primary field in 1-3 words (e.g. "Finance", "Corporate Law", "Software Engineering", "Public Health"). Empty string if genuinely unclear.
- Aim for 4-10 skills for a substantial resume; fewer if the text is thin. Deduplicate.
- If the text is too short or contains no real professional signal, return empty field and an empty skills array.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    field: {
      type: "string",
      description: "Primary field in 1-3 words, or empty string if unclear.",
    },
    skills: {
      type: "array",
      description: "Transferable skills evidenced in the text.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          skill: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["skill", "evidence"],
      },
    },
  },
  required: ["field", "skills"],
};

export async function POST(request) {
  let text = "";
  try {
    const body = await request.json();
    text = (body?.text || "").toString();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (text.trim().length < 12) {
    return Response.json({ field: "", skills: [] });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "No API key configured on the server (set ANTHROPIC_API_KEY)." },
      { status: 500 }
    );
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      output_config: {
        // Note: the `effort` param is unsupported on Haiku 4.5; only add it if
        // you switch MODEL to an Opus/Sonnet tier that supports it.
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Extract skills and field from this text:\n\n${text.slice(0, 12000)}`,
        },
      ],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block) return Response.json({ field: "", skills: [] });

    const parsed = JSON.parse(block.text);
    // Normalize + de-dupe defensively.
    const seen = new Set();
    const skills = (parsed.skills || [])
      .filter((s) => s && s.skill && !seen.has(s.skill.toLowerCase()) && seen.add(s.skill.toLowerCase()))
      .map((s) => ({ skill: String(s.skill), evidence: String(s.evidence || "") }));

    return Response.json({ field: String(parsed.field || ""), skills });
  } catch (err) {
    const status = err?.status;
    if (status === 401) {
      return Response.json({ error: "Invalid API key." }, { status: 401 });
    }
    if (status === 429) {
      return Response.json({ error: "Rate limited — try again in a moment." }, { status: 429 });
    }
    console.error("analyze route error:", err?.message || err);
    return Response.json({ error: "Analysis failed. You can fill in your background manually below." }, { status: 500 });
  }
}
