# TASKS.md — who's doing what

A lightweight board so Claude and Codex don't step on each other. Update this in
the same PR/commit as you pick up or finish work. Full conventions in `AGENTS.md`.

**Branches:** Codex → `codex/<feature>`, Claude → `claude/<feature>`. `main` is
integration-only. Rebase on `main` before starting and before pushing.

---

## Lane split (default file ownership)

To keep parallel edits collision-free, we split by area. The near-term Codex lane
is deliberately **mostly new files**.

| Area | Owner | Files |
|---|---|---|
| Plan generation (prompt + schema) | **Claude** | `app/api/plan/route.js` |
| Course render / input UI | **Claude** | `components/PlanView.js`, `components/*Section.js`, `app/page.js` |
| Plan checkers (AI supervisors) | **Claude** | `app/api/check/route.js` |
| Static module-quality checker | **Codex** | `lib/moduleCheck.js` (new), `app/api/module-check/route.js` (new) |
| Golden regression fixtures | **Codex** | `fixtures/*.json` (new) |
| Grounding / retrieval hardening | **Codex** | `lib/verify.js`, `app/api/candidates|select|augment-web/route.js` |
| Deploy / infra | **Codex** | Vercel config, env docs |

**Ownership rule (read before editing anything):** Before you edit any file,
check whether it's listed as owned by the *other* agent above. If it is, do **not**
make even a "small helpful change" — ask first, or write your proposal in a
separate file (e.g. `revise/proposal-<topic>.md`) and hand it to the owner. This
is what keeps well-meaning edits from becoming merge conflicts.

---

## Integration & review

- **No agent merges its own branch to `main`.** Open a PR, or leave the branch/
  commit for review. `main` receives only reviewed, integrated work. (Even when
  the human is merging locally, keep this mental model.)
- **Review roles:** Codex implements tooling / checkers / fixtures / grounding.
  **Claude reviews for product-rule alignment** before merge — it holds the
  freshest architectural memory and catches "technically fine, product-wrong"
  changes (grounding, facts-vs-fluency, fidelity, the container contract).
- **The human (Sissi) is the final decision-maker.** When Claude and Codex
  disagree, the tie-breaker is **not** "which model is smarter" — it's **"which
  change preserves LabBridge's core product contract?"** (teach-not-point,
  verify-and-drop grounding, honesty over fiction, role/date fidelity).

---

## Open work

*(Board refreshed 2026-07-10 — everything through "remaining-before-visual" is
implemented; see JOURNEY.md for the story.)*

### Shipped & merged to main
- [x] Moments grammar (honest Coach, live-state Reward) · task navigation ·
      page hierarchy · single-surface workspace · sidebar workspace (file states,
      previews, export) · progress states (files-not-percent, gap chips) ·
      completion rewards (gap-closed, mirror, handoff memo, welcome-back) ·
      artifact experience (per-file downloads, last-edited).

### Merged (review waived by Sissi — Codex out of credits; Codex may back-review)
- [x] remaining-before-visual §1-5 · checker branch · layout foundation ·
      visual design (+ amplification after Sissi's squint-test review).

### Next up
- [ ] **Deploy the public demo** — Vercel, NO ANTHROPIC_API_KEY set (zero spend
      risk; demo fully works, generation degrades honestly). CI is in place.

### Talked about, never done (the honest ledger — Sissi asked for this)
*Everything discussed in sessions that never became code. Date = when discussed.*

**From the great review cycle + the "combine with real work" conversation (Jul 14-15):**
- [~] **INTERVIEW MODE = the front door** — Session A SHIPPED Jul 15 (doors, intake, diagnostic, receipts, gap marker); Session B remaining (runner, Simulated Live, walk-in card, post-interview loop) — full design in
      `revise/interview-mode-spec.md`: diagnostic-first opening (2 cold questions,
      map generates FROM them), Question Map with posting-line receipts, named-not-
      dreaded gap question, graduated exposure ramp, dynamic-pushback mock runner
      (now AHEAD of DuckDB), walk-in card, post-interview loop, win→onboarding
      handoff. Two-axis rubric authoring deferred by Sissi. (Jul 15)
- [ ] Interactive check variants — drag-to-classify / click-the-error / pick-the-codes,
      rendered client-side from the same check data (one checkGenre enum max). After
      the DuckDB workspace. (Jul 15)
- [ ] Session-end mirror — one earned line on exit from tracker data ("42 min today;
      task-2 answer went thin→met"). (Jul 15)
- [ ] User→product feedback backend — the 👍/👎 beat chips SHIPPED (v1 localStorage, Jul 15);
      still needs a collection endpoint + dashboard when accounts land. (Jul 15)
- [ ] **Four visual roadmap identities** — road (role) / countdown calendar (interview) /
      evidence scale (career move) / door (curious); progress currency + product noun
      change per purpose. Beat identities shipped Jul 15; the roadmap visual is the
      remaining half. (Jul 15)
- [ ] Interactive mock-interview runner — timed rapid-fire capstone, scored via
      /api/coach; today the mock interview is a described arc. (Jul 15)
- [ ] Post-interview loop — log real questions after the interview → plan
      regenerates weak spots (campaign companion). (Jul 15)
- [ ] Exports: interview cheat-sheet (one page, 30-min-before) + Day-One Pack
      (artifacts + ask-your-team list, formatted for the first 1:1). (Jul 15)
- [ ] Form-free curious entry — one typed phrase, no resume/goals/timeline;
      Haiku-generated taste as free top-of-funnel. (Jul 15)
- [ ] Purpose-ladder handoff — the curious door / decision brief / interview win
      regenerates the next purpose's plan with background carried over. (Jul 15)
- [ ] Assistant select-to-ask — highlight page text → quoted into the chat. (Jul 15)
- [ ] Register selector UI + explicit language field (prompt honors steering-note
      language today; make it a first-class input). (Jul 15)
- [ ] Career-move drip pacing — weekly rhythm + "still curious?" re-entry. (Jul 15)
- [ ] **In-browser data workspace** — DuckDB-WASM SQL cell (and/or grid editor)
      embedded in the Try/Draft beats so learners RUN their cohort spec against
      the generated extract and the Check verifies their count. The concrete
      version of the long-parked toolbox 模拟软件. Spec:
      `revise/data-workspace-spec.md`. Real engineering project — own session. (Jul 15)
- [ ] **YouTube Data API key** — free, Sissi creates it; unlocks the already-specced
      video search pipeline (`revise/video-pipeline-spec.md`). (Jul 11, re-raised Jul 15)
- [ ] Curated-anchor pass per field — beyond the select-stage "prefer the anchor"
      rule: seed the candidates stage with known authoritative sources per domain
      (FDA RWD guidance, OHDSI phenotype library, ISPOR/ISPE good practices for
      RWE; field-equivalents elsewhere). (Jul 15)
- [ ] "Coming from" selector before generation (#57) + clickable "You today"
      chips (#60) — the input-layer fix for cold-start bridge quality. (Jul 13)
- [ ] Mock-mode leak loudness (#58) — real form inputs while `lb_mock=1` silently
      serve the sample; burned Sissi once. (Jul 13)
- [ ] One-page review mode (#9); free-text check answers graded by /api/coach (#24). (Jul 12)
- [ ] Sonnet fallback for /api/coach if trap-wired Haiku recall still short (#80). (Jul 13)
- [ ] Reference fact-check pass currently covers coding-reference docs only —
      consider widening (statutes, standards) per field. (Jul 15)
- [ ] Base44 satellites (landing page / waitlist / feedback form) — keep the
      product here; use Base44 only for near-product surfaces. (Jul 15)
- [ ] Warning-collapse when multiple prior tasks are empty (#88) — chained ambers
      read as a corridor of failure; collapse repeats. (Jul 13)
- [ ] Growth-equity + beginner fixture verification runs (~$1). (Jul 12)
- [ ] Expert 30-min spot-check of a generated plan with the .md export. (Jul 11)

**Needs API funding:**
- [ ] Paper key-points at select stage — fetch the abstract (OpenAlex, free),
      Haiku selects 1-2 task-relevant sentences VERBATIM (quoted + attributed
      "from the abstract"); no abstract → no key point, never a memory-summary.
      Rendering + first real quoted entry shipped Jul 11. (Jul 11)
- [ ] Video resources in the live pipeline — full design in
      `revise/video-pipeline-spec.md` (queries → Data API → verify → hard-signal
      rank → Haiku judge → 0-1 pick; curated tier on top). Embed player + first
      curated entry shipped Jul 11. Needs: free YouTube key (Sissi) + Haiku. (Jul 11)
- [ ] Live-model content validation — run the 3 golden fixtures, judge real
      output; verify `northStar` / `comprehensionCheck` / `closesGapIndex` land. (Jul 10)
- [ ] Trim-loop regeneration — roadmap "I already know this" trims feed a
      regenerated leaner plan (UI + persistence built Jul 11; the generation call is the gap).
- [ ] `/api/coach` — real AI review of drafts (socket built: Coach beat panel). (Jul 10)
- [ ] Manager's-reaction reward (rewards spec item F; deliberately parked). (Jul 10)
- [ ] "Go deeper" opt-in depth expansion in the Model beat + depth-scaled
      concept length — the answer to "content feels too short". (Jul 11)
- [ ] AI checker for module substance (shift-1 §4 "later": does the concept
      actually teach? is the example concrete?). (Jul 9)

**Zero API, never built:**
- [x] "Talk to humans" networking stop — specced (`revise/talk-to-humans-spec.md`),
      schema + prompt + search-link rendering built, mocked in the growth persona.
      Live-model behavior (purpose-gating, personalized archetypes) verifies at
      validation day. (Jul 11)
- [ ] **Free-resource bias** — prefer open-access (OpenAlex OA flag), .gov/.edu,
      official docs in candidates/select; label each resource "free" in the UI. (Jul 11)
- [ ] Resource `difficulty` + `confidence` fields & labels (shift-1 §7 — only
      `use` was implemented). (Jul 9)
- [ ] Structured workedExample rows → real Visual table AND the toolbox 模拟
      (interactive example table) — both blocked on the same schema addition. (Jul 10/11)
- [ ] Progressive reveal — STILL undefined by Sissi; my proposed default
      (sequential first pass, free after Wrap) awaiting yes/no. (Jul 10)
- [ ] Expert 30-min validation + curricula triangulation as a repeatable
      practice (first comparison done Jul 11 vs IQVIA getting-started). (Jul 11)
- [ ] Codex back-review of Claude's merged implementations (when credits). (Jul 10)

**Waiting on Sissi (minutes each):**
- [ ] Keyless Vercel deploy — import repo, set NO api key. (Jul 11)
- [ ] README screenshot → `docs/`, Claude embeds. (Jul 11)

**Long-parked (needs backend/design):**
- [ ] Cross-session memory / accounts. (Jul 8)
- [ ] Code-verified skill graph for prerequisite ordering. (Jul 8)

### Parked (needs API funding)
- [ ] Verify `northStar` / `comprehensionCheck` / `closesGapIndex` against the
      live model; tune prompts from golden-fixture runs.
- [ ] `/api/coach` — real AI review + manager's-reaction reward (sockets exist:
      the Coach beat panel and the parked reward slot F).
- [ ] Deploy (rotate the API key, set a spend cap first).

### Parked (needs definition or backend)
- [ ] "Progressive reveal" — dropped from scope until Sissi defines it.
- [ ] Cross-session memory (accounts + backend) — the stickiness play.
- [ ] Code-verified skill graph (prerequisite ordering).

---

## Handoff notes

- Generating a plan is a **paid Opus call** (~1-2 min). Test against demo mode
  (`?mock=1` / "explore a sample plan") or the `fixtures/`, not fresh generations.
- `npx next lint` is configured (`next/core-web-vitals`,
  `react/no-unescaped-entities` off) — run it before pushing.
- When you finish an item, check it off here and add a `JOURNEY.md` entry.
