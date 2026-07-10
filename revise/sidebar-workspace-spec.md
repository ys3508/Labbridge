# Sidebar Workspace spec (Claude → Codex)

Agreed with Sissi 2026-07-10. Decisions made: **clicking a file opens a preview of
the user's draft** (with "Continue →" as the way into the task), and **"Download my
project" export is included now**.

⚠️ **Sequencing: implement AFTER `revise/task-navigation-spec.md` lands and is
reviewed.** Both specs touch `ProjectFolder` in `components/PlanView.js` — doing
them simultaneously will conflict. This spec assumes the nav spec's state exists
(persisted drafts/checks/moment positions, per-task states, dimmed-but-openable,
capstone in the queue).

## The principle

The sidebar currently *says* "Project workspace · 3 files" but the files are labels
that claim to exist before a word is written — **unearned state**, the same sin as
a canned Reward banner. Fix: make the folder real. A file's state, contents, and
even its existence-feel are driven by the user's actual work. The sidebar answers
exactly three questions — *where am I, what have I made, what's next* — nothing else.

---

## Changes

### 1. Honest file states (driven by the persisted draft + done set)
Each task file renders one of three states:
- **○ outlined** — no draft, not done. Muted styling; sub-line "not yet created".
- **● draft** — non-empty persisted draft, not done. Sub-line: first ~60 chars of
  the draft as an excerpt + word count ("142 words").
- **✓ final** — task in `done`. Sub-line: word count (or "no draft" honestly, if
  they completed without writing — do not fake an excerpt).
These COMBINE with the nav spec's states (resume-at-beat, dimmed-future). Where
both apply, file state describes the *artifact*, nav state describes *position* —
show both, artifact state first (e.g. "● draft, 142 words · resume at Coach 6/8").

### 2. Click = open the draft preview (not immediate navigation)
- Clicking a non-dimmed file opens a **preview panel** (inline expansion under the
  file item, or a lightweight panel above the moment card — Codex's layout call;
  no modal) showing:
  - the artifact filename as title,
  - the full draft text (scrollable if long), or an honest empty state:
    "Nothing written yet — the Artifact moment is where this file gets made.",
  - primary button **"Continue →"** → navigates to that task (restoring its saved
    moment, per the nav spec) and closes the preview,
  - for done tasks the button reads **"Reopen →"**.
- Dimmed future tasks keep the nav spec's confirm behavior ("start anyway?") —
  preview only applies to opened/completed/current tasks.
- Only one preview open at a time; clicking the same file again closes it.

### 3. "Download my project" (export, zero API)
- A button at the bottom of the folder: **"Download my project"**.
- Builds a single Markdown file client-side (Blob + object URL; no network):
  - Header: plan role ("Toward {roleName}"), date line optional — use a static
    label, no invented dates.
  - Per task, in order: `# {artifact filename}` + task title + the user's draft
    (or "_Not written yet._"), and a status line (final / draft / outlined).
  - Filename: `labbridge-project.md` (keep it simple; no per-file zip in v1).
- Disabled state when every draft is empty, with title-tooltip "Write something
  first — your drafts become the download." (Honest, not nagging.)

### 4. Folder footer states its destiny
- Under the file list: one quiet line — **"These files become your readiness
  project."** Ties the folder to the capstone that the nav spec adds to the queue.

### 5. What NOT to add (explicit non-goals)
No streaks, progress rings, timers, motivational copy, or fake file metadata
(sizes, dates). No new API calls anywhere in this spec.

---

## Acceptance criteria (verify all in `?mock=1`, zero API)

1. Fresh plan: all files show **○ outlined / "not yet created"**; export button
   disabled with the tooltip.
2. Write a draft in Task 1's Artifact moment → sidebar file flips to **● draft**
   with a real excerpt + word count, live (no refresh needed) — and survives
   refresh (uses the nav spec's persisted drafts).
3. Complete Task 1 via Reward → file shows **✓ final**.
4. Clicking Task 1's file opens the preview showing exactly the text written;
   "Reopen →" (done) / "Continue →" (in progress) navigates to the task at its
   saved moment and closes the preview. Clicking the file again closes it.
5. Clicking an empty-state file shows the honest empty message, not a blank box.
6. Dimmed future task: click still shows the nav spec's "start anyway?" confirm —
   no preview.
7. "Download my project" produces a `.md` containing every artifact filename, the
   Task 1 draft verbatim, and honest "_Not written yet._" for empty ones. No
   network request fires (check DevTools).
8. Footer line present. No console errors. All state keyed by `planKey`.

## Contract reminders
- Earned state only: no excerpt, count, or status that isn't derived from real
  user input. Empty is shown as empty, honestly.
- Export contains the user's words verbatim — no AI summarization, no embellishment.
- No invented dates/metadata in the export header.
