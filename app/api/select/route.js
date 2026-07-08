// Retrieval-first, Part C: from each topic's VERIFIED candidate pool, select the
// best 1-3 for THIS learner and explain the fit. The model chooses by pool index
// (so title/url/source are copied verbatim from a real item — never re-authored)
// and writes "why it fits" grounded only in the provided metadata.
import { client, PLAN_MODEL } from "@/lib/ai";

const SELECT_SYSTEM = `You choose learning resources for a career-changer entering an unfamiliar field. For each topic you are given the topic, why it's in their plan, the learner's background and depth goal, and a numbered list of VERIFIED, real resources. Choose the best 1-3 for THIS learner and, for each, write one short sentence on why it fits — using ONLY the information given (title, author, year, kind). Prefer resources matched to their level and background. If none of the candidates genuinely fit the topic, return an empty list for it (the UI shows an honest gap). Choose ONLY by the numbers given; never invent a resource or a number not in the list.`;

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
              properties: { poolIndex: { type: "integer" }, why: { type: "string" } },
              required: ["poolIndex", "why"],
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
      return `TOPIC ${t.index}: ${t.topic}\n  why in plan: ${t.why || ""}\n  candidates:\n${pool}`;
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
      .slice(0, 3)
      .map((p) => {
        const r = pool[p.poolIndex];
        return { title: r.title, url: r.url, source: r.source, kind: r.kind, why: (p.why || "").trim() };
      });
    byIndex[s.index] = resources;
  });

  const result = topics.map((t) => ({ index: t.index, resources: byIndex[t.index] || [] }));
  return Response.json({ selections: result });
}
