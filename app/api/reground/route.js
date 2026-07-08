// One-shot retry (hard grounding). For resources that failed to verify, ask the
// model for ONE alternative REAL, well-known resource for the topic, then verify
// that alternative the same way. Returns a verified item or null (→ honest gap).
// The model proposes a query; verification still decides truth.
import { client, MODEL } from "@/lib/ai";
import { verifyBook, verifyPaper, webFindUrls } from "@/lib/verify";

const MAX_ITEMS = 20;

const SUGGEST_SYSTEM = `You suggest ONE real, widely-known learning resource for a topic. For each item you're given a topic, a resource kind, and titles already tried (which failed to verify). Name a DIFFERENT, real, well-known resource of that kind for learning that topic — prefer canonical, established resources (standard textbooks, official documentation, well-known courses). Give the exact title (and author for a book). If you do not know a real one, return an empty string for that item — NEVER invent a title.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { index: { type: "integer" }, title: { type: "string" } },
        required: ["index", "title"],
      },
    },
  },
  required: ["suggestions"],
};

function isCatalogKind(kind) {
  return /book|textbook|paper|article|journal|publication|study|preprint/.test((kind || "").toLowerCase());
}
function isBookKind(kind) {
  return /book|textbook/.test((kind || "").toLowerCase());
}

export async function POST(request) {
  let items = [];
  try {
    const body = await request.json();
    items = Array.isArray(body?.items) ? body.items.slice(0, MAX_ITEMS) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!items.length) return Response.json({ results: [] });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ results: items.map((it) => ({ key: it.key, item: null })) });

  // 1) Ask for one alternative per item.
  const list = items
    .map((it, i) => `${i}. topic: "${it.topic}" | kind: ${it.kind} | already tried: ${(it.tried || []).join("; ") || "(none)"}`)
    .join("\n");
  let suggestions = [];
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SUGGEST_SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Suggest one alternative resource per item:\n${list}` }],
    });
    const block = message.content.find((b) => b.type === "text");
    suggestions = block ? JSON.parse(block.text).suggestions || [] : [];
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key.", results: items.map((it) => ({ key: it.key, item: null })) });
    return Response.json({ results: items.map((it) => ({ key: it.key, item: null })) });
  }

  const altByIndex = {};
  suggestions.forEach((s) => {
    if (s && typeof s.index === "number" && (s.title || "").trim()) altByIndex[s.index] = s.title.trim();
  });

  // 2) Verify each alternative. Catalog items resolve directly; web items batch.
  const results = items.map((it) => ({ key: it.key, item: null }));
  const webBatch = []; // { resultIdx, title, kind }

  await Promise.all(
    items.map(async (it, i) => {
      const alt = altByIndex[i];
      if (!alt) return;
      if (isCatalogKind(it.kind)) {
        const hit = isBookKind(it.kind)
          ? (await verifyBook(alt)) || (await verifyPaper(alt))
          : (await verifyPaper(alt)) || (await verifyBook(alt));
        if (hit && !hit.retracted) {
          results[i].item = { title: hit.verifiedTitle, url: hit.url, source: hit.source, year: hit.year };
        }
      } else {
        webBatch.push({ resultIdx: i, title: alt, kind: it.kind });
      }
    })
  );

  // 3) Web-verify the course/doc alternatives.
  if (webBatch.length) {
    try {
      const urls = await webFindUrls(webBatch.map((w) => ({ title: w.title, kind: w.kind })));
      urls.forEach((u) => {
        const w = webBatch[u.index];
        if (w && u.url) results[w.resultIdx].item = { title: w.title, url: u.url, source: "Web" };
      });
    } catch {
      // leave as gaps
    }
  }

  return Response.json({ results });
}
