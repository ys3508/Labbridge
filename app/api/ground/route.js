// Catalog grounding — books via Open Library, papers via OpenAlex.
// Verification logic lives in lib/verify (shared with /api/reground).
import { groundCatalog } from "@/lib/verify";

const MAX_RESOURCES = 40;

export async function POST(request) {
  let resources = [];
  try {
    const body = await request.json();
    resources = Array.isArray(body?.resources) ? body.resources.slice(0, MAX_RESOURCES) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const results = await Promise.all(resources.map((r) => groundCatalog(r?.title, r?.kind)));
  return Response.json({ results });
}
