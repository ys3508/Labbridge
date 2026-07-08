// Retrieval-first, Part C: from each topic's VERIFIED candidate pool, select the
// best 1-3 for THIS learner and explain the fit. The model chooses by pool index
// (so title/url/source are copied verbatim from a real item — never re-authored)
// and writes "why it fits" grounded only in the provided metadata.
import { client, PLAN_MODEL } from "@/lib/ai";

const SELECT_SYSTEM = `You choose learning resources for ONE module of an interactive training course, for a career-changer entering an unfamiliar field. Each module has a topic, a why, and a concrete TASK the learner must complete (which produces a deliverable). You're given the learner's background/depth and a numbered list of VERIFIED, real candidate resources.

Pick ONLY resources that DIRECTLY help complete THIS module's TASK — relevance to the task is the bar, not general topic-relevance. For each pick, write "use" as a justified selection, not a blurb — cover three things in 1–2 short sentences: (1) the GAP it closes for THIS learner given their background (what they can't yet do that this fixes); (2) the EXACT part to use (e.g. "chapters 2–3", "the 'Joins' section", "the getting-started tutorial") and what to SKIP; (3) why THIS source over alternatives, if relevant. Scope it to the minimum needed for the task — a specific chapter / section / article, never "read the whole book". Never present a resource as general reading.

Choose 0–2 per module. It is GOOD to return an EMPTY list when the task is best done hands-on and needs no external resource — do not pad to look complete. Choose ONLY by the numbers given; never invent a resource or a number not in the list.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    selections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          picks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { poolIndex: { type: "integer" }, use: { type: "string" } },
              required: ["poolIndex", "use"],
            },
          },
        },
        required: ["index", "picks"],
      },
    },
  },
  required: ["selections"],
};

function learnerLine(l) {
  const parts = [];
  if (l?.field?.length) parts.push(`field: ${l.field.join(", ")}`);
  if (l?.skills?.length) parts.push(`skills: ${l.skills.slice(0, 12).join(", ")}`);
  if (l?.depth) parts.push(`depth goal: ${l.depth}`);
  if (l?.purpose) parts.push(`purpose: ${l.purpose}`);
  return parts.join(" | ") || "beginner, no background provided";
}

export async function POST(request) {
  let topics = [];
  let learner = {};
  try {
    const body = await request.json();
    topics = Array.isArray(body?.topics) ? body.topics : [];
    learner = body?.learner || {};
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  // Only topics that actually have a candidate pool need selection.
  const withPool = topics.filter((t) => (t.pool || []).length);
  if (!withPool.length) return Response.json({ selections: topics.map((t) => ({ index: t.index, resources: [] })) });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ selections: topics.map((t) => ({ index: t.index, resources: [] })) });

  const blocks = withPool
    .map((t) => {
      const pool = t.pool
        .map((r, j) => `   [${j}] ${r.title}${r.by ? ` — ${r.by}` : ""}${r.year ? ` (${r.year})` : ""} [${r.kind || "resource"}]`)
        .join("\n");
      const task = t.task ? `\n  TASK (resources must serve this): ${t.task.title} → produces ${t.task.deliverable}` : "";
      return `MODULE ${t.index}: ${t.topic}\n  why: ${t.why || ""}${task}\n  candidates:\n${pool}`;
    })
    .join("\n\n");

  let selections = [];
  try {
    const message = await client.messages.create({
      model: PLAN_MODEL,
      max_tokens: 2048,
      system: SELECT_SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Learner: ${learnerLine(learner)}\n\n${blocks}` }],
    });
    const block = message.content.find((b) => b.type === "text");
    selections = block ? JSON.parse(block.text).selections || [] : [];
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key.", selections: [] });
    return Response.json({ selections: topics.map((t) => ({ index: t.index, resources: [] })) });
  }

  // Map picks (pool indices) back to the real verified items — verbatim.
  const poolByIndex = {};
  topics.forEach((t) => (poolByIndex[t.index] = t.pool || []));
  const byIndex = {};
  selections.forEach((s) => {
    const pool = poolByIndex[s.index] || [];
    const resources = (s.picks || [])
      .filter((p) => p && pool[p.poolIndex])
      .slice(0, 2)
      .map((p) => {
        const r = pool[p.poolIndex];
        return { title: r.title, url: r.url, source: r.source, kind: r.kind, use: (p.use || "").trim() };
      });
    byIndex[s.index] = resources;
  });

  const result = topics.map((t) => ({ index: t.index, resources: byIndex[t.index] || [] }));
  return Response.json({ selections: result });
}
