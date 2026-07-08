// Web-grounding for resources catalogs can't cover (courses, docs, tutorials).
// Verification logic lives in lib/verify (shared).
import { webFindUrls } from "@/lib/verify";

const MAX_ITEMS = 8;

export async function POST(request) {
  let items = [];
  try {
    const body = await request.json();
    items = Array.isArray(body?.items) ? body.items.slice(0, MAX_ITEMS) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!items.length) return Response.json({ results: [] });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key.", results: [] });
  try {
    const results = await webFindUrls(items);
    return Response.json({ results });
  } catch (err) {
    if (err?.status === 401) return Response.json({ error: "Invalid API key.", results: [] });
    console.error("ground-web route error:", err?.message || err);
    return Response.json({ results: [] });
  }
}
