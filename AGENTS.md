# AGENTS.md — working guide for AI agents on LabBridge

This repo is worked by **two agents in parallel**: Claude (Claude Code) and Codex.
Read this before touching anything. It mirrors the conventions Claude follows so
we produce one coherent codebase, not two. See **`TASKS.md`** for who owns what
right now, and **`JOURNEY.md`** for the running story of how we got here.

---

## What LabBridge is

A personalized **enterprise-onboarding plan generator** for career-changers. You
give it a background (resume), a target (role / job posting), goals, and a
timeline; it generates a **single-surface onboarding workspace**: a full-screen
briefing (the doorway), then a workspace where 3-4 manager-assigned tasks are
each walked as **Moments** (Brief → Question → Model → Example → Practice →
Coach → Draft → Reward), drafts accumulate as files in a project folder
(honest states, timestamps, Markdown export), and a staged Observe→Assist→Own
capstone lands on a derived horizon. A zero-API **demo mode** (`?mock=1`, or
the "explore a sample plan" link) runs the whole app on canned data.

Positioning: **career transition + enterprise onboarding**, not "AI learning-path
generator." That framing is intentional — keep output in that voice.

## Stack

- **Next.js 14.2.15**, App Router. **React 18**. **Tailwind 3.4**.
- **Plain JavaScript — no TypeScript.** Do not introduce `.ts`/`.tsx` or type
  annotations. Match the surrounding style (it's the source of truth).
- **Anthropic SDK only** (`@anthropic-ai/sdk` ^0.110). This is a Claude app.
  Do **not** add OpenAI/other LLM SDKs or provider-neutral shims, even though
  Codex is an OpenAI tool — the product runs on Claude.

## Claude API conventions (get these right — they bite)

- Models live in `lib/ai.js`: `MODEL = "claude-haiku-4-5"` (cheap, high-frequency
  calls — analyze/classify/focus/candidates) and `PLAN_MODEL = "claude-opus-4-8"`
  (plan / select / check). Don't hard-code model strings elsewhere; import these.
- **Structured output** is done with `output_config: { format: { type: "json_schema", schema } }`
  on `client.messages.create(...)`, then `JSON.parse(textBlock.text)`. This is the
  current API — do not use the deprecated `output_format`.
- **`effort` is NOT supported on Haiku 4.5** — passing it 400s. Omit it.
- **`max_tokens` must fit the whole JSON.** The plan route emits a large container
  schema; it's set to **16384**. If you grow a schema and see
  `Unterminated string in JSON`, that's truncation — raise `max_tokens`, and note
  the route already guards on `stop_reason === "max_tokens"`.
- **web_search** tool type is `web_search_20260209`; it's agentic and can return
  `pause_turn` — loop until done (see `lib/verify.js` → `webFindUrls`).
- The **API key never reaches the browser.** It lives in `.env.local`
  (gitignored) as `ANTHROPIC_API_KEY` and is only read in server routes.
  Never log it, echo it, or move a Claude call client-side.

## Architecture — the retrieval-first pipeline

When the user clicks **Build my plan**, `components/PlanView.js` orchestrates:

```
/api/plan         → plan STRUCTURE only: hook, strengths(→skip), gaps,
                     learningSequence (teaching-container modules), capstone.
                     NEVER names a specific book/paper/course/URL.
/api/candidates   → per topic, propose canonical titles → verify against real
                     catalogs (Open Library, OpenAlex). Returns a verified pool.
/api/select       → model picks 0-2 pool items BY INDEX (copies title/url
                     verbatim — never authors a resource) and writes the "use".
/api/augment-web  → thin modules only: one official doc/course via web search,
                     web-verified. Gated by WEB_AUGMENT in lib/constants.js.
/api/check        → two supervisors (over-teaching, capstone viability),
                     compare-only, never judge from outside knowledge.
```

Supporting routes: `analyze` (resume → field/sector/skills+evidence),
`classify` (artifact type), `read-link` (fetch/parse a job URL or honestly fail),
`focus` (review-screen phrase).

### The non-negotiable product rules
1. **Grounding / "verify-and-drop":** never show a resource that wasn't verified
   real. The model selects from a retrieved+verified pool; it does not invent
   resources, citations, authors, or URLs. If nothing verifies, show an honest gap.
2. **Facts vs fluency:** the generator may write workflow framing, analogies,
   ordering, task wording, self-check criteria. It must **not** assert precise
   source-dependent specifics (clinical/coding/regulatory rules, thresholds,
   citations) unless they came from the input. See the FACTS vs FLUENCY block in
   `app/api/plan/route.js`.
3. **Fidelity:** role shown verbatim (never re-categorized); dates never invented
   or transformed — the **UI owns any factual deadline**, the model supplies only
   relative phase labels; company/sector only when actually provided.
4. **Degrade to honesty, never to fiction** (e.g. an unreadable job link warns the
   user and builds from background only).

## Key files

| File | What |
|---|---|
| `app/page.js` | Input flow + form state (`background`, `headed`, `goals`, `timeline`) |
| `components/InterviewDoor.js` `DiagnosticFlow.js` `VoiceInput.js` `TriageView.js` | Interview front door, two-question diagnostic, browser voice/typed input, post-diagnostic triage |
| `lib/triage.js` | Pure interview triage ranking + output-contract helpers |
| `components/BackgroundSection.js` `HeadedSection.js` `GoalsSection.js` `TimelineSection.js` `ReviewScreen.js` | The 4-section input + review |
| `components/PlanView.js` | The workspace (briefing, moments, folder, drawer) + client orchestration of the pipeline |
| `components/MockGate.js` + `lib/mockResponses.js` | Demo mode — fetch interceptor + canned data (zero API) |
| `lib/moduleCheck.js` + `fixtures/` | Static plan-quality checker + golden regression inputs |
| `app/api/*/route.js` | Server routes (above) |
| `lib/ai.js` | Anthropic client + `MODEL` / `PLAN_MODEL` |
| `lib/verify.js` | Resource verification (Open Library, OpenAlex, web search) |
| `lib/constants.js` | Pools, options, `WEB_AUGMENT` toggle, `poolMatches` |
| `lib/stubs.js` | `looksLikeUrl`, `detectSource`, `readMaterials` |
| `revise/` | Planning/spec docs (design history; not shipped code) |

## Running it

- Dev server: the Claude preview launches `.claude/launch.json` → **`labbridge-dev`**
  on **port 3100**. Or from a shell:
  `export PATH="$HOME/.local/node-v22.23.1-darwin-arm64/bin:$PATH"` then
  `npm run dev` (Node is at that local path; it's not on the default PATH).
- **Never run `npm run build` while the dev server is running on the same
  `.next`** — it corrupts the cache (`Cannot find module './XXX.js'`). Stop the
  server → `rm -rf .next` → build.
- Generating a plan is a **paid Opus call** (~1–2 min with the container schema).
  Test deliberately; don't loop it.

## Conventions

- **Keep `JOURNEY.md` updated on every change** — a short honest entry (the
  problem in plain terms → the fix), in the same commit as the change. Not just
  big features; bugfixes and tweaks too.
- Commit style: imperative subject, a short body explaining *why*. End Claude's
  commits with its `Co-Authored-By` trailer; Codex should use its own author
  identity so history shows who did what.
- **Commit after each coherent action** so the other agent can pull state instead
  of asking Sissi to copy/paste context. Include code, specs, and coordination
  docs together when they explain the same change: `AGENTS.md`, `TASKS.md`,
  `JOURNEY.md`, `revise/*.md`, and source edits should stay in sync.
- **Use commit messages as mini handoffs.** The subject says what changed; the
  body says why, what was verified, and what remains open. Future CC/Codex
  sessions should be able to orient from the last few commits plus the docs.
- Don't commit `.env.local`, `.next`, `node_modules`, `.vercel`, `deploy.sh`
  (all gitignored). Don't commit secrets.
- Match existing formatting; keep comments at the density of the file you're in.

## Coordination (two agents, one repo) — see TASKS.md

- **Work on your own branch**, never commit directly to `main` in parallel:
  Codex → `codex/<feature>`, Claude → `claude/<feature>`. `main` is the
  integration branch — merge only working, tested code.
- **`git pull --rebase origin main` before you start** and before you push.
- **Stay in your lane** (TASKS.md). The high-churn files
  (`app/api/plan/route.js`, `components/PlanView.js`) are Claude's by default;
  Codex's near-term lane is mostly **new files** (checker, fixtures) — low
  collision. If you must touch the other lane's file, say so in TASKS.md first.
- Prefer **small, frequent merges** over long-lived branches.
- For true parallelism use a **git worktree** so each agent has its own checkout:
  `git worktree add ../labbridge-codex codex/<feature>`.
- **No agent merges its own branch to `main`** — open a PR / leave it for review.
  Standing role: **Claude reviews Codex's changes for product-rule alignment**
  before merge. The human (Sissi) is final decision-maker; when we disagree, the
  tie-breaker is "which change preserves LabBridge's core product contract?"
  (See `TASKS.md` → Integration & review.)
- **Review cost is real.** Claude reviewing every small Codex PR is good for
  quality, but it can quietly eat the Claude usage that Codex was meant to save.
  Batch Codex reviews when possible, and reserve mandatory Claude product-rule
  review for changes touching the non-negotiables above (grounding, facts vs
  fluency, fidelity, honesty/degrade behavior) or high-churn product surfaces.
  Isolated new files such as checker/fixture utilities can usually get lighter
  review unless they affect those rules.
- **Before CC/Codex review conversations, pull/read the branch instead of
  re-pasting context.** Default prompt shape:
  `"Pull latest codex/planview-density-polish, read the last 3 commits plus
  JOURNEY.md tail, then review only for product-rule risks."`
  Adjust the branch name and review scope, but keep reviews targeted rather than
  asking for full re-understanding.
- **Codex should prompt Sissi when Claude Code review is worth it.** If a change
  touches product-rule risk, high-churn prompts/rendering, paid-call behavior, or
  user trust surfaces, say so and draft a targeted CC prompt. Prefer:
  `"Review this branch for product-rule alignment around X"` over broad prompts
  like `"Understand everything and tell me what you think."`
- **Keep the picture current.** When something ships, mark it done in `TASKS.md`
  and tell the story in `JOURNEY.md`; when something is designed but not built,
  leave it in `TASKS.md` / `revise/` with date, owner, and the next trigger.
  The docs are the shared memory; chat is only the working room.
