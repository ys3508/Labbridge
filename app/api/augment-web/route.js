// Retrieval-first, phase 2: add ONE canonical course / official doc per topic,
// web-verified. Runs AFTER the fast catalog resources render, so the slow
// (agentic) web search never blocks the plan — courses/docs fill in progressively.
import { client, MODEL } from "@/lib/ai";
import { webFindUrls } from "@/lib/verify";

const MAX_TOPICS = 12;

const PROPOSE_SYSTEM = `For each learning topic, name ONE canonical, widely-known COURSE or official DOCUMENTATION for learning it — an official docs site, or a well-established course (e.g. a specific university / Coursera / edX course). Give the exact name, a kind ("course" or "documentation"), and one short sentence on why it fits a career-changer. Only name real, well-known ones; if you don't know a real one for a topic, omit it. Never invent.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          title: { type: "string" },
          kind: { type: "string" },
          why: { type: "string" },
        },
        required: ["index", "title", "kind", "why"],
      },
    },
  },
  required: ["items"],
};

export async function POST(request) {
  let topics = [];
  try {
    topics = (await request.json())?.topics || [];
    topics = Array.isArray(topics) ? topics.slice(0, MAX_TOPICS) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!topics.length) return Response.json({ augments: [] });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ augments: [] });

  // 1) Propose one course/doc per topic (batched).
  const list = topics.map((t) => `${t.index}. ${t.topic}`).join("\n");
  let items = [];
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system: PROPOSE_SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Propose one course/doc per topic:\n${list}` }],
    });
    const block = message.content.find((b) => b.type === "text");
    items = block ? JSON.parse(block.text).items || [] : [];
  } catch {
    return Response.json({ augments: [] });
  }
  items = items.filter((it) => it && typeof it.index === "number" && (it.title || "").trim());
  if (!items.length) return Response.json({ augments: [] });

  // 2) Web-verify each proposed course/doc (one batched agentic call).
  let urls = [];
  try {
    urls = await webFindUrls(items.map((it) => ({ title: it.title, kind: it.kind })));
  } catch {
    return Response.json({ augments: [] });
  }

  const augments = [];
  urls.forEach((u) => {
    const it = items[u.index];
    if (it && u.url) {
      augments.push({
        index: it.index,
        resource: { title: it.title, url: u.url, source: "Web", kind: it.kind || "resource", why: (it.why || "").trim() },
      });
    }
  });

  return Response.json({ augments });
}
