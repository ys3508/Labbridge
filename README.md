# LabBridge

**From "I'm new here" to "I can contribute" — in days, not months.**

LabBridge is a personalized **enterprise-onboarding workspace** for career-changers.
Give it your background (a resume, a few lines) and where you're headed (a role, a
job posting), and it builds not a course but a **first assignment**: a sequence of
manager-style tasks that each produce a real work artifact, with just enough
teaching wrapped around the work.

Works for any field — an epidemiologist moving into pharma RWE, a consultant
moving into growth equity, an engineer moving into biotech.

---

## Try it in 30 seconds (no API key needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **"Or explore a sample plan →"** at the
bottom of the input page. The demo runs entirely on canned data — zero API calls —
and shows the full experience: briefing → workspace → tasks → your project folder.

To generate *real* plans, put an Anthropic key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## What you get

Onboarding, not a syllabus:

- **A mission briefing** — how close you already are, what to *skip* because you
  already have it, and the gaps that actually stand between you and the role.
- **A project workspace** — 3–4 manager-assigned tasks ("Your RWE lead says: …"),
  each walked as short **Moments**: Brief → Question → Model → Example → Practice
  → Coach → Draft → Reward. You're handed named inputs, you write real drafts,
  you check your own work against concrete criteria.
- **A project folder** — your drafts become files with honest states (outlined →
  draft → final), real timestamps, and one-click Markdown export. The folder is
  the product: visible proof of work.
- **A readiness arc** — an Observe → Assist → Own capstone sized to *your*
  timeline (a 3-week runway is a 3-week arc, never a hard-coded "90 days").
- **Progress that can't lie** — only completing a task moves any counter; gap
  chips close only when the tasks that close them are done.

## The principles (what makes it trustworthy)

1. **Grounded resources or none.** Every recommended resource is verified against
   real catalogs (Open Library, OpenAlex) or official pages — retrieval-first;
   the model selects from verified candidates and can never invent a citation.
2. **Facts vs. fluency.** Generated teaching prose may frame and bridge, but may
   not assert precise source-dependent specifics (clinical codes, regulations,
   thresholds) it wasn't given.
3. **Fidelity.** Your role is named verbatim, never re-categorized. Dates are
   never invented or transformed — the UI owns your deadline.
4. **No fake AI.** Nothing pretends to be intelligence that didn't run. The demo's
   sample coaching is labeled canned; real AI review arrives only when it's real.
5. **Degrade to honesty.** An unreadable job link warns you up front and the plan
   says what it's built from.

## Stack

Next.js 14 (App Router) · React 18 · Tailwind 3 · Anthropic Claude API
(`claude-haiku-4-5` for high-frequency extraction, `claude-opus-4-8` for plan
generation) · plain JavaScript, no TypeScript. All AI calls are server-side; the
key never reaches the browser. Progress persists in localStorage.

## Repo map

- `app/page.js` — input flow (background, target, goals, timeline)
- `components/PlanView.js` — the workspace (briefing, moments, folder, drawer)
- `app/api/*` — plan generation + retrieval-first resource pipeline + checkers
- `lib/mockResponses.js` + `components/MockGate.js` — the zero-API demo mode
- `lib/moduleCheck.js` + `fixtures/` — static plan-quality checker + golden inputs
- `revise/` — design specs (the product's paper trail)
- `JOURNEY.md` — the working diary: every question raised and how it was fixed
- `AGENTS.md` — conventions for the AI agents that build this (yes, really)

## Status

Actively built by a human product owner working with two AI agents (Claude +
Codex) in a spec → implement → review loop. Current phase: structure and
behavior complete; visual design pass next. See `JOURNEY.md` for the story.
