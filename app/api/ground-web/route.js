import { client } from "@/lib/ai";

// Slice 3: web-grounding for resources not in book/paper catalogs (courses,
// docs, tutorials). Uses Claude's web_search tool to find a real official URL
// for each, or null. Progressive enhancement — runs after the fast catalog
// grounding, so docs/courses turn from "double-check" into real links.

const WEB_MODEL = "claude-opus-4-8";
const MAX_ITEMS = 8;

const SYSTEM = `You verify that learning resources are real and find each one's official / canonical URL using web search. For each numbered resource, prefer the project's own documentation site, the course provider's page, or the publisher's page. If you cannot confidently find a real official page, return null for that item — never invent a URL.`;

export async function POST(request) {
  let items = [];
  try {
    const body = await request.json();
    items = Array.isArray(body?.items) ? body.items.slice(0, MAX_ITEMS) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!items.length) return Response.json({ results: [] });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key." }, { status: 500 });

  const list = items.map((it, i) => `${i}. "${it.title}" (${it.kind})`).join("\n");
  const userMsg = `Find the official URL for each resource below, using web search. Then respond with ONLY a JSON array — one entry per resource — like:\n[{"index":0,"url":"https://..."},{"index":1,"url":null}]\nNo prose, just the JSON array.\n\n${list}`;

  let messages = [{ role: "user", content: userMsg }];
  let final = null;
  try {
    for (let iter = 0; iter < 4; iter++) {
      const resp = await client.messages.create({
        model: WEB_MODEL,
        max_tokens: 2048,
        system: SYSTEM,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
        messages,
      });
      if (resp.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: resp.content });
        continue;
      }
      final = resp;
      break;
    }
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key." }, { status: 401 });
    console.error("ground-web route error:", err?.message || err);
    return Response.json({ error: "Web grounding failed.", results: [] }, { status: 200 });
  }

  const text = (final?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const match = text.match(/\[[\s\S]*\]/);
  let arr = [];
  try {
    arr = match ? JSON.parse(match[0]) : [];
  } catch {
    arr = [];
  }
  // normalize to { index, url }
  const results = arr
    .filter((e) => e && typeof e.index === "number")
    .map((e) => ({ index: e.index, url: typeof e.url === "string" && /^https?:\/\//.test(e.url) ? e.url : null }));

  return Response.json({ results });
}
