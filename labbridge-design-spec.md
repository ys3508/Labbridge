# LabBridge — Product Design Spec

*From "I'm new here" to "I can contribute" — in days, not months.*

This document captures the product decisions made so far. It's a living spec: the kind of thing you edit as the product sharpens.

---

## 1. What LabBridge is

Life sciences is now interdisciplinary by default — software engineers, MPH graduates, and clinicians keep moving into biotech and AI roles, and onboarding hasn't caught up. New hires get handed papers and told to "figure it out." The gap isn't access to information; it's knowing what to *do* with it.

LabBridge sits at the intersection of three questions no single tool answers together: who is this person (their real, transferable background), what role are they entering, and what are they actually expected to do first. It takes a background, a target, and constraints, and returns a personalized onboarding plan: transferable strengths, real knowledge gaps, a learning sequence in prerequisite order, curated resources grounded in real literature, background-aware explanations, and a scoped first task they could finish in week one.

The wedge is the individual making an interdisciplinary leap. Organizations and labs are the natural expansion, but the individual comes first — sharper product, faster feedback, easier to sell.

---

## 2. Platform: responsive web first

Web, not native mobile. The core activity — reading papers, following tutorials, writing first scripts — happens on a laptop, next to the user's actual work environment, and LabBridge should live in a browser tab alongside it. The input is keyboard-heavy. The B2B expansion path is web/SSO territory. And web is the fastest, cheapest way to the feedback the wedge depends on.

Build it responsive so it's usable on a phone for glanceable things (checking progress, a reminder). Treat native mobile as a later feature decision made with real usage data, not a founding bet.

---

## 3. The input

Design principles: resume-paste first (fastest, richest signal) with a structured fallback behind progressive disclosure, so nobody fills a long form they didn't want. Tap over type wherever the output only needs a coarse value. Free-form keywords with suggestions — never block someone with a fixed list, but nudge toward canonical values when a match exists.

What it captures:

- **Background:** resume text, or fallback fields — field(s) of study (multi, free-form + suggestions), skills already held (tag input, free-form + suggestions), experience.
- **Target:** role, company/lab, pasted job description or research description, skills they want to learn (tag input), and repos/demos/examples of work they want to mimic (a format-friendly list — links become clickable, plain text stays a note). The examples field is a strong signal: it pins what "productive" concretely means for this person.
- **Goals:** success criteria (oriented quickly / productive fast / deep expertise / interview prep / exploring), multi-select.
- **Timeline:** entered as a duration that *resolves to and stores an absolute date* (or an exact date picker). Storing a date, not a duration, keeps the later countdown honest.

Note: weekly hours are **not** asked. They're derived (see §7).

---

## 4. The core engine: a shared graph, a personal route

The heart of LabBridge is a **skill graph**: concepts as nodes, prerequisite relationships as directed edges (A must come before B). One graph per *target domain* (e.g. computational biology), 15–30 nodes.

The critical distinction: **the graph is shared; the route across it is personal.** Like a subway map — the map is the same for everyone, but each rider's journey depends on where they start and where they're going. Background does not create a new graph; it only changes the **entry point** (which nodes start satisfied). A software engineer entering comp-bio already has Python and stats; a clinician already has the biology. Same graph, mirrored starting sets, completely different routes.

Personalization happens on five independent dimensions, all computed *over* the shared graph without changing it:

1. **Entry point** — what they already know, subtracted out.
2. **Destination** — which target nodes light up.
3. **Depth** — how far up each prerequisite chain to climb (goal-driven).
4. **Weighting** — example repos and org context reweight which nodes matter.
5. **Voice** — explanations written for *this* background over shared nodes.

The computation: gap = the prerequisite-closure of the targets, minus everything satisfied. Topologically sort the gap so every node follows its prerequisites — that's the learning sequence. Pick the best-fit resource per gap node — that's the reading list. Sum the effort — that feeds the tracker.

One graph serves every background aiming at that domain, with zero extra authoring.

---

## 5. Building the graph: AI-built, grounded, cached

You don't hand-author nodes and edges — even experts struggle to, and it doesn't scale. **AI builds the graph.** The discipline isn't "a human draws it"; it's *grounded and kept* rather than *imagined and discarded*:

- **Grounded:** AI extracts nodes and prerequisite edges from sources that already encode expert consensus — university syllabi and their prerequisite listings, textbook tables of contents (chapter order is a sequenced prereq chain), "background assumed" sections of review papers, existing learning roadmaps. When many sources agree on an edge it's high-confidence; a lone mention is flagged. Same philosophy as citations: the model arranges what real sources contain, it doesn't invent from memory.
- **Cached, not per-user:** build the graph once per domain (on first demand), validate, version, and reuse it for everyone. This is cheaper, consistent across users, inspectable/debuggable, and — most importantly — *improvable*: a kept graph accumulates fixes; an ephemeral one resets to zero every time.
- **Validated cheaply:** is it a valid DAG (no cyclic prerequisites)? Is every target reachable? Does it cover the source syllabi? All code checks, not expert labor. Human role shrinks to spot-checking.
- **Demand-paced expansion:** you launch with one domain. When someone requests a domain you don't have, the product says so honestly, optionally offers an AI-drafted *provisional* path clearly marked "unvetted," and logs the request. Those logs tell you which domain to build next — users vote with demand.

The library grows one verified domain at a time. That curated, grounded graph is the moat — the thing a generic chatbot can't reproduce. If the path were invented live per user instead, LabBridge *would be* the generic chatbot it's trying to beat.

---

## 6. Trust architecture

Trust lives in the resources being real and right, and it's structural, not promised.

- **Retrieval-then-select:** the language model never *produces* a citation. Retrieval pulls real candidates with real IDs from real APIs (PubMed/PMC, Semantic Scholar, OpenAlex, Crossref, preprint servers). The model only selects, sequences, and explains over that fixed set. A fabricated citation becomes structurally impossible.
- **Four failure modes, four fixes:** (1) doesn't exist → resolve every ID against source of truth; (2) exists but wrongly described → generate the "why this" from the retrieved abstract and show it; (3) real but bad → quality signals + **retraction checks** (Crossref, Retraction Watch); (4) real, good, but wrong *for this person* → the matching problem, which is the actual differentiator.
- **Honesty valve:** when retrieval is thin, say "I didn't find a strong grounded resource for X" rather than smoothing over it. A calibrated "not sure" is worth more than a confident-but-shaky rec.
- **Everything checkable:** link, abstract, and reason on every recommendation, plus a flag button. A miss caught in ten seconds beats a miss that quietly poisons trust.

Bound the corpus. Don't ground "all of science" — nail one transition's curated set first.

---

## 7. Timeline, effort, and the tracker

Three quantities in a triangle: total effort (from the plan), time left (from the stored deadline), and required pace = effort ÷ time.

- **Store a date, not a duration** — a duration is only meaningful relative to when it was entered.
- **Derive the hours, don't ask them.** Nobody knows their weekly bandwidth, but everyone can react to "this takes about 7 hrs/week to finish by your date." Present effort as a *range*, not false precision, and let it *learn* from actual completion times.
- **The tracker is the same triangle re-solved.** As time passes and tasks lag, remaining effort stays high while time shrinks, so required pace climbs. When it crosses what they signed up for, the nudge offers three levers: push the date, cut scope (drop lowest-priority nodes via the matching engine), or add hours.
- **Tone: options, not guilt.** Falling behind is the normal case. Frame every behind-schedule moment as a choice among levers, never "you failed." A tracker that scolds gets abandoned.

---

## 8. Calibration: the collapse mechanic

A resume can't tell whether someone already knows a given node. Rather than quiz them up front (which kills "start fast"), let them correct the plan in place.

"I already know this" on a node marks it **and all its prerequisites** satisfied — the downward closure, because knowing an advanced skill implies its foundations. One tap can clear a whole chain. Then the gap recomputes and the sequence re-sorts, live, in front of them.

Implementation discipline: keep exactly one piece of user state — the set of nodes they clicked. Everything else (gap, sequence, hours, implied clears) is *derived* every render. Restore works for free because "satisfied" is never stored as a hand-edited list. Consider making implied clears *soft* — "we also skipped Probability — add it back?" — since knowing a tool doesn't always mean knowing its foundation.

---

## 9. Live feedback (personalization over time)

Four inputs, split by *what they change*:

- **Add-a-goal (#1)** and **collapse (#4)** *re-solve the plan* — they add or satisfy a node and re-run the traversal. Same engine, controls exposed. Build these first.
- **Feedback (#2)** *improves the product* — but capture *what* was rated, because the same thumbs-down means four different things: on a resource → corpus tagging is off; on a node's placement ("why am I learning this?") → a graph edge is wrong (fix it once, help everyone); "this area is missing" → coverage gap; "too basic / advanced" → difficulty calibration. This is the improvement loop, and it's why the graph is cached — a cached graph can accumulate these fixes.
- **Format & modality (#3)** *re-render* — cheapest, lowest-risk, build last; gated on corpus coverage.

Principle: **feedback must visibly change something.** Collapse a rung → the plan re-sequences right there. A silent feedback form trains people that their input doesn't matter.

Strategic payoff: #1, #2, and #4 are free labeled data for the hardest problem. Every "I already know this," every "why am I learning this," every added skill is your users verifying and extending the graph at scale, in exchange for a better plan. The expertise problem gets solved by the crowd.

---

## 10. Content vs format: who decides what

The one freedom that would destroy the product is letting users choose the *content* — newcomers can't see what they don't know, so they'd skip the hard, necessary things. So:

- **The system owns content:** what's worth learning, the order, and the mastery bar.
- **The user owns habit:** delivery format (video / paper / interactive), validation modality, pace.
- **Validation sits on the seam:** the user picks how a check *looks and feels*; the system decides what *passing it requires*. Otherwise format becomes a backdoor for lowering the content bar.

Capture format preference by watching, not interrogating — one explicit setting they can change anytime, plus behavioral inference. Preference lives beside the traversal as a user-level parameter; it changes what's *shown*, never what's *decided*, so it can't corrupt the content layer.

---

## 11. Reflection & notes (the self-check, without exams)

The mastery check is **self-summary, not quizzes.** Asking someone to write what they learned in their own words is retrieval practice — the same cognitive benefit as a quiz — minus the online-course burden, and it surfaces gaps the moment they can't write the sentence.

- **System provides grounded key takeaways per node** (the content anchor — "here's what actually mattered," drawn from the real material, not the model's memory). **The user writes their own summary** (their consolidation and self-check, comparing what they wrote against what mattered). Same content/format line: system owns "what's important," user owns "what I made of it."
- **Reflection, not a gate.** Notes don't unlock the next node — the sequence stays 100% system-decided. Because passing isn't a thing you can pass, there's no content backdoor. This preserves integrity more cleanly than gating ever could.
- **Invited, never required.** Offer it at natural moments (end of node, end of onboarding), always skippable. Requiring it turns it back into the burden it's meant to avoid.
- **Doubles as the collapse double-check.** "I already know this" → "write one sentence on what it is / how you'd use it." If it comes easily, the collapse stands; if not, that's their own signal to keep it in. No quiz, no course-feel.
- **Accumulates into a personal playbook.** The user finishes onboarding with their own notes and takeaways, keyed to their own path — a keep-able, screenshot-able capstone, and a retention hook. The end-of-onboarding review revisits anything they wrote lightly.

Known trade-off: self-notes give the *learner* a strong signal but the *system* little machine-readable data. That's an acceptable choice — the improvement loop leans on the structured feedback in §9 instead.

---

## 12. Build order

**Prove trust first, on one bounded transition.** The riskiest, least-generic piece is the grounding-plus-matching pipeline. Build the thinnest version — even a script with no UI — prove the recommendations are genuinely good for one transition (software engineer → computational biology is a clean start), *then* wrap UI around it. The form is the easy part; trust is the hard part.

**Stack (fewest moving parts that don't box you in):** Next.js on Vercel (frontend + backend, one deploy). Postgres via Supabase/Neon doing triple duty — relational data, the skill graph (two tables: nodes, edges — no graph DB needed at this scale), and semantic search via pgvector. An auth provider (Supabase Auth / Clerk) that supports the later SSO/orgs model. External literature APIs for grounding. The Anthropic API for select/sequence/explain. A cron job (Vercel Cron / Supabase scheduled functions) for the tracker. Notably absent on purpose: no separate vector DB, no graph DB, no microservices.

**Graph construction:** bound the target → list nodes → draw prerequisite edges (AI-drafted, grounded in real curricula) → encode as two tables → tag a small curated corpus → traverse → validate with real people.

**Feature order:** collapse (#4) → add-a-goal (#1) → structured feedback (#2) → format/modality (#3) → reflection & notes.

---

*The pieces interlock: the timeline feeds the tracker, the collapse feeds calibration and the tracker, feedback feeds the graph, the graph feeds every plan. That interlock is the sign the architecture is right.*
