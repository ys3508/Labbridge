# CHAT-PROTOCOL.md — working with Claude chat (the decide tier)

Chat's lane: **brainstorm, challenge, decide.** Writes `revise/*.md` and
`decisions/ADR-*.md`. Never writes code. See `AGENTS.md` §Lanes.

Sissi is the only one who talks to all three agents. Agents never talk to each
other — **the repo is the bus.** Humans carry intent; files carry state. If you
are pasting state between agents, that's a bug in the pipeline.

---

## Setup (done once)

Claude.ai → **Project: LabBridge** → **Files** panel (this is "project
knowledge") → **+** → **GitHub** → `ys3508/Labbridge`, branch `main`.

GitHub is **not** in the Connectors directory — it's added through the Files
panel. It is not a live read tool.

**Configure files** — sync only the decide tier's world:

```
AGENTS.md  OPEN.md  CHAT-PROTOCOL.md  TASKS.md  JOURNEY.md
decisions/  revise/
```

Source files are CC's business. Chat critiquing `PlanView.js` from a snapshot is
worse than not looking.

**Project Instructions** (+ next to Instructions) holds the LabBridge-specific
opener. Behavioral rules (skip praise, don't restate decided things, stop when
nothing's wrong) go in **Settings → Profile**, since they apply everywhere.
Profile loads first, project instructions stack on top — don't write them twice.

---

## What project knowledge actually is

**A manual snapshot, not a live repo.**

- Files only. **No commit history, no PRs, no branches other than the synced
  one.** "Read the last 5 commits" does not work here. This is why
  commit-messages-as-mini-handoffs and `JOURNEY.md` are load-bearing: they are
  *files*, so they sync. The reasoning that lives only in a commit body is
  invisible to chat.
- **`main` only.** Chat cannot see `claude/*` or `codex/*` until they merge.
- **It goes stale silently.** CC commits; chat doesn't notice.

**Sync is part of opening a design chat**, the same reflex as
`git pull --rebase` before starting work. Hit **Sync now** before any chat that
follows a CC or Codex session.

The failure mode is not chat saying "I don't know." It's chat critiquing
confidently against last week's files. Stale-but-assured is worse than ignorant,
because you can't tell from the outside. This is the product's own rule pointed
back at the workflow: **degrade to honesty, never to fiction.**

---

## Chat cannot write to the repo

Read-only, by design. That's the veto — nothing enters the repo unseen.

**The loop:**

1. Chat writes the `.md` → download it
2. Drop it in the repo folder
3. CC commits it (or you do)
4. **Sync now** → chat sees it

Hand-carrying only happens the **first time a file exists**. After that CC edits
it in place and you never move a file again.

---

## The three moves

### 1. Open — orient, don't narrate

The project instructions do this. Your first message is just the screenshot or
the question. If you're explaining background, something upstream is broken.

### 2. Middle — one topic

One gate, one design question, one screenshot. **When it drifts, close.** Drift
is the signal, not word count.

### 3. Close — always end in a file

> Write it to `.md`. Then give me the handoff prompt for a fresh chat.

A decision that ends in chat gets re-litigated. A decision that ends in an ADR
doesn't.

---

## Reusable prompts

**Decide a gate**
> Close **[G#]** — options, costs, what's irreversible. Output an ADR.

**Design review from a screenshot**
> [screenshot] **[one line of context]**. What am I missing?

**Check for drift** (needs source files synced, `main` only)
> Does `[file]` still match `decisions/ADR-000x`? If yes, say clean and stop.

**Write a prompt for CC/Codex**
> Write me the prompt to send **[CC | Codex]** for **[task]**. Keep it in their
> lane per `AGENTS.md`.

**Brainstorm**
> Read `revise/[doc].md`. I'm thinking **[idea]**. Argue against it first.

---

## Two things that are true and inconvenient

**Long ≠ expensive. Vague is expensive.** A long session where every turn has a
target is cheap and lands something. "Here's my whole project, thoughts?" costs
more and lands nothing. Kill sessions on drift, not length.

**Token-saving and challenge pull against each other.** A cheap session that
agrees with you is the expensive outcome — you build the wrong thing and pay to
unbuild it. Spend freely on Decide; save on build, commit, review. The product's
own logic applies: *a confident wrong triage is worse than a flat map.*

---

## Where chat's output goes

| Output | Lands in |
|---|---|
| Design thinking, stage specs | `revise/*.md` |
| A closed decision | `decisions/ADR-000x-<slug>.md` |
| A new fork found mid-conversation | `OPEN.md` (as OPEN) |
| A rule that can be asserted | proposed in `TASKS.md` → CC writes it into `lib/moduleCheck.js` |

If chat produced something that lands nowhere, the session didn't close — it just
stopped.
