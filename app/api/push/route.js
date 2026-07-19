import { client, MODEL } from "@/lib/ai";

// The drill's push (one Haiku call, ~1¢): the follow-up a real interviewer uses
// to test whether an answer folds. Drill grammar rulings: exactly ONE push per
// take, fixed-and-dumb in v1 — no adaptive escalation (that's G6, open) — and
// the push is where a borrowed answer gets caught (the spark stance enforces
// nothing but the push). The one hard line generalizes here: the push may
// question the candidate's claims; it may never manufacture new ones.

const SYSTEM = `You are the interviewer in a rehearsal. You just heard the candidate's answer to your question. Produce exactly ONE pushback — the follow-up a real interviewer uses to test whether the answer survives pressure.

Rules:
- One or two sentences, ending in a question. Firm but fair; professional, not hostile.
- Push on the weakest load-bearing claim of THEIR actual answer — reference their own words; be specific to what they said, never generic.
- Fixed difficulty: one honest push. No escalation, no follow-up chains.
- NEVER invent facts about the candidate's history, the company, or the role that were not stated in the input. Questioning their claims is the job; manufacturing new claims is forbidden.
- No coaching, no praise, no meta-commentary. Return only the push.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { push: { type: "string" } },
  required: ["push"],
};

// A static push is still a real push — the drill keeps working when the model
// doesn't. Generic by necessity, honest by construction (it invents nothing).
const FALLBACK_PUSH =
  "Are you sure? Which part of that answer would you defend first if I told you it doesn't hold?";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = (body?.question || "").toString().slice(0, 1000);
  const answer = (body?.answer || "").toString().trim();

  if (!answer) return Response.json({ error: "Nothing to push on yet." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const parts = [
    question && `THE QUESTION YOU ASKED:\n${question}`,
    `THE CANDIDATE'S ANSWER:\n"""\n${answer.slice(0, 6000)}\n"""`,
  ].filter(Boolean);

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: parts.join("\n\n") }],
    });
    const block = message.content.find((b) => b.type === "text");
    const p = block ? JSON.parse(block.text) : {};
    const push = typeof p.push === "string" && p.push.trim().length >= 10 ? p.push.trim() : "";
    if (!push) return Response.json({ push: FALLBACK_PUSH, degraded: true });
    return Response.json({ push });
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    return Response.json({ push: FALLBACK_PUSH, degraded: true });
  }
}
