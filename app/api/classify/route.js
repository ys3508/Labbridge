import { client, MODEL } from "@/lib/ai";

// Classify one "add material" artifact into a type (section 02 classify-and-confirm).
// The result is a proposal the user can override with a tap.

const TYPES = ["job_posting", "repo", "pipeline", "paper", "company_page", "description"];

const SYSTEM = `You classify a single piece of "target material" a person handed to a career-onboarding tool to describe where they're headed. It may be a link or pasted text, from ANY industry.

Choose exactly one type:
- "job_posting": a job/role description or listing (responsibilities, requirements, "we're hiring").
- "repo": a code repository, project, demo, or an example of work to mimic.
- "paper": a research paper, article, or publication.
- "pipeline": a description of a workflow, process, system, or methodology.
- "company_page": a company/organization/lab page, "about us", or careers page.
- "description": a plain-language description of what they want to learn or do — the fallback when nothing else fits.

Return only the type.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { type: { type: "string", enum: TYPES } },
  required: ["type"],
};

export async function POST(request) {
  let text = "";
  try {
    const body = await request.json();
    text = (body?.text || "").toString();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (text.trim().length < 3) return Response.json({ type: "description" });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ type: "description", error: "No API key configured." }, { status: 500 });
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 128,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Classify this material:\n\n${text.slice(0, 4000)}` }],
    });
    const block = message.content.find((b) => b.type === "text");
    const parsed = block ? JSON.parse(block.text) : {};
    const type = TYPES.includes(parsed.type) ? parsed.type : "description";
    return Response.json({ type });
  } catch (err) {
    // Non-fatal: fall back to the neutral default; the UI stays usable.
    return Response.json({ type: "description", error: err?.status === 401 ? "Invalid API key." : "Classify failed." });
  }
}
