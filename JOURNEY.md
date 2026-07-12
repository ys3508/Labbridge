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

**Progress now measures files built and gaps closed.**
Codex implemented `revise/progress-states-spec.md`: the workspace header no longer shows a percent and now says `{N} of {M} project files built`, with one segment per task. Segments can tint for saved moment/draft activity, but the counted number only changes through Reward completion. To enforce that honesty rule, the old task-header manual done toggle was removed; completion now flows through `markDone` from Reward only. The mock/schema gained optional `closesGapIndex`, and the Briefing gap chips flip from `□` to `✓` only when every mapped task for that gap is in `done`; old plans without mappings remain static. When all tasks are complete, the header hands off to readiness: `All {N} files built — your readiness project is open ★`. Verified in mock mode without running `npm run build`: all-done restore, closed-gap Briefing, no manual mark-done button, no percent in the workspace header, mobile no-overflow, and no console errors.

**Completion rewards now say the earned state out loud.**
Codex implemented `revise/completion-rewards-spec.md` items A–E only; item F remains parked with no socket, stub, or fake manager reaction. Reward now computes `doneAsIf = done ∪ currentTask` so it can show the exact moment a mapped knowledge gap closes, then the final task adds a before/after mirror built from `knowledgeGaps` and real deliverable filenames. Readiness now prepends a handoff memo only after all tasks are done, with real draft/file/gap counts and a shared zero-API Markdown download link. The project-folder export label now carries live draft/word counts, and workspace reloads can show a quiet welcome-back line derived from persisted moments/drafts/done state. Verified in mock mode without running `npm run build`: final mirror, handoff memo/download, heavy export label, no F/coach output, mobile no-overflow, and no console errors; fresh/early/fallback reward guards were verified by code path because the browser runtime does not expose localStorage reset.

**Artifacts became individually portable.**
Codex implemented `revise/artifact-experience-spec.md`: draft edits now write a plan-scoped `lb_draftmeta_<planKey>` timestamp, file cards append an honest "edited {date}" label only after a real edit, and file previews show the fuller last-edited date/time. Non-empty previews now expose a real zero-API Markdown download for that single artifact (`# filename` plus the user's draft); empty files still show the existing empty state and no per-file link. The whole-project export path was left untouched. Verified in `?mock=1`: data-URL per-file download decoded to the file header plus draft verbatim, empty files showed no link, edited labels survived refresh, a second edit updated the visible timestamp, and no console errors appeared.

**Claude stepped into the implementation seat (Codex hit its rate limit).**
With Codex rate-limited, Claude implemented §1–3 + §5 of `revise/remaining-before-visual-spec.md` (Codex had gotten one uncommitted edit in — the banner copy — which is included):
- **Demo mode is now a product feature** — "Or explore a sample plan →" on the input page; the banner reads "Sample plan — explore freely · exit sample" instead of dev-speak. Zero API end-to-end.
- **Sample coaching (demo-gated)** — the Coach beat gains a labeled "not AI" canned-coaching panel, replies templated over real state (draft length, first unticked criterion, key terms). Renders nothing in the real flow; it's the `/api/coach` UX socket.
- **A11y semantics** — ←/→ walk the moments (skipping inputs/dialogs), Escape closes drawer and file preview with focus returned to the trigger, focus trap in the drawer, `aria-current`/`aria-expanded`/`role="progressbar"` where they belong. (One catch during verification: focus-return via rAF lost the race with React's re-render — fixed with a small timeout.)
- **Honest Retry** — plan-generation failure now offers a Retry button (user-initiated, never automatic — each retry is a paid call).
Roles reverse for review: Codex reviews this when its limit resets.

**Housekeeping before the paint: lint, honest docs, and a second persona.**
Three closers before the layout/visual passes: (1) **ESLint** configured (`next/core-web-vitals`; the one purely stylistic rule off) — the codebase was already clean. (2) **The docs stopped lying** — README rewritten from the Phase-1 proposal era to the actual product (workspace, moments, demo mode, principles), AGENTS.md's architecture refreshed, TASKS.md board rebuilt, this diary's tail updated. (3) **A second demo persona** — consultant → growth equity, switchable from the demo banner — whose third task is deliberately *thin*: it proved the variable-inclusion path live for the first time (6 moments instead of 8, no resources, honest hands-on state). Codex review waived by Sissi (out of credits); merged on her authority.

**The layout foundation: discipline before paint.**
Claude implemented `revise/layout-foundation-spec.md` — the zero-behavior pass that readies the skeleton for visual design: 6 named type roles replace every ad-hoc bracket size (reading content now speaks at 16px with a ~65ch measure; chrome stays small), spacing snapped to three tiers, counters in tabular-nums, `prefers-reduced-motion` respected. The big one: a desktop **app shell** — the page body no longer scrolls at all (scrollHeight == viewport, measured); the sidebar and moment stage scroll independently while the header stays put. Mobile keeps normal page scroll. Two real bugs fixed en route: the moment dots were ~6px tall (untappable — now 40px hit areas with the small visual dot inside), and a sneaky one — `.fade-up`'s retained `translateY(0)` transform made the workspace the containing block for `position:fixed`, silently clipping the drawer 16px off the viewport edges; releasing the transform after the animation (`backwards` fill) makes the mobile drawer a true full-screen sheet. Verified by measurement in `?mock=1`, zero API; behavior smoke intact.

**The visual pass: calm analyst workspace, and the palette now enforces honesty.**
Claude implemented `revise/visual-design-spec.md` — the final pass. The ground is a flat warm off-white (the decorative radial gradient and the workspace emphasis gradient are gone — surfaces earn dominance by being the most solid white on the page). The ink ramp was darkened so every text tier clears WCAG AA (ink-faint was 2.9:1 — now 4.6:1, measured). The **briefing hook renders in a system serif** — day one reads like a letter from your manager, then the workspace snaps to clean UI type; zero font downloads. The Moment vocabulary went to work language: **Brief · Check · Model · Example · Try · Coach · Draft · Wrap** (display strings only; saved progress is index-based and survives untouched). The draft area became a small **document** (mono filename strip, real Saved · N words meta) — and the restyle flushed out two unearned-state relics: a dead "Open →" button and a hardcoded checklist whose first item was always ✓. The Wrap beat is now a **work receipt** (line items, no banner energy), a keyboard **focus ring** landed globally, and the unused DoneReward component went with the rest. Verified in `?mock=1` by computed style: serif on the hook, exact ground color, zero gradient classes, contrast ratios, receipt + editor rendering, behaviors intact, no console errors.

**Q (Sissi): "You sure you finished visual design? It's all the same."**
She was right at the impression level — the first token values were too timid (#faf9f7 ground vs the old #fbfcfd is a difference of nothing). Amplified: the ground went to a genuinely warm paper (#f4f1ea, all text tiers re-measured AA on it), and the briefing letter got display size. Now the white workspace visibly floats on warm paper and the page reads as designed, not just re-tokened. Lesson recorded: a visual pass must pass the squint test, not just the acceptance criteria.

**Deploy-ready morning: CI, a no-key story, and a green production build.**
Zero-API closers for shipping a public demo: a GitHub Action now runs lint + the checker/fixture smoke (`npm run check`) + a production build on every push — a safety net for both agents. When plan generation fails (e.g. a deploy with no API key on purpose), the error now offers "explore a sample plan →" so a public visitor lands somewhere real instead of a dead end. `npm run build` verified clean (87 kB first load). The play: deploy to Vercel with NO `ANTHROPIC_API_KEY` set — the demo works fully for anyone, real generation degrades honestly, and the spend risk is exactly zero.

**Q (Sissi, annotated screenshot): "The briefing wording loses people. I want a roadmap — show users they can do whatever they want as long as they follow it. And 'tell us what you already know' has nowhere to tell us anything."**
Three catches in one review — including a genuine honesty bug (copy inviting an action the UI didn't offer) that both agents had missed. The briefing was rebuilt around her confidence framing — *confidence is a conclusion the user draws when the road looks short, walkable, and already begun*:
- **The road starts behind you**: a green "You today" node listing real transferable strengths — you're partway down the road before reading a word.
- **The whole road, priced**: "3 stops · ~9–12 hrs of hands-on work · your ~4-week runway" — all real numbers (timeboxes summed honestly; if any timebox can't parse, the hour math is omitted rather than faked).
- **Stops are capabilities with receipts**: each shows its price chip, its bridge line ("same instinct as…"), and the mono filename you'll walk away holding. The ★ destination is the role itself.
- **"I already know this" trims the road live** — totals shrink on click, trims persist, and the note stays honest: the leaner plan regenerates only when the live model is funded; nothing is silently dropped from the workspace meanwhile.
- **The CTA got priced**: "Enter your workspace →" became "Start your first stop — 3–4 hours →". You don't ask for a journey; you ask for one small, priced step.
The serif letter demoted to a small supporting line (her font critique), and the dead invitation now points at the real toggles. MissionBrief/BriefChip retired. Verified live in the demo, zero API.

**Q (Sissi, second annotated pass): "Too many words still. The filenames — no one can read 01_a_one_page. And write down everything we talked about but never did."**
Plus she caught a shipped bug: literal `\u201c` rendering in the beginner note (an escaping slip). All fixed: filenames now slug the task TITLE's meaningful words (`01_data_orientation_memo.pdf`, not `01_a_one_page_memo_tables_present_grain_of_ea.csv`), extensions key off the title only, the hook shows one sentence, per-stop bridge lines left the roadmap (it's a map, not prose), and TASKS.md gained **the honest ledger** — every discussed-but-never-built item with dates, split by what blocks it. She also brought the first real validation source (IQVIA's RWE getting-started primer); the coverage triangulation lives in `revise/validation-notes.md` — two real findings (lifecycle context thin, common-data-model absent), both queued for live-model validation.
**Third pass: "why do you need to show filenames here???"** — right again. The file chips on the roadmap (Claude's "receipt" idea) read as technical noise to someone who hasn't met the workspace folder yet. Removed; each stop is now one scannable line (capability · price · trim toggle), and the file metaphor stays where it's taught — inside the workspace.

**Q (Sissi): "For explorers ('career move' / 'just curious'), get LinkedIn authorization and automatically find people they might know in the target field."**
The instinct was right — explorers need humans more than curricula — but the implementation was impossible: LinkedIn's API doesn't expose network data to products like ours, and the scraping route is litigated ToS territory that would poison the trust brand. Built the honesty-feasible version instead (`revise/talk-to-humans-spec.md`): a purpose-gated **"Talk to humans" stop** where the model writes the words (personalized archetypes, outreach drafts in the user's own voice, search query strings) and the **code builds the URLs** (legit LinkedIn people-search links — the user searches inside their own account; nothing is ever sent for them). The stop doubles as plan validation: an explorer's two informational interviews test the field AND our plan against a real practitioner. Mocked live in the growth-equity persona (now a truer story: a consultant *exploring* the move), stop 2 of 4, with the honest footnote under the search buttons.

**Q (Sissi): "I don't want you hand-writing the plan — there's no meaning in validating that. Here's the same persona through raw Claude and ChatGPT. What do we learn?" (and: "RWE is just an example, right? Changes must be universal.")**
The competitive read was humbling and useful: the Claude one-shot out-taught our sample (practitioner traps, ask-your-manager questions, a compliance rule, self-falsification steps, real calendar weeks), while ChatGPT's curriculum independently confirmed the IQVIA lifecycle-orientation gap. Both lack everything around the words: verification, state, artifacts, control, guarantees. Absorbed the lessons into the contract as FIELD-AGNOSTIC patterns (her explicit check): **askYourTeam** (fidelity turned into action — the questions no plan can know, adapted per field), **traps[]** (2-4 practitioner mistakes per module), **flagged conventions** (teach the common threshold, marked confirm-locally, instead of omitting), a **self-falsification step** in later modules, the **canonical-artifact review** pattern (read one verified public artifact — connects the resource layer to a task), a hardened **orientation requirement**, functional cap 4-6 (trims as the pressure valve), and **UI-computed calendar spans** from the user's real deadline (the model stays relative; the app prints the dates). Both demo personas carry the new fields — the growth-equity ones wrote just as naturally as the RWE ones, which was the universality test passing. Comparisons recorded as #2 and #3 in `revise/validation-notes.md`.

**Q (Sissi, task-1 screenshots): "How can a user know it without you feeding them useful information? Zero background, zero explanation — basically I don't like the plans."**
She was right, and the receipts made it worse: her ORIGINAL moments vision had teaching at position 2 and the quiz at position 4 — the build drifted to quiz-at-2 chasing the "generation effect," which for a real career-changer reads as a test about words nobody defined. Three fixes: (1) a new **`context`** field — 60-120 words of plain-language scene-setting a total newcomer needs, rendered FIRST in the Brief before the manager's ask (the speech a real manager gives before handing anyone a task); (2) **the order restored to hers**: Brief → Model → Example → Check → Try → Coach → Draft → Wrap — the question now tests whether the idea landed, after it was taught; (3) **teaching budget raised** (concept 80-150 → 150-250 words) — the live model will fill it; the mock stays lighter than the contract demands. All seven demo modules across both personas got hand-written contexts as the pattern proof. Lesson logged: when the builder's pedagogy theory and the designer's original instinct disagree, test with first-time eyes before shipping the theory.

**Q (Sissi): "The workspace should feel private — 沉浸式学习, no distraction. Too many progress bars. And embed a learning toolbox (notes / screenshot / chatbot / 模拟软件)."**
Two features, one philosophy — subtract the chrome, add quiet help:
- **Focus mode, automatic.** Entering a task's moments collapses everything non-essential: the sidebar disappears, the header becomes one line (☰ Workspace · task title · 1/3), the four redundant progress indicators reduce to a hairline + tiny count, the dots hide, and the stage centers at reading width. Wrap or ☰ restores the full workspace — the folder is for *between* tasks. (She counted four progress indicators on one screen; she was right.)
- **The Toolbox** — a slim rail that survives focus mode, opening overlays so help never navigates away: **Notes** (per-task thinking space, separate from the Draft, persisted, exported with the project under `### Notes`), **Glossary** (every keyTerm in the plan, searchable — instant "what did that word mean?" with zero AI), **Snapshot** (her "screenshot," honest mechanics: captures the current moment's content into Notes with a 📌 reference — no browser permission circus), and **Coach** (the demo's sample coaching moved here from the Coach beat; in real mode the icon doesn't render until `/api/coach` exists — no dead buttons). 模拟软件 (the interactive worked-example table) parked on the ledger pending structured rows from the live model.
All verified live: auto-focus on entry, notes persist and ride the export, glossary search hits, snapshot appends, ☰ restores.
**Follow-up: "why so much empty space around the workspace?"** — Claude had capped the focused *container* at reading width instead of just the paragraphs (which already carry their own measure), leaving a white card floating inside a white card. Fixed: in focus the outer shell dissolves entirely — borderless slim header on the ground, zero padding ring, the moment card as the single surface at a wider column. The work owns the screen now. One process note: two of the day's python patch scripts died mid-run and silently discarded their in-memory edits — caught both times by post-write boolean checks, which are now the habit.

**Q (Sissi): "Can I insert YouTube tutorial videos — legally, without paying?"**
Yes — through the one sanctioned door: YouTube's official embeddable player (their ToS explicitly permits it; creators who object can disable it per-video). The don'ts stay dont's: no re-hosting, no ad-stripping, no transcribing videos into "our" teaching. Product-wise, videos became just another **verified resource kind**: YouTube's keyless oEmbed endpoint confirms a video exists and returns its true title/channel — verify-and-drop for video, at zero cost. Her first find ("What is Real-World Evidence?", AbbVie) was oEmbed-verified live and now plays **inside the moment** via the privacy-mode (nocookie) player — watch without leaving, exactly the 沉浸式 direction. Fixing the resource layer also settled an older debt she'd exposed: the demo's two placeholder resources (invented catalog IDs wearing real ✓ badges) were replaced with live-verified OpenAlex papers (Funk 2014 on claims misclassification; the RECORD reporting statement). No resource in the demo is fake anymore. Live-pipeline video search goes on the API-day ledger.

**Q (Sissi): "When we put papers, can we cite the most important information so users get it right away?"**
Yes — with one honest rule: **cite from fetched text, never from memory** (a model "summarizing" a paper it hasn't read is hallucination with a citation attached). Resources gained a `keyPoint`: 1-2 sentences quoted VERBATIM from the paper's abstract (OpenAlex serves abstracts free), attributed "— from the abstract," under the use note. The live fetch demonstrated the rule immediately: the RECORD statement has an abstract → it got a real quoted key point; Funk 2014 has no abstract in OpenAlex → it honestly got none. At API day the select stage fetches abstracts and Haiku picks the task-relevant sentences verbatim (ledger). Verify-and-drop now extends to citations.

**Q (Sissi): "What actually costs API? If I scroll around a generated plan, does that bill?" — then she topped up.**
Mapped every action to its cost (scrolling/working in a plan = free forever; building = ~$0.35-0.50; each settled resume edit = a small Haiku call) — and the audit found a real spend trap: **the plan lived only in memory, so every page refresh re-billed a full Opus generation.** Shipped the armor before her first paid run: a **generation cache** — plan + resources + self-check stored in localStorage keyed by an input hash. Same inputs → the paid plan loads instantly, free; changed inputs or Retry → fresh generation, cache overwritten; demo mode bypasses (personas share an empty form and would collide). Also flipped `WEB_AUGMENT` off for validation economy. Pay once per plan; own it.
**Follow-up: "can you make it save this time's plan?"** — the cache was already live, but her phrasing exposed the missing half: the cache keeps a plan *in the browser*; it doesn't give you a *file*. Added **"Download this plan (.md)"** to the Why-this-plan drawer — the full generated plan (mission, strengths/gaps, every task's context/concept/traps/example/check/assignment/ask-your-team/self-check, the readiness arc) as portable markdown. A paid plan is now savable, shareable, and reviewable outside the app — exactly what validation day needs.

---

## Where it stands

Input (real extraction, honest job-link reading) → a **single-surface onboarding workspace**: a briefing doorway, manager-assigned tasks walked as Moments, drafts accumulating as real files (states, timestamps, downloads), earned-only progress, and a derived-horizon readiness arc. A zero-API **demo mode** shows the whole thing to anyone. It degrades to honesty, never to fiction — and the palette spec now literally encodes that rule.

## What's still ahead

- **Layout foundation → visual design** — the two specced passes that dress the finished skeleton (`revise/layout-foundation-spec.md`, `revise/visual-design-spec.md`).
- **When the API balance returns** — verify the model actually writes good `northStar` / `comprehensionCheck` / `closesGapIndex`; build `/api/coach` into the waiting sockets (the Coach panel and the parked manager's-reaction reward).
- **Cross-session memory** — accounts + a backend, so the workspace remembers you across devices. The stickiness play.
- **The skill graph** — code-verified prerequisite ordering.
- **Deploy** — rotate the key, set a spend cap, ship a link.

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
- `components/MockGate.js` + `lib/mockResponses.js` — demo mode (zero API)
- `lib/moduleCheck.js` + `fixtures/` — static plan-quality checker + golden inputs
- `lib/constants.js` — pools, options, and the `WEB_AUGMENT` toggle

**Knobs:** `WEB_AUGMENT = false` (in `lib/constants.js`) for fast/cheap runs · swap `MODEL`/`PLAN_MODEL` to trade cost vs. quality · `ANTHROPIC_API_KEY` lives in `.env.local` (gitignored).

## The one-line takeaway

The product got good because it got tested honestly and the problems got named plainly. Keep doing that.
