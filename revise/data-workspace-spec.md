# Data Workspace — spec (the 模拟软件, made concrete)

**Status: specced Jul 15, build deferred to its own session.** Origin: Sissi — "I want to build a workspace where people can directly work in it, open csv as csv form, and work on data." Phase 1 (CSV-as-table + downloads) shipped Jul 15 in the review batch; this spec is phases 2–3.

## Thesis

The learner should RUN the work, not read about it. The beats stay (they're the scaffolding); the workspace embeds INSIDE the Try/Draft beats. This also structurally kills the synthetic-drift bug class: once the extract is the thing being queried, the file is the source of truth.

## Phase 2 — SQL cell (the core)

- **Engine:** DuckDB-WASM — full SQL client-side, no backend, no data leaves the browser. Loads the task's generated CSV(s) as tables.
- **Placement:** a "Run it" panel inside the Try beat, below the starting materials. One query box + results grid + row/patient counts.
- **Wired to the plan:** the task's steps become runnable ("compute patient count vs row count" → they write the GROUP BY). The Check/Coach can verify the learner's reported count against the true computed answer — the first *objectively graded* beat in the product.
- **Seed queries:** each task's materials generation can include 1-2 starter queries (SELECT * LIMIT 5) so the first keystroke is free, same philosophy as the draft template.
- **Scale guardrail:** teaching-size data only (≤ a few hundred rows). No warehouse ambitions; the browser sandbox is a feature (private by construction — fits the honesty architecture).

## Phase 3 — notebook option (later, maybe)

Pyodide/JupyterLite for pandas-style work if user demand exists. Note: SAS won't run in a browser; Python/R-WASM are the substitutes. Decide only after phase 2 has usage.

## Pedagogical guardrails (from the review)

- Never replace beats with the workspace — embed it. An open tool with no scaffolding loses the beginner (the entire beat grammar exists to prevent this).
- The coach receives the learner's query + result alongside their draft — review of the WORK, not just the write-up.
- Known-answer checks: materials generation computes the canonical answers (patient count, date range) into a hidden answer block the Check verifies against; never shown to the learner.

## Build estimate

DuckDB-WASM integration + one query cell + results grid: a focused session. Answer-verification wiring: a second. Do it after the current batch has soaked with real usage.
