# LabBridge — Working Diary

A running log of how this project got built: the questions raised, what was wrong, and how we fixed it. Read top to bottom as a story, or skim the bold lines.

*Living document — updated as the work continues.*

## How we worked

A simple loop, repeated: **build a slice → test it like a real user → notice what's off → say it plainly → diagnose → fix → verify → commit.** Almost every good decision here started as a blunt observation ("this is awful," "I don't like that label," "why doesn't it warn me earlier?"). The product got sharp because the questions were honest, not because the first build was right.

---

## Phase 1 — Getting on the map

**Q: "How do I connect this to GitHub?"**
Set up git from scratch — SSH key, first commit, pushed to `ys3508/Labbridge`. Wrote a README from the product proposal so the repo explains itself.

## Phase 2 — Reading the specs, then building the input page

Read the design specs (background, where-you're-headed, goals, timeline) and asked the real question: *does the AI have enough to generate a plan?* Flagged the gaps early (where does the skill graph come from? is the first task real or illustrative?). Then built the 4-section input page + review screen in Next.js — with a **stubbed AI** so the interaction could be tested before spending on real calls. (Had to install Node locally first — the machine had none.)

## Phase 3 — Making it actually understand people

**Q: "I entered a finance background and the keywords are completely wrong."**
The stub was a hand-written keyword list, biased toward life sciences — useless for finance/law/anything else. Swapped it for a **real Claude call** (server-side, key protected). Now it extracts from *any* field. Broadened the whole product past its life-science framing.

**Q: "The field box only knows a few things; typing 'data' shows one option."**
Added a comprehensive field pool, then a **type-ahead for the target role too**, plus **initials matching** ("cs" → Computer Science, "swe" → Software Engineer, "pm" → Product Manager).

## Phase 4 — From an input form to a real plan

**Q: "If I deploy this, can it actually generate onboarding materials?"**
Honest answer: no — it only captured input. Two paths offered; picked **Option A (a quick AI-generated plan)** to see materials end-to-end, then **Option B (a grounded engine)** built in slices:
- **Grounding** — every resource verified real against Open Library / OpenAlex, or an honest gap.
- **Checkers** — an automated pass that flags over-teaching and unreachable first tasks.
- **Web grounding** — courses/docs resolved to real official links.
- **Hard grounding** — "verify-and-drop": never show an unverified resource; retry once for a real alternative.

## Phase 5 — Reading job links honestly

**Q: "I pasted a LinkedIn link, it failed to read it, but it only told me on the final page."**
Two bugs. (1) Links weren't actually read — fixed with a server-side fetch that reads real postings and **honestly fails to a paste box** when a site blocks it (LinkedIn always will). (2) The failure surfaced too late — moved the warning to the **review step, before generating**, and made the button say "Build from background only." Also stopped the header ever showing a raw URL.

## Phase 6 — Sharpening how we ask the model

**Q: "Show me the exact prompt you send — don't clean it up."**
Pasted it verbatim and reviewed it against a sharp checklist (who is this written for? what's the job to be done? does it invent things?). The biggest miss: it never told the model it's writing for a **career-changer who can't yet judge a good path**. Added that, plus per-gap "bridges from your world," and made depth/purpose reshape the plan. Then flipped resources to **retrieval-first**: retrieve and verify a real candidate pool, and the model only *selects and explains* — it can't invent.

**Practical asides that shaped the build:**
- **"Which version am I testing — local or Vercel?"** → Clarified: test on `localhost`; the money is the API calls, not the hosting; keep a public URL private + set a spend cap.
- **"When I paste a resume I have to click out before anything happens."** → Made analysis fire instantly on paste; surfaced **Field and Sector** as their own categories.
- **"I don't like 'Add material' — people will skip it. And 'No resume handy?' makes people skip the manual fields."** → Reframed labels so they invite input instead of causing skips ("Show us what you're aiming at"; "Add more by hand — even if you pasted a resume"). Made the target box accept a broad field *or* a specific role.

## Phase 7 — The big pivot: reading list → interactive course

**Q: "I tested it and the onboarding plan is awful. It's a reading list. My instinct was a personalized, interactive training course."**
This was the turning point. The real product isn't a better set of links — it's **continuity**: tasks, checkpoints, progress. Rebuilt the generator so:
- **Every module ends in a concrete, time-boxed task** that produces a deliverable (a script, a memo, a model), not "read about X."
- **Resources are scoped to that task** — the exact chapter/section needed, or nothing if it's hands-on.
- **The UI is a course** — module cards with the task, a "Done when" check, per-module checkboxes, and a **progress bar that saves on your device**.

**Q: "Tune the task quality further."**
Raised the bar from homework to real work: the tasks now form **one coherent project** (load → clean → analyze → dashboard, each building on the last), mirror the **actual artifacts of the target role**, and each carries a **checkable "done when."**

## Phase 8 — Making the course feel like a job, not a class

**Q: "Here's a review of a real generated plan (MPH epidemiologist → pharma RWE analyst) — fix it."**
A detailed, prioritized critique. Worked through it:
- **The header lied.** It said "Toward Data Scientist" while the whole body was about RWE. Two fixes: the header now prefers a *read job posting's* role over a free-text box that disagrees with it, and the generator is now forbidden to re-categorize the stated role in prose (an "RWE Analyst" never becomes a "Data Scientist"). Same gate applied to dates — no inventing "August 2026" unless the user gave a deadline.
- **Strengths should subtract, not praise.** "You already know X" became "you already know X, *so skip Y*" — the value of onboarding is eliminating redundant learning.
- **Modules became assignments, not lessons.** Each task now starts from a stakeholder request ("your medical team asks…"), *hands* you named inputs ("you're given claims_extract.csv") instead of telling you to go find data, and names **who consumes the output** (Medical/Regulatory/Business).
- **The capstone became a 30-60-90.** The old "first contribution" was a graduation project mislabeled as week-one work — and it referenced module outputs that didn't exist yet. Now it's a staged **90-day readiness project** (reproduce → modify → own), which comes *after* the modules, so the logic is coherent.
- **Resources justify themselves.** Each pick now states the gap it closes, the exact part to read, and what to skip — a decision, not a bibliography.

## Phase 9 — The reframe: from "AI learning-path" to "enterprise onboarding"

**Q: "Here's a spec to reposition the whole thing as career-transition + enterprise onboarding, and re-architect the layout to lead with value."**
The organizing frame the Phase-8 fixes were reaching toward. Two coupled changes:
- **A new prompt spine.** The generator now designs "how a new hire becomes productive," on an explicit 7-step backbone: transferable skills (→ what to *skip*) → job-critical gaps only → map each gap to a real responsibility → manager-assigned tasks with given inputs → deliverable + success criteria → a staged **observe → assist → own** arc → an independent contribution at the end.
- **The horizon is now DERIVED, not hard-coded.** The old "30-60-90" was a lie when someone had a 3-week runway. Now: a deadline *is* the horizon (phases compress to fit), a weekly pace derives one, and only an open-ended plan falls back to a goal-based default — shown as a correctable assumption, never silently asserted.
- **Layout inverted to lead with value.** The page used to open with two long assessment lists and bury the course. Now: a value-first **hook** → the **course, featured** as the center of gravity → the **independent-contribution** capstone → and the assessment + self-check **collapsed** below as verification drawers ("expand to see the reasoning"). The self-check is now failures-only and quiet by default, not a wall of "cannot confirm" hedges.

The principle: *lead with value, defer verification.* The course earns the spotlight because Phase 8 made each module a real assignment worth featuring.

**Snag: "Plan generation failed."** The richer schema (hook + per-task stakeholders + staged arc) overflowed the 4096-token output cap, cutting the JSON off mid-string so it wouldn't parse. Raised the cap to 8192 and added a clear "plan too long" guard if it ever hits the ceiling again.

## Phase 10 — Shift 1: modules become containers, not pointers

**Q: "Turn each module from a pointer into a container — it should teach the concept before it asks me to work."**
The plan's weak spot: a module was `topic → task → link`, so the actual learning happened off-page (or not at all). Rebuilt each module into a self-contained learning object:
- **Teach first.** Every module now carries a **concept** (120–220 words in the learner's terms, with key-term glosses and a "common trap"), a **worked example** built on a *tiny named object* (one patient, three rows), then the assignment. You shouldn't need to leave the page to understand the idea.
- **The assignment got realer.** Explicit **manager request** ("Your RWE lead says…") and **given inputs** (a named file/ticket you're handed), plus a practical **self-check** (checkable criteria + red flags) — "another analyst can reproduce your counts," not "you feel confident."
- **Resources demoted to backup.** "For this task" → "Supporting reference — use only if you want backup." The container is the product; the link is a safety net.
- **Facts vs fluency guard.** Now that we generate teaching prose, a rule keeps it from inventing precise clinical/coding/regulatory specifics — teach the general shape, never fabricate a threshold as fact.
- **Deadline fidelity.** A test showed the model transforming `2026-08-07` into `2026-08-27` in a phase label. Fixed at the root: the **UI owns the factual deadline** (renders it verbatim), and the model only supplies *relative* phase windows ("Weeks 1–2") — it can no longer touch the date.
- **Bumped output budget to 16k tokens** (the container plan is far larger) and reset expectations to ~1–2 min.

Still ahead in this shift (not yet built): a static module-quality checker (banned phrases, min lengths) and golden regression fixtures.

## Phase 11 — A second agent joins

**Q: "I want to let Codex work with you together."**
Set up the repo for two AI agents working in parallel without colliding:
- **`AGENTS.md`** — Codex's instruction file (the way Claude reads context), capturing the stack, the Claude-API conventions that bite (models, `output_config` structured output, no `effort` on Haiku, `max_tokens` sizing), the retrieval-first pipeline, the non-negotiable product rules (grounding, facts-vs-fluency, fidelity), and the "keep JOURNEY updated" habit.
- **`TASKS.md`** — a lane split so we don't edit the same files: Claude keeps the high-churn prompt/render/checkers; Codex starts on mostly-new files (the static module-quality checker, golden fixtures, grounding hardening).
- **Branch discipline** — each agent on its own branch, `main` integration-only, rebase before push, worktrees for true parallelism.
- **Codex reviewed the setup and agreed**, adding two rules we made explicit: check file ownership before editing (propose, don't sneak "small helpful changes"), and no agent merges its own branch — Claude reviews Codex's work for product-rule alignment first, with Sissi as final decision-maker.

## Phase 12 — Making the richer modules easier to read

**Q: "Shift 1 is working, but the page feels dense — can one module feel lighter without losing substance?"**
Codex temporarily crossed into the PlanView lane at Sissi's request and polished the module presentation:
- **Labels got warmer.** "Concept" became **"Core idea"** and "Worked example" became **"See it in practice"** so the section rhythm feels less academic.
- **Module hierarchy got clearer.** Each content type now sits in a lighter, reusable panel; the capability title is stronger, the background bridge is a quiet callout, and assignment/self-check sections breathe more.
- **References stopped competing with the lesson.** Supporting resources are collapsed by default and described as optional backup, keeping the embedded teaching container as the main product.

The principle: after Shift 1 made the content smarter, the UI needed breathing room — not a new architecture, just clearer hierarchy and less visual competition.

---

## Where it stands

Input (real extraction, honest job-link reading) → a **task-driven course** whose resources are real and scoped, whose plan is self-checked, and whose progress you can track. It degrades to honesty, never to fiction.

## What's still ahead

- **Cross-session memory** — so the course *remembers* completed work and deliverables across visits (needs accounts + a backend). This is what makes it sticky.
- **The skill graph** — make prerequisite *ordering* code-verified, not model-judged.
- **Deploy** — ship a shareable link (rotate the key, set a spend cap first).

## Architecture at a glance

The flow, once you click **Build my plan**:

```
input  → /api/plan         structure only: strengths, gaps, task-modules, capstone
       → /api/candidates   propose canonical titles → verify against catalogs
       → /api/select       pick task-relevant resources, scoped to the exact section
       → /api/augment-web   thin modules only: one official doc/course via web search
       → /api/check         over-teaching + first-task-viability supervisors
```

**API routes** (all server-side; the API key never reaches the browser):
`analyze` (resume → skills+evidence, field, sector) · `classify` (artifact type) · `read-link` (fetch/parse a job URL or honestly fail; extract fields) · `focus` (review-screen phrase) · `plan` (course structure) · `candidates` / `select` / `augment-web` (retrieval-first resources) · `check` (plan self-check).

**Key files:**
- `app/page.js` — input flow + form state
- `components/` — `BackgroundSection`, `HeadedSection`, `GoalsSection`, `TimelineSection`, `ReviewScreen`, `PlanView`
- `lib/ai.js` — Anthropic client + model constants (`MODEL` = Haiku for cheap calls, `PLAN_MODEL` = Opus for plan/select)
- `lib/verify.js` — resource verification (Open Library, OpenAlex, web search)
- `lib/constants.js` — pools, options, and the `WEB_AUGMENT` toggle

**Knobs:** `WEB_AUGMENT = false` (in `lib/constants.js`) for fast/cheap runs · swap `MODEL`/`PLAN_MODEL` to trade cost vs. quality · `ANTHROPIC_API_KEY` lives in `.env.local` (gitignored).

## The one-line takeaway

The product got good because it got tested honestly and the problems got named plainly. Keep doing that.
