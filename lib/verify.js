// SERVER-ONLY. Shared resource verification — catalogs (Open Library / OpenAlex)
// and web search. Used by /api/candidates and /api/augment-web so there's one
// implementation of "is this resource real."
import { client } from "@/lib/ai";

const TIMEOUT_MS = 6000;
const WEB_MODEL = "claude-opus-4-8";

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokenSet(s) {
  return new Set(normalize(s).split(" ").filter((w) => w.length > 2));
}
export function overlap(query, candidate) {
  const q = tokenSet(query);
  if (!q.size) return 0;
  const c = tokenSet(candidate);
  let hit = 0;
  for (const t of q) if (c.has(t)) hit++;
  return hit / q.size;
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "LabBridge/0.1" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyBook(title) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=title,author_name,key`;
  const data = await fetchJson(url);
  const doc = data?.docs?.[0];
  if (!doc || overlap(title, doc.title) < 0.5) return null;
  return {
    verifiedTitle: doc.title,
    url: `https://openlibrary.org${doc.key}`,
    source: "Open Library",
    by: doc.author_name?.slice(0, 2).join(", ") || null,
  };
}

export async function verifyPaper(title) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(
    title
  )}&per_page=1&mailto=labbridge-app@users.noreply.github.com`;
  const data = await fetchJson(url);
  const w = data?.results?.[0];
  if (!w || overlap(title, w.display_name) < 0.5) return null;
  return {
    verifiedTitle: (w.display_name || "").replace(/<[^>]+>/g, "").trim(),
    url: w.doi || w.id,
    source: "OpenAlex",
    year: w.publication_year || null,
    retracted: !!w.is_retracted,
  };
}

// Catalog check by kind. Returns { status, ... }.
// verified | retracted | unverified (book/paper not found) | uncheckable (course/doc)
export async function groundCatalog(title, kind) {
  const k = (kind || "").toLowerCase();
  const t = (title || "").trim();
  if (!t) return { status: "unverified" };
  try {
    let hit = null;
    if (/book|textbook/.test(k)) hit = (await verifyBook(t)) || (await verifyPaper(t));
    else if (/paper|article|journal|publication|study|preprint/.test(k)) hit = (await verifyPaper(t)) || (await verifyBook(t));
    else return { status: "uncheckable" };
    if (!hit) return { status: "unverified" };
    if (hit.retracted) return { status: "retracted", ...hit };
    return { status: "verified", ...hit };
  } catch {
    return { status: "unverified" };
  }
}

// Web search for official URLs — for courses/docs/tutorials not in catalogs.
// items: [{title, kind}]  → returns [{index, url|null}] (never invents a URL).
export async function webFindUrls(items) {
  if (!items.length) return [];
  const list = items.map((it, i) => `${i}. "${it.title}" (${it.kind})`).join("\n");
  const system = `You verify that learning resources are real and find each one's official / canonical URL using web search. Prefer the project's own docs site, the course provider's page, or the publisher's page. If you cannot confidently find a real official page, return null for that item — never invent a URL.`;
  const userMsg = `Find the official URL for each resource below, using web search. Then respond with ONLY a JSON array — one entry per resource — like [{"index":0,"url":"https://..."},{"index":1,"url":null}]. No prose.\n\n${list}`;
  let messages = [{ role: "user", content: userMsg }];
  let final = null;
  for (let i = 0; i < 4; i++) {
    const resp = await client.messages.create({
      model: WEB_MODEL,
      max_tokens: 2048,
      system,
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
  const text = (final?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const m = text.match(/\[[\s\S]*\]/);
  let arr = [];
  try {
    arr = m ? JSON.parse(m[0]) : [];
  } catch {
    arr = [];
  }
  return arr
    .filter((e) => e && typeof e.index === "number")
    .map((e) => ({ index: e.index, url: typeof e.url === "string" && /^https?:\/\//.test(e.url) ? e.url : null }));
}
