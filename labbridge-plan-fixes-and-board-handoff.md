# LabBridge — Plan-Quality Fixes + Plan→Board Handoff (build guide)

Two builds, back to back. Build 1 is a prompt + interpolation change (makes the plan content better). Build 2 is UI plumbing (click a step → the board opens on that node). Independent; do either order.

---

# BUILD 1 — Plan-quality fixes

Two halves, and they only work together: enrich the **prompt** (the fluent brief) AND fix the **interpolation** (what actually reaches the model). Editing the prompt alone is half-powered, because the bridge prose the prompt asks for needs the evidence phrases the interpolation currently drops.

## 1a. System prompt — add four lines to the fluent brief

Keep everything you have; add these into the system text. They enrich the fluent half only — the factual half stays owned by your downstream verify-and-drop pass.

```
WHO YOU'RE WRITING FOR: You are writing for a career-changer entering a field they
don't yet know well — someone who cannot reliably tell a good learning path from a
bad one. Be the expert guide they can't be for themselves: decisive about order and
about what to skip. Write so someone new to this field can follow every line, and
explain each gap and step in terms of what they ALREADY do — bridge from their world
into the new one. Don't use unexplained jargon; if a term is essential, anchor it to
something in their background in the same sentence.

THE BAR: The goal is to get them productive on a real team in days — not to hand them
a generic reading list. Every step must earn its place against that bar and connect
to the first task.

TONE / HONESTY: Write in the person's own vocabulary where you can. When you're not
sure a step applies to them, say so plainly rather than asserting it — never smooth
over a gap with confident filler.

RESOURCES: Only recommend resources you are confident are real and canonical, and
prefer ones you could point to a specific, checkable source for. The system verifies
each and drops fakes, so fewer certain ones beat more plausible-but-uncertain ones —
do not pad.
```

(That last line is honest to your current downstream-verify architecture, and the "checkable source" clause quietly biases the model toward recommendations that *survive* grounding — lowering your drop-rate and shrinking the eventual retrieval-first switch.)

## 1b. Per-item bridges — prompt + SCHEMA (must do together)

In the `PRODUCE` section, change the gap and sequence descriptions to require a bridge:

```
- knowledgeGaps: ... FOR EACH GAP, one sentence connecting it to what they already
  do: given their background, why THIS is the thing that's missing.
- learningSequence: ... FOR EACH STEP, a short "why this, why here" tying it to their
  background and the steps around it — the reasoning, not just the topic.
```

**This is inert unless the JSON schema has somewhere to put it.** Add:
- each `knowledgeGaps` item → `{ gap: string, whyItRelates: string }`
- each `learningSequence` step → add `why: string`

Then surface `whyItRelates` and `why` in the render template. Prompt + schema + template are one change, not three.

## 1c. Interpolation fix — carry the evidence, expand the enums

This is the one that makes 1a/1b actually land. In `buildPrompt()`:

**Carry skill evidence (not just names).** Today `skills` is `extractedSkills.map(s => s.skill)` — the evidence phrase is dropped, so the model bridges from thin material.

```js
// BEFORE
if (b.skills?.length) lines.push(`Skills they have: ${b.skills.join(", ")}`);

// AFTER — keep the evidence attached
if (b.extractedSkills?.length) {
  lines.push("Skills they have (with evidence from their background):");
  for (const s of b.extractedSkills) {
    lines.push(s.evidence ? `- ${s.skill} — ${s.evidence}` : `- ${s.skill}`);
  }
}
```

Now "financial modeling — built forecasting models in Excel" reaches the model, which is exactly the raw material the per-gap bridge (1b) needs.

**Expand depth/purpose inline** instead of relying on the system prompt to decode raw keys:

```js
const DEPTH = {
  landscape:  "landscape — orientation only, one rung up",
  functional: "functional — build to working competence",
  deep:       "deep — specialize, top of the relevant chains"
};
const PURPOSE = {
  starting_role: "starting a role — prioritize the first task and just-in-time depth",
  interview:     "interview prep — favor breadth and commonly-tested concepts",
  career_move:   "career move — favor durable foundations",
  curious:       "just curious — a short, low-commitment taste"
};
lines.push(`Depth: ${DEPTH[g.depth] || g.depth || "functional"}`);
lines.push(`Purpose: ${PURPOSE[g.purpose] || g.purpose || "not specified"}`);
```

## Build-1 order & test

Do 1a + 1b + 1c together (they interlock), ship, then re-run the Blackstone example. You should see: summary written *for* a career-changer; each gap saying why-it-matters-given-their-background; a "functional / starting_role" plan visibly leaning toward the first task. Leave the retrieval-first refactor ("feed candidates in, switch suggest→select") as its own tracked slice — it's a real build, not a prompt tweak.

---

# BUILD 2 — Plan → Board handoff

The board (`labbridge-onboarding.html`, folded into `labbridge.html`) already exists. What's missing is the click that opens it on a specific step. Pure plumbing, no AI.

## 2a. The data each step needs

A learning-sequence step already carries what the board's center panel needs: title, the `why`, and its resources. Make sure each step object looks like:

```js
step = {
  id,                 // stable id (index is fine to start: `step-0`)
  title,
  why,                // from Build 1b
  resources: [ { title, kind, link, verified } ],
  // filled later, when notes/AI exist:
  // notes:  loaded per step
}
```

## 2b. Make each plan step clickable

In the plan-overview render, each step becomes a button that switches view to the board, seeded with that step:

```js
function renderStep(step, i) {
  const el = document.createElement('button');
  el.className = 'plan-step';
  el.innerHTML = `<span class="n">${i + 1}</span>
                  <span class="t">${step.title}</span>
                  <span class="go">Open ›</span>`;
  el.onclick = () => openBoard(step.id);
  return el;
}
```

## 2c. The handoff

`openBoard` switches from the plan view to the board view and tells the board which node to show. If the board is its own view in the merged file, reuse your existing `show('onboarding')` + `selectNode()`:

```js
function openBoard(stepId) {
  state.current = stepId;
  show('onboarding');          // reveal the three-panel board
  selectNode(stepId);          // load THIS step's material into the center panel
}
```

And `selectNode` populates the center panel from the step object (title, why, resources) — you already have this shape from the onboarding page; point it at the plan's steps instead of the old hard-coded CONTENT map:

```js
function selectNode(stepId) {
  const step = state.plan.sequence.find(s => s.id === stepId);
  document.getElementById('matTitle').textContent = step.title;
  document.getElementById('matWhy').textContent   = step.why;
  renderResources(step.resources);   // the grounded resource cards
  // load notes for this step when the notes panel exists (Build 3)
  renderList();                      // left rail highlights the active step
}
```

## 2d. The left rail = the plan sequence

The board's left rail should list the plan's steps (not a hard-coded set), so navigating inside the board mirrors the plan:

```js
function renderList() {
  const list = document.getElementById('nodeList'); list.innerHTML = '';
  state.plan.sequence.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'node' + (s.id === state.current ? ' active' : '');
    row.onclick = () => selectNode(s.id);
    row.innerHTML = `<span class="step-n">${i + 1}</span><span class="node-label">${s.title}</span>`;
    list.appendChild(row);
  });
}
```

## 2e. A way back

One button in the board's top bar to return to the plan overview:

```js
document.getElementById('backToPlan').onclick = () => show('plan');
```

## Build-2 test

Generate a plan → click a step → the board opens on that step with its title, its `why`, and its resources in the center, that step highlighted in the left rail, and Back returns you to the overview. No AI, no notes yet — those are the next slice (Build 3: notes panel; Build 4: grounded bot).

---

# Order recap

1. **Build 1** (prompt 1a + bridges 1b + interpolation 1c) — plan content gets better; the board will show whatever this produces, so it comes first.
2. **Build 2** (handoff) — pure plumbing, connects overview → board.
3. Later: notes panel (easy, safe), then the grounded AI bot (same discipline as plan grounding — build last, on the resources you'll have by then).
```
