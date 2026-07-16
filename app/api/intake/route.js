import { client, MODEL } from "@/lib/ai";

// The interview door's intake router (one Haiku call, ~1-2¢): reads the human
// fields and returns everything the diagnostic needs. Design rules from review:
// - ONE sentence can carry BOTH signals ("scared of system design because I
//   freeze" → fear: system design + obstacle: freezing) — extract both.
// - tone drives the WHOLE plan's register; vulnerable intake → gentle.
// - contractLine is model-written ONLY for fused/vulnerable intake (the cases a
//   template would flatten); clean cases get "" and the client uses templates.
// - Every element gets a server-side sanity check + fallback, so one weak field
//   degrades THAT field — a confident-looking bundle must not hide a bad Q2.

const SYSTEM = `You read a job interview candidate's intake and return structured prep signals. Fields you receive: the job description, their worry ("what are you most worried they'll ask"), their challenge ("the hardest part of this for you"), the round/format, and optionally their resume.

Return:
- contentFears: topics/questions they fear (from worry AND challenge — a fused sentence like "scared of the system design question because I freeze" yields BOTH a contentFear ("system design") and an obstacle ("freezing under pressure"). Never classify a fused sentence as only one type.)
- obstacles: personal/delivery obstacles (nerves, rambling, freezing, explaining a gap/layoff, second language, identity worries). Short phrases.
- tone: "playful" | "neutral" | "gentle". Gentle whenever the intake carries vulnerability (layoff pain, age/bias worry, visa, distress); playful only when the intake is confident and the stakes read as energizing.
- q2: THE single most likely substantive question from THIS job description for THIS round — quoted as an interviewer would ask it. Must derive from the posting's stated responsibilities/requirements.
- q2Receipt: the posting line q2 derives from, quoted (≤15 words).
- q1SubstanceKey / q1DeliveryKey: grading keys for the opener "walk me through your background and why this role" — substance = what a strong answer must contain GIVEN THEIR RESUME (name their strongest evidence so the grader can catch omissions); delivery = the structural bar (result-first, under ~90s, ends pointed at this role). DEFERRAL GRANT: if their challenge involves a layoff/gap, the substance key must EXPLICITLY state that omitting the layoff/gap is acceptable in this first answer (the app promises them that choice — the grader must honor it).
- q2SubstanceKey / q2DeliveryKey: same for q2 (substance = the core idea a working answer shows; delivery = answer-first, no hedging spiral).
- contractLine: "" for clean single-signal intake (the app has templates). Write it ONLY when the challenge/worry text is fused, emotional, or vulnerable — then write 2-3 sentences that (a) reflect their actual words without quoting them clinically, (b) explain how the first two questions are shaped around what they said, (c) promise honesty without pep-talk. CARE: never chirpy, never gamified, never minimize; acknowledge what's hard as hard.`;

const S = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    contentFears: { type: "array", items: S },
    obstacles: { type: "array", items: S },
    tone: S,
    q2: S,
    q2Receipt: S,
    q1SubstanceKey: S,
    q1DeliveryKey: S,
    q2SubstanceKey: S,
    q2DeliveryKey: S,
    contractLine: S,
  },
  required: [
    "contentFears",
    "obstacles",
    "tone",
    "q2",
    "q2Receipt",
    "q1SubstanceKey",
    "q1DeliveryKey",
    "q2SubstanceKey",
    "q2DeliveryKey",
    "contractLine",
  ],
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const jd = (body?.jd || "").toString();
  const worry = (body?.worry || "").toString();
  const challenge = (body?.challenge || "").toString();
  const round = (body?.round || "").toString();
  const resume = (body?.resume || "").toString();

  if (!jd.trim() && !worry.trim() && !challenge.trim()) {
    return Response.json({ error: "Nothing to read yet." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const parts = [
    jd && `JOB DESCRIPTION:\n${jd.slice(0, 5000)}`,
    round && `Round/format: ${round.slice(0, 400)}`,
    worry && `Their worry: ${worry.slice(0, 800)}`,
    challenge && `Their challenge: ${challenge.slice(0, 800)}`,
    resume && `Their resume:\n${resume.slice(0, 3000)}`,
  ].filter(Boolean);

  // Per-element fallbacks (review: a confident bundle must not hide a weak component).
  const fallback = {
    contentFears: [],
    obstacles: [],
    tone: "neutral",
    q2: "Walk me through how you would approach the core responsibility in this role.",
    q2Receipt: "",
    q1SubstanceKey:
      "The answer connects their actual background to this role with specific evidence, not adjectives.",
    q1DeliveryKey: "Result and relevance reached early; under ~90 seconds; ends pointed at this job.",
    q2SubstanceKey: "The answer shows the core idea and names its limits honestly.",
    q2DeliveryKey: "Answer first, reasoning second; no hedging spiral.",
    contractLine: "",
  };

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: parts.join("\n\n") }],
    });
    const block = message.content.find((b) => b.type === "text");
    const p = block ? JSON.parse(block.text) : {};

    const clean = (v, fb, min = 4) => (typeof v === "string" && v.trim().length >= min ? v.trim() : fb);
    const out = {
      contentFears: (Array.isArray(p.contentFears) ? p.contentFears : fallback.contentFears)
        .map(String)
        .slice(0, 5),
      obstacles: (Array.isArray(p.obstacles) ? p.obstacles : fallback.obstacles).map(String).slice(0, 5),
      tone: ["playful", "neutral", "gentle"].includes(p.tone) ? p.tone : fallback.tone,
      q2: clean(p.q2, fallback.q2, 15),
      q2Receipt: clean(p.q2Receipt, fallback.q2Receipt, 0),
      q1SubstanceKey: clean(p.q1SubstanceKey, fallback.q1SubstanceKey),
      q1DeliveryKey: clean(p.q1DeliveryKey, fallback.q1DeliveryKey),
      q2SubstanceKey: clean(p.q2SubstanceKey, fallback.q2SubstanceKey),
      q2DeliveryKey: clean(p.q2DeliveryKey, fallback.q2DeliveryKey),
      contractLine: typeof p.contractLine === "string" ? p.contractLine.trim() : "",
    };
    // Sanity: a generated Q2 that ignores the posting is worse than the fallback.
    if (jd.trim() && out.q2 !== fallback.q2 && out.q2.length < 20) out.q2 = fallback.q2;
    return Response.json(out);
  } catch (err) {
    // Total failure degrades to the deterministic bundle — the door still works.
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    return Response.json({ ...fallback, degraded: true });
  }
}
