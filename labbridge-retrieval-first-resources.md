# LabBridge — Retrieval-First Resources (build guide)

The deepest remaining grounding gap, and the refactor that closes it. One rule:

> **The model selects and explains over resources we already retrieved and verified. It never authors a resource title from memory that then gets shown.**

Today we do the opposite order and clean up after. This flips it.

---

## Where we are now (be honest about it)

Current flow, as built:

```
/api/plan   → model generates the WHOLE plan, incl. resource titles, from memory
/api/ground → verify each title against Open Library / OpenAlex   (drop fakes)
/api/ground-web → web-search official URLs for courses/docs         (drop fakes)
/api/reground   → one LLM retry to replace a dropped title          (verify again)
PlanView    → show only what survived; honest gap if none
```

This is **generate-then-verify**. It's genuinely good — a fabricated title never reaches the user, because code drops it. But two residual gaps live in it:

1. **Pedagogical selection is from memory.** The model decides *what* to recommend before any retrieval. On a niche or fast-moving field where its memory is thin or dated, the picks are weak — even when they're real.
2. **The explanation can drift from the shown resource.** The `"why this fits"` line is written in `/api/plan` about the title the model *authored*. If that title fails verification and `/api/reground` swaps in a different real resource, the surviving item and its rationale were written about **different things**. The prose describes a resource that isn't there.

Retrieval-first fixes both: the model only ever chooses among, and writes about, resources we've already pulled and verified.

---

## The inversion (three passes)

```
1. STRUCTURE   — plan with NO resources: summary, strengths, gaps,
                 ordered topics (+ why each topic), first task, timelineNote.
2. RETRIEVE    — per topic, build a pool of REAL, verified candidate resources
                 (model proposes canonical titles as QUERIES → verify → keep).
3. SELECT      — per topic, model picks the best 1–3 for THIS person and writes
                 the "why it fits" grounded ONLY in the retrieved metadata.
```

Selection and explanation now both happen over material we retrieved. The model's job narrows to what it's actually good at: **judging fit and explaining** — over given material, not from memory.

---

## Part A — Structure only (`/api/plan`, modified)

Drop `resources` from the `learningSequence` items in the schema. Each topic keeps `topic` + `why` (why it comes here). Everything else (summary, strengths, gaps, firstTask, timelineNote) is unchanged. The prompt gains one line:

```
Do NOT list resources. For each learning step give only the topic and why it
comes here. Resources are selected in a later step from verified sources.
```

Output shape (only the sequence changes):

```
learningSequence: [ { topic, why } ]     // no resources[]
```

---

## Part B — Candidate retrieval (`/api/candidates`, new)

Reuses `lib/verify.js` (`verifyBook`, `verifyPaper`, `webFindUrls`). Per topic:

```
1. Model proposes 3–5 SPECIFIC canonical titles for the topic (Haiku).
   These are QUERIES, never shown. This is the pedagogical knowledge we DO want
   — "the canonical ML text is Géron" is a good query; a raw topic search is not.
2. Verify each proposed title (catalog by kind, else web). Keep verified ones.
3. (Optional, phase 2) Augment: an OpenAlex / Open Library topic search
   (`search=<topic>`) to surface strong items the model didn't name.
4. Dedupe → return a small pool of REAL candidates, each with metadata:
   { title, url, source, by?, year?, abstract? }   // abstract from OpenAlex
```

Batch the model-proposal step across all topics in one call. Verification is parallel (`Promise.all`). The abstract matters — it's what lets the SELECT step explain from the real thing (OpenAlex returns an inverted-index abstract; reconstruct it; Open Library has none, use subjects/author; web items, use the page `<meta description>` fetched server-side).

```js
// sketch — one proposal call, then verify each candidate
const proposals = await proposeTitles(topics);         // Haiku, [{topicIndex, titles[]}]
const pool = await Promise.all(
  proposals.flatMap(p => p.titles.map(async title => ({
    topicIndex: p.topicIndex,
    ...(await groundCandidate(title, kindHint(p.topic)))  // reuse lib/verify
  })))
);
// group verified candidates by topicIndex
```

---

## Part C — Selection + grounded explanation (`/api/select`, new)

Input: each topic + its verified candidate pool + the learner (background, depth, purpose). One batched call (Opus/Sonnet). Constrained the way every other prompt is:

```
You choose learning resources. For each topic you are given the topic and a list
of VERIFIED resources (all real, with metadata). Choose the best 1–3 for THIS
learner given their background and depth goal, and explain why each fits — using
ONLY the provided metadata, never outside knowledge. Do not name any resource not
in the list. If none of the candidates fit the topic well, return an empty list
for it (the UI shows an honest gap).
```

Output per topic: `[{ title, url, source, whyItFits }]` — where `title`/`url`/`source` are copied verbatim from a verified candidate (not re-authored), and `whyItFits` is grounded in that candidate's metadata. Now the shown resource and its rationale are the same object.

---

## How it composes with what exists

- **Checkers (`/api/check`)** — unchanged. They still validate the assembled plan (over-teaching, first-task viability).
- **Hard grounding (`/api/ground*`, `/api/reground`)** — mostly *subsumed*. Verification now happens **before** selection (Part B) instead of after generation. Keep `lib/verify.js` — it's the retrieval/verification engine, just called earlier. The old `verify-and-drop` pass in `PlanView` becomes unnecessary (everything selected is already verified); keep at most a thin final backstop.
- **Job-link fields, timeline, goals** — all still flow into Part A (structure) exactly as now.

---

## Build sequencing (ship in slices, keep it working throughout)

1. **Feature-flag the split.** Add a structure-only mode to `/api/plan` (drop `resources`), but keep the current resource-gen path live behind a flag so nothing breaks mid-build.
2. **Build `/api/candidates`** (model-propose → verify, reusing `lib/verify`). Test it standalone against a few topics before wiring.
3. **Build `/api/select`** (grounded selection + why). Test standalone.
4. **Rewire `PlanView`**: `plan(structure)` → `candidates` → `select` → render. Retire `verify-and-drop` to a backstop. Flip the flag.
5. **Phase 2 — topic-search augmentation** (Part B step 3) to widen pools beyond what the model names.
6. **Abstracts for the "why"** — reconstruct OpenAlex abstracts and fetch web `<meta description>` so SELECT explains from real text.

Each step is independently shippable and testable; the flag means `main` always has a working plan.

---

## Caveats (the honest ones)

- **Latency goes up, meaningfully.** Structure → per-topic retrieve → per-topic select is more round trips than one generate call. **Batch hard** (one proposal call for all topics; one selection call for all topics), parallelize verification, and **cache candidates per `(topic, kind)`** — the same topic recurs across users. Expect the plan screen to render structure first (fast) and resources to fill in.
- **Retrieval quality for beginners is the whole game.** A raw topic search on OpenAlex returns a top-*cited research paper*, not the best *textbook* — useless to a career-changer. That's exactly why Part B seeds the pool with the **model's proposed canonical titles** (its pedagogical knowledge) and treats topic-search as *augmentation*, not the source. Don't invert that.
- **Emerging / interdisciplinary domains stay thin.** Where catalogs are sparse — the novel intersections LabBridge most serves — the candidate pool is small and some topics honestly gap out. Retrieval-first trades "plausible-but-possibly-weak from memory" for "honestly sparse but real." That's the right trade for trust, but it *will* feel emptier on the bleeding edge. The gap is the curation to-do list (see the grounding-map guide).
- **Cost rises** (more calls per plan). Batching + caching is not optional at scale.
- **Not the skill graph.** This grounds *resources*; it does not build the prerequisite **graph** (ordering is still model-judged in Part A). That remains Slice 4. Retrieval-first and the graph are independent wins — this one is smaller and closes the resource-trust gap; the graph closes the ordering-trust gap.

---

## What it changes vs today

- The **`why this fits`** is written about the **real, surviving resource** — no drift between explanation and shown item (today's `reground` can swap the item out from under its rationale).
- **Pedagogical selection** is made over a **verified pool**, not raw memory — better picks on thin/dated domains, and the model can only choose real things.
- The model's role narrows to **judgment and explanation over given material** — the one boundary the current plan prompt can't state, because today it has no given material to select from.
