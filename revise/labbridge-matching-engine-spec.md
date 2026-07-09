# LabBridge — Matching Engine Spec (build notes)

The engine that turns captured intent into a certified onboarding plan. This is the document standing between the five input briefs and a testable product. It follows the same contracts as the rest of the system: *AI arranges real material you gave it, never speaks from memory*, and *extract → show → let them edit*.

Reads from: `labbridge-input-spec` (01 background), `labbridge-where-headed-spec` (02), `labbridge-goals-spec` (03), `labbridge-timeline-spec` (04). Uses: `labbridge-checker-prompts` as the output-certification layer.

---

## The mandate (read first)

The engine's riskiest job is **not** the traversal. It's **grounding and checking the map the traversal runs on.**

There are **two levels that must each be certified**, and the original checker doc covered only the second:

| Level | What it certifies | When | The rule |
|---|---|---|---|
| **The MAP** | the per-domain skill graph — nodes *and* prerequisite edges | build time (once per domain) | edges must be **seeded from real artifacts**, then **code-checked** — never free-generated from memory |
| **The PLAN** | a specific user's route across the map | at matching time | the four checks in `labbridge-checker-prompts` |

The contradiction this closes: the checker refuses to let AI *assert* prerequisites at check time, so the engine must not let AI *invent* them at build time. Every plan-level check certifies consistency **with the map** — so an unverified map makes every green check downstream a validation against a possible lie. **The map is the must-be-perfect surface.**

---

## Generation model (decided): build-and-check, then serve

When a user targets a **domain with no cached graph**, the engine **builds and certifies the graph before generating their plan** — the user waits on that first request. The graph is then **cached and versioned**, and every later user in that domain **reuses it instantly**. Per-domain (not per background×target) is what makes this tractable: one checked map serves every entry point into that domain.

Consequences to honor:
- **Reproducibility:** two users in the same domain get the *same* map, so a bad plan can be diagnosed as a bad *match* rather than a randomly bad *map*.
- **A finite, reviewable set:** because maps are per-domain and cached, a human can optionally eyeball each domain's graph *once*; per-combination generation would make that impossible.
- **First-user latency is real** — show honest progress ("Building the map for this field — this happens once, then it's instant for everyone"). It's a one-time cost per domain, not per user.

---

## Part A — Per-domain graph generation (the map, and its certification)

Triggered on first demand for a domain. Blocks until the graph passes certification, then caches.

**A1. Retrieve real domain artifacts (grounding sources).**
Pull genuine structural sources for the domain: university syllabi and their prerequisite listings, textbook tables of contents (chapter order = a sequenced prereq chain), the "background assumed" sections of review papers, published course outlines / learning roadmaps. These already encode expert-validated order.

**A2. Extract nodes AND edges *from* those artifacts — do not free-generate.**
The AI's job is **extraction and arrangement over the retrieved material**, the same move the rest of the system trusts. It reads the syllabi and proposes nodes and prerequisite edges *grounded in what those documents state* — not from its own memory of the field. This is the centerpiece guardrail: it converts edge-creation from "AI asserts from memory" into "AI compares/extracts from given material."

**A3. Ground every node or drop it.**
Reuse the grounding check *at build time*: a node that cannot resolve to a real, non-retracted resource does not enter the graph. Kills hallucinated topics before they can ever be taught.

**A4. Cross-check edges against ≥2 sources.**
An edge (X before Y) that appears across multiple retrieved sources is high-confidence and kept; one that appears in only a single source is flagged low-confidence (kept-but-marked, or dropped, per your tolerance). This is the edge-level analogue of grounding, and it's why a single mis-extracted syllabus can't silently corrupt the map.

**A5. Code-check the resulting graph (map certification).**
Mechanical, no AI:
- **Valid DAG** — no cyclic prerequisites (topological sort must succeed).
- **Reachability** — every plausible target node is reachable from the roots.
- **No orphans** — every non-root node has at least one prerequisite path.

**A6. Cache + version.** Store the certified graph keyed by domain, with a version stamp. Optional one-time human review here is now tractable.

> **Map certification = grounded nodes (A3) + seeded-and-cross-checked edges (A2, A4) + DAG-check (A5).** This is the layer the original checker doc was silent on. It must exist before any plan built on the map can be trusted.

---

## Part B — Entry-point resolution (background → where you start)

From section 01: `extractedSkills`, `skillsHave`, `field`, and raw resume text.

- **Normalize then map to nodes.** Free-text and tags are messy ("ML", "machine learning", "Machine Learning") — run a normalization step (canonical mapping, synonyms, casing) before matching keywords to graph nodes. Matched nodes are marked **satisfied**.
- **Downward closure (soft).** Marking an advanced node satisfied implies its prerequisites are satisfied too — but keep it *soft* (the user can restore an implied prereq), since using a tool doesn't always mean knowing its foundation.
- **Empty background → beginner.** No usable signal ⇒ entry at the roots, nothing satisfied — and set the visible `isBeginner` note in the plan ("assuming you're starting fresh — tell us what you know to trim this").
- **Certify:** run gap-accuracy supervisor (checker prompt 1) to catch **over-teaching** — any satisfied-node call the background doesn't actually support routes to `needs_review`.

---

## Part C — Target resolution (where you're headed → the destination)

From section 02: `role`, weighted `artifacts[]`, `instructions`, and the optional **real first-task/ticket** field.

- **Weighting drives direction, in priority order** (per section 02): type-default weight → instruction-box override → AI inference. High-weight artifacts + role + instructions determine the **target nodes**.
- **Real-ticket field is dual-purpose:** highest-weight target signal *and* the seed for the first task (Part F). It gets its own labeled line, not the artifact pile.
- **Conflict → one question.** If strong artifacts disagree (JD leans wet-lab, example repo is computational), surface `conflictFlag` and ask the single clarifying question rather than averaging.
- **Default target** if nothing resolves: the domain's headline/terminal node.
- **Ambiguous pile → honesty valve:** if the target is genuinely unclear, build around the clearest artifact and say so, correctable on the review screen.

---

## Part D — Traversal (the route)

Given the certified map, the satisfied set (B), and the targets (C):

1. **Gap = prerequisite-closure(targets) − satisfied.** Everything needed to reach the targets that the person doesn't already have.
2. **Depth (section 03) sets how far up each chain to climb** — `landscape` stops one rung up, `functional` reaches working competence, `deep` climbs to the top. Depth changes *how many rungs the gap contains per chain*, so it's a real input here, not cosmetic.
3. **Topologically sort the gap** against the map's edges → the **learning sequence** (every node after its prerequisites).
4. **Pick the best resource per node** from the grounded corpus, ranked by quality signals (citation velocity, recency where the field moves fast, **retractions excluded**) and **difficulty-fit** to the person's level.
5. **Purpose (section 03) tunes emphasis** — interview vs. starting-a-role vs. exploring reweights framing and resource choice among the already-chosen nodes (not which nodes).
6. **Sum effort per node** → hand to the timeline triangle (Part E).

---

## Part E — Timeline integration (section 04)

- Effort (from D6) is the third vertex of the triangle. Combined with the user's held vertex: `deadline` → derive required pace; `pace` → derive finish date; `open` → show total effort, tracker dormant.
- **Feasibility check at generate time.** If a deadline yields a brutal required pace, surface it now with the three levers — including **reduce depth**, which loops straight back to Part D2. An impossible deadline is a depth negotiation, not a dead end.

---

## Part F — First task

- **If the real-ticket field is filled:** scope the actual ticket into a week-one-sized first task.
- **If absent:** AI-simulate a plausible scoped first task for the target — grounded in the target artifacts, requiring **only nodes the plan has already covered.**
- Either way, certify with first-task-viability supervisor (checker prompt 2).

---

## Part G — Output certification (the plan)

Run `labbridge-checker-prompts` on the generated plan:

- **Grounding (code):** every resource resolves to a real, non-retracted ID; description matches abstract.
- **Prerequisite integrity (code):** plan order respects map edges; no node before its prereq; nothing required-but-missing (closure − included). *This is a code walk against the certified map — which is only meaningful because Part A certified the map.*
- **Gap accuracy — over-teaching (AI supervisor, prompt 1).**
- **First-task viability (AI supervisor, prompt 2).**
- `needs_review` on any check → one human glance at a specific, named finding.

---

## The single review screen (section 04 decision #4)

One surface, shown after generate, before the full plan, hosting all confirmations at once so there aren't three interruptions:
- the "here's how we read your materials" weighting summary (Part C),
- the goals/timeline pre-fills (sections 03/04),
- the `isBeginner` assumption if it fired (Part B),
- any `conflictFlag` question (Part C) or `needs_review` flags (Part G).

Right → proceed. Wrong → correct in a tap or a sentence.

---

## Data shape

```
domainGraph (cached, versioned, per domain):
  nodes[]   – { id, label, level, resourceIds[] (grounded), sourceRefs[] }
  edges[]   – { from, to, confidence, sourceRefs[] }   # seeded from artifacts, cross-checked
  status    – 'certified' (passed A3–A5) | 'building'

plan (per user):
  domain
  entry        – satisfied node set (Part B), + isBeginner flag
  targets      – target node set (Part C), + conflictFlag
  sequence[]   – ordered gap nodes (Part D), each with chosen resource + effort
  firstTask    – from ticket or simulated (Part F)
  timeline     – mode + derived pace/date + feasibility (Part E)
  checks       – results of Part G, incl. needs_review items
```

---

## Build sequencing

1. **Start with one pre-built, hand-checked graph** for a single domain (SWE → computational genomics). Build Parts B–G against it first — entry resolution, traversal, output checks. This lets you test the *plan* pipeline immediately without the build-time generation risk.
2. **Then add Part A** (the per-domain generation + map certification pipeline). It's the harder, higher-risk half; do it once the plan half is proven and you can see what a good map needs to produce.
3. The **two code checks** (grounding, prerequisite integrity) come first within Part G — small, high-value, no AI. The AI supervisors are the second layer.

---

## Cautions

- **Certify the map before trusting any plan on it.** Parts B–G are all downstream of the map; A is the foundation. Don't ship plan-generation on an uncertified graph.
- **Seed edges, never free-generate them.** This is the one guardrail that removes the risk rather than containing it.
- **Code-check the map too** — grounded edges can still be extracted wrong; the DAG/reachability walk catches that.
- **Cache per domain, version it** — for reproducibility and one-time reviewability.
- **First-user latency is honest and one-time** — communicate it; don't serve a provisional uncertified map to dodge the wait (that hands the ungrounded thing to the exact newcomer who can't catch it).
- **Keep analogies out** — deliver background-aware *entry-point placement* (grounded, Part B), not generated analogy text. Update section 01 Job 2 and the README to match.
