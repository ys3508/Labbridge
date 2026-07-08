# LabBridge — Hardening Grounding + Map Certification (build guide)

Two fixes the live test surfaced: (1) make grounding **hard** — every shown resource is real, or the slot is honestly empty, never a placeholder; (2) **certify the map** — at minimum a DAG-check now, seed-from-artifact next. Concrete, with working code. Do them in the order below.

---

## Build order (so this stays small)

1. **DAG-check every generated graph** — pure code, ~1 hour. Instantly moves "prerequisite integrity" from *unverifiable* to *structurally valid*. **Start here.**
2. **Hard grounding** — kill invented resources at the source, verify-and-drop, show the resolved item (not a generic description), flag zero-resource nodes honestly.
3. **Seed edges from real sources** — the deeper fix that makes the *content* of the map trustworthy, not just its structure.
4. **One human glance per cached domain** — optional backstop; tractable because maps are per-domain and cached.

---

## Fix 1 — Map certification, Phase 1: the DAG-check (do first)

Drop this in and run it on every graph the builder produces. If it doesn't certify, reject and regenerate (or repair) *before* any plan is built on it.

```js
// nodes: [{ id }]   edges: [{ from, to }]  where `from` is a prerequisite of `to`
// Returns { certified, order, problems }
function certifyGraph(nodes, edges, targets = []) {
  const ids = new Set(nodes.map(n => n.id));
  const problems = [];

  // 0) edges must reference real nodes
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to))
      problems.push(`Edge ${e.from} → ${e.to} references an unknown node`);
  }

  // adjacency (prereq → dependent) + indegree
  const adj = {}, indeg = {};
  nodes.forEach(n => { adj[n.id] = []; indeg[n.id] = 0; });
  for (const e of edges)
    if (ids.has(e.from) && ids.has(e.to)) { adj[e.from].push(e.to); indeg[e.to]++; }

  // 1) cycle check via Kahn's topological sort
  const roots = nodes.filter(n => indeg[n.id] === 0).map(n => n.id);
  const deg = { ...indeg }, q = [...roots], order = [];
  while (q.length) {
    const u = q.shift(); order.push(u);
    for (const v of adj[u]) if (--deg[v] === 0) q.push(v);
  }
  if (order.length !== nodes.length)
    problems.push('Cycle detected: prerequisites form a loop — no valid learning order exists');

  // 2) reachability from roots (catches orphans AND unreachable targets)
  const reachable = new Set();
  const walk = id => { if (reachable.has(id)) return; reachable.add(id); adj[id].forEach(walk); };
  roots.forEach(walk);
  for (const n of nodes)
    if (!reachable.has(n.id)) problems.push(`Node "${n.id}" is an orphan — no prerequisite path reaches it`);
  for (const t of targets)
    if (!reachable.has(t)) problems.push(`Target "${t}" is not reachable from the foundations`);

  return { certified: problems.length === 0, order, problems };
}
```

What it guarantees: no circular prerequisites, a valid learning order exists, no floating nodes, and your target is actually reachable. That's the *structural* half of prerequisite integrity — pure code, no AI, no expertise. It does **not** guarantee the edges are *correct* (that's Phase 3); it guarantees they're *coherent*.

---

## Fix 2 — Hard grounding

**Root cause of the "unverified" items in your test:** two different things got merged under one label.

- **(a) Invented resources** — "a reputable PE overview book," "a reputable PE operations text." These were never retrieved; the LLM *wrote* them. This is the real hallucination and must be killed at the source.
- **(b) Real items you couldn't fully vet** — a genuine edge case worth an honest caveat.

The rule that fixes both:

> **The LLM never authors a resource. It only selects from a retrieved candidate list. Every displayed resource is a real retrieved item that passed a code verification. A node with zero verified items shows an honest resource-gap — never a placeholder.**

### The per-node pipeline

```
1. Build a search query for the node (AI may help write the query — not the resource).
2. Retrieve candidates from the right source by type (book / paper / web).
3. Code-verify each candidate (resolve to a real ID / reachable / not retracted).
4. Keep only verified; rank by quality signal; take top 1–3.
5. If none verified → node.resourceGap = true. Show the honest message, not a placeholder.
6. The LLM may write only the "why this fits" line — from the retrieved abstract, never the identity.
```

### Verification, by source type (all code, deterministic)

```js
// BOOK → Open Library (CORS-friendly, no key). Returns a real item or null.
async function verifyBook(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`
            + `&limit=1&fields=title,author_name,key,first_publish_year`;
  const r = await fetch(url); if (!r.ok) return null;
  const d = ((await r.json()).docs || [])[0]; if (!d) return null;
  return { title: d.title, authors: (d.author_name || []).slice(0, 2).join(', '),
           year: d.first_publish_year, link: `https://openlibrary.org${d.key}`, source: 'Open Library' };
}

// PAPER → OpenAlex (CORS-friendly, no key). Excludes retracted.
async function verifyPaper(query) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}`
            + `&per_page=1&mailto=you@example.com`
            + `&select=id,doi,title,publication_year,cited_by_count,authorships,is_retracted`;
  const r = await fetch(url); if (!r.ok) return null;
  const w = ((await r.json()).results || [])[0];
  if (!w || w.is_retracted) return null;                 // hard-drop retracted
  return { title: w.title, year: w.publication_year, cites: w.cited_by_count,
           link: w.doi || w.id, source: 'OpenAlex' };
}
```

```js
async function resourcesForNode(node) {
  const verified = [];
  for (const cand of node.candidates) {                  // candidates from retrieval, never invented
    const item = cand.type === 'book'  ? await verifyBook(cand.query)
               : cand.type === 'paper' ? await verifyPaper(cand.query)
               : null;                                    // web/course → verify server-side (see note)
    if (item) verified.push(item);
  }
  return verified.length
    ? { resources: verified.slice(0, 3), gap: false }
    : { resources: [], gap: true };                       // honest gap — NEVER a placeholder
}
```

### Two display rules that matter

- **Show the resolved item, not the query.** Your test showed "McKinsey/Bain reports ✓" — a generic label with a link. Instead show the *actual retrieved title + real link* (`verifyBook`/`verifyPaper` already return these). The user should see the real thing you found, not your search intent.
- **A resource-gap is honest, not empty-looking.** When `gap: true`: *"No vetted resource found for this step yet — flagged for review."* That's the honesty valve, and it doubles as your curation to-do list (which nodes need a hand-picked source).

### One caveat on web/course URLs

Books and papers verify cleanly in the browser (Open Library, OpenAlex, Crossref all allow CORS). Arbitrary web/course URLs often **can't** be 200-checked client-side (CORS blocks it) — so verify those **server-side**, or trust that a URL returned by a real search API exists and skip the reachability check. Don't fake a client-side check that silently passes everything.

---

## Fix 2 — Map certification, Phase 3: seed edges from real sources

This is what makes the *content* of the edges trustworthy (Phase 1 only made them coherent). It's the guardrail that removes the risk instead of containing it.

When building a new domain's graph:

1. **Retrieve 2–4 real structural sources** for the domain via web search — university syllabi with prerequisite listings, course outlines, published learning roadmaps, the "background assumed" section of a review paper. Extract their text.
2. **Feed those texts to the builder** with the constrained prompt below — it extracts nodes and edges *from the sources*, attaches a `sourceRef` to each edge, and is forbidden from adding edges no source supports.
3. **Cross-check:** an edge appearing in ≥2 sources is high-confidence; a lone edge is low-confidence (flag or drop, your call).
4. **Run `certifyGraph`** (Phase 1) on the result.

### Constrained graph-builder prompt

```
You are a GRAPH BUILDER. Build a prerequisite skill graph for the domain, using
ONLY the provided source material. You are extracting structure that already
exists in these sources — you are NOT inventing it from your own knowledge.

ABSOLUTE RULES
- Every edge (X is a prerequisite of Y) MUST be supported by at least one source.
  Attach the source it came from. If no source supports an ordering, DO NOT add
  that edge.
- Do not add nodes that don't appear in the sources.
- If the sources conflict on an ordering, include the edge and mark it "conflicted."
- Return JSON only.

DOMAIN: {{domain}}

SOURCES (retrieved syllabi / outlines / roadmaps / review-paper prerequisites):
{{source_texts_with_labels}}

Return JSON ONLY:
{
  "nodes": [ { "id": "...", "label": "...", "sourceRefs": ["S1","S3"] } ],
  "edges": [ { "from": "...", "to": "...", "sourceRefs": ["S2"], "conflicted": false } ]
}
```

Same move as everywhere else in your system: the AI **arranges given material**, it doesn't speak from memory. Now the edges — your must-be-perfect surface — are grounded, cross-checked, and code-verified.

---

## What each fix does to your rubric

- **DAG-check** → prerequisite integrity becomes *structurally* passable today (no loops, valid order, reachable target).
- **Hard grounding** → grounding becomes a *hard* pass (every shown resource resolves; gaps are honest, not placeholders) — matching your spec instead of softening it.
- **Seed-from-artifact** → prerequisite integrity becomes *content-wise* trustworthy (edges grounded in real curricula, not memory).
- **Human glance** → optional backstop, finite because per-domain + cached.

Ship #1 today (it's an afternoon), #2 next (visible trust win), #3 when you build the generation pipeline for real. Together they close the exact two gaps the live test found.
```
