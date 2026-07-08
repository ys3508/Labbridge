// Retrieval-first, Part B: build a pool of REAL, verified candidate resources
// per learning topic. The model proposes canonical titles (its pedagogical
// knowledge) — used only as QUERIES — and lib/verify decides what's real. The
// model never authors a resource that gets shown; only verified items survive.
import { client, MODEL } from "@/lib/ai";
import { groundCatalog } from "@/lib/verify";

const MAX_TOPICS = 12;

const PROPOSE_SYSTEM = `For each learning topic, name up to 5 real, widely-known, canonical resources to LEARN it. STRONGLY PREFER standard textbooks and landmark papers — give the exact title and the author(s), and set kind to "book" or "paper". These are what the system can verify, so lean toward them. Give at least 2–3 books/papers per topic when real ones exist. These are search queries: only name resources you are genuinely confident are REAL and well-known; if you don't know a real one, return fewer — never invent a title.`;

const PROPOSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    proposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { title: { type: "string" }, kind: { type: "string" } },
              required: ["title", "kind"],
            },
          },
        },
        required: ["index", "items"],
      },
    },
  },
  required: ["proposals"],
};

function isCatalogKind(kind) {
  return /book|textbook|paper|article|journal|publication|study|preprint/.test((kind || "").toLowerCase());
}

export async function POST(request) {
  let topics = [];
  try {
    topics = (await request.json())?.topics || [];
    topics = Array.isArray(topics) ? topics.slice(0, MAX_TOPICS) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!topics.length) return Response.json({ candidates: [] });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ candidates: topics.map((t) => ({ index: t.index, pool: [] })) });

  // 1) Propose canonical titles per topic (one batched call).
  const list = topics.map((t) => `${t.index}. ${t.topic}`).join("\n");
  let proposals = [];
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: PROPOSE_SYSTEM,
      output_config: { format: { type: "json_schema", schema: PROPOSE_SCHEMA } },
      messages: [{ role: "user", content: `Propose resources for each topic:\n${list}` }],
    });
    const block = message.content.find((b) => b.type === "text");
    proposals = block ? JSON.parse(block.text).proposals || [] : [];
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key.", candidates: [] });
    return Response.json({ candidates: topics.map((t) => ({ index: t.index, pool: [] })) });
  }

  // Flatten proposals into candidates, keyed back to their topic.
  const cands = [];
  proposals.forEach((p) => {
    (p.items || []).forEach((it) => {
      if (it && (it.title || "").trim()) cands.push({ topicIndex: p.index, title: it.title.trim(), kind: it.kind || "" });
    });
  });

  // 2) Verify catalog candidates (books/papers) against Open Library / OpenAlex —
  //    fast and free, runs in parallel. Course/doc web-verification is slow
  //    (agentic web search) and would block the whole plan, so it's deferred to
  //    phase 2; catalog candidates cover most topics with real, canonical items.
  const pools = {};
  topics.forEach((t) => (pools[t.index] = []));

  await Promise.all(
    cands
      .filter((c) => isCatalogKind(c.kind))
      .map(async (c) => {
        const r = await groundCatalog(c.title, c.kind);
        if (r.status === "verified") {
          (pools[c.topicIndex] ||= []).push({
            title: r.verifiedTitle || c.title,
            url: r.url,
            source: r.source,
            by: r.by || null,
            year: r.year || null,
            kind: c.kind,
          });
        }
      })
  );

  // Cap each pool.
  const candidates = topics.map((t) => ({ index: t.index, pool: (pools[t.index] || []).slice(0, 6) }));
  return Response.json({ candidates });
}
