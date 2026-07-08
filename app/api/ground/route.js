// Resource grounding (Option B, slice 1). Verifies each AI-suggested resource
// against real public catalogs — books via Open Library, scholarly works via
// OpenAlex (both free, no key). Verified items get a real link; unresolved ones
// stay flagged. This is the "no hallucinated citations" guarantee, post-hoc:
// generate freely, then keep only what resolves to something real.

const MAX_RESOURCES = 40;
const TIMEOUT_MS = 6000;

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokenSet(s) {
  return new Set(normalize(s).split(" ").filter((w) => w.length > 2));
}
// Fraction of the query's meaningful tokens present in the candidate title.
function overlap(query, candidate) {
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

async function searchOpenLibrary(title) {
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

async function searchOpenAlex(title) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(
    title
  )}&per_page=1&mailto=labbridge-app@users.noreply.github.com`;
  const data = await fetchJson(url);
  const w = data?.results?.[0];
  if (!w || overlap(title, w.display_name) < 0.5) return null;
  return {
    verifiedTitle: w.display_name,
    url: w.doi || w.id,
    source: "OpenAlex",
    year: w.publication_year || null,
    retracted: !!w.is_retracted,
  };
}

async function groundOne(res) {
  const kind = (res?.kind || "").toLowerCase();
  const title = (res?.title || "").trim();
  if (!title) return { status: "unverified" };
  try {
    let hit = null;
    if (/book|textbook/.test(kind)) {
      hit = (await searchOpenLibrary(title)) || (await searchOpenAlex(title));
    } else if (/paper|article|journal|publication|study|preprint/.test(kind)) {
      hit = (await searchOpenAlex(title)) || (await searchOpenLibrary(title));
    } else {
      // courses, documentation, tutorials, videos, blogs — not in these catalogs.
      return { status: "uncheckable" };
    }
    if (!hit) return { status: "unverified" };
    if (hit.retracted) return { status: "retracted", ...hit };
    return { status: "verified", ...hit };
  } catch {
    return { status: "unverified" };
  }
}

export async function POST(request) {
  let resources = [];
  try {
    const body = await request.json();
    resources = Array.isArray(body?.resources) ? body.resources.slice(0, MAX_RESOURCES) : [];
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const results = await Promise.all(resources.map(groundOne));
  return Response.json({ results });
}
