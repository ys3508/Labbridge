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

### Codex — start here (low collision, high value)

- [x] **Static module-quality checker** (`lib/moduleCheck.js`, pure JS, no AI).
      Per module, flag: `concept.explanation` < ~500 chars; `workedExample.setup`
      < ~120 chars; `task.givenInputs.length < 1`; `task.managerRequest` missing a
      stakeholder-like phrase; `selfCheck.criteria.length < 3`; `task.steps.length
      < 3`; banned phrases anywhere ("find a dataset", "search online", "read
      about", "learn about", "simulate your own"). Return **specific findings, not
      a score**. Expose via `app/api/module-check/route.js` returning findings for
      a posted plan. (Claude will wire an optional dev-only display into PlanView
      once the shape is stable — leave the render to the Claude lane.)
- [ ] **Golden fixtures** (`fixtures/golden-rwe-input.json`,
      `golden-growth-equity-input.json`, `golden-beginner-input.json`) — the exact
      `payload` shape `/api/plan` receives (see `buildPayload` in
      `components/PlanView.js`). Used to re-test header/role/deadline fidelity,
      module richness, no fake resources, no "go find a dataset". RWE fixture is
      started in `fixtures/golden-rwe-input.json`; growth-equity and beginner
      fixtures still need adding.
- [ ] **Grounding hardening** — occasional catalog title-match lands on an
      adjacent record; tighten `overlap()` / verification in `lib/verify.js`.

### Claude — in progress / owned

- [x] Shift 1: modules are teaching containers (concept/worked-example/self-check).
- [ ] PlanView workspace/session polish: Codex picked this up at Sissi's request on
      `codex/planview-density-polish` despite PlanView normally being Claude's
      lane. It now makes the result feel more like one-task-at-a-time project
      work than an all-on-one-page course. Latest pass also touches
      `app/api/plan/route.js` to align generation with the project-first learning
      engine. Review for product-rule alignment before merge.
- [ ] Wire the static checker's findings into PlanView (dev-only), once Codex's
      `module-check` route shape is stable.
- [ ] Prompt tuning from golden-fixture results (horizon math on a real deadline;
      "functional" → 3–4 tight modules).

### Unassigned / later

- [ ] Cross-session memory (accounts + backend) — the stickiness play.
- [ ] Code-verified skill graph (prerequisite ordering, not model-judged).
- [ ] Deploy (rotate the API key, set a spend cap first).

---

## Handoff notes

- Generating a plan is a **paid Opus call** (~1–2 min). Prefer testing checker/
  fixture work against **saved fixtures**, not fresh generations.
- When you finish an item, check it off here and add a one-line `JOURNEY.md` entry.
