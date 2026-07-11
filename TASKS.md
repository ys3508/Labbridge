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
