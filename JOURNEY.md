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

**Follow-up: "It still feels like studying, not doing the job."**
The page shifted from an all-at-once course list toward a **project workspace**:
- The long hook became a compact mission brief: already-strong skills, what still needs learning, and the concrete mission.
- The course list became **one active task at a time**, with task navigation and previous/next controls, so the learner moves through sessions instead of staring at the whole plan.
- Each task now exposes a visible **deliverable artifact** and a lightweight workspace strip (notes, draft, checklist, deliverable), reinforcing that the output accumulates into a project folder.
- Supporting references were renamed to **"Need another explanation?"** so they feel like backup help, not the center of the experience.
- A tiny "Before you start" check gives the learner an immediate win before the lesson begins.

The principle sharpened: LabBridge should help users complete work artifacts, not merely consume a personalized course.

**Second follow-up: "The workspace is better, but it still teaches before making me try."**
The task screen now leads with doing:
- **Assignment first.** The learner sees the job request, deliverable, draft box, steps, and checklist before the explanation.
- **Help is revealed when needed.** Core idea, worked example, and outside references moved behind a "Stuck?" drawer so the default experience is try → get help, not read → maybe act.
- **The sidebar became persistent.** Project files and the AI mentor sit beside the active task on desktop, so it feels like one project workspace rather than disconnected pages.
- **Deliverables feel more real.** Each task has an "Open" affordance, draft notes, and a completion reward that says the artifact was added to the project.

The product direction is now clearer: AI should behave like an onboarding manager watching the work, not a one-time course generator.

**Third follow-up: "Make this a generic learning engine, not an RWE-specific course."**
The branch now encodes the product architecture explicitly:
- **Workspace layer first.** The plan view widens into a project workspace with a persistent sidebar, project files, deliverables, draft notes, task progress, and an AI mentor entry point.
- **Horizontal overflow fixed at the source.** The wider workspace briefly exposed a browser-specific failure mode: long generated artifact filenames could overflow their cards, and an older `100vw` wrapper could leave Chromium preserving a stale horizontal scroll offset. The root wrapper now uses normal centered max-width layout, long filenames break instead of widening panels, the page clips accidental x-overflow, and the workspace resets stale `scrollLeft` to zero on mount.
- **Learning layer second.** Explanations are no longer the default body of the page; they live behind a task-linked learning layer with pages for mental model, example, mentor, and extra help.
- **Project-first generation.** The plan prompt now tells Claude to generate project tasks first, then only the concepts required for the current deliverable. Concepts are capped to Slack-message length (80–150 words) instead of mini essays.
- **Generic engine framing.** The prompt describes the pipeline as role/project/company/background → tasks → skills → gaps → learning layer → deliverables, so it should work across domains rather than hard-coding RWE-like chapters.

**Fourth follow-up: "Make the learning layer progressive, not a long document."**
The active task now behaves like a sequence of **Moments** rather than a scrollable lesson:
- **One objective per screen.** A task moves through Mission → Question → Mental model → Visual → Example → Practice → AI coaching → Apply to project. Each Moment shows only what the learner needs at that point.
- **The learner tries earlier.** The first decision appears before the explanation, then the concept, visual, and example unlock progressively.
- **Project workspace stays persistent.** The sidebar still holds the project files and mentor entry point, while the main panel behaves like a guided onboarding flow instead of an article.
- **Completion becomes artifact-driven.** The final Moment asks the user to add draft notes/deliverable work to the project, then marks the task complete.

The principle: the user is not completing a course. They are completing the artifacts expected from a real first assignment, with adaptive learning and AI mentorship wrapped around the work.

---

## Phase 13 — Moments: a manager beside you, not a lesson

**Q (Sissi, brainstormed with Codex): "Moments should feel less like pages of a lesson and more like a manager walking beside you while you produce one work artifact."**
We turned that into a **Moment grammar** — a fixed rhythm with variable length: `Brief → Question → Model → Visual → Practice → Coach → Artifact → Reward`. Rules we agreed on (all three of us):
- **Code assembles the flow, the model never chooses it.** Always-on beats (Brief, Coach, Artifact, Reward) plus conditional ones (Question/Model/Visual/Practice) that appear only when a task has that content — 4–8 moments per task, deterministically.
- **Coach is honest by construction.** No fake AI: it's a self-check the user *ticks* against the criteria, with a "Watch for" list and a plain note that real AI review is coming later. The future `/api/coach` slots in above it without pretending now.
- **Reward reads live state** — the ticked count and the saved draft feed the payoff ("Self-check: 2/3 confirmed · memo added · Next: …"), so progress is earned, not a canned banner.
- Along the way: restored the personalized **hook** (generated but not shown), un-truncated the taught concept, added a per-task **comprehension question**, and cut the fake-AI mentor panel.

Built and verified entirely **offline in mock mode** (`?mock=1`) — zero API — while the balance was unpaid. We also stood up that mock mode (a fetch interceptor + canned data) so the whole app runs without spending, and settled a standing working rhythm: **Claude/CC writes specs, acceptance criteria, and reviews product fit; Codex executes code changes, verification, cleanup, and implementation tasks.** Codex should keep future implementation notes in `JOURNEY.md` so later agents can see what changed, why it changed, and how it was verified.

**Codex cleanup pass from CC's handoff.**
CC handed off `revise/handoff-to-codex.md`; Codex executed item A only: removed obsolete `PlanView` helpers left behind by earlier learning-layer iterations (`QuickWin`, `LearningLayer`, `CoachChecklist`, `WorkPath`, `FlowBox`, `FlowArrow`, `ModulePanel`, `SubLabel`). This was pure dead-code removal — no Moment behavior changed. Verified by grep (no definitions/references remain) and an offline browser smoke test at `?mock=1`: Brief → Question → Model → Visual → Practice → Coach → Artifact → Reward all rendered with no console errors.

**Task navigation became earned state.**
Codex implemented CC's `revise/task-navigation-spec.md`: removed the competing TaskPager, made Reward the forward-navigation engine, persisted per-task Moment position / Coach ticks / draft notes under plan-scoped localStorage keys, and upgraded the sidebar into a real project map with complete, in-progress, future, and capstone states. Future tasks and the readiness project are dimmed-but-openable with inline "start anyway" nudges, not locks. Mock mode now reopens directly into the workspace after refresh so offline resume behavior can be verified without API calls. Verified in `?mock=1` against the spec's 9 acceptance criteria: Task 1 Reward advanced to Task 2 and marked progress, Task 2 resumed at Coach after switching and refresh, draft text persisted, Task 3 showed the future-task confirm and honored Start anyway, the capstone queue item scrolled to the independent contribution card, and no console errors appeared.

**Page hierarchy became weight-based instead of document-like.**
Codex implemented CC's `revise/page-hierarchy-spec.md`: the top brief is now only the hook, a "Your mission" north-star sentence, compact strengths/gaps chips, and the existing quiet goal chips. The old two-column strengths/gaps and duplicated mission box left the opening, while the full strengths/gaps detail remains available inside the collapsed reasoning drawer. The workspace card now has the strongest visual treatment so it reads as the main product surface, and the timeline/pace note moved into "Your independent contribution" instead of floating as a standalone paragraph. Added optional `northStar` to the plan schema and mock mode, with a UI fallback to the first task when old plans do not include it.

**The plan view became a single-surface workspace.**
After Sissi rejected the remaining five stacked sections, Codex implemented `revise/single-surface-workspace-spec.md`: the briefing is now a first-arrival doorway keyed by `lb_briefed_<planKey>`, and the workspace becomes home after entry/refresh. The workspace no longer renders contribution, reasoning, self-check, or payload utilities as stacked sections below it. The readiness project now opens from the queue into the main stage, while "Why this plan?" opens a right-side drawer containing the full strengths/gaps reasoning plus the plan self-check result. Back-to-edit and payload inspection moved into the drawer footer, and blocked job-link honesty remains visible as full briefing copy plus a compact dismissible workspace banner. Verified by production build and mock-mode browser smoke test.

**The project folder became earned artifact state.**
Codex implemented `revise/sidebar-workspace-spec.md` inside the single-surface shell: sidebar files now show honest artifact states (`○ outlined`, `● draft`, `✓ final`) derived from persisted drafts and completion state. Clicking a non-future file opens an inline draft preview with `Continue →` / `Reopen →`; future tasks still show the existing start-anyway confirmation. The folder now exports a zero-API Markdown project via a real `download` link once any draft exists, with empty artifacts written honestly as `_Not written yet._`, and the footer ties files to the readiness project. Verified in `?mock=1` by fresh-origin browser checks, draft persistence, preview behavior, Reward completion, future gating, export href contents, no console errors, and no horizontal overflow. Per the preview-harness rule, Codex did not run `npm run build` while the dev server was active.

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
