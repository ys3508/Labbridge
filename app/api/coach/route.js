import { client, MODEL } from "@/lib/ai";

// The loop-closer (review item #34): grades a user's draft against the task's
// own success criteria and red flags. One consumer-facing rule dominates the
// prompt: judge ONLY from the draft text. The reviewer never invents facts the
// draft doesn't contain and never praises work that isn't there — the whole
// point of this endpoint is that the checkmark upstream is earned.

// Purpose-aware tone (the four lenses must FEEL different): verdicts fit a
// deliverable that can be right or wrong; "does this fit me?" cannot be graded.
const REFLECTIVE_SYSTEM = `You are a thoughtful career mentor reading someone's private reflection notes about whether to move into a new field. This is NOT gradable work — there is no right answer to "does this fit me."

Rules:
- NO verdicts, NO pass/fail language. For each listed criterion, status is "met" if the note engages with that dimension at all, "thin" only if it's genuinely unexplored — and every note you write is a REFLECTION, not a correction: mirror back what their own words suggest ("you keep returning to autonomy — that's telling you something"), name tensions you see, ask at most one good question.
- redFlagHits: only genuine self-deception patterns (deciding from imagination instead of evidence, sunk-cost language), phrased gently.
- nextEdits: 2-3 prompts for further reflection, not corrections.
- overall: 2-3 sentences mirroring the strongest signal in their notes — what the evidence they've gathered actually points toward. Never tell them what to decide.
- Judge ONLY from their text; quote their own words back where it helps.`;

const SYSTEM = `You are an experienced, direct, kind team lead reviewing a new hire's first-week draft. You are given the task, its success criteria, its red flags (known failure modes), and the draft.

Rules:
- Judge ONLY from the draft text. If something isn't in the draft, it doesn't exist.
- For EACH criterion, in the given order, return a status: "met" (clearly satisfied, name the evidence), "thin" (attempted but shallow or partly wrong — say what's missing), or "missing" (not addressed).
- Each note is one sentence, ≤ 25 words, specific to THIS draft — quote or reference its actual words where possible.
- redFlagHits: list ONLY red flags whose MISTAKE actually appears in the draft, each as one sentence pointing at where. A draft that mentions the topic while handling it correctly (e.g. it correctly distinguishes billed codes from clinical truth) has NOT hit the flag — do not list it. If none appear, return an empty array — do not manufacture problems.
- nextEdits: the 2-3 highest-value concrete edits, imperative voice, each ≤ 20 words, ordered by impact.
- overall: 2-3 sentences. Honest read first (is this usable work?), then the single biggest strength and the single biggest gap. No grade inflation, no rubric restating, no "great job" filler.
- If the task is INTERVIEW REHEARSAL (the deliverable is an answer to an interviewer's question), judge it as the interviewer would: would this answer land in the room? Note where they'd push back, and whether it survives the push.
- If the task is an INTERVIEW DIAGNOSTIC and includes DIAGNOSTIC DELIVERY METRICS in context, use those metrics ONLY for the delivery criterion. Judge substance from the confirmed transcript alone.
- SPOKEN-ANSWER AXIS SEPARATION (critical for second-language and nervous speakers): grammar, accent, word choice, fluency, disfluency, filler, and pace are DELIVERY signals ONLY — they may never lower the SUBSTANCE verdict. Judge substance as if the transcript were first cleaned into fluent English: does the reasoning hold, is the evidence there, does the structure answer what was asked? Someone who knows the answer but says it in halting or ungrammatical English is strong-substance / weak-delivery — NOT weak-substance. Grading a language limitation as a knowledge gap tells a person they don't know something they know; that is the one error this must never make.
- If the draft is only a template or placeholder bullets with nothing filled in, say exactly that in overall, mark criteria accordingly, and make nextEdits about doing the work — never pretend effort you don't see.`;

const S = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall: S,
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["met", "thin", "missing"] },
          note: S,
        },
        required: ["status", "note"],
      },
    },
    redFlagHits: { type: "array", items: S },
    nextEdits: { type: "array", items: S },
  },
  required: ["overall", "criteria", "redFlagHits", "nextEdits"],
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const draft = (body?.draft || "").toString().trim();
  const criteria = Array.isArray(body?.criteria) ? body.criteria.filter(Boolean).map(String) : [];
  const redFlags = Array.isArray(body?.redFlags) ? body.redFlags.filter(Boolean).map(String) : [];
  const steps = Array.isArray(body?.steps) ? body.steps.filter(Boolean).map(String) : [];
  const taskTitle = (body?.taskTitle || "").toString();
  const deliverable = (body?.deliverable || "").toString();
  const doneWhen = (body?.doneWhen || "").toString();
  const context = (body?.context || "").toString();
  const materials = (body?.materials || "").toString();
  const canon = (body?.canon || "").toString();
  const purpose = (body?.purpose || "starting_role").toString();
  const tone = (body?.tone || "").toString();

  if (!draft) return Response.json({ error: "Nothing to review — the draft is empty." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const parts = [
    tone === "gentle" &&
      "REGISTER: the person disclosed something vulnerable at intake. Be warm and precise — deliver every hard truth kindly, zero games, zero pep-talk, no exclamation marks.",
    `Task: ${taskTitle}`,
    deliverable && `Deliverable: ${deliverable}`,
    doneWhen && `Done when: ${doneWhen}`,
    context && `Task context: ${context.slice(0, 800)}`,
    steps.length && `Steps the draft should reflect:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    criteria.length
      ? `Success criteria (return one status per criterion, in this order):\n${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "Success criteria: none given — grade against the deliverable and done-when line (return an empty criteria array).",
    redFlags.length && `Red flags to check for:\n${redFlags.map((r) => `- ${r}`).join("\n")}`,
    canon && `World canon (the plan's fixed facts — a draft contradicting these is wrong):\n${canon.slice(0, 1200)}`,
    materials &&
      `THE PRACTICE MATERIALS the draft was written against (use these to verify empirical claims — counts, dates, spans, codes; a claim the materials contradict is wrong):\n${materials.slice(0, 4000)}`,
    `THE DRAFT:\n"""\n${draft.slice(0, 8000)}\n"""`,
  ].filter(Boolean);

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: purpose === "career_move" ? REFLECTIVE_SYSTEM : SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: parts.join("\n\n") }],
    });
    const block = message.content.find((b) => b.type === "text");
    const parsed = block ? JSON.parse(block.text) : {};

    // Normalize so the UI can zip verdicts with the criteria it sent: exactly
    // one entry per criterion, statuses coerced to the known three.
    const verdicts = criteria.map((_, i) => {
      const v = Array.isArray(parsed.criteria) ? parsed.criteria[i] : null;
      const status = ["met", "thin", "missing"].includes(v?.status) ? v.status : "missing";
      return { status, note: (v?.note || "Not addressed in the draft.").toString() };
    });

    return Response.json({
      review: {
        overall: (parsed.overall || "").toString(),
        criteria: verdicts,
        redFlagHits: (Array.isArray(parsed.redFlagHits) ? parsed.redFlagHits : []).map(String).slice(0, 6),
        nextEdits: (Array.isArray(parsed.nextEdits) ? parsed.nextEdits : []).map(String).slice(0, 4),
      },
    });
  } catch (err) {
    const msg = err?.status === 401 ? "Invalid API key." : "Review failed — try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
